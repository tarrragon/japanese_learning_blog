#!/usr/bin/env python3
# /// script
# dependencies = []
# requires-python = ">=3.10"
# ///

"""
取得指定分類的下一個可用編號（支援並發執行）

用途：新增卡片時自動取得編號，避免手動查找
執行：uv run scripts/get-next-number.py <category> [選項]

參數：
  category            分類名稱 (如: verb-ru, noun)

選項：
  --extension BASE    取得延伸卡片編號 (BASE 為基礎卡片的編號，如: 001)
  --format            格式化輸出為完整檔名 (如: 026_taberu.md)
  --json              以 JSON 格式輸出
  --update-index      自動更新 index.md 的最後編號（需配合其他腳本使用）
  --batch COUNT       批次分配多個連續編號（回傳起始編號）

範例：
  uv run scripts/get-next-number.py verb-ru
  # 輸出: 026

  uv run scripts/get-next-number.py verb-ru --format
  # 輸出: 026

  uv run scripts/get-next-number.py verb-ru --extension 001
  # 輸出: 001_001 (第一個延伸卡片)

  uv run scripts/get-next-number.py verb-ru --batch 5
  # 輸出: 026 (並保留 026-030 共 5 個編號)
"""

import json
import sys
import re
import fcntl
import time
from pathlib import Path
from typing import Optional

# 專案根目錄
PROJECT_ROOT = Path(__file__).parent.parent
ZETTELKASTEN_DIR = PROJECT_ROOT / "zettelkasten"
LOCK_DIR = PROJECT_ROOT / ".locks"

# 確保 lock 目錄存在
LOCK_DIR.mkdir(exist_ok=True)


