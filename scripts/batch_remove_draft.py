# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""
批次移除完整卡片的 draft: true 標記
"""

import json
import re
from pathlib import Path

def main():
    # 讀取審計結果
    audit_file = Path("doc/worklog/draft-audit.json")
    with open(audit_file, encoding='utf-8') as f:
        data = json.load(f)

    complete_cards = [c for c in data['cards'] if c['status'] == 'complete']
    print(f"找到 {len(complete_cards)} 張完整卡片")

    updated = 0
    for card in complete_cards:
        file_path = Path(card['file_path'])
        if not file_path.exists():
            print(f"  ⚠ 檔案不存在: {file_path}")
            continue

        content = file_path.read_text(encoding='utf-8')

        # 移除 draft: true
        new_content = re.sub(r'\ndraft: true\n', '\ndraft: false\n', content)

        if new_content != content:
            file_path.write_text(new_content, encoding='utf-8')
            updated += 1

    print(f"\n已更新 {updated} 張卡片（設定 draft: false）")


if __name__ == '__main__':
    main()
