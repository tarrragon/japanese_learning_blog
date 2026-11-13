#!/usr/bin/env python3
"""
Add Pending Cards Script
新增待辦卡片到 worklog CSV - v1.5.0 同時建立卡片檔案

Usage:
    # 單張新增（同時建立卡片檔案）
    uv run scripts/add_pending_cards.py add \
        --category noun \
        --number 025 \
        --japanese 語彙 \
        --chinese 詞彙 \
        --jlpt n4 \
        --source v1.0.6 \
        --priority High

    # 只新增到 CSV（不建立卡片檔案）
    uv run scripts/add_pending_cards.py add \
        --category noun \
        --number 025 \
        --japanese 語彙 \
        --chinese 詞彙 \
        --jlpt n4 \
        --priority High \
        --csv-only

    # 批次新增（從 JSON 檔案）
    uv run scripts/add_pending_cards.py batch \
        --from-json extension-cards.json

v1.5.0 變更：
    - 新增卡片時同時建立 YAML frontmatter 檔案
    - 新增 --csv-only 選項（只更新 CSV，不建立卡片）

編號規則（card_numbering.py）：
    - batch 未指定編號時，透過 card_numbering 保留編號，不會重複發號
    - --csv-only 的 batch 不分配編號（number 與 path 留空），
      等真正建立卡片時再由 allocate_card_numbers.py 或 get-next-number.py 分配
    - 新增前檢查同分類是否已有相同基本編號，有則拒絕
"""

import csv
import json
import argparse
import sys
from pathlib import Path
from datetime import datetime, date
from typing import List, Dict, Optional

from csv_config import get_default_csv_path
from card_numbering import CardNumbering

# 專案根目錄
PROJECT_ROOT = Path(__file__).parent.parent
ZETTELKASTEN_DIR = PROJECT_ROOT / "zettelkasten"

