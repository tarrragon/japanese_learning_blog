#!/usr/bin/env python3
"""
Add Pending Cards Script
新增待辦卡片到 worklog CSV

Usage:
    # 單張新增
    uv run scripts/add_pending_cards.py add \
        --category noun \
        --number 025 \
        --japanese 語彙 \
        --chinese 詞彙 \
        --jlpt n4 \
        --source v1.0.6 \
        --priority High

    # 批次新增（從 JSON 檔案）
    uv run scripts/add_pending_cards.py batch \
        --from-json extension-cards.json

    # 批次新增（從 stdin）
    cat cards.json | uv run scripts/add_pending_cards.py batch --from-json -
"""

import csv
import json
import argparse
import sys
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional

from csv_config import get_default_csv_path

class PendingCardAdder:
    """新增待辦卡片到 CSV"""

    VALID_STAGES = ['pending', 'draft', 'extension-review', 'linking', 'completed']
    VALID_PRIORITIES = ['Critical', 'High', 'Medium', 'Low']
    VALID_JLPT = ['n5', 'n4', 'n3', 'n2', 'n1', 'concept', 'phrase']

    def __init__(self, csv_path: str):
        self.csv_path = Path(csv_path)
        self.cards = []
        self.max_id = 0

        if self.csv_path.exists():
            self.load_cards()

    def load_cards(self):
        """載入現有 CSV 檔案"""
        with open(self.csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            self.cards = list(reader)

        # 找出最大 ID
        if self.cards:
            self.max_id = max(int(card['id']) for card in self.cards)

        print(f"✅ 已載入 {len(self.cards)} 張卡片（最大 ID: {self.max_id}）")

    def save_cards(self):
        """儲存到 CSV 檔案"""
        fieldnames = [
            'id', 'category', 'number', 'path', 'japanese', 'chinese',
            'jlpt', 'source', 'priority', 'stage', 'note', 'created', 'updated', 'batch'
        ]

        with open(self.csv_path, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(self.cards)

        print(f"💾 已儲存 {len(self.cards)} 張卡片")

    def validate_card(self, card: Dict) -> List[str]:
        """驗證卡片資料，回傳錯誤訊息列表"""
        errors = []

        # 必填欄位
        required = ['category', 'number', 'japanese', 'chinese', 'jlpt', 'priority']
        for field in required:
            if not card.get(field):
                errors.append(f"缺少必填欄位: {field}")

        # 驗證 JLPT
        if card.get('jlpt') and card['jlpt'] not in self.VALID_JLPT:
            errors.append(f"無效的 JLPT 等級: {card['jlpt']}，有效值: {', '.join(self.VALID_JLPT)}")

        # 驗證優先級
        if card.get('priority') and card['priority'] not in self.VALID_PRIORITIES:
            errors.append(f"無效的優先級: {card['priority']}，有效值: {', '.join(self.VALID_PRIORITIES)}")

        # 檢查編號格式（應為 3 位數字）
        if card.get('number'):
            num = card['number']
            if not num.isdigit() or len(num) != 3:
                errors.append(f"編號格式錯誤: {num}，應為 3 位數字（如 025）")

        # 檢查路徑衝突
        if card.get('path'):
            existing = [c for c in self.cards if c['path'] == card['path']]
            if existing:
                errors.append(f"路徑已存在: {card['path']} (ID: {existing[0]['id']})")

        return errors

    def add_single_card(self,
                       category: str,
                       number: str,
                       japanese: str,
                       chinese: str,
                       jlpt: str,
                       priority: str,
                       source: str = '',
                       note: str = '',
                       stage: str = 'pending') -> bool:
        """新增單張卡片"""

        # 建立卡片路徑
        path = f"{category}/{number}_{japanese.replace(' ', '_')}.md"

        # 建立新卡片
        new_card = {
            'id': str(self.max_id + 1),
            'category': category,
            'number': number,
            'path': path,
            'japanese': japanese,
            'chinese': chinese,
            'jlpt': jlpt,
            'source': source or 'manual',
            'priority': priority,
            'stage': stage,
            'note': note,
            'created': datetime.now().strftime('%Y-%m-%d'),
            'updated': datetime.now().strftime('%Y-%m-%d'),
            'batch': ''
        }

        # 驗證
        errors = self.validate_card(new_card)
        if errors:
            print("❌ 驗證失敗：")
            for error in errors:
                print(f"   - {error}")
            return False

        # 新增
        self.cards.append(new_card)
        self.max_id += 1

        print(f"✅ 已新增卡片 ID {new_card['id']}: {path}")
        return True

    def add_batch_cards(self, cards_data: List[Dict]) -> int:
        """批次新增卡片，回傳成功新增的數量"""
        success_count = 0

        for idx, card_data in enumerate(cards_data, 1):
            print(f"\n📝 處理卡片 {idx}/{len(cards_data)}")

            # 確保必要欄位存在
            required = ['category', 'number', 'japanese', 'chinese', 'jlpt', 'priority']
            missing = [f for f in required if f not in card_data]
            if missing:
                print(f"❌ 跳過：缺少欄位 {', '.join(missing)}")
                continue

            # 新增卡片
            if self.add_single_card(
                category=card_data['category'],
                number=card_data['number'],
                japanese=card_data['japanese'],
                chinese=card_data['chinese'],
                jlpt=card_data['jlpt'],
                priority=card_data['priority'],
                source=card_data.get('source', ''),
                note=card_data.get('note', ''),
                stage=card_data.get('stage', 'pending')
            ):
                success_count += 1

        return success_count

def main():
    parser = argparse.ArgumentParser(description='新增待辦卡片到 worklog CSV')
    parser.add_argument('--csv', default=get_default_csv_path(),
                       help='CSV 檔案路徑（預設: 自動偵測最新版本）')

    subparsers = parser.add_subparsers(dest='command', help='指令')

    # 單張新增
    add_parser = subparsers.add_parser('add', help='新增單張卡片')
    add_parser.add_argument('--category', required=True, help='分類（如 noun, verb-ru）')
    add_parser.add_argument('--number', required=True, help='編號（3 位數字，如 025）')
    add_parser.add_argument('--japanese', required=True, help='日文詞彙/概念')
    add_parser.add_argument('--chinese', required=True, help='中文翻譯')
    add_parser.add_argument('--jlpt', required=True, choices=PendingCardAdder.VALID_JLPT,
                           help='JLPT 等級')
    add_parser.add_argument('--priority', required=True, choices=PendingCardAdder.VALID_PRIORITIES,
                           help='優先級')
    add_parser.add_argument('--source', default='', help='來源（如 v1.0.6）')
    add_parser.add_argument('--note', default='', help='備註')
    add_parser.add_argument('--stage', default='pending', choices=PendingCardAdder.VALID_STAGES,
                           help='階段（預設: pending）')

    # 批次新增
    batch_parser = subparsers.add_parser('batch', help='批次新增卡片')
    batch_parser.add_argument('--from-json', required=True,
                             help='JSON 檔案路徑（使用 - 從 stdin 讀取）')

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return 1

    # 初始化管理器
    adder = PendingCardAdder(args.csv)

    if args.command == 'add':
        # 單張新增
        success = adder.add_single_card(
            category=args.category,
            number=args.number,
            japanese=args.japanese,
            chinese=args.chinese,
            jlpt=args.jlpt,
            priority=args.priority,
            source=args.source,
            note=args.note,
            stage=args.stage
        )

        if success:
            adder.save_cards()
            return 0
        else:
            return 1

    elif args.command == 'batch':
        # 批次新增
        if args.from_json == '-':
            # 從 stdin 讀取
            cards_data = json.load(sys.stdin)
        else:
            # 從檔案讀取
            with open(args.from_json, 'r', encoding='utf-8') as f:
                cards_data = json.load(f)

        # 確保是列表
        if not isinstance(cards_data, list):
            print("❌ JSON 格式錯誤：應為卡片列表")
            return 1

        # 批次新增
        success_count = adder.add_batch_cards(cards_data)

        print(f"\n📊 批次新增完成：成功 {success_count}/{len(cards_data)} 張")

        if success_count > 0:
            adder.save_cards()

        return 0 if success_count > 0 else 1

if __name__ == '__main__':
    sys.exit(main())
