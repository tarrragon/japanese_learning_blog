#!/usr/bin/env python3
# /// script
# dependencies = []
# requires-python = ">=3.11"
# ///
"""
列出可用的專業領域（domains）與子主題，以及各自的卡片數

領域定義在 data/domains.toml。卡片在 frontmatter 使用：
  domains:
    - economics
  domain_topics:
    - economics/finance

執行：
  uv run scripts/list-domains.py          # 文字輸出
  uv run scripts/list-domains.py --json   # JSON 輸出（供代理人使用）
"""

import json
import re
import sys
import tomllib
from collections import Counter
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
ZETTELKASTEN_DIR = PROJECT_ROOT / "zettelkasten"
DOMAINS_FILE = PROJECT_ROOT / "data" / "domains.toml"

FRONTMATTER_RE = re.compile(r"\A---\n(.*?\n)---\n", re.DOTALL)


def _list_field(frontmatter: str, key: str) -> list[str]:
    match = re.search(rf"^{key}:[ \t]*(\[.*\])?[ \t]*\n((?:[ \t]+-.*\n)*)", frontmatter, re.M)
    if not match:
        return []
    if match.group(1):
        return [v.strip().strip("\"'") for v in match.group(1)[1:-1].split(",") if v.strip()]
    return [l.strip()[1:].strip().strip("\"'") for l in match.group(2).splitlines()]


def count_usage():
    domains, topics = Counter(), Counter()
    for path in ZETTELKASTEN_DIR.rglob("*.md"):
        rel = path.relative_to(ZETTELKASTEN_DIR)
        if rel.parts[0].startswith("_") or path.name.startswith("_"):
            continue
        match = FRONTMATTER_RE.match(path.read_text(encoding="utf-8"))
        if not match:
            continue
        domains.update(_list_field(match.group(1), "domains"))
        topics.update(_list_field(match.group(1), "domain_topics"))
    return domains, topics


def main() -> int:
    data = tomllib.loads(DOMAINS_FILE.read_text(encoding="utf-8"))
    domain_counts, topic_counts = count_usage()

    result = []
    for d in data.get("domains", []):
        result.append({
            "slug": d["slug"],
            "name_ja": d.get("name_ja", ""),
            "name_zh": d.get("name_zh", ""),
            "count": domain_counts.get(d["slug"], 0),
            "topics": [
                {
                    "id": f"{d['slug']}/{t['slug']}",
                    "name_ja": t.get("name_ja", ""),
                    "name_zh": t.get("name_zh", ""),
                    "count": topic_counts.get(f"{d['slug']}/{t['slug']}", 0),
                }
                for t in d.get("topics", [])
            ],
        })

    known = {d["slug"] for d in result}
    unknown = sorted(set(domain_counts) - known)

    if "--json" in sys.argv[1:]:
        print(json.dumps({"domains": result, "undefined": unknown}, ensure_ascii=False, indent=2))
    else:
        print("📚 專業領域（data/domains.toml）\n")
        for d in result:
            print(f"  {d['slug']:15} {d['name_ja']}／{d['name_zh']}  {d['count']} 張")
            for t in d["topics"]:
                print(f"    └ {t['id']:22} {t['name_ja']}／{t['name_zh']}  {t['count']} 張")
        if unknown:
            print(f"\n❌ 卡片使用了未定義的領域：{', '.join(unknown)}")

    return 1 if unknown else 0


if __name__ == "__main__":
    sys.exit(main())