class FileLock:
    """檔案鎖管理器（支援並發控制）"""

    def __init__(self, lock_file: Path, timeout: float = 10.0):
        self.lock_file = lock_file
        self.timeout = timeout
        self.lock_fd = None

    def __enter__(self):
        """取得鎖"""
        self.lock_file.parent.mkdir(parents=True, exist_ok=True)
        self.lock_fd = open(self.lock_file, 'w')

        start_time = time.time()
        while True:
            try:
                fcntl.flock(self.lock_fd.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
                return self
            except BlockingIOError:
                if time.time() - start_time > self.timeout:
                    raise TimeoutError(f"無法在 {self.timeout} 秒內取得鎖: {self.lock_file}")
                time.sleep(0.1)

    def __exit__(self, exc_type, exc_val, exc_tb):
        """釋放鎖"""
        if self.lock_fd:
            fcntl.flock(self.lock_fd.fileno(), fcntl.LOCK_UN)
            self.lock_fd.close()


def get_last_number_from_index(category_path: Path) -> Optional[int]:
    """從 index.md 讀取最後編號"""
    index_path = category_path / "index.md"

    if not index_path.exists():
        return None

    content = index_path.read_text(encoding="utf-8")

    for line in content.split("\n"):
        if "最後編號" in line:
            parts = line.split("：") if "：" in line else line.split(":")
            if len(parts) > 1:
                try:
                    return int(parts[1].strip())
                except ValueError:
                    pass

    return None


def get_max_number_from_files(category_path: Path) -> int:
    """從實際檔案中找出最大編號"""
    max_number = 0

    if not category_path.exists():
        return max_number

    for file in category_path.iterdir():
        if not file.is_file() or file.suffix != ".md" or file.name == "index.md":
            continue

        # 提取檔名開頭的編號 (如: 001_taberu.md -> 001)
        match = re.match(r"^(\d{3})", file.name)
        if match:
            number = int(match.group(1))
            max_number = max(max_number, number)

    return max_number


def get_next_number(category: str, batch_size: int = 1, use_lock: bool = True) -> dict:
    """
    取得下一個可用編號（支援批次分配和並發控制）

    Args:
        category: 分類名稱
        batch_size: 批次分配數量（預設 1）
        use_lock: 是否使用檔案鎖（預設 True）

    Returns:
        {
            "category": 分類名稱,
            "next_number": 下一個編號（批次時為起始編號）,
            "batch_size": 批次大小,
            "allocated_range": "026-030" (批次時顯示範圍),
            "from_index": 是否從 index.md 讀取,
            "from_files": 是否從檔案掃描取得,
            "warning": 警告訊息（如果有不一致）
        }
    """
    category_path = ZETTELKASTEN_DIR / category

    if not category_path.exists() or not category_path.is_dir():
        return {
            "category": category,
            "error": f"分類「{category}」不存在",
            "next_number": None,
        }

    # 使用檔案鎖保護並發存取
    lock_file = LOCK_DIR / f"{category}.lock"

    def _get_number():
        # 從 index.md 讀取
        index_number = get_last_number_from_index(category_path)

        # 從檔案掃描
        file_number = get_max_number_from_files(category_path)

        result = {
            "category": category,
            "index_last_number": index_number,
            "files_max_number": file_number,
            "batch_size": batch_size,
        }

        # 決定下一個編號
        if index_number is not None and file_number is not None:
            # 兩者都有，取較大值
            next_number = max(index_number, file_number) + 1

            # 檢查是否一致
            if index_number != file_number:
                result["warning"] = (
                    f"⚠️  index.md 記錄 ({index_number:03d}) 與實際檔案 ({file_number:03d}) 不一致"
                )

        elif index_number is not None:
            # 只有 index.md
            next_number = index_number + 1
            result["from_index"] = True

        elif file_number > 0:
            # 只有檔案
            next_number = file_number + 1
            result["from_files"] = True
            result["warning"] = "⚠️  index.md 未記錄最後編號，從檔案掃描取得"

        else:
            # 都沒有，這是第一張卡片
            next_number = 1

        result["next_number"] = next_number

        # 批次分配時，顯示範圍
        if batch_size > 1:
            end_number = next_number + batch_size - 1
            result["allocated_range"] = f"{next_number:03d}-{end_number:03d}"
            result["end_number"] = end_number

        return result

    # 使用檔案鎖
    if use_lock:
        with FileLock(lock_file, timeout=10.0):
            return _get_number()
    else:
        return _get_number()


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


def main():
    """主要邏輯"""
    args = sys.argv[1:]

    if not args or args[0].startswith("--"):
        print("❌ 請指定分類名稱", file=sys.stderr)
        print("\n使用方式：uv run scripts/get-next-number.py <category> [選項]", file=sys.stderr)
        sys.exit(1)

    category = args[0]

    # 解析選項
    show_json = "--json" in args
    show_format = "--format" in args

    extension_base = None
    if "--extension" in args:
        ext_idx = args.index("--extension")
        if ext_idx + 1 < len(args):
            extension_base = args[ext_idx + 1]

    batch_size = 1
    if "--batch" in args:
        batch_idx = args.index("--batch")
        if batch_idx + 1 < len(args):
            try:
                batch_size = int(args[batch_idx + 1])
            except ValueError:
                print("❌ --batch 參數必須是整數", file=sys.stderr)
                sys.exit(1)

    # 取得編號
    if extension_base:
        result = get_next_extension_number(category, extension_base)
    else:
        result = get_next_number(category, batch_size=batch_size, use_lock=True)

    # 輸出
    if "error" in result:
        print(result["error"], file=sys.stderr)
        sys.exit(1)

    if show_json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        # 顯示警告（如果有）
        if "warning" in result:
            print(result["warning"], file=sys.stderr)

        # 批次分配時顯示範圍
        if batch_size > 1 and "allocated_range" in result:
            print(f"📦 批次分配 {batch_size} 個編號: {result['allocated_range']}", file=sys.stderr)

        # 輸出編號
        if extension_base:
            print(result["format"])
        else:
            if show_format:
                print(f"{result['next_number']:03d}")
            else:
                print(result["next_number"])


if __name__ == "__main__":
    main()
