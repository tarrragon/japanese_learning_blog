#!/usr/bin/env python3
# /// script
# dependencies = []
# requires-python = ">=3.10"
# ///

"""
列出系統中所有既有的卡片分類

用途：在建立新卡片或連結時，快速查看可用的分類
執行：uv run scripts/list-categories.py [選項]

選項：
  --json              以 JSON 格式輸出
  --count             顯示每個分類的卡片數量
  [category_name]     顯示特定分類的詳細資訊
"""

import json
import sys
from pathlib import Path
from typing import Optional

# 專案根目錄
PROJECT_ROOT = Path(__file__).parent.parent
ZETTELKASTEN_DIR = PROJECT_ROOT / "zettelkasten"

# 不計入的特殊目錄
EXCLUDE_DIRS = {"_meta", ".DS_Store"}


def get_categories() -> list[dict]:
    """
    取得所有分類資料夾資訊

    Returns:
        分類列表，每個分類包含：
        - name: 分類名稱
        - description: 分類描述
        - card_count: 實際卡片數
        - recorded_count: index.md 記錄的數量
        - last_number: 最後編號
        - path: 相對路徑
        - full_path: 絕對路徑
    """
    categories = []

    if not ZETTELKASTEN_DIR.exists():
        return categories

    for item in ZETTELKASTEN_DIR.iterdir():
        # 排除特殊目錄和檔案
        if item.name in EXCLUDE_DIRS or not item.is_dir():
            continue

        # 讀取該分類的 index.md 取得資訊
        index_path = item / "index.md"
        description = ""
        recorded_count = 0
        last_number = 0

        if index_path.exists():
            index_content = index_path.read_text(encoding="utf-8")

            # 提取標題作為描述（第一個 # 行）
            for line in index_content.split("\n"):
                if line.startswith("# "):
                    description = line[2:].replace("索引", "").strip()
                    break

            # 提取卡片數量
            for line in index_content.split("\n"):
                if "總卡片數" in line:
                    parts = line.split("：") if "：" in line else line.split(":")
                    if len(parts) > 1:
                        try:
                            recorded_count = int(parts[1].strip())
                        except ValueError:
                            pass
                    break

            # 提取最後編號
            for line in index_content.split("\n"):
                if "最後編號" in line:
                    parts = line.split("：") if "：" in line else line.split(":")
                    if len(parts) > 1:
                        try:
                            last_number = int(parts[1].strip())
                        except ValueError:
                            pass
                    break

        # 計算實際的 .md 檔案數量（排除 index.md）
        actual_card_count = sum(
            1 for f in item.iterdir()
            if f.is_file() and f.suffix == ".md" and f.name != "index.md"
        )

        categories.append({
            "name": item.name,
            "description": description,
            "card_count": actual_card_count,
            "recorded_count": recorded_count,
            "last_number": last_number,
            "path": item.name,
            "full_path": str(item),
        })

    # 按名稱排序
    categories.sort(key=lambda x: x["name"])

    return categories


def format_output(categories: list[dict], show_count: bool = False):
    """格式化輸出分類列表"""
    print("\n📂 既有卡片分類清單\n")
    print("=" * 80)

    total_cards = sum(cat["card_count"] for cat in categories)

    for cat in categories:
        print(f"\n【{cat['name']}】", end="")
        if cat["description"]:
            print(f" - {cat['description']}", end="")
        print()
        print(f"  路徑: zettelkasten/{cat['path']}/")

        if show_count:
            print(f"  卡片數量: {cat['card_count']} 張")
            if cat["card_count"] != cat["recorded_count"]:
                print(f"  ⚠️  index.md 記錄: {cat['recorded_count']} 張 (不一致！)")
            print(f"  最後編號: {str(cat['last_number']).zfill(3)}")

    print("\n" + "=" * 80)
    print(f"\n總計: {len(categories)} 個分類，{total_cards} 張卡片\n")


def get_category_info(category_name: str) -> Optional[dict]:
    """取得特定分類的詳細資訊"""
    categories = get_categories()
    for cat in categories:
        if cat["name"] == category_name:
            return cat
    return None


def main():
    """主要邏輯"""
    args = sys.argv[1:]

    # 解析選項
    show_json = "--json" in args
    show_count = "--count" in args

    # 移除選項參數，剩下的是分類名稱
    category_arg = None
    for arg in args:
        if not arg.startswith("--"):
            category_arg = arg
            break

    # 取得所有分類
    categories = get_categories()

    # 如果指定了特定分類
    if category_arg:
        info = get_category_info(category_arg)
        if info:
            if show_json:
                print(json.dumps(info, ensure_ascii=False, indent=2))
            else:
                print(f"\n分類: {info['name']}")
                print(f"描述: {info['description']}")
                print(f"路徑: zettelkasten/{info['path']}/")
                print(f"卡片數: {info['card_count']}")
                print(f"最後編號: {str(info['last_number']).zfill(3)}\n")
        else:
            print(f"❌ 分類「{category_arg}」不存在", file=sys.stderr)
            sys.exit(1)
    else:
        # 顯示所有分類
        if show_json:
            print(json.dumps(categories, ensure_ascii=False, indent=2))
        else:
            format_output(categories, show_count)


if __name__ == "__main__":
    main()
