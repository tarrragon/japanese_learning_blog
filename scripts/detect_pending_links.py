#!/usr/bin/env python3
# /// script
# dependencies = []
# requires-python = ">=3.10"
# ///

"""
檢測卡片中的「待建立」連結標記

用途：掃描所有卡片，找出尚未建立的連結
執行：uv run scripts/detect_pending_links.py [選項]

選項：
  --scan              掃描所有卡片（預設）
  --report            生成詳細報告
  --category CAT      只掃描特定分類
  --format text|json  輸出格式（預設 text）
  --summary           只顯示摘要

檢測的標記格式：
  - [文字](待建立)
  - [文字](【待建立】)
  - [待建立](pending)
  - （待建立）
  - [待建立: xxx]()
"""

import json
import re
import sys
from pathlib import Path
from collections import defaultdict
from dataclasses import dataclass, field, asdict

# 專案根目錄
PROJECT_ROOT = Path(__file__).parent.parent
ZETTELKASTEN_DIR = PROJECT_ROOT / "zettelkasten"

# 不掃描的目錄
EXCLUDE_DIRS = {"_meta", ".DS_Store"}

# 待建立標記的正則表達式
PENDING_PATTERNS = [
    # [文字](待建立) 或 [文字](【待建立】)
    re.compile(r'\[([^\]]+)\]\((待建立|【待建立】)\)'),
    # [待建立](pending) 或 [待建立: xxx](...)
    re.compile(r'\[待建立[：:\s]*([^\]]*)\]\([^)]*\)'),
    # （待建立） 在連結後
    re.compile(r'\[[^\]]+\]\([^)]+\)（待建立）'),
    # 純文字（待建立）或 (待建立)
    re.compile(r'[（(]待建立[）)]'),
]


@dataclass
class PendingLink:
    """待建立連結資訊"""
    text: str           # 連結文字
    line_number: int    # 行號
    line_content: str   # 該行內容
    pattern_type: str   # 匹配的模式類型


@dataclass
class CardPendingLinks:
    """卡片的待建立連結"""
    path: str
    category: str
    card_name: str
    pending_links: list = field(default_factory=list)

    @property
    def count(self) -> int:
        return len(self.pending_links)


def parse_yaml_frontmatter(content: str) -> dict:
    """解析 YAML frontmatter"""
    yaml_match = re.search(r'^---\s*\n(.*?)\n---\s*\n', content, re.DOTALL)
    if not yaml_match:
        return {}

    yaml_content = yaml_match.group(1)
    data = {}

    for line in yaml_content.split("\n"):
        if ":" in line and not line.startswith("-"):
            parts = line.split(":", 1)
            key = parts[0].strip()
            value = parts[1].strip() if len(parts) > 1 else ""
            data[key] = value

    return data


def detect_pending_in_file(file_path: Path) -> CardPendingLinks:
    """檢測單個檔案中的待建立連結"""
    content = file_path.read_text(encoding="utf-8")
    lines = content.split("\n")

    category = file_path.parent.name
    card_name = file_path.stem

    result = CardPendingLinks(
        path=str(file_path.relative_to(PROJECT_ROOT)),
        category=category,
        card_name=card_name
    )

    for line_num, line in enumerate(lines, start=1):
        # 跳過 frontmatter
        if line.strip() == "---":
            continue

        for i, pattern in enumerate(PENDING_PATTERNS):
            matches = pattern.findall(line)
            if matches:
                for match in matches:
                    text = match if isinstance(match, str) else match[0] if match else ""
                    result.pending_links.append(PendingLink(
                        text=text,
                        line_number=line_num,
                        line_content=line.strip(),
                        pattern_type=f"pattern_{i+1}"
                    ))

    return result


def scan_all_cards(category_filter: str = None) -> list[CardPendingLinks]:
    """掃描所有卡片"""
    results = []

    if not ZETTELKASTEN_DIR.exists():
        return results

    for category_dir in sorted(ZETTELKASTEN_DIR.iterdir()):
        if not category_dir.is_dir() or category_dir.name in EXCLUDE_DIRS:
            continue

        if category_filter and category_dir.name != category_filter:
            continue

        for card_file in sorted(category_dir.iterdir()):
            if not card_file.is_file() or card_file.suffix != ".md":
                continue
            if card_file.name == "index.md":
                continue

            try:
                card_result = detect_pending_in_file(card_file)
                if card_result.count > 0:
                    results.append(card_result)
            except Exception as e:
                print(f"警告: 無法處理 {card_file}: {e}", file=sys.stderr)

    return results


