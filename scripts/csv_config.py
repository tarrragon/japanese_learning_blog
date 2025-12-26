#!/usr/bin/env python3
"""
CSV 配置模組
自動偵測最新的 worklog CSV 檔案，支援 Active CSV 機制

Usage:
    from csv_config import get_latest_csv_path, get_active_csv_path, set_active_csv

    # 設定當前工作的 CSV
    set_active_csv("cards-pending-links-1.4.0.csv")

    # 取得預設 CSV（優先 Active CSV）
    csv_path = get_default_csv_path()
"""

from pathlib import Path
import re
from typing import Optional

# Active CSV 標記檔案名稱
ACTIVE_CSV_MARKER = ".active-csv"


def get_active_csv_path(worklog_dir: Optional[str] = None) -> Optional[str]:
    """
    讀取 Active CSV 標記檔案

    Args:
        worklog_dir: worklog 目錄路徑（預設: doc/worklog）

    Returns:
        str: Active CSV 檔案路徑，如果未設定或檔案不存在則回傳 None
    """
    if worklog_dir is None:
        worklog_dir = Path("doc/worklog")
    else:
        worklog_dir = Path(worklog_dir)

    marker = worklog_dir / ACTIVE_CSV_MARKER
    if marker.exists():
        filename = marker.read_text(encoding='utf-8').strip()
        if filename:
            csv_path = worklog_dir / filename
            if csv_path.exists():
                return str(csv_path)
    return None


def set_active_csv(filename: str, worklog_dir: Optional[str] = None) -> bool:
    """
    設定 Active CSV

    Args:
        filename: CSV 檔案名稱（如 cards-pending-links-1.4.0.csv）
        worklog_dir: worklog 目錄路徑（預設: doc/worklog）

    Returns:
        bool: 設定成功回傳 True，檔案不存在回傳 False
    """
    if worklog_dir is None:
        worklog_dir = Path("doc/worklog")
    else:
        worklog_dir = Path(worklog_dir)

    csv_path = worklog_dir / filename
    if not csv_path.exists():
        return False

    marker = worklog_dir / ACTIVE_CSV_MARKER
    marker.write_text(filename, encoding='utf-8')
    return True


def clear_active_csv(worklog_dir: Optional[str] = None) -> bool:
    """
    清除 Active CSV 設定

    Args:
        worklog_dir: worklog 目錄路徑（預設: doc/worklog）

    Returns:
        bool: 清除成功回傳 True
    """
    if worklog_dir is None:
        worklog_dir = Path("doc/worklog")
    else:
        worklog_dir = Path(worklog_dir)

    marker = worklog_dir / ACTIVE_CSV_MARKER
    if marker.exists():
        marker.unlink()
    return True


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

    優先順序：
    1. Active CSV（如果已設定）
    2. 最新版本號的 CSV
    3. 預設路徑

    Returns:
        str: CSV 檔案路徑
    """
    # 1. 優先使用 Active CSV
    active = get_active_csv_path()
    if active:
        return active

    # 2. 最新版本（現有邏輯）
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
