#!/usr/bin/env python3
"""
Active CSV 管理工具
設定當前工作的 CSV 檔案，統一代理人操作流程

Usage:
    # 設定 Active CSV
    uv run scripts/set_active_csv.py cards-pending-links-1.4.0.csv

    # 顯示當前設定
    uv run scripts/set_active_csv.py --show

    # 清除設定（回到自動偵測）
    uv run scripts/set_active_csv.py --clear

    # 列出所有可用 CSV
    uv run scripts/set_active_csv.py --list
"""

import argparse
import csv
import sys
from pathlib import Path
from collections import Counter

from csv_config import (
    get_active_csv_path,
    set_active_csv,
    clear_active_csv,
    get_latest_csv_path,
    ACTIVE_CSV_MARKER
)


def count_stages(csv_path: Path) -> dict:
    """統計 CSV 中各階段的卡片數量"""
    stages = Counter()
    try:
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                stage = row.get('stage', 'unknown')
                stages[stage] += 1
    except Exception:
        pass
    return dict(stages)


def list_csv_files(worklog_dir: Path) -> list:
    """列出所有 CSV 檔案及其狀態"""
    csv_files = sorted(worklog_dir.glob("cards-*.csv"))
    active_csv = get_active_csv_path(str(worklog_dir))

    results = []
    for csv_path in csv_files:
        stages = count_stages(csv_path)
        total = sum(stages.values())
        pending = stages.get('pending', 0)
        draft = stages.get('draft', 0)
        completed = stages.get('completed', 0)

        is_active = active_csv and Path(active_csv).name == csv_path.name

        results.append({
            'name': csv_path.name,
            'total': total,
            'pending': pending,
            'draft': draft,
            'completed': completed,
            'is_active': is_active
        })

    return results


def show_current(worklog_dir: Path) -> int:
    """顯示當前 Active CSV 設定"""
    active = get_active_csv_path(str(worklog_dir))

    if active:
        print(f"📋 Active CSV: {Path(active).name}")
        stages = count_stages(Path(active))
        total = sum(stages.values())
        pending = stages.get('pending', 0)
        print(f"   總計: {total} 張卡片, {pending} 張待處理")
        return 0
    else:
        print("⚪ 未設定 Active CSV（使用自動偵測）")
        try:
            latest = get_latest_csv_path(str(worklog_dir))
            print(f"   自動偵測: {Path(latest).name}")
        except FileNotFoundError:
            print("   ⚠️ 無法找到任何 CSV 檔案")
        return 0


def list_all(worklog_dir: Path) -> int:
    """列出所有 CSV 檔案"""
    csv_list = list_csv_files(worklog_dir)

    if not csv_list:
        print("❌ 在 doc/worklog/ 目錄下找不到任何 cards-*.csv 檔案")
        return 1

    print("📋 可用的 CSV 檔案：\n")
    for item in csv_list:
        marker = " [ACTIVE]" if item['is_active'] else ""
        prefix = "  * " if item['is_active'] else "    "
        print(f"{prefix}{item['name']}{marker}")
        print(f"      總計: {item['total']}, 待處理: {item['pending']}, 草稿: {item['draft']}, 完成: {item['completed']}")
        print()

    return 0


def do_set(filename: str, worklog_dir: Path) -> int:
    """設定 Active CSV"""
    if set_active_csv(filename, str(worklog_dir)):
        print(f"✅ 已設定 Active CSV: {filename}")
        return 0
    else:
        csv_path = worklog_dir / filename
        if not csv_path.exists():
            print(f"❌ CSV 檔案不存在: {csv_path}")
            print("\n💡 可用的 CSV 檔案：")
            for f in sorted(worklog_dir.glob("cards-*.csv")):
                print(f"   - {f.name}")
            return 1
        else:
            print(f"❌ 設定失敗: {filename}")
            return 1


def do_clear(worklog_dir: Path) -> int:
    """清除 Active CSV 設定"""
    clear_active_csv(str(worklog_dir))
    print("✅ 已清除 Active CSV 設定（回到自動偵測）")
    try:
        latest = get_latest_csv_path(str(worklog_dir))
        print(f"   自動偵測: {Path(latest).name}")
    except FileNotFoundError:
        pass
    return 0


def main():
    parser = argparse.ArgumentParser(
        description='Active CSV 管理工具',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
範例:
    # 設定 Active CSV
    uv run scripts/set_active_csv.py cards-pending-links-1.4.0.csv

    # 顯示當前設定
    uv run scripts/set_active_csv.py --show

    # 列出所有 CSV
    uv run scripts/set_active_csv.py --list

    # 清除設定
    uv run scripts/set_active_csv.py --clear
"""
    )

    parser.add_argument('filename', nargs='?',
                       help='要設定的 CSV 檔案名稱')
    parser.add_argument('--show', action='store_true',
                       help='顯示當前 Active CSV 設定')
    parser.add_argument('--list', action='store_true',
                       help='列出所有可用的 CSV 檔案')
    parser.add_argument('--clear', action='store_true',
                       help='清除 Active CSV 設定')
    parser.add_argument('--worklog-dir', default='doc/worklog',
                       help='worklog 目錄路徑（預設: doc/worklog）')

    args = parser.parse_args()
    worklog_dir = Path(args.worklog_dir)

    # 驗證目錄存在
    if not worklog_dir.exists():
        print(f"❌ 目錄不存在: {worklog_dir}")
        return 1

    # 處理命令
    if args.show:
        return show_current(worklog_dir)
    elif args.list:
        return list_all(worklog_dir)
    elif args.clear:
        return do_clear(worklog_dir)
    elif args.filename:
        return do_set(args.filename, worklog_dir)
    else:
        # 預設顯示當前設定
        return show_current(worklog_dir)


if __name__ == '__main__':
    sys.exit(main())
