#!/usr/bin/env python3
"""
Worklog Cards Management Script
管理 worklog 卡片清單的 CSV 檔案

Usage:
    uv run scripts/manage_worklog_cards.py list --stage pending
    uv run scripts/manage_worklog_cards.py update --id 133 --stage draft
    uv run scripts/manage_worklog_cards.py stats
"""

import csv
import argparse
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional
import sys

class WorklogCardManager:
    """管理 worklog 卡片的 CSV 檔案"""

    def __init__(self, csv_path: str):
        self.csv_path = Path(csv_path)
        self.cards = []

        if self.csv_path.exists():
            self.load_cards()

    def load_cards(self):
        """載入 CSV 檔案"""
        with open(self.csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            self.cards = list(reader)
        print(f"✅ 已載入 {len(self.cards)} 張卡片")

    def save_cards(self):
        """儲存到 CSV 檔案"""
        if not self.cards:
            print("❌ 沒有卡片可儲存")
            return

        fieldnames = [
            'id', 'category', 'number', 'path', 'japanese', 'chinese',
            'jlpt', 'source', 'priority', 'stage', 'note', 'created', 'updated', 'batch'
        ]

        with open(self.csv_path, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(self.cards)

        print(f"✅ 已儲存 {len(self.cards)} 張卡片到 {self.csv_path}")

    def list_cards(self, stage: Optional[str] = None, priority: Optional[str] = None,
                   category: Optional[str] = None, batch: Optional[int] = None,
                   limit: Optional[int] = None):
        """列出卡片"""
        filtered = self.cards

        if stage:
            filtered = [c for c in filtered if c.get('stage') == stage]
        if priority:
            filtered = [c for c in filtered if c.get('priority') == priority]
        if category:
            filtered = [c for c in filtered if c.get('category') == category]
        if batch is not None:
            filtered = [c for c in filtered if c.get('batch') == str(batch)]

        if limit:
            filtered = filtered[:limit]

        print(f"\n📋 找到 {len(filtered)} 張卡片")
        print("-" * 100)

        for card in filtered:
            print(f"ID: {card['id']:>3} | {card['category']:>12} | {card['path']:40} | "
                  f"{card['japanese']:15} | {card['chinese']:12} | "
                  f"JLPT: {card['jlpt']:4} | {card['priority']:8} | {card['stage']:15}")

    def update_card(self, card_id: int, stage: Optional[str] = None,
                    batch: Optional[int] = None):
        """更新單張卡片"""
        card_found = False

        for card in self.cards:
            if int(card['id']) == card_id:
                if stage:
                    card['stage'] = stage
                if batch is not None:
                    card['batch'] = str(batch)
                card['updated'] = datetime.now().strftime('%Y-%m-%d')
                card_found = True
                print(f"✅ 已更新卡片 ID {card_id}: {card['path']}")
                break

        if not card_found:
            print(f"❌ 找不到卡片 ID {card_id}")
            return False

        self.save_cards()
        return True

    def batch_update(self, card_ids: List[int], stage: str, batch: int):
        """批次更新卡片"""
        updated_count = 0

        for card_id in card_ids:
            if self.update_card(card_id, stage=stage, batch=batch):
                updated_count += 1

        print(f"\n✅ 批次更新完成：{updated_count}/{len(card_ids)} 張卡片")

    def generate_stats(self):
        """生成統計資訊"""
        total = len(self.cards)

        # 按 stage 統計
        stage_stats = {}
        for card in self.cards:
            stage = card.get('stage', 'unknown')
            stage_stats[stage] = stage_stats.get(stage, 0) + 1

        # 按 priority 統計
        priority_stats = {}
        for card in self.cards:
            priority = card.get('priority', 'unknown')
            priority_stats[priority] = priority_stats.get(priority, 0) + 1

        # 按 category 統計
        category_stats = {}
        for card in self.cards:
            category = card.get('category', 'unknown')
            category_stats[category] = category_stats.get(category, 0) + 1

        print(f"\n📊 統計資訊")
        print("=" * 60)
        print(f"總卡片數: {total}")

        print(f"\n按階段統計:")
        for stage, count in sorted(stage_stats.items()):
            percentage = (count / total) * 100
            print(f"  {stage:20} {count:4} ({percentage:5.1f}%)")

        print(f"\n按優先級統計:")
        for priority, count in sorted(priority_stats.items()):
            percentage = (count / total) * 100
            print(f"  {priority:20} {count:4} ({percentage:5.1f}%)")

        print(f"\n按分類統計:")
        for category, count in sorted(category_stats.items()):
            percentage = (count / total) * 100
            print(f"  {category:20} {count:4} ({percentage:5.1f}%)")

    def validate(self):
        """驗證 CSV 資料"""
        print("\n🔍 驗證 CSV 資料...")

        required_fields = ['id', 'category', 'path', 'japanese', 'chinese', 'jlpt', 'stage']
        issues = []

        for i, card in enumerate(self.cards, 1):
            # 檢查必填欄位
            for field in required_fields:
                if not card.get(field):
                    issues.append(f"第 {i} 張卡片缺少欄位: {field}")

            # 檢查 ID 是否為數字
            try:
                int(card.get('id', ''))
            except ValueError:
                issues.append(f"第 {i} 張卡片 ID 不是數字: {card.get('id')}")

        if issues:
            print(f"\n❌ 發現 {len(issues)} 個問題:")
            for issue in issues[:10]:  # 只顯示前 10 個
                print(f"  - {issue}")
        else:
            print("✅ 驗證通過，無問題")

        return len(issues) == 0


def main():
    parser = argparse.ArgumentParser(description='管理 worklog 卡片 CSV')
    parser.add_argument('--csv', default='doc/worklog/cards-1.0.6.csv',
                        help='CSV 檔案路徑')

    subparsers = parser.add_subparsers(dest='command', help='指令')

    # list 指令
    list_parser = subparsers.add_parser('list', help='列出卡片')
    list_parser.add_argument('--stage', help='篩選階段')
    list_parser.add_argument('--priority', help='篩選優先級')
    list_parser.add_argument('--category', help='篩選分類')
    list_parser.add_argument('--batch', type=int, help='篩選批次')
    list_parser.add_argument('--limit', type=int, help='限制數量')

    # update 指令
    update_parser = subparsers.add_parser('update', help='更新單張卡片')
    update_parser.add_argument('--id', type=int, required=True, help='卡片 ID')
    update_parser.add_argument('--stage', help='更新階段')
    update_parser.add_argument('--batch', type=int, help='批次號碼')

    # batch-update 指令
    batch_parser = subparsers.add_parser('batch-update', help='批次更新')
    batch_parser.add_argument('--ids', required=True, help='卡片 ID 範圍 (如: 61-70)')
    batch_parser.add_argument('--stage', required=True, help='更新階段')
    batch_parser.add_argument('--batch', type=int, required=True, help='批次號碼')

    # stats 指令
    subparsers.add_parser('stats', help='統計資訊')

    # validate 指令
    subparsers.add_parser('validate', help='驗證資料')

    args = parser.parse_args()

    manager = WorklogCardManager(args.csv)

    if args.command == 'list':
        manager.list_cards(
            stage=args.stage,
            priority=args.priority,
            category=args.category,
            batch=args.batch,
            limit=args.limit
        )
    elif args.command == 'update':
        manager.update_card(args.id, stage=args.stage, batch=args.batch)
    elif args.command == 'batch-update':
        # 解析 ID 範圍
        if '-' in args.ids:
            start, end = map(int, args.ids.split('-'))
            card_ids = list(range(start, end + 1))
        else:
            card_ids = [int(args.ids)]
        manager.batch_update(card_ids, args.stage, args.batch)
    elif args.command == 'stats':
        manager.generate_stats()
    elif args.command == 'validate':
        manager.validate()
    else:
        parser.print_help()


if __name__ == '__main__':
    main()
