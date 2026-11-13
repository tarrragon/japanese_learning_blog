#!/usr/bin/env python3
# /// script
# dependencies = []
# requires-python = ">=3.11"
# ///
"""
盤點卡片欄位與內容缺口

檢查項目：
  - title：frontmatter 缺少（附上內文第一個 # 標題作為建議值）
  - description：frontmatter 缺少
  - chinese：沒有中文說明段落，或段落為空 / 只有佔位文字
  - stub：整張卡片仍是空範本（沒有任何實質的日文 / 英文 / 中文說明）
  - stage：frontmatter 為 pending，但內容已具備三語說明（應至少為 draft）

中文段落的標題寫法很多（## 中文解釋、### 繁體中文、## 中文（繁體）…），
凡是 H2~H4 標題含「中文 / 繁體 / Traditional Chinese」且不含「例句」者都視為中文說明。

執行：
  uv run scripts/audit_card_fields.py              # 摘要
  uv run scripts/audit_card_fields.py --json       # 完整清單（JSON）
"""

from __future__ import annotations

import json
import re
import sys
from dataclasses import asdict, dataclass, field
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
ZETTELKASTEN_DIR = PROJECT_ROOT / "zettelkasten"

FRONTMATTER_RE = re.compile(r"\A---\n(.*?\n)---\n", re.DOTALL)
HEADING_RE = re.compile(r"^(#{1,6})\s+(.+?)\s*$", re.MULTILINE)
H1_RE = re.compile(r"^#\s+(.+?)\s*$", re.MULTILINE)

ZH_HEADING_RE = re.compile(r"中文|繁體|Traditional Chinese", re.IGNORECASE)
JA_HEADING_RE = re.compile(r"日文|日本語|Japanese|日文解釋", re.IGNORECASE)
EN_HEADING_RE = re.compile(r"英文|English", re.IGNORECASE)
EXCLUDE_HEADING_RE = re.compile(r"例句|例文|Example", re.IGNORECASE)

PLACEHOLDER_RE = re.compile(r"\{[^}\n]*\}|待填寫|待填充|待補充|待建立內容|TODO|TBD|（略）|\.\.\.$")
HAN_RE = re.compile(r"[一-鿿]")
KANA_RE = re.compile(r"[ぁ-ヿ]")
LATIN_WORD_RE = re.compile(r"[A-Za-z]{2,}")
# 例句的翻譯行（**中文翻譯**：…）不算中文說明
EXAMPLE_TRANSLATION_RE = re.compile(r"^[-*>\s]*\**(中文翻譯|中文|翻譯|英文翻譯|English)\**\s*[:：]")

MIN_HAN = {"ja": 8, "zh": 2}  # 段落至少的漢字數（中文可以是簡短釋義，如「對不起（口語）」）
MIN_EN_WORDS = 3              # 英文段落至少的單字數
MIN_PROSE_LINES = 3           # 不用「中文解釋」標題、直接以中文撰寫的卡片


def _scalar(frontmatter: str, key: str) -> str:
    m = re.search(rf"^{key}:[ \t]*(.*)$", frontmatter, re.M)
    if not m:
        return ""
    value = m.group(1).strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
        value = value[1:-1]
    return value.strip()


def sections(body: str) -> list[tuple[int, str, str]]:
    """[(層級, 標題, 內容)]，內容到下一個同層或更高層標題為止"""
    headings = list(HEADING_RE.finditer(body))
    result = []
    for i, h in enumerate(headings):
        level = len(h.group(1))
        end = len(body)
        for nxt in headings[i + 1:]:
            if len(nxt.group(1)) <= level:
                end = nxt.start()
                break
        result.append((level, h.group(2), body[h.end():end]))
    return result


def _meaningful(text: str, kind: str) -> bool:
    cleaned = PLACEHOLDER_RE.sub("", text)
    cleaned = re.sub(r"[#>*`|\-_\s]", "", cleaned)
    if kind == "en":
        return len(LATIN_WORD_RE.findall(PLACEHOLDER_RE.sub("", text))) >= MIN_EN_WORDS
    return len(HAN_RE.findall(cleaned)) >= MIN_HAN[kind]