def generate_summary(results: list[CardPendingLinks]) -> dict:
    """生成摘要統計"""
    total_cards = 0
    total_pending = 0
    by_category = defaultdict(lambda: {"cards": 0, "pending": 0})

    for card in results:
        total_cards += 1
        total_pending += card.count
        by_category[card.category]["cards"] += 1
        by_category[card.category]["pending"] += card.count

    return {
        "total_cards_with_pending": total_cards,
        "total_pending_links": total_pending,
        "by_category": dict(by_category)
    }


def format_text_output(results: list[CardPendingLinks], show_summary: bool = False):
    """格式化文字輸出"""
    summary = generate_summary(results)

    print("\n" + "=" * 80)
    print("待建立連結檢測報告")
    print("=" * 80)

    print(f"\n📊 摘要統計")
    print(f"  含待建立標記的卡片數: {summary['total_cards_with_pending']}")
    print(f"  待建立連結總數: {summary['total_pending_links']}")

    print(f"\n📁 按分類統計:")
    for cat, stats in sorted(summary["by_category"].items()):
        print(f"  {cat}: {stats['cards']} 張卡片, {stats['pending']} 個待建立")

    if not show_summary:
        print(f"\n📝 詳細清單:")
        print("-" * 80)

        for card in results:
            print(f"\n📄 {card.path}")
            for link in card.pending_links:
                print(f"   L{link.line_number}: {link.text or '(無文字)'}")
                print(f"         {link.line_content[:60]}...")

    print("\n" + "=" * 80)


def format_json_output(results: list[CardPendingLinks]):
    """格式化 JSON 輸出"""
    summary = generate_summary(results)
    output = {
        "summary": summary,
        "cards": []
    }

    for card in results:
        card_dict = {
            "path": card.path,
            "category": card.category,
            "card_name": card.card_name,
            "count": card.count,
            "pending_links": [
                {
                    "text": link.text,
                    "line_number": link.line_number,
                    "line_content": link.line_content
                }
                for link in card.pending_links
            ]
        }
        output["cards"].append(card_dict)

    print(json.dumps(output, ensure_ascii=False, indent=2))


def generate_report(results: list[CardPendingLinks]):
    """生成詳細報告到標準輸出"""
    summary = generate_summary(results)

    print("# 待建立連結報告\n")
    print(f"生成時間: {__import__('datetime').datetime.now().isoformat()}\n")

    print("## 摘要\n")
    print(f"- 含待建立標記的卡片數: **{summary['total_cards_with_pending']}**")
    print(f"- 待建立連結總數: **{summary['total_pending_links']}**\n")

    print("## 按分類統計\n")
    print("| 分類 | 卡片數 | 待建立數 |")
    print("|------|--------|----------|")
    for cat, stats in sorted(summary["by_category"].items()):
        print(f"| {cat} | {stats['cards']} | {stats['pending']} |")

    print("\n## 詳細清單\n")
    for card in results:
        print(f"### {card.path}\n")
        print("| 行號 | 連結文字 | 內容 |")
        print("|------|----------|------|")
        for link in card.pending_links:
            text = link.text or "(無文字)"
            content = link.line_content[:40].replace("|", "\\|")
            print(f"| {link.line_number} | {text} | {content}... |")
        print()


def main():
    """主要邏輯"""
    args = sys.argv[1:]

    # 解析選項
    show_report = "--report" in args
    show_summary = "--summary" in args
    output_format = "json" if "--format" in args and "json" in args else "text"

    category_filter = None
    if "--category" in args:
        idx = args.index("--category")
        if idx + 1 < len(args):
            category_filter = args[idx + 1]

    # 掃描
    results = scan_all_cards(category_filter)

    # 輸出
    if show_report:
        generate_report(results)
    elif output_format == "json":
        format_json_output(results)
    else:
        format_text_output(results, show_summary)

    # 返回狀態
    sys.exit(0 if len(results) == 0 else 1)


if __name__ == "__main__":
    main()
