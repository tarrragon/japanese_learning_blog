#!/usr/bin/env python3
"""
Stage Dashboard - 統一階段管理看板
作為進度判斷的單一事實依據，從 YAML frontmatter 掃描卡片狀態

Usage:
    # 顯示總覽（預設）
    uv run scripts/stage_dashboard.py

    # 顯示特定階段的待處理卡片
    uv run scripts/stage_dashboard.py --stage draft --limit 50

    # 按分類顯示某階段卡片
    uv run scripts/stage_dashboard.py --stage draft --by-category

    # JSON 格式輸出（供代理人使用）
    uv run scripts/stage_dashboard.py --stage draft --format json

    # 顯示下一步行動建議
    uv run scripts/stage_dashboard.py --next-action

設計原則：
    1. YAML frontmatter 是進度追蹤的單一事實來源
    2. 每次分配任務前執行此腳本查詢狀態
    3. 腳本輸出作為代理人任務分配的依據
"""

import json
import argparse
import sys
import re
from pathlib import Path
from typing import Dict, List, Optional
from collections import defaultdict

# 專案根目錄
PROJECT_ROOT = Path(__file__).parent.parent
ZETTELKASTEN_DIR = PROJECT_ROOT / "zettelkasten"
EXCLUDE_DIRS = {"_meta", ".DS_Store"}

# 階段定義（按流程順序）
STAGES = ["pending", "draft", "extension-review", "linking", "completed"]

# 階段對應的代理人
STAGE_AGENTS = {
    "pending": "card-structure-handler + build-card-content",
    "draft": "create-extension-cards",
    "extension-review": "build-card-links",
    "linking": "最終驗證（人工 + diagram-designer）",
    "completed": "（已完成）"
}

# 階段描述
STAGE_DESC = {
    "pending": "待建立內容",
    "draft": "待延伸需求審查",
    "extension-review": "待建立連結",
    "linking": "待最終驗證",
    "completed": "已完成"
}


def parse_yaml_frontmatter(content: str) -> dict:
    """解析 YAML frontmatter"""
    yaml_match = re.search(r'^---\s*\n(.*?)\n---\s*\n', content, re.DOTALL)
    if not yaml_match:
        return {}

    yaml_content = yaml_match.group(1)
    data = {}

    for line in yaml_content.split("\n"):
        if ":" in line and not line.startswith("-") and not line.startswith(" "):
            parts = line.split(":", 1)
            key = parts[0].strip()
            value = parts[1].strip().strip('"').strip("'") if len(parts) > 1 else ""
            data[key] = value

    return data


def scan_all_cards() -> List[Dict]:
    """從 YAML frontmatter 掃描所有卡片"""
    cards = []

    if not ZETTELKASTEN_DIR.exists():
        return cards

    for category_dir in sorted(ZETTELKASTEN_DIR.iterdir()):
        if not category_dir.is_dir() or category_dir.name in EXCLUDE_DIRS:
            continue

        for card_file in sorted(category_dir.iterdir()):
            if not card_file.is_file() or card_file.suffix != ".md":
                continue
            if card_file.name in ["index.md", "_index.md"]:
                continue

            try:
                content = card_file.read_text(encoding="utf-8")
                yaml_data = parse_yaml_frontmatter(content)

                # 提取編號
                stem = card_file.stem
                number = stem.split('_')[0] if '_' in stem else ''

                card = {
                    'path': str(card_file.relative_to(PROJECT_ROOT)),
                    'category': category_dir.name,
                    'number': number,
                    'title': yaml_data.get('title', stem),
                    'description': yaml_data.get('description', ''),
                    'stage': yaml_data.get('stage', 'pending'),
                    'jlpt': yaml_data.get('jlpt', ''),
                    'type': yaml_data.get('type', ''),
                }
                cards.append(card)

            except Exception as e:
                print(f"⚠️ 無法解析 {card_file}: {e}", file=sys.stderr)

    return cards


def generate_overview(cards: List[Dict]) -> str:
    """生成總覽報告"""
    total = len(cards)

    # 按階段統計
    stage_counts = defaultdict(int)
    for card in cards:
        stage_counts[card['stage']] += 1

    # 按分類統計
    category_counts = defaultdict(int)
    for card in cards:
        category_counts[card['category']] += 1

    lines = []
    lines.append("=" * 70)
    lines.append("📊 卡片階段總覽（YAML 事實來源）")
    lines.append("=" * 70)
    lines.append(f"\n總卡片數: {total}\n")

    # 階段進度條
    lines.append("【階段分佈】")
    lines.append("-" * 70)

    for stage in STAGES:
        count = stage_counts.get(stage, 0)
        pct = (count / total * 100) if total > 0 else 0
        bar_len = int(pct / 2)
        bar = "█" * bar_len + "░" * (50 - bar_len)

        agent = STAGE_AGENTS.get(stage, '')
        lines.append(f"  {stage:20} {count:5} ({pct:5.1f}%) {bar}")
        if count > 0 and stage != 'completed':
            lines.append(f"                       → 代理人: {agent}")

    # 分類分佈
    lines.append(f"\n【分類分佈】")
    lines.append("-" * 70)
    for category, count in sorted(category_counts.items(), key=lambda x: -x[1]):
        pct = (count / total * 100) if total > 0 else 0
        lines.append(f"  {category:20} {count:5} ({pct:5.1f}%)")

    return "\n".join(lines)


