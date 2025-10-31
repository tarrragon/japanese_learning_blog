#!/usr/bin/env python3
"""
Get Pending Cards Script
讀取待辦卡片清單（用於建立 Todo 任務）

Usage:
    # 文字格式（預設）
    uv run scripts/get_pending_cards.py --stage pending --priority Critical --limit 10

    # JSON 格式（供程式解析）
    uv run scripts/get_pending_cards.py --stage pending --format json

    # 篩選特定分類
    uv run scripts/get_pending_cards.py --category noun --stage pending --limit 20

    # 複合篩選
    uv run scripts/get_pending_cards.py \
        --stage pending \
        --priority Critical \
        --category noun \
        --jlpt n5 \
        --limit 5 \
        --format json
"""

import csv
import json
import argparse
import sys
from pathlib import Path
from typing import List, Dict, Optional

class PendingCardReader:
    """讀取待辦卡片清單"""

    def __init__(self, csv_path: str):
        self.csv_path = Path(csv_path)
        self.cards = []

        if not self.csv_path.exists():
            print(f"❌ CSV 檔案不存在: {csv_path}", file=sys.stderr)
            sys.exit(1)

        self.load_cards()

    def load_cards(self):
        """載入 CSV 檔案"""
        with open(self.csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            self.cards = list(reader)

    def filter_cards(self,
                    stage: Optional[str] = None,
                    priority: Optional[str] = None,
                    category: Optional[str] = None,
                    jlpt: Optional[str] = None,
                    batch: Optional[str] = None,
                    limit: Optional[int] = None) -> List[Dict]:
        """篩選卡片"""
        result = self.cards

        if stage:
            result = [c for c in result if c['stage'] == stage]

        if priority:
            result = [c for c in result if c['priority'] == priority]

        if category:
            result = [c for c in result if c['category'] == category]

        if jlpt:
            result = [c for c in result if c['jlpt'] == jlpt]

        if batch:
            result = [c for c in result if c['batch'] == batch]

        if limit and limit > 0:
            result = result[:limit]

        return result

    def format_text(self, cards: List[Dict]) -> str:
        """格式化為文字清單"""
        if not cards:
            return "📋 未找到符合條件的卡片"

        lines = [f"📋 找到 {len(cards)} 張卡片\n"]

        for card in cards:
            line = (
                f"ID: {card['id']:>3} | "
                f"{card['category']:12} | "
                f"{card['path']:40} | "
                f"{card['japanese']:15} | "
                f"{card['chinese']:10} | "
                f"JLPT: {card['jlpt']:7} | "
                f"{card['priority']:8} | "
                f"{card['stage']}"
            )
            lines.append(line)

        return '\n'.join(lines)

    def format_json(self, cards: List[Dict]) -> str:
        """格式化為 JSON（供 TodoWrite 使用）"""
        # 簡化卡片資訊，只保留 Todo 所需欄位
        todo_cards = []

        for card in cards:
            todo_card = {
                'id': int(card['id']),
                'category': card['category'],
                'path': card['path'],
                'japanese': card['japanese'],
                'chinese': card['chinese'],
                'priority': card['priority'],
                'stage': card['stage'],
                'jlpt': card['jlpt'],
                # TodoWrite 可以使用的描述
                'content': f"建立 {card['path']}",
                'activeForm': f"建立 {card['japanese']}（{card['chinese']}）卡片"
            }
            todo_cards.append(todo_card)

        return json.dumps(todo_cards, ensure_ascii=False, indent=2)

    def get_cards(self,
                 stage: Optional[str] = None,
                 priority: Optional[str] = None,
                 category: Optional[str] = None,
                 jlpt: Optional[str] = None,
                 batch: Optional[str] = None,
                 limit: Optional[int] = None,
                 output_format: str = 'text') -> str:
        """取得卡片清單並格式化"""
        cards = self.filter_cards(stage, priority, category, jlpt, batch, limit)

        if output_format == 'json':
            return self.format_json(cards)
        else:
            return self.format_text(cards)

def main():
    parser = argparse.ArgumentParser(description='讀取待辦卡片清單')
    parser.add_argument('--csv', default='doc/worklog/cards-1.0.6.csv',
                       help='CSV 檔案路徑（預設: doc/worklog/cards-1.0.6.csv）')

    # 篩選條件
    parser.add_argument('--stage', help='篩選階段（pending, draft, extension-review, linking, completed）')
    parser.add_argument('--priority', help='篩選優先級（Critical, High, Medium, Low）')
    parser.add_argument('--category', help='篩選分類（noun, verb-ru, grammar 等）')
    parser.add_argument('--jlpt', help='篩選 JLPT 等級（n5, n4, n3, n2, n1, concept）')
    parser.add_argument('--batch', help='篩選批次號碼')
    parser.add_argument('--limit', type=int, help='限制回傳數量')

    # 輸出格式
    parser.add_argument('--format', choices=['text', 'json'], default='text',
                       help='輸出格式（text: 人類可讀, json: 程式解析）')

    args = parser.parse_args()

    # 建立讀取器
    reader = PendingCardReader(args.csv)

    # 取得並輸出卡片清單
    output = reader.get_cards(
        stage=args.stage,
        priority=args.priority,
        category=args.category,
        jlpt=args.jlpt,
        batch=args.batch,
        limit=args.limit,
        output_format=args.format
    )

    print(output)
    return 0

if __name__ == '__main__':
    sys.exit(main())
