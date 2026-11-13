#!/usr/bin/env python3
# /// script
# dependencies = []
# requires-python = ">=3.11"
# ///
"""
將卡片的 domain/* tag 遷移為 domains / domain_topics 欄位

用途：
  舊做法把領域寫成 tag（domain/経済学、domain/金融…），同一個領域有二十多種寫法，
  網站上也只能以零散的 tag 頁呈現。新做法使用 Hugo 的 domains 分類法：

    domains:
      - economics
    domain_topics:
      - economics/finance

  對應規則定義在 data/domains.toml 的 [aliases]（網站與腳本共用）。

執行：
  uv run scripts/migrate_domain_tags.py --dry-run   # 預覽
  uv run scripts/migrate_domain_tags.py             # 執行
  uv run scripts/migrate_domain_tags.py --check     # 檢查是否還有 domain/* tag（有則回傳 1）

行為：
  - 從 tags 移除所有 domain/* 項目（區塊清單與 [a, b] 兩種寫法皆支援）
  - 在 tags 之後寫入 domains / domain_topics（已有欄位則合併）
  - 卡片內指向 _meta/tags/domain/*.md 的連結改為指向 /domains/{slug}/ 頁面
  - 有任何無法對應的 tag 時，該卡片不修改並列出，結束碼為 1
"""

from __future__ import annotations

import re
import sys
import tomllib
from dataclasses import dataclass, field
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
ZETTELKASTEN_DIR = PROJECT_ROOT / "zettelkasten"
DOMAINS_FILE = PROJECT_ROOT / "data" / "domains.toml"

FRONTMATTER_RE = re.compile(r"\A---\n(.*?\n)---\n", re.DOTALL)
DOMAIN_TAG_RE = re.compile(r"""^["']?domain/(.+?)["']?$""")
META_LINK_RE = re.compile(r"\[([^\]\n]*)\]\(([^)\s]*?_meta/tags/domain/([^)\s/]+?)\.md)\)")


# ----------------------------------------------------------------------
# 領域定義
# ----------------------------------------------------------------------

@dataclass
class DomainConfig:
    domains: dict          # slug -> {name_ja, topics: set}
    aliases: dict          # 舊名稱 -> "domain" / "domain/topic" / ""
    bare_tags: frozenset = frozenset()  # 視為領域的無前綴 tag

    @classmethod
    def load(cls, path: Path = DOMAINS_FILE) -> "DomainConfig":
        data = tomllib.loads(path.read_text(encoding="utf-8"))
        domains = {}
        for d in data.get("domains", []):
            domains[d["slug"]] = {
                "name_ja": d.get("name_ja", d["slug"]),
                "topics": {t["slug"] for t in d.get("topics", [])},
            }
        config = cls(
            domains=domains,
            aliases=dict(data.get("aliases", {})),
            bare_tags=frozenset(data.get("bare_tags", [])),
        )
        config.validate()
        return config

    def validate(self) -> None:
        for tag in self.bare_tags:
            if tag not in self.aliases and tag not in self.domains:
                raise ValueError(f"bare_tags 中的 {tag} 沒有對應的 alias")
        for alias, target in self.aliases.items():
            if not target:
                continue
            domain, _, topic = target.partition("/")
            if domain not in self.domains:
                raise ValueError(f"別名 {alias} 指向未定義的領域: {domain}")
            if topic and topic not in self.domains[domain]["topics"]:
                raise ValueError(f"別名 {alias} 指向未定義的子主題: {target}")

    def resolve(self, name: str):
        """
        回傳 (domain, topic)；None 表示不是領域（直接移除）；KeyError 表示未定義

        [aliases] 優先於領域 slug：舊 tag domain/economics 應對應到 economics/general，
        而不是沒有子主題的 economics。
        """
        if name not in self.aliases:
            if name in self.domains:
                return name, None
            raise KeyError(name)
        target = self.aliases[name]
        if not target:
            return None
        domain, _, topic = target.partition("/")
        return domain, (f"{domain}/{topic}" if topic else None)