def prose_lines(body: str) -> tuple[int, int]:
    """
    (中文段落行數, 日文段落行數)
    中文行：漢字 >= 6 且幾乎沒有假名；日文行：假名 >= 5。
    排除標題、表格、程式碼、佔位文字與例句翻譯行。
    """
    zh = ja = 0
    for line in body.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith(("#", "|", "```")) or PLACEHOLDER_RE.search(stripped):
            continue
        if EXAMPLE_TRANSLATION_RE.match(stripped):
            continue
        han, kana = len(HAN_RE.findall(stripped)), len(KANA_RE.findall(stripped))
        if kana >= 5:
            ja += 1
        elif han >= 6 and kana <= 1:
            zh += 1
    return zh, ja


def has_section(body: str, heading_re: re.Pattern, kind: str) -> bool:
    for level, title, content in sections(body):
        if level < 2 or level > 4:
            continue
        if not heading_re.search(title) or EXCLUDE_HEADING_RE.search(title):
            continue
        if _meaningful(content, kind):
            return True
    return False


@dataclass
class CardAudit:
    path: str
    category: str
    stage: str
    draft: bool
    title: str = ""
    h1: str = ""
    description: str = ""
    has_japanese: bool = False
    has_english: bool = False
    has_chinese: bool = False
    issues: list = field(default_factory=list)


def audit_card(path: Path, zettel_dir: Path = ZETTELKASTEN_DIR) -> CardAudit | None:
    text = path.read_text(encoding="utf-8")
    match = FRONTMATTER_RE.match(text)
    if not match:
        return None
    fm, body = match.group(1), text[match.end():]
    rel = path.relative_to(zettel_dir)

    h1 = H1_RE.search(body)
    zh_lines, ja_lines = prose_lines(body)
    audit = CardAudit(
        path=str(rel),
        category=rel.parts[0],
        stage=_scalar(fm, "stage"),
        draft=_scalar(fm, "draft").lower() == "true",
        title=_scalar(fm, "title"),
        h1=h1.group(1) if h1 else "",
        description=_scalar(fm, "description"),
        has_japanese=has_section(body, JA_HEADING_RE, "ja"),
        has_english=has_section(body, EN_HEADING_RE, "en"),
        has_chinese=has_section(body, ZH_HEADING_RE, "zh") or zh_lines >= MIN_PROSE_LINES,
    )
    has_any_prose = zh_lines >= MIN_PROSE_LINES or ja_lines >= MIN_PROSE_LINES

    if not audit.title:
        audit.issues.append("title")
    if not audit.description:
        audit.issues.append("description")
    if not (audit.has_japanese or audit.has_english or audit.has_chinese or has_any_prose):
        audit.issues.append("stub")
    elif not audit.has_chinese:
        audit.issues.append("chinese")
    if audit.stage == "pending" and audit.has_japanese and audit.has_english and audit.has_chinese:
        audit.issues.append("stage")
    return audit


def audit_all(zettel_dir: Path = ZETTELKASTEN_DIR) -> list[CardAudit]:
    results = []
    for path in sorted(zettel_dir.rglob("*.md")):
        rel = path.relative_to(zettel_dir)
        if rel.parts[0].startswith("_") or rel.parts[0] == "domains" or path.name.startswith("_"):
            continue
        if path.name in ("index.md", "README.md", "search.md"):
            continue
        audit = audit_card(path, zettel_dir)
        if audit:
            results.append(audit)
    return results


def main() -> int:
    results = audit_all()
    if "--json" in sys.argv[1:]:
        print(json.dumps([asdict(r) for r in results if r.issues], ensure_ascii=False, indent=2))
        return 0

    def count(issue):
        return sum(1 for r in results if issue in r.issues)

    title_with_h1 = sum(1 for r in results if "title" in r.issues and r.h1)
    print(f"📋 卡片欄位盤點（共 {len(results)} 張）\n")
    print(f"  缺 title：{count('title')}（其中 {title_with_h1} 張可用內文 # 標題補上）")
    print(f"  缺 description：{count('description')}")
    print(f"  缺中文說明（其他語言已有）：{count('chinese')}")
    print(f"  空範本卡片（三語皆無）：{count('stub')}")
    print(f"  stage 為 pending 但三語已齊：{count('stage')}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
