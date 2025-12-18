#!/usr/bin/env python3
"""
CSV 配置模組
自動偵測最新的 worklog CSV 檔案

Usage:
    from csv_config import get_latest_csv_path
    csv_path = get_latest_csv_path()
"""

from pathlib import Path
import re
from typing import Optional


def get_latest_csv_path(worklog_dir: Optional[str] = None) -> str:
    """
    自動偵測最新的 worklog CSV 檔案

    搜尋 doc/worklog/cards-*.csv 並回傳版本號最大的檔案路徑

    Returns:
        str: CSV 檔案路徑（相對路徑）

    Raises:
        FileNotFoundError: 如果找不到任何 CSV 檔案
    """
    if worklog_dir is None:
        worklog_dir = Path("doc/worklog")
    else:
        worklog_dir = Path(worklog_dir)

    # 搜尋所有 cards-*.csv 檔案
    csv_files = list(worklog_dir.glob("cards-*.csv"))

    if not csv_files:
        raise FileNotFoundError(
            f"在 {worklog_dir} 目錄下找不到任何 cards-*.csv 檔案"
        )

    # 解析版本號並排序
    def parse_version(path: Path) -> tuple:
        """解析版本號 (major, minor, patch)"""
        match = re.search(r'cards-(\d+)\.(\d+)\.(\d+)\.csv$', path.name)
        if match:
            return (int(match.group(1)), int(match.group(2)), int(match.group(3)))
        return (0, 0, 0)

    # 按版本號排序，取最大的
    csv_files.sort(key=parse_version, reverse=True)
    latest = csv_files[0]

    return str(latest)


def get_csv_version(csv_path: str) -> str:
    """
    從 CSV 檔案路徑提取版本號

    Args:
        csv_path: CSV 檔案路徑

    Returns:
        str: 版本號（如 "1.0.6"）
    """
    match = re.search(r'cards-(\d+\.\d+\.\d+)\.csv$', csv_path)
    if match:
        return match.group(1)
    return "unknown"


def get_default_csv_path() -> str:
    """
    取得預設 CSV 路徑（供 argparse default 使用）

    Returns:
        str: CSV 檔案路徑
    """
    try:
        return get_latest_csv_path()
    except FileNotFoundError:
        # Fallback：如果找不到，回傳一個合理的預設值
        return "doc/worklog/cards.csv"


# 為了向後相容，提供常數
DEFAULT_CSV_PATH = get_default_csv_path()


if __name__ == "__main__":
    # 測試用
    try:
        path = get_latest_csv_path()
        version = get_csv_version(path)
        print(f"最新 CSV: {path}")
        print(f"版本號: {version}")
    except FileNotFoundError as e:
        print(f"錯誤: {e}")