# ----------------------------------------------------------------------
# frontmatter 處理（以文字方式修改，保留其他欄位原樣）
# ----------------------------------------------------------------------

def _split_inline(value: str) -> list[str]:
    inner = value.strip()[1:-1]
    return [item.strip() for item in inner.split(",") if item.strip()]


def _unquote(value: str) -> str:
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
        return value[1:-1]
    return value


def _find_field(lines: list[str], key: str):
    """回傳 (起始行, 結束行(不含), 區塊清單項目)；inline 時項目為 None"""
    for i, line in enumerate(lines):
        if re.match(rf"^{re.escape(key)}:", line):
            value = line.split(":", 1)[1].strip()
            if value.startswith("["):
                return i, i + 1, None
            end = i + 1
            while end < len(lines) and (lines[end].startswith((" ", "\t")) or not lines[end].strip()):
                if not lines[end].strip():
                    break
                end += 1
            return i, end, lines[i + 1:end]
    return None


def _field_values(lines: list[str], key: str) -> list[str]:
    found = _find_field(lines, key)
    if not found:
        return []
    start, end, block = found
    if block is None:
        return [_unquote(v) for v in _split_inline(lines[start].split(":", 1)[1])]
    return [_unquote(l.strip()[1:]) for l in block if l.strip().startswith("-")]


def _render_list(key: str, values: list[str]) -> list[str]:
    return [f"{key}:"] + [f"  - {v}" for v in values]


@dataclass
class MigrationResult:
    changed: bool = False
    content: str = ""
    removed_tags: list = field(default_factory=list)
    domains: list = field(default_factory=list)
    topics: list = field(default_factory=list)
    unknown: list = field(default_factory=list)
    links_fixed: int = 0


def _domain_name(item: str, config: DomainConfig):
    """tag 項目若代表領域，回傳其名稱（domain/ 之後的部分或無前綴 tag）；否則 None"""
    m = DOMAIN_TAG_RE.match(item.strip())
    if m:
        return m.group(1)
    value = _unquote(item)
    if value in config.bare_tags:
        return value
    return None


