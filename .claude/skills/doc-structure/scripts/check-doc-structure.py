#!/usr/bin/env python3
# /// script
# dependencies = []
# requires-python = ">=3.10"
# ///

"""
check-doc-structure.py - 檢查專案文檔結構完整性

設計目的：確保專案遵循層級聚攏結構，所有應有 README 的目錄都有 README
職責：檢查有子目錄的目錄是否包含 README.md

使用方式：
    uv run .claude/skills/doc-structure/scripts/check-doc-structure.py
"""

import sys
from pathlib import Path
from typing import List, Set


# 排除的目錄
EXCLUDE_DIRS = {
    'node_modules', '.git', '__pycache__', '.venv', 'venv',
    'dist', 'build', '.cache', '.next', '.nuxt', 'coverage',
    '.idea', '.vscode', '.pytest_cache', '.mypy_cache',
    'egg-info', '.tox', '.nox'
}

# 不需要 README 的目錄模式
SKIP_PATTERNS = {
    '_meta',       # zettelkasten meta 系統
    'assets',      # 靜態資源
    'fonts',       # 字體
    'images',      # 圖片
    'icons',       # 圖標
    'css',         # 樣式
    'js',          # 腳本（非源碼）
    'data',        # 數據文件
    'fixtures',    # 測試數據
    '__snapshots__',  # Jest snapshots
    # Claude Code 配置子目錄
    'agents',      # 代理人定義
    'commands',    # Slash Commands
    'templates',   # 模板
    'skills',      # Skills
    'references',  # 參考文檔
    'scripts',     # 腳本
    # 測試子目錄
    'unit',        # 單元測試
    'integration', # 整合測試
    'environment', # 環境測試
    'app',         # App 測試
    'helpers',     # 測試輔助
    'middleware',  # 中介軟體
    'i18n',        # i18n 測試
    'renderers',   # 渲染器測試
    'ui',          # UI 測試
    # 工作日誌
    'worklog',     # 版本工作日誌
    # Hugo 目錄
    'archetypes',  # Hugo archetypes
    'layouts',     # Hugo layouts
    'themes',      # Hugo themes
    'static',      # 靜態文件
    # 插件目錄
    'plugins',     # 插件
}


def should_check_dir(dir_path: Path, root: Path) -> bool:
    """判斷目錄是否需要檢查"""
    # 排除特定目錄
    if dir_path.name in EXCLUDE_DIRS:
        return False

    # 排除隱藏目錄（除了 .claude）
    if dir_path.name.startswith('.') and dir_path.name != '.claude':
        return False

    # 排除不需要 README 的目錄模式
    if dir_path.name in SKIP_PATTERNS:
        return False

    # zettelkasten 分類使用 index.md，不需要 README
    if 'zettelkasten' in dir_path.parts:
        # 只檢查 zettelkasten 根目錄
        zettel_root = root / 'zettelkasten'
        if dir_path != zettel_root:
            return False

    return True


def has_subdirectories(dir_path: Path) -> bool:
    """檢查目錄是否有子目錄"""
    for item in dir_path.iterdir():
        if item.is_dir() and not item.name.startswith('.'):
            if item.name not in EXCLUDE_DIRS and item.name not in SKIP_PATTERNS:
                return True
    return False


def has_code_files(dir_path: Path) -> bool:
    """檢查目錄是否有程式碼文件"""
    code_extensions = {'.py', '.js', '.ts', '.jsx', '.tsx', '.md'}
    for item in dir_path.iterdir():
        if item.is_file() and item.suffix in code_extensions:
            if item.name != 'README.md':
                return True
    return False


def find_dirs_needing_readme(root: Path) -> List[Path]:
    """找出需要 README 但沒有的目錄"""
    missing_readme = []

    def check_dir(dir_path: Path):
        if not should_check_dir(dir_path, root):
            return

        # 如果目錄有子目錄或有程式碼文件，應該有 README
        needs_readme = has_subdirectories(dir_path) or has_code_files(dir_path)

        if needs_readme:
            readme_path = dir_path / 'README.md'
            if not readme_path.exists():
                missing_readme.append(dir_path)

        # 遞迴檢查子目錄
        for item in dir_path.iterdir():
            if item.is_dir():
                check_dir(item)

    check_dir(root)
    return sorted(missing_readme)


def count_readmes(root: Path) -> int:
    """計算現有 README 數量"""
    count = 0
    for readme in root.rglob('README.md'):
        if not any(ex in readme.parts for ex in EXCLUDE_DIRS):
            count += 1
    return count


def main():
    # 找出專案根目錄
    script_path = Path(__file__).resolve()
    project_root = script_path.parents[4]  # .claude/skills/doc-structure/scripts -> root

    readme_count = count_readmes(project_root)
    missing_dirs = find_dirs_needing_readme(project_root)

    if not missing_dirs:
        print(f"✅ 文檔結構完整（共 {readme_count} 個目錄有 README）")
        sys.exit(0)
    else:
        print("⚠️ 以下目錄缺少 README.md：")
        for dir_path in missing_dirs:
            rel_path = dir_path.relative_to(project_root)
            print(f"  {rel_path}/")
        print(f"\n共 {len(missing_dirs)} 個目錄缺少 README（現有 {readme_count} 個）")
        sys.exit(1)


if __name__ == '__main__':
    main()
