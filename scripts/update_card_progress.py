#!/usr/bin/env python3
"""
Update Card Progress Script
更新卡片進度（供代理人呼叫）- v1.5.0 版本支援 YAML 更新

Usage:
    # 更新單張卡片（同時更新 CSV 和 YAML）
    uv run scripts/update_card_progress.py --id 59 --stage draft

    # 更新單張卡片並設定批次
    uv run scripts/update_card_progress.py --id 59 --stage completed --batch 1

    # 批次更新
    uv run scripts/update_card_progress.py --ids 59-68 --stage completed --batch 1

    # 安靜模式（減少輸出）
    uv run scripts/update_card_progress.py --id 59 --stage draft --quiet

    # 只更新 YAML（跳過 CSV）
    uv run scripts/update_card_progress.py --id 59 --stage draft --yaml-only

v1.5.0 變更：
    - 同時更新 CSV 和卡片 YAML frontmatter
    - YAML 成為單一事實來源
    - 支援 --yaml-only 選項
"""

import csv
import argparse
import sys
import re
from pathlib import Path
from datetime import datetime, date
from typing import List, Dict, Optional

from csv_config import get_default_csv_path

# 專案根目錄
PROJECT_ROOT = Path(__file__).parent.parent
ZETTELKASTEN_DIR = PROJECT_ROOT / "zettelkasten"