def migrate_content(content: str, config: DomainConfig) -> MigrationResult:
    result = MigrationResult(content=content)
    match = FRONTMATTER_RE.match(content)
    if not match:
        return result

    lines = match.group(1).rstrip("\n").split("\n")
    tags_field = _find_field(lines, "tags")
    domain_names: list[str] = []

    if tags_field:
        start, end, block = tags_field
        if block is None:
            items = _split_inline(lines[start].split(":", 1)[1])
            keep = []
            for item in items:
                name = _domain_name(item, config)
                if name is not None:
                    domain_names.append(name)
                    result.removed_tags.append(_unquote(item))
                else:
                    keep.append(item)
            new_tag_lines = [f"tags: [{', '.join(keep)}]"]
        else:
            keep = []
            for line in block:
                name = _domain_name(line.strip()[1:], config) if line.strip().startswith("-") else None
                if name is not None:
                    domain_names.append(name)
                    result.removed_tags.append(_unquote(line.strip()[1:]))
                else:
                    keep.append(line)
            new_tag_lines = [lines[start]] + keep if keep else ["tags: []"]
    else:
        start = end = None
        new_tag_lines = []

    # 解析領域
    domains = _field_values(lines, "domains")
    topics = _field_values(lines, "domain_topics")
    for name in domain_names:
        try:
            resolved = config.resolve(name)
        except KeyError:
            result.unknown.append(name)
            continue
        if resolved is None:
            continue
        domain, topic = resolved
        if domain not in domains:
            domains.append(domain)
        if topic and topic not in topics:
            topics.append(topic)

    if result.unknown:
        return result

    # 已有具體子主題時，不再歸入同領域的 general（避免「一般」重複列出所有卡片）
    original_topics = _field_values(lines, "domain_topics")
    specific = {t.split("/", 1)[0] for t in topics if not t.endswith("/general")}
    topics = [t for t in topics if not (t.endswith("/general") and t.split("/", 1)[0] in specific)]
    topics_changed = topics != original_topics

    # 卡片內指向舊 domain tag 定義頁的連結
    body = content[match.end():]

    def fix_link(m):
        text, name = m.group(1), m.group(3)
        try:
            resolved = config.resolve(name)
        except KeyError:
            return m.group(0)
        if resolved is None:
            return m.group(0)
        slug = resolved[0]
        if text.startswith("domain/"):
            text = config.domains[slug]["name_ja"]
        result.links_fixed += 1
        return f"[{text}](../../domains/{slug}/)"

    body = META_LINK_RE.sub(fix_link, body)

    if not domain_names and not result.links_fixed and not topics_changed:
        return result

    # 重組 frontmatter：移除舊的 domains / domain_topics，再插在 tags 之後
    if tags_field:
        lines = lines[:start] + new_tag_lines + lines[end:]
    for key in ("domains", "domain_topics"):
        found = _find_field(lines, key)
        if found:
            lines = lines[:found[0]] + lines[found[1]:]

    insert = []
    if domains:
        insert += _render_list("domains", domains)
    if topics:
        insert += _render_list("domain_topics", topics)

    tags_after = _find_field(lines, "tags")
    position = tags_after[1] if tags_after else len(lines)
    lines = lines[:position] + insert + lines[position:]

    new_content = "---\n" + "\n".join(lines) + "\n---\n" + body
    result.changed = new_content != content
    result.content = new_content
    result.domains = domains
    result.topics = topics
    return result


def card_files(zettel_dir: Path = ZETTELKASTEN_DIR):
    for path in sorted(zettel_dir.rglob("*.md")):
        rel = path.relative_to(zettel_dir)
        if rel.parts[0].startswith("_") or path.name.startswith("_"):
            continue
        yield path


def main(argv=None) -> int:
    args = sys.argv[1:] if argv is None else argv
    dry_run = "--dry-run" in args
    check = "--check" in args

    config = DomainConfig.load()

    if check:
        remaining = []
        for path in card_files():
            match = FRONTMATTER_RE.match(path.read_text(encoding="utf-8"))
            if match and re.search(r"^\s*-\s*[\"']?domain/|^tags:.*domain/", match.group(1), re.M):
                remaining.append(path.relative_to(PROJECT_ROOT))
        for p in remaining:
            print(f"❌ {p} 仍有 domain/* tag")
        if not remaining:
            print("✅ 沒有殘留的 domain/* tag")
        return 1 if remaining else 0

    changed = 0
    links = 0
    errors = []
    per_domain: dict = {}
    for path in card_files():
        content = path.read_text(encoding="utf-8")
        result = migrate_content(content, config)
        if result.unknown:
            errors.append((path, result.unknown))
            continue
        if not result.changed:
            continue
        changed += 1
        links += result.links_fixed
        for d in result.domains:
            per_domain[d] = per_domain.get(d, 0) + 1
        if not dry_run:
            path.write_text(result.content, encoding="utf-8")

    verb = "將遷移" if dry_run else "已遷移"
    print(f"{'🔍' if dry_run else '✅'} {verb} {changed} 張卡片，修正 {links} 個舊定義頁連結")
    for slug, count in sorted(per_domain.items(), key=lambda x: -x[1]):
        print(f"   {slug:15} {count}")

    if errors:
        print(f"\n❌ {len(errors)} 張卡片有未定義的 domain tag（未修改），請在 data/domains.toml 的 [aliases] 補上：")
        for path, unknown in errors:
            print(f"   {path.relative_to(PROJECT_ROOT)}: {', '.join(unknown)}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
