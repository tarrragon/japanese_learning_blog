#!/usr/bin/env python3
"""
Worklog Cards Query Script
查詢 worklog 卡片清單的 CSV 檔案

注意：本腳本僅供查詢使用
- 新增卡片：請使用 add_pending_cards.py
- 更新進度：請使用 update_card_progress.py
- 讀取清單：請使用 get_pending_cards.py

Usage:
    uv run scripts/manage_worklog_cards.py list --stage pending
    uv run scripts/manage_worklog_cards.py stats
    uv run scripts/manage_worklog_cards.py validate
"""

import csv
import argparse
from pathlib import Path
from typing import Optional
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
    elif args.command == 'stats':
        manager.generate_stats()
    elif args.command == 'validate':
        manager.validate()
    else:
        parser.print_help()


if __name__ == '__main__':
    main()
