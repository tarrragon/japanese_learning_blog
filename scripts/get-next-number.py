#!/usr/bin/env python3
# /// script
# dependencies = []
# requires-python = ">=3.10"
# ///

"""
取得指定分類的下一個可用編號（並保留，支援並發執行）

用途：新增卡片時取得編號。取得的編號會寫入 .locks/{category}.reserved.json，
      之後的呼叫不會再拿到同一個編號；卡片檔案建立後保留紀錄會自動清除。
執行：uv run scripts/get-next-number.py <category> [選項]

參數：
  category            分類名稱 (如: verb-ru, noun)

選項：
  --peek              只查詢下一個編號，不保留
  --batch COUNT       保留 COUNT 個連續編號（回傳起始編號）
  --label TEXT        記錄在保留紀錄中的說明（如預定檔名）
  --release NUMBER    取消保留某個編號（卡片最後沒建立時使用）
  --reservations      列出目前保留中的編號
  --extension BASE    取得延伸卡片編號 (BASE 為基礎卡片的編號，如: 001)
  --format            （相容舊參數）輸出一律為補零的三位數編號
  --json              以 JSON 格式輸出

範例：
  uv run scripts/get-next-number.py verb-ru
  # 輸出: 026（並保留 026）

  uv run scripts/get-next-number.py verb-ru --format --label 026_taberu.md
  # 輸出: 026

  uv run scripts/get-next-number.py verb-ru --batch 5
  # 輸出: 026 (並保留 026-030 共 5 個編號)

  uv run scripts/get-next-number.py verb-ru --peek
  # 輸出: 下一個編號，不保留

  uv run scripts/get-next-number.py verb-ru --release 026
"""

import json
import sys
import re
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from card_numbering import CardNumbering, ZETTELKASTEN_DIR  # noqa: E402


def get_next_number(category: str, batch_size: int = 1, reserve: bool = True,
                    label: str = "") -> dict:
    """
    取得下一個可用編號

    預設會在保留紀錄中「保留」編號，之後的呼叫不會再拿到同一個號碼。
    reserve=False 只查詢不保留（--peek）。
    """
    numbering = CardNumbering(category)

    if not numbering.exists():
        return {
            "category": category,
            "error": f"分類「{category}」不存在",
            "next_number": None,
        }

    index_number = numbering.index_last_number()
    file_number = numbering.files_max_number()

    result = {
        "category": category,
        "index_last_number": index_number,
        "files_max_number": file_number,
        "batch_size": batch_size,
        "reserved": reserve,
    }

    if index_number is not None and index_number != file_number:
        result["warning"] = (
            f"⚠️  index.md 記錄 ({index_number:03d}) 與實際檔案 ({file_number:03d}) 不一致"
        )

    if reserve:
        labels = [label] * batch_size if label else None
        numbers = numbering.reserve(batch_size, labels=labels)
        next_number = numbers[0]
    else:
        next_number = numbering.peek()

    result["next_number"] = next_number

    if batch_size > 1:
        end_number = next_number + batch_size - 1
        result["allocated_range"] = f"{next_number:03d}-{end_number:03d}"
        result["end_number"] = end_number

    return result


def get_next_extension_number(category: str, base_number: str) -> dict:
    """
    取得延伸卡片的下一個編號

    延伸卡片命名格式：{base}_{ext}.md
    如：001_taberu_001_keigo.md

    Returns:
        {
            "category": 分類名稱,
            "base_number": 基礎卡片編號,
            "next_extension": 下一個延伸編號,
            "format": "001_001" (基礎_延伸)
        }
    """
    category_path = ZETTELKASTEN_DIR / category

    if not category_path.exists() or not category_path.is_dir():
        return {
            "category": category,
            "base_number": base_number,
            "error": f"分類「{category}」不存在",
        }

    # 找出該基礎卡片的所有延伸卡片
    base_num = int(base_number)
    pattern = re.compile(rf"^{base_number}_\w+_(\d{{3}})")

    max_ext = 0

    for file in category_path.iterdir():
        if not file.is_file() or file.suffix != ".md":
            continue

        match = pattern.match(file.name)
        if match:
            ext_num = int(match.group(1))
            max_ext = max(max_ext, ext_num)

    next_ext = max_ext + 1

    return {
        "category": category,
        "base_number": base_number,
        "max_extension": max_ext,
        "next_extension": next_ext,
        "format": f"{base_number}_{next_ext:03d}",
    }


def _option_value(args, name):
    if name in args:
        idx = args.index(name)
        if idx + 1 < len(args):
            return args[idx + 1]
    return None


def main():
    """主要邏輯"""
    args = sys.argv[1:]

    if not args or args[0].startswith("--"):
        print("❌ 請指定分類名稱", file=sys.stderr)
        print("\n使用方式：uv run scripts/get-next-number.py <category> [選項]", file=sys.stderr)
        sys.exit(1)

    category = args[0]
    show_json = "--json" in args
    numbering = CardNumbering(category)

    if not numbering.exists():
        print(f"分類「{category}」不存在", file=sys.stderr)
        sys.exit(1)

    # 取消保留
    release_value = _option_value(args, "--release")
    if release_value is not None:
        try:
            released = numbering.release(int(release_value))
        except ValueError:
            print("❌ --release 參數必須是數字", file=sys.stderr)
            sys.exit(1)
        if released:
            print(f"✅ 已取消保留 {category} {int(release_value):03d}")
            return
        print(f"⚠️  {category} {int(release_value):03d} 沒有保留紀錄", file=sys.stderr)
        sys.exit(1)

    # 列出保留紀錄
    if "--reservations" in args:
        reservations = numbering.reservations()
        if show_json:
            print(json.dumps({f"{k:03d}": v for k, v in sorted(reservations.items())},
                             ensure_ascii=False, indent=2))
        elif not reservations:
            print(f"{category}：沒有保留中的編號")
        else:
            for number, info in sorted(reservations.items()):
                print(f"{number:03d}  {info.get('reserved_at', '')}  {info.get('label', '')}")
        return

    extension_base = _option_value(args, "--extension")

    batch_size = 1
    batch_value = _option_value(args, "--batch")
    if batch_value is not None:
        try:
            batch_size = int(batch_value)
        except ValueError:
            print("❌ --batch 參數必須是整數", file=sys.stderr)
            sys.exit(1)
        if batch_size < 1:
            print("❌ --batch 參數必須 >= 1", file=sys.stderr)
            sys.exit(1)

    if extension_base:
        result = get_next_extension_number(category, extension_base)
    else:
        result = get_next_number(
            category,
            batch_size=batch_size,
            reserve="--peek" not in args,
            label=_option_value(args, "--label") or "",
        )

    if "error" in result:
        print(result["error"], file=sys.stderr)
        sys.exit(1)

    if show_json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return

    if "warning" in result:
        print(result["warning"], file=sys.stderr)

    if batch_size > 1 and "allocated_range" in result:
        print(f"📦 已保留 {batch_size} 個編號: {result['allocated_range']}", file=sys.stderr)

    # 一律輸出補零的三位數：舊版預設輸出 "39"，被直接用在檔名（39_xxx.md），
    # 而 3 位數掃描看不到這些檔案，導致同一編號被重複發出
    if extension_base:
        print(result["format"])
    else:
        print(f"{result['next_number']:03d}")


if __name__ == "__main__":
    main()