class PendingCardAdder:
    """新增待辦卡片到 CSV（v1.5.0 同時建立卡片檔案）"""

    VALID_STAGES = ['pending', 'draft', 'extension-review', 'linking', 'completed']
    VALID_PRIORITIES = ['Critical', 'High', 'Medium', 'Low']
    VALID_JLPT = ['n5', 'n4', 'n3', 'n2', 'n1', 'concept', 'phrase']

    # v1.5.0 卡片模板
    CARD_TEMPLATE = '''---
title: {title}
description: {chinese}
type: {category}
jlpt: {jlpt}
stage: {stage}
tags:
  - jlpt/{jlpt}
created: {today}
updated: {today}

# 版本歷史
version_history:
  - version: "1.5.0"
    stage: "{stage}"
    date: {today}

# 內容驗證
content_verification:
  japanese: false
  english: false
  chinese: false
  examples_count: 0
  pending_links: []

# 連結狀態
link_status:
  incoming: 0
  outgoing: 0
  pending: 0
  verified_date: {today}
---

## 日文

{japanese}

## 日文解釋

（待填寫）

## 英文解釋

（待填寫）

## 中文解釋

{chinese}

## 例句

（待填寫）

---

## 註解

（待填寫）

---

## 相關連結

（待填寫）
'''

    def __init__(self, csv_path: str, csv_only: bool = False):
        self.csv_path = Path(csv_path)
        self.cards = []
        self.max_id = 0
        self.csv_only = csv_only

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
            'jlpt', 'source', 'priority', 'stage', 'note', 'created', 'updated', 'batch',
            'allocated_number'
        ]

        with open(self.csv_path, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
            writer.writeheader()
            writer.writerows(self.cards)

        print(f"💾 已儲存 {len(self.cards)} 張卡片")

    def validate_card(self, card: Dict) -> List[str]:
        """驗證卡片資料，回傳錯誤訊息列表"""
        errors = []

        # 必填欄位（--csv-only 時編號可延後分配）
        required = ['category', 'japanese', 'chinese', 'jlpt', 'priority']
        if not self.csv_only:
            required.insert(1, 'number')
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

        # 檢查編號衝突：同分類已有相同基本編號的檔案或 CSV 紀錄
        if card.get('number') and card.get('category'):
            number = card['number']
            filename = card['path'].split('/')[-1] if card.get('path') else None
            conflicts = CardNumbering(card['category'], ZETTELKASTEN_DIR).find_conflicts(int(number), filename)
            if conflicts:
                errors.append(f"編號 {card['category']}/{number} 已被使用: {', '.join(conflicts)}")
            csv_conflicts = [
                c for c in self.cards
                if c.get('category') == card['category']
                and (c.get('allocated_number') or c.get('number')) == number
                and c.get('path') != card.get('path')
            ]
            if csv_conflicts:
                ids = ', '.join(c['id'] for c in csv_conflicts)
                errors.append(f"編號 {card['category']}/{number} 已分配給 CSV 中的卡片 (ID: {ids})")

        # 檢查路徑衝突
        if card.get('path'):
            existing = [c for c in self.cards if c.get('path') == card['path']]
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

        # 建立卡片路徑（尚未分配編號時留空，待建立卡片時再分配）
        path = f"{category}/{number}_{japanese.replace(' ', '_')}.md" if number else ''

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

        # 新增到 CSV
        self.cards.append(new_card)
        self.max_id += 1

        print(f"✅ 已新增卡片 ID {new_card['id']}: {path or f'{category}/（未編號）{japanese}'}")

        # v1.5.0: 同時建立卡片檔案
        if not self.csv_only and new_card['path']:
            file_created = self.create_card_file(new_card)
            if file_created:
                print(f"   📄 已建立卡片檔案")

        return True

    def create_card_file(self, card: Dict) -> bool:
        """建立卡片 markdown 檔案"""
        category = card['category']
        path = card['path']

        # 建立完整路徑
        full_path = ZETTELKASTEN_DIR / path

        # 確保分類目錄存在
        category_dir = full_path.parent
        if not category_dir.exists():
            category_dir.mkdir(parents=True, exist_ok=True)
            print(f"   📁 已建立分類目錄: {category_dir.name}")

        # 如果檔案已存在，跳過
        if full_path.exists():
            print(f"   ⚠️ 檔案已存在，跳過建立")
            return False

        # 使用模板建立檔案
        today = date.today().isoformat()
        content = self.CARD_TEMPLATE.format(
            title=card['japanese'],
            chinese=card['chinese'],
            category=card['category'],
            jlpt=card['jlpt'],
            stage=card.get('stage', 'pending'),
            today=today,
            japanese=card['japanese']
        )

        try:
            full_path.write_text(content, encoding='utf-8')
            return True
        except Exception as e:
            print(f"   ❌ 建立檔案失敗: {e}")
            return False

    def _reserve_number(self, category: str, japanese: str) -> Optional[str]:
        """透過 card_numbering 保留下一個編號（保留後不會再發給其他人）"""
        try:
            numbering = CardNumbering(category, ZETTELKASTEN_DIR)
            label = f"{category}/{japanese}"
            return f"{numbering.reserve(1, labels=[label])[0]:03d}"
        except Exception as e:
            print(f"   ⚠️ 自動編號失敗: {e}")
            return None

    def add_batch_cards(self, cards_data: List[Dict]) -> int:
        """批次新增卡片，回傳成功新增的數量"""
        success_count = 0

        for idx, card_data in enumerate(cards_data, 1):
            print(f"\n📝 處理卡片 {idx}/{len(cards_data)}")

            reserved_number = None

            # 自動分配編號（如果缺失）
            # --csv-only 不分配：卡片尚未建立，提早寫死編號會造成重複
            if self.csv_only and not card_data.get('number'):
                card_data['number'] = ''
                print("   → 尚未分配編號（建立卡片時再分配）")
            elif not card_data.get('number'):
                category = card_data.get('category', 'concept')
                auto_number = self._reserve_number(category, card_data.get('japanese', ''))
                if auto_number:
                    card_data['number'] = auto_number
                    reserved_number = (category, auto_number)
                    print(f"   → 自動分配編號: {auto_number}")
                else:
                    print(f"❌ 跳過：無法自動分配編號")
                    continue

            # 確保必要欄位存在
            required = ['category', 'number', 'japanese', 'chinese', 'jlpt', 'priority']
            missing = [f for f in required if f not in card_data]
            if missing:
                print(f"❌ 跳過：缺少欄位 {', '.join(missing)}")
                if reserved_number:
                    CardNumbering(reserved_number[0], ZETTELKASTEN_DIR).release(int(reserved_number[1]))
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
            elif reserved_number:
                # 新增失敗，歸還剛保留的編號
                CardNumbering(reserved_number[0], ZETTELKASTEN_DIR).release(int(reserved_number[1]))

        return success_count

def main():
    parser = argparse.ArgumentParser(description='新增待辦卡片到 worklog CSV（v1.5.0 同時建立卡片）')
    parser.add_argument('--csv', default=get_default_csv_path(),
                       help='CSV 檔案路徑（預設: 自動偵測最新版本）')
    parser.add_argument('--csv-only', action='store_true',
                       help='只新增到 CSV，不建立卡片檔案')

    subparsers = parser.add_subparsers(dest='command', help='指令')

    # 單張新增
    add_parser = subparsers.add_parser('add', help='新增單張卡片（同時建立卡片檔案）')
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
    adder = PendingCardAdder(
        args.csv,
        csv_only=getattr(args, 'csv_only', False)
    )

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
