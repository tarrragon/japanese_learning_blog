#!/usr/bin/env python3
# /// script
# dependencies = []
# requires-python = ">=3.10"
# ///

"""
validate-readme-links.py - 驗證 README 內部連結有效性

設計目的：確保所有 README.md 的內部連結指向存在的檔案
職責：掃描專案中所有 README.md，提取內部連結並驗證目標路徑是否存在

使用方式：
    uv run .claude/skills/doc-structure/scripts/validate-readme-links.py
"""

import re
import sys
from pathlib import Path
from typing import List, Tuple


def find_readme_files(root: Path) -> List[Path]:
    """找出所有 README.md 文件"""
    exclude_dirs = {
        'node_modules', '.git', '__pycache__', '.venv',
        'venv', 'dist', 'build', '.cache'
    }

    readme_files = []
    for readme in root.rglob('README.md'):
        if not any(ex in readme.parts for ex in exclude_dirs):
            readme_files.append(readme)

    return sorted(readme_files)


def extract_internal_links(file_path: Path) -> List[Tuple[int, str, str]]:
    """從文件提取內部連結，返回 (行號, 連結文字, 連結路徑)"""
    md_link_pattern = re.compile(r'\[([^\]]+)\]\(([^\)]+)\)')
    links = []

    content = file_path.read_text(encoding='utf-8')
    lines = content.split('\n')

    for line_num, line in enumerate(lines, start=1):
        for match in md_link_pattern.finditer(line):
            link_text = match.group(1)
            link_path = match.group(2)

            # 跳過外部連結和錨點連結
            if link_path.startswith(('http://', 'https://', '#')):
                continue

            links.append((line_num, link_text, link_path))

    return links


def validate_link(base_file: Path, link_path: str) -> bool:
    """驗證連結是否有效"""
    # 移除錨點部分
    path_without_anchor = link_path.split('#')[0]
    if not path_without_anchor:
        return True  # 純錨點連結，視為有效

    # 計算絕對路徑
    target_path = (base_file.parent / path_without_anchor).resolve()
    return target_path.exists()


def main():
    # 找出專案根目錄
    script_path = Path(__file__).resolve()
    project_root = script_path.parents[4]  # .claude/skills/doc-structure/scripts -> root

    readme_files = find_readme_files(project_root)

    total_links = 0
    invalid_links: List[Tuple[Path, int, str]] = []

    for readme in readme_files:
        links = extract_internal_links(readme)
        total_links += len(links)

        for line_num, link_text, link_path in links:
            if not validate_link(readme, link_path):
                invalid_links.append((readme, line_num, link_path))

    # 輸出結果
    if not invalid_links:
        print(f"✅ 所有 README 連結有效（共 {total_links} 個連結）")
        sys.exit(0)
    else:
        print("❌ 發現無效連結：")
        for file_path, line_num, link_path in invalid_links:
            rel_path = file_path.relative_to(project_root)
            print(f"  {rel_path}:{line_num} → {link_path}")
        print(f"\n共 {len(invalid_links)} 個無效連結（總計 {total_links} 個連結）")
        sys.exit(1)


if __name__ == '__main__':
    main()
