#!/usr/bin/env python3
# /// script
# dependencies = []
# requires-python = ">=3.11"
# ///
"""
補上卡片 frontmatter 的 title / description（只填空白欄位，不覆蓋既有值）

執行：
  # 以內文第一個 # 標題補上缺少的 title
  uv run scripts/fill_card_fields.py --titles-from-h1 [--dry-run]

  # 套用 JSON：{"noun/073_bukka.md": {"title": "...", "description": "..."}, ...}
  uv run scripts/fill_card_fields.py --apply FILE.json [--dry-run]

寫入規則：
  - title 放在 frontmatter 第一行、description 緊接在 title 之後
  - 欄位已存在但為空（title: / title: ""）時就地替換
  - 值一律以雙引號包住並跳脫
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
ZETTELKASTEN_DIR = PROJECT_ROOT / "zettelkasten"

FRONTMATTER_RE = re.compile(r"\A---\n(.*?\n)---\n", re.DOTALL)
H1_RE = re.compile(r"^#\s+(.+?)\s*$", re.MULTILINE)


def _quote(value: str) -> str:
    value = " ".join(value.split())
    return '"' + value.replace("\\", "\\\\").replace('"', '\\"') + '"'


def _current(frontmatter: str, key: str) -> str | None:
    """欄位值；欄位不存在回傳 None"""
    m = re.search(rf"^{key}:[ \t]*(.*)$", frontmatter, re.M)
    if not m:
        return None
    return m.group(1).strip().strip("\"'").strip()


def set_fields(content: str, values: dict) -> tuple[str, list[str]]:
    """只填空白的 title / description；回傳 (新內容, 實際寫入的欄位)"""
    match = FRONTMATTER_RE.match(content)
    if not match:
        return content, []
    lines = match.group(1).rstrip("\n").split("\n")
    written = []

    for key in ("title", "description"):
        value = (values.get(key) or "").strip()
        if not value:
            continue
        frontmatter = "\n".join(lines)
        current = _current(frontmatter, key)
        if current:  # 已有值，不覆蓋
            continue
        new_line = f"{key}: {_quote(value)}"
        if current is not None:
            idx = next(i for i, l in enumerate(lines) if re.match(rf"^{key}:", l))
            lines[idx] = new_line
        elif key == "title":
            lines.insert(0, new_line)
        else:
            title_idx = next((i for i, l in enumerate(lines) if re.match(r"^title:", l)), -1)
            lines.insert(title_idx + 1, new_line)
        written.append(key)

    if not written:
        return content, []
    return "---\n" + "\n".join(lines) + "\n---\n" + content[match.end():], written


def h1_title(content: str) -> str:
    match = FRONTMATTER_RE.match(content)
    body = content[match.end():] if match else content
    h1 = H1_RE.search(body)
    return h1.group(1).strip() if h1 else ""


def main(argv=None) -> int:
    args = sys.argv[1:] if argv is None else argv
    dry_run = "--dry-run" in args

    if "--titles-from-h1" in args:
        updates = {}
        for path in sorted(ZETTELKASTEN_DIR.rglob("*.md")):
            rel = path.relative_to(ZETTELKASTEN_DIR)
            if rel.parts[0].startswith("_") or rel.parts[0] == "domains" or path.name.startswith("_"):
                continue
            title = h1_title(path.read_text(encoding="utf-8"))
            if title:
                updates[str(rel)] = {"title": title}
    elif "--apply" in args:
        source = Path(args[args.index("--apply") + 1])
        updates = json.loads(source.read_text(encoding="utf-8"))
    else:
        print(__doc__)
        return 2

    counts = {"title": 0, "description": 0}
    missing = []
    for rel, values in updates.items():
        path = ZETTELKASTEN_DIR / rel
        if not path.exists():
            missing.append(rel)
            continue
        content, written = set_fields(path.read_text(encoding="utf-8"), values)
        for key in written:
            counts[key] += 1
        if written and not dry_run:
            path.write_text(content, encoding="utf-8")

    verb = "將寫入" if dry_run else "已寫入"
    print(f"{'🔍' if dry_run else '✅'} {verb} title {counts['title']} 張、description {counts['description']} 張")
    if missing:
        print(f"⚠️  找不到 {len(missing)} 個檔案：{', '.join(missing[:5])}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
