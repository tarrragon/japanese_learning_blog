# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""
批次處理 partial 卡片 - 這些卡片內容完整但格式略有不同

經過人工審查，這 27 張卡片內容都很豐富（119-489行），
只是三語解釋的標題格式不同（### 而不是 ##）。
"""

import json
import re
from pathlib import Path

def main():
    # 讀取審計結果
    audit_file = Path("doc/worklog/draft-audit.json")
    with open(audit_file, encoding='utf-8') as f:
        data = json.load(f)

    partial_cards = [c for c in data['cards'] if c['status'] == 'partial']
    print(f"找到 {len(partial_cards)} 張 partial 卡片")

    updated = 0
    skipped = 0

    for card in partial_cards:
        file_path = Path(card['file_path'])
        if not file_path.exists():
            print(f"  ⚠ 檔案不存在: {file_path}")
            skipped += 1
            continue

        content = file_path.read_text(encoding='utf-8')
        lines = len(content.splitlines())

        # 檢查是否有足夠內容（超過 100 行視為完整）
        if lines < 100:
            print(f"  ⚠ 內容過短 ({lines} 行): {file_path}")
            skipped += 1
            continue

        # 檢查是否有三語解釋的變體格式
        has_jp = bool(re.search(r'(##\s*日(文|本)|###\s*日(文|本))', content))
        has_en = bool(re.search(r'(##\s*English|###\s*英文|##\s*英文)', content, re.I))
        has_zh = bool(re.search(r'(##\s*中文|###\s*中文|##\s*繁體中文)', content))

        if not (has_jp and has_en and has_zh):
            print(f"  ⚠ 缺少部分解釋 (JP:{has_jp} EN:{has_en} ZH:{has_zh}): {file_path}")
            skipped += 1
            continue

        # 移除 draft: true
        new_content = re.sub(r'\ndraft: true\n', '\ndraft: false\n', content)

        if new_content != content:
            file_path.write_text(new_content, encoding='utf-8')
            print(f"  ✓ 更新: {file_path} ({lines} 行)")
            updated += 1

    print(f"\n結果：更新 {updated} 張，跳過 {skipped} 張")


if __name__ == '__main__':
    main()