def generate_next_action(cards: List[Dict]) -> str:
    """生成下一步行動建議"""
    stage_counts = defaultdict(int)
    stage_by_category = defaultdict(lambda: defaultdict(int))

    for card in cards:
        stage = card['stage']
        category = card['category']
        stage_counts[stage] += 1
        stage_by_category[stage][category] += 1

    lines = []
    lines.append("=" * 70)
    lines.append("🎯 下一步行動建議")
    lines.append("=" * 70)

    # 找出需要處理的階段（按優先級：draft > extension-review > linking > pending）
    priority_order = ["draft", "extension-review", "linking", "pending"]

    for stage in priority_order:
        count = stage_counts.get(stage, 0)
        if count > 0:
            lines.append(f"\n【優先處理】{stage} 階段 ({count} 張)")
            lines.append("-" * 70)
            lines.append(f"  描述: {STAGE_DESC[stage]}")
            lines.append(f"  代理人: {STAGE_AGENTS[stage]}")
            lines.append(f"\n  按分類分佈:")

            for category, cat_count in sorted(stage_by_category[stage].items(), key=lambda x: -x[1]):
                lines.append(f"    {category:15} {cat_count:4} 張")

            lines.append(f"\n  建議命令:")
            lines.append(f"    uv run scripts/stage_dashboard.py --stage {stage} --by-category")
            lines.append(f"    uv run scripts/stage_dashboard.py --stage {stage} --limit 50 --format json")
            break

    # 完成率
    completed = stage_counts.get('completed', 0)
    total = sum(stage_counts.values())
    completion_rate = (completed / total * 100) if total > 0 else 0

    lines.append(f"\n【整體進度】")
    lines.append("-" * 70)
    lines.append(f"  完成率: {completion_rate:.1f}% ({completed}/{total})")

    return "\n".join(lines)


def list_stage_cards(cards: List[Dict], stage: str, by_category: bool = False,
                     limit: Optional[int] = None) -> str:
    """列出特定階段的卡片"""
    filtered = [c for c in cards if c['stage'] == stage]

    if limit:
        filtered = filtered[:limit]

    lines = []
    lines.append(f"\n📋 {stage} 階段卡片 ({len(filtered)} 張)")
    lines.append("=" * 70)

    if by_category:
        # 按分類分組
        by_cat = defaultdict(list)
        for card in filtered:
            by_cat[card['category']].append(card)

        for category, cat_cards in sorted(by_cat.items()):
            lines.append(f"\n【{category}】({len(cat_cards)} 張)")
            lines.append("-" * 60)
            for card in cat_cards[:20]:  # 每分類最多顯示 20 張
                lines.append(f"  #{card['number']:4} | {card['title'][:30]:30} | {card['path']}")
            if len(cat_cards) > 20:
                lines.append(f"  ... 還有 {len(cat_cards) - 20} 張")
    else:
        # 直接列出
        for card in filtered:
            lines.append(f"#{card['number']:4} | {card['category']:12} | {card['title'][:25]:25} | {card['path']}")

    return "\n".join(lines)


def format_json(cards: List[Dict], stage: Optional[str] = None,
                limit: Optional[int] = None) -> str:
    """JSON 格式輸出（供代理人使用）"""
    if stage:
        filtered = [c for c in cards if c['stage'] == stage]
    else:
        filtered = cards

    if limit:
        filtered = filtered[:limit]

    # 轉換為代理人友好格式
    output = {
        "total": len(filtered),
        "stage": stage,
        "cards": [
            {
                "path": c['path'],
                "category": c['category'],
                "number": c['number'],
                "title": c['title'],
                "stage": c['stage'],
            }
            for c in filtered
        ]
    }

    return json.dumps(output, ensure_ascii=False, indent=2)


def main():
    parser = argparse.ArgumentParser(
        description='階段管理看板 - 從 YAML 掃描卡片狀態',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
範例:
  # 顯示總覽
  uv run scripts/stage_dashboard.py

  # 顯示下一步行動建議
  uv run scripts/stage_dashboard.py --next-action

  # 列出 draft 階段卡片
  uv run scripts/stage_dashboard.py --stage draft

  # 按分類顯示
  uv run scripts/stage_dashboard.py --stage draft --by-category

  # JSON 輸出（供代理人）
  uv run scripts/stage_dashboard.py --stage draft --limit 50 --format json
"""
    )

    parser.add_argument('--stage', choices=STAGES,
                       help='顯示特定階段的卡片')
    parser.add_argument('--by-category', action='store_true',
                       help='按分類分組顯示')
    parser.add_argument('--limit', type=int,
                       help='限制顯示數量')
    parser.add_argument('--format', choices=['text', 'json'], default='text',
                       help='輸出格式')
    parser.add_argument('--next-action', action='store_true',
                       help='顯示下一步行動建議')

    args = parser.parse_args()

    # 掃描所有卡片
    cards = scan_all_cards()

    if not cards:
        print("❌ 未找到任何卡片")
        return 1

    # 根據參數輸出
    if args.format == 'json':
        print(format_json(cards, args.stage, args.limit))
    elif args.next_action:
        print(generate_next_action(cards))
    elif args.stage:
        print(list_stage_cards(cards, args.stage, args.by_category, args.limit))
    else:
        print(generate_overview(cards))
        print("\n" + "-" * 70)
        print("💡 使用 --next-action 查看下一步行動建議")
        print("💡 使用 --stage <stage> 查看特定階段卡片")

    return 0


if __name__ == '__main__':
    sys.exit(main())