class CardProgressUpdater:
    """更新卡片進度（支援 CSV 和 YAML 同步更新）"""

    VALID_STAGES = ['pending', 'draft', 'extension-review', 'linking', 'completed']

    # 合法的階段轉換
    STAGE_TRANSITIONS = {
        'pending': ['draft'],
        'draft': ['extension-review', 'pending'],  # 允許回退
        'extension-review': ['linking', 'draft'],
        'linking': ['completed', 'extension-review'],
        'completed': []  # 完成後不可轉換
    }

    def __init__(self, csv_path: str, quiet: bool = False, yaml_only: bool = False):
        self.csv_path = Path(csv_path) if csv_path else None
        self.cards = []
        self.quiet = quiet
        self.yaml_only = yaml_only

        if not yaml_only:
            if not self.csv_path or not self.csv_path.exists():
                self._error(f"CSV 檔案不存在: {csv_path}")
                sys.exit(1)
            self.load_cards()

    def _print(self, msg: str):
        """輸出訊息（除非 quiet 模式）"""
        if not self.quiet:
            print(msg)

    def _error(self, msg: str):
        """輸出錯誤訊息（即使 quiet 模式也輸出）"""
        print(msg, file=sys.stderr)

    def load_cards(self):
        """載入 CSV 檔案"""
        with open(self.csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            self.cards = list(reader)

        self._print(f"✅ 已載入 {len(self.cards)} 張卡片")

    def save_cards(self):
        """儲存到 CSV 檔案"""
        # 動態取得欄位名稱（從第一筆資料）
        if not self.cards:
            self._error("❌ 沒有卡片資料可儲存")
            return

        fieldnames = list(self.cards[0].keys())

        with open(self.csv_path, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(self.cards)

        self._print(f"💾 已儲存 {len(self.cards)} 張卡片")

    def validate_stage_transition(self, current_stage: str, new_stage: str) -> bool:
        """驗證階段轉換是否合法"""
        # 如果階段相同，允許（可能只是更新 batch）
        if current_stage == new_stage:
            return True

        # 檢查是否為合法轉換
        allowed_transitions = self.STAGE_TRANSITIONS.get(current_stage, [])
        return new_stage in allowed_transitions

    def find_card_by_id(self, card_id: int) -> Optional[Dict]:
        """根據 ID 尋找卡片"""
        for card in self.cards:
            if int(card['id']) == card_id:
                return card
        return None

    def update_card(self, card_id: int, stage: Optional[str] = None, batch: Optional[int] = None) -> bool:
        """更新單張卡片"""
        card = self.find_card_by_id(card_id)

        if not card:
            self._error(f"❌ 找不到卡片 ID: {card_id}")
            return False

        # 驗證階段轉換
        if stage:
            if stage not in self.VALID_STAGES:
                self._error(f"❌ 無效的階段: {stage}，有效值: {', '.join(self.VALID_STAGES)}")
                return False

            if not self.validate_stage_transition(card['stage'], stage):
                self._error(
                    f"❌ 不合法的階段轉換: {card['stage']} → {stage}\n"
                    f"   允許的轉換: {', '.join(self.STAGE_TRANSITIONS.get(card['stage'], []))}"
                )
                return False

            card['stage'] = stage

        # 更新批次
        if batch is not None:
            card['batch'] = str(batch)

        # 更新時間（如果有 updated 欄位）
        if 'updated' in card:
            card['updated'] = datetime.now().strftime('%Y-%m-%d')

        # 構建顯示用的卡片識別資訊
        if 'path' in card:
            card_info = card['path']
        elif 'number' in card and 'japanese' in card:
            card_info = f"{card['category']}/{card['number']}_{card['japanese']}.md"
        else:
            card_info = f"{card.get('category', '?')}/{card.get('japanese', '?')}"

        self._print(f"✅ 已更新卡片 ID {card_id}: {card_info}")
        if stage:
            self._print(f"   階段: {stage}")
        if batch is not None:
            self._print(f"   批次: {batch}")

        # v1.5.0: 同步更新 YAML frontmatter
        if stage and 'path' in card:
            yaml_updated = self.update_yaml_stage(card['path'], stage)
            if yaml_updated:
                self._print(f"   YAML: 已同步更新")

        return True

    def update_yaml_stage(self, card_path: str, new_stage: str) -> bool:
        """更新卡片 YAML frontmatter 中的 stage 欄位"""
        # 建立完整路徑
        if card_path.startswith('zettelkasten/'):
            full_path = PROJECT_ROOT / card_path
        else:
            full_path = ZETTELKASTEN_DIR / card_path

        if not full_path.exists():
            self._print(f"   ⚠️ 卡片檔案不存在: {full_path}")
            return False

        try:
            content = full_path.read_text(encoding='utf-8')

            # 更新 stage 欄位
            content = re.sub(
                r'^(stage:\s*)(\S+)',
                f'\\g<1>{new_stage}',
                content,
                count=1,
                flags=re.MULTILINE
            )

            # 更新 updated 日期
            today = date.today().isoformat()
            content = re.sub(
                r'^(updated:\s*)(\S+)',
                f'\\g<1>{today}',
                content,
                count=1,
                flags=re.MULTILINE
            )

            # 新增 version_history 條目（如果需要）
            if 'version_history:' in content:
                # 檢查是否已有今天的記錄
                if f'date: {today}' not in content:
                    # 在 version_history: 後添加新條目
                    content = re.sub(
                        r'(version_history:\n)',
                        f'\\g<1>  - version: "1.5.0"\n    stage: "{new_stage}"\n    date: {today}\n',
                        content,
                        count=1
                    )

            full_path.write_text(content, encoding='utf-8')
            return True

        except Exception as e:
            self._error(f"   ❌ YAML 更新失敗: {e}")
            return False

    def batch_update(self, card_ids: List[int], stage: str, batch: Optional[int] = None) -> int:
        """批次更新卡片，回傳成功更新的數量"""
        success_count = 0

        for card_id in card_ids:
            if self.update_card(card_id, stage, batch):
                success_count += 1

        return success_count

def parse_id_range(id_range: str) -> List[int]:
    """解析 ID 範圍字串（如 "59-68" 或 "59,60,61"）"""
    card_ids = []

    # 處理逗號分隔
    if ',' in id_range:
        parts = id_range.split(',')
        for part in parts:
            part = part.strip()
            if '-' in part:
                # 範圍
                start, end = part.split('-')
                card_ids.extend(range(int(start), int(end) + 1))
            else:
                # 單一 ID
                card_ids.append(int(part))
    # 處理範圍
    elif '-' in id_range:
        start, end = id_range.split('-')
        card_ids.extend(range(int(start), int(end) + 1))
    # 單一 ID
    else:
        card_ids.append(int(id_range))

    return card_ids

def main():
    parser = argparse.ArgumentParser(description='更新卡片進度（v1.5.0 支援 YAML 同步）')
    parser.add_argument('--csv', default=get_default_csv_path(),
                       help='CSV 檔案路徑（預設: 自動偵測最新版本）')
    parser.add_argument('--quiet', action='store_true',
                       help='安靜模式（減少輸出）')
    parser.add_argument('--yaml-only', action='store_true',
                       help='只更新 YAML（跳過 CSV）')

    # 卡片選擇（互斥）
    card_group = parser.add_mutually_exclusive_group(required=True)
    card_group.add_argument('--id', type=int, help='單張卡片 ID')
    card_group.add_argument('--ids', help='批次 ID（如 "59-68" 或 "59,60,61"）')

    # 更新內容
    parser.add_argument('--stage', choices=CardProgressUpdater.VALID_STAGES,
                       help='新階段')
    parser.add_argument('--batch', type=int, help='批次號碼')

    args = parser.parse_args()

    # 至少要更新一個欄位
    if not args.stage and args.batch is None:
        parser.error("必須指定 --stage 或 --batch 至少一個")

    # 建立更新器
    updater = CardProgressUpdater(
        args.csv,
        quiet=args.quiet,
        yaml_only=getattr(args, 'yaml_only', False)
    )

    # 單張或批次更新
    if args.id:
        # 單張更新
        success = updater.update_card(args.id, args.stage, args.batch)
        if success:
            updater.save_cards()
            return 0
        else:
            return 1

    elif args.ids:
        # 批次更新
        try:
            card_ids = parse_id_range(args.ids)
        except ValueError as e:
            updater._error(f"❌ ID 範圍格式錯誤: {args.ids}")
            return 1

        if not args.quiet:
            print(f"📝 準備更新 {len(card_ids)} 張卡片")

        success_count = updater.batch_update(card_ids, args.stage, args.batch)

        if not args.quiet:
            print(f"\n📊 批次更新完成：成功 {success_count}/{len(card_ids)} 張")

        if success_count > 0:
            updater.save_cards()

        return 0 if success_count > 0 else 1

if __name__ == '__main__':
    sys.exit(main())
