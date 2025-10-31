#!/usr/bin/env python3
"""
Allocate Card Numbers Script
為 pending 階段的卡片預先分配編號

用途：
  在開始建立卡片前，為所有待建立的卡片預先分配編號，
  這樣多個代理人可以並發執行而不會產生編號衝突。

Usage:
    # 為所有 pending 卡片分配編號
    uv run scripts/allocate_card_numbers.py

    # 為特定分類分配編號
    uv run scripts/allocate_card_numbers.py --category noun

    # 為特定優先級分配編號
    uv run scripts/allocate_card_numbers.py --priority Critical

    # 限制數量
    uv run scripts/allocate_card_numbers.py --limit 10

    # 乾跑模式（不實際更新 CSV）
    uv run scripts/allocate_card_numbers.py --dry-run
"""

import csv
import sys
import argparse
import json
import subprocess
from pathlib import Path
from collections import defaultdict
from typing import List, Dict

# 專案根目錄
PROJECT_ROOT = Path(__file__).parent.parent

class CardNumberAllocator:
    """卡片編號分配器"""

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
            self.fieldnames = reader.fieldnames

    def save_cards(self):
        """儲存 CSV 檔案"""
        with open(self.csv_path, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=self.fieldnames)
            writer.writeheader()
            writer.writerows(self.cards)

    def filter_cards(self,
                     stage: str = 'pending',
                     category: str = None,
                     priority: str = None,
                     limit: int = None) -> List[Dict]:
        """篩選需要分配編號的卡片"""
        result = []

        for card in self.cards:
            # 只處理 pending 且尚未分配編號的卡片
            if card['stage'] != stage:
                continue

            # 已經有 allocated_number，跳過
            if card.get('allocated_number'):
                continue

            if category and card['category'] != category:
                continue

            if priority and card['priority'] != priority:
                continue

            result.append(card)

            if limit and len(result) >= limit:
                break

        return result

    def get_next_number_via_script(self, category: str, batch_size: int = 1) -> dict:
        """呼叫 get-next-number.py 腳本取得編號"""
        cmd = ['uv', 'run', 'scripts/get-next-number.py', category, '--json']

        if batch_size > 1:
            cmd.extend(['--batch', str(batch_size)])

        result = subprocess.run(cmd, cwd=PROJECT_ROOT, capture_output=True, text=True)

        if result.returncode != 0:
            return {'error': result.stderr.strip()}

        return json.loads(result.stdout)

    def allocate_numbers(self,
                        stage: str = 'pending',
                        category: str = None,
                        priority: str = None,
                        limit: int = None,
                        dry_run: bool = False) -> Dict:
        """為卡片分配編號"""

        # 篩選需要分配編號的卡片
        pending_cards = self.filter_cards(stage, category, priority, limit)

        if not pending_cards:
            return {
                'success': True,
                'message': '沒有需要分配編號的卡片',
                'allocated_count': 0
            }

        # 按分類分組
        cards_by_category = defaultdict(list)
        for card in pending_cards:
            cards_by_category[card['category']].append(card)

        # 為每個分類批次分配編號
        allocation_summary = []
        total_allocated = 0

        for cat, cat_cards in cards_by_category.items():
            count = len(cat_cards)

            # 使用 get-next-number.py 批次分配編號
            result = self.get_next_number_via_script(cat, batch_size=count)

            if 'error' in result:
                print(f"❌ 分類「{cat}」分配編號失敗: {result['error']}", file=sys.stderr)
                continue

            start_num = result['next_number']
            end_num = result.get('end_number', start_num)

            allocation_summary.append({
                'category': cat,
                'count': count,
                'range': f"{start_num:03d}-{end_num:03d}" if count > 1 else f"{start_num:03d}"
            })

            # 更新卡片的 allocated_number 和 number 欄位
            for i, card in enumerate(cat_cards):
                allocated_num = start_num + i
                card['allocated_number'] = f"{allocated_num:03d}"

                # 更新 number 欄位（從 path 中提取的編號）
                # 例如：noun/018_tango.md -> 018
                if '/' in card['path']:
                    filename = card['path'].split('/')[-1]
                    card['number'] = card['allocated_number']
                    # 也更新 path 中的編號
                    parts = filename.split('_', 1)
                    if len(parts) == 2:
                        new_filename = f"{card['allocated_number']}_{parts[1]}"
                        card['path'] = f"{card['category']}/{new_filename}"

                total_allocated += 1

        # 顯示分配摘要
        print("📦 編號分配摘要\n")
        print(f"{'分類':<15} {'數量':<8} {'編號範圍':<15}")
        print("-" * 40)
        for item in allocation_summary:
            print(f"{item['category']:<15} {item['count']:<8} {item['range']:<15}")
        print("-" * 40)
        print(f"{'總計':<15} {total_allocated:<8}")
        print()

        # 儲存更新（如果不是乾跑模式）
        if not dry_run:
            self.save_cards()
            print(f"✅ 已更新 CSV 檔案: {self.csv_path}")
        else:
            print("🔍 乾跑模式：未實際更新 CSV 檔案")

        return {
            'success': True,
            'allocated_count': total_allocated,
            'allocation_summary': allocation_summary
        }


def main():
    parser = argparse.ArgumentParser(description='為待建立卡片預先分配編號')
    parser.add_argument('--csv', default='doc/worklog/cards-1.0.6.csv',
                       help='CSV 檔案路徑（預設: doc/worklog/cards-1.0.6.csv）')

    # 篩選條件
    parser.add_argument('--stage', default='pending',
                       help='篩選階段（預設: pending）')
    parser.add_argument('--category', help='篩選分類（noun, verb-ru, grammar 等）')
    parser.add_argument('--priority', help='篩選優先級（Critical, High, Medium, Low）')
    parser.add_argument('--limit', type=int, help='限制分配數量')

    # 選項
    parser.add_argument('--dry-run', action='store_true',
                       help='乾跑模式（不實際更新 CSV）')

    args = parser.parse_args()

    # 建立分配器
    allocator = CardNumberAllocator(args.csv)

    # 執行分配
    result = allocator.allocate_numbers(
        stage=args.stage,
        category=args.category,
        priority=args.priority,
        limit=args.limit,
        dry_run=args.dry_run
    )

    if not result['success']:
        print(f"❌ 分配失敗: {result.get('message')}", file=sys.stderr)
        return 1

    if result['allocated_count'] == 0:
        print(result['message'])
    else:
        print(f"\n✨ 已為 {result['allocated_count']} 張卡片分配編號")

    return 0


if __name__ == '__main__':
    sys.exit(main())
