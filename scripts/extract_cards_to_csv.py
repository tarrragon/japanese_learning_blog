#!/usr/bin/env python3
"""
從 worklog-1.0.6.md 提取卡片資訊並生成 CSV

Usage:
    uv run scripts/extract_cards_to_csv.py
"""

import csv
import re
from pathlib import Path
from datetime import datetime

def parse_markdown_tables(md_content: str):
    """解析 Markdown 表格"""
    cards = []
    card_id = 1

    # 正則表達式匹配表格行
    # 格式: | # | 路徑 | 日文 | 中文 | JLPT | 來源 | 優先級 | 備註 |
    # 或:    | # | 路徑 | 日文 | 中文 | JLPT | Stage |

    lines = md_content.split('\n')
    in_completed_section = False
    in_pending_section = False
    current_priority = None
    current_source = None

    for i, line in enumerate(lines):
        # 檢測章節
        if '## ✅ 已完成卡片清單' in line:
            in_completed_section = True
            in_pending_section = False
            continue
        elif '## 🆕 待建立卡片清單' in line:
            in_completed_section = False
            in_pending_section = True
            continue
        elif line.startswith('###') and in_pending_section:
            # 嘗試從標題提取資訊（如優先級、來源）
            if 'Critical' in line:
                current_priority = 'Critical'
            elif 'High' in line:
                current_priority = 'High'
            elif 'Medium' in line:
                current_priority = 'Medium'
            elif 'Low' in line:
                current_priority = 'Low'

        # 跳過表格標題和分隔線
        if not line.strip() or line.startswith('|---') or line.startswith('| # |') or line.startswith('| 編號 |'):
            continue

        # 解析表格行
        if line.startswith('|') and '|' in line[1:]:
            parts = [p.strip() for p in line.split('|')[1:-1]]  # 移除首尾空元素

            if len(parts) < 4:
                continue

            # 已完成卡片格式: | # | 路徑 | 日文 | 中文 | JLPT | Stage |
            if in_completed_section and len(parts) >= 6:
                num_str, path, japanese, chinese, jlpt, stage = parts[:6]

                # 解析路徑獲取分類和編號
                if '/' in path:
                    category, filename = path.split('/', 1)
                    # 從檔名提取編號
                    num_match = re.match(r'(\d+)', filename.split('_')[0])
                    number = num_match.group(1) if num_match else '000'
                else:
                    category = 'unknown'
                    number = '000'

                card = {
                    'id': str(card_id),
                    'category': category,
                    'number': number,
                    'path': path,
                    'japanese': japanese,
                    'chinese': chinese,
                    'jlpt': jlpt.lower(),
                    'source': 'v1.0.6',  # 已完成的都是本版本
                    'priority': 'High',   # 已完成的默認 High
                    'stage': 'completed',
                    'note': '',
                    'created': '2025-10-31',
                    'updated': '2025-10-31',
                    'batch': '0'
                }
                cards.append(card)
                card_id += 1

            # 待建立卡片格式: | # | 路徑 | 日文 | 中文 | JLPT | 來源 | 優先級 | 備註 |
            elif in_pending_section and len(parts) >= 7:
                num_str, path, japanese, chinese, jlpt, source, priority = parts[:7]
                note = parts[7] if len(parts) > 7 else ''

                # 解析路徑獲取分類和編號
                if '/' in path:
                    category, filename = path.split('/', 1)
                    # 從檔名提取編號
                    num_match = re.match(r'(\d+)', filename.split('_')[0])
                    number = num_match.group(1) if num_match else '000'
                else:
                    category = 'unknown'
                    number = '000'

                # 簡化來源
                if 'v1.0.5' in source or '1.0.5' in source:
                    source_short = 'v1.0.5'
                elif 'v1.0.4' in source or '1.0.4' in source:
                    source_short = 'v1.0.4'
                elif 'Misc' in source or 'misc' in source:
                    source_short = 'misc-tags'
                else:
                    source_short = 'unknown'

                card = {
                    'id': str(card_id),
                    'category': category,
                    'number': number,
                    'path': path,
                    'japanese': japanese,
                    'chinese': chinese,
                    'jlpt': jlpt.lower(),
                    'source': source_short,
                    'priority': priority if priority else (current_priority or 'Medium'),
                    'stage': 'pending',
                    'note': note,
                    'created': '2025-10-31',
                    'updated': '2025-10-31',
                    'batch': ''
                }
                cards.append(card)
                card_id += 1

    return cards


def main():
    # 讀取 worklog-1.0.6.md
    worklog_path = Path('doc/worklog/worklog-1.0.6.md')

    if not worklog_path.exists():
        print(f"❌ 找不到檔案: {worklog_path}")
        return

    print(f"📖 讀取 {worklog_path}...")
    with open(worklog_path, 'r', encoding='utf-8') as f:
        md_content = f.read()

    # 解析表格
    print("🔍 解析表格...")
    cards = parse_markdown_tables(md_content)

    print(f"✅ 找到 {len(cards)} 張卡片")

    # 統計
    completed = sum(1 for c in cards if c['stage'] == 'completed')
    pending = sum(1 for c in cards if c['stage'] == 'pending')
    print(f"   已完成: {completed} 張")
    print(f"   待建立: {pending} 張")

    # 儲存到 CSV
    csv_path = Path('doc/worklog/cards-1.0.6.csv')
    csv_path.parent.mkdir(parents=True, exist_ok=True)

    fieldnames = [
        'id', 'category', 'number', 'path', 'japanese', 'chinese',
        'jlpt', 'source', 'priority', 'stage', 'note', 'created', 'updated', 'batch'
    ]

    print(f"\n💾 儲存到 {csv_path}...")
    with open(csv_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(cards)

    print(f"✅ 成功生成 CSV 檔案！")
    print(f"\n📊 可使用以下指令查看:")
    print(f"   uv run scripts/manage_worklog_cards.py stats")
    print(f"   uv run scripts/manage_worklog_cards.py list --stage pending --limit 10")


if __name__ == '__main__':
    main()
