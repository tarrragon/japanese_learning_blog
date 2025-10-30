#!/usr/bin/env python3
# /// script
# dependencies = []
# requires-python = ">=3.10"
# ///

"""
fix-wikilinks.py - 修正 Wikilink 格式為標準 Markdown 連結

這個腳本會掃描所有卡片，將 Obsidian/Wikilink 格式 [[path|text]] 或 [[path]]
轉換為標準 Markdown 格式 [text](path.md)，並正確計算相對路徑。

使用方式：
    # 檢測問題
    uv run scripts/fix-wikilinks.py --check

    # 預覽變更
    uv run scripts/fix-wikilinks.py --dry-run

    # 執行修正
    uv run scripts/fix-wikilinks.py --fix

    # 只修正特定分類
    uv run scripts/fix-wikilinks.py --fix --category grammar

    # 驗證修正結果
    uv run scripts/fix-wikilinks.py --verify
"""

import re
import sys
from pathlib import Path
from typing import List, Tuple, Dict
from dataclasses import dataclass


@dataclass
class WikilinkMatch:
    """Wikilink 匹配結果"""
    original: str      # 原始文字 [[path|text]] 或 [[path]]
    path: str          # 路徑部分
    text: str          # 顯示文字
    line_num: int      # 行號
    context: str       # 上下文（前後各 20 字元）


class WikilinkFixer:
    def __init__(self, zettelkasten_root: Path):
        self.root = zettelkasten_root
        self.wikilink_pattern = re.compile(r'\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]')

    def find_wikilinks_in_file(self, file_path: Path) -> List[WikilinkMatch]:
        """在檔案中尋找所有 wikilink"""
        matches = []

        try:
            content = file_path.read_text(encoding='utf-8')
            lines = content.split('\n')

            for line_num, line in enumerate(lines, start=1):
                for match in self.wikilink_pattern.finditer(line):
                    path = match.group(1)
                    text = match.group(2) if match.group(2) else path.split('/')[-1]

                    # 提取上下文
                    start = max(0, match.start() - 20)
                    end = min(len(line), match.end() + 20)
                    context = line[start:end]

                    matches.append(WikilinkMatch(
                        original=match.group(0),
                        path=path,
                        text=text,
                        line_num=line_num,
                        context=context
                    ))
        except Exception as e:
            print(f"❌ 讀取檔案失敗 {file_path}: {e}", file=sys.stderr)

        return matches

    def convert_wikilink_to_markdown(self, wikilink: WikilinkMatch, current_file: Path) -> str:
        """將 wikilink 轉換為標準 Markdown 連結"""
        # 解析路徑：category/number_name -> category/number_name.md
        path_parts = wikilink.path.split('/')

        if len(path_parts) == 2:
            category, name = path_parts
            # 如果沒有 .md 後綴，加上它
            if not name.endswith('.md'):
                # 檢查是否有編號前綴（如 001_name）
                if '_' in name:
                    # 已經有完整檔名
                    target_filename = f"{name}.md"
                else:
                    # 只有名稱，需要找到對應檔案
                    # 這種情況下，我們保留原樣，但加上 .md
                    target_filename = f"{name}.md"
            else:
                target_filename = name

            # 計算相對路徑
            current_category = current_file.parent.name

            if current_category == category:
                # 同一分類，直接使用檔名
                relative_path = target_filename
            else:
                # 不同分類，使用 ../category/file.md
                relative_path = f"../{category}/{target_filename}"
        else:
            # 路徑格式不正確，保持原樣但加上 .md
            relative_path = f"{wikilink.path}.md"

        # 建立標準 Markdown 連結
        return f"[{wikilink.text}]({relative_path})"

    def fix_file(self, file_path: Path, dry_run: bool = True) -> Tuple[int, List[str]]:
        """修正檔案中的 wikilinks"""
        matches = self.find_wikilinks_in_file(file_path)

        if not matches:
            return 0, []

        changes = []
        content = file_path.read_text(encoding='utf-8')
        new_content = content

        # 從後往前替換，避免位置偏移
        for match in sorted(matches, key=lambda m: m.line_num, reverse=True):
            markdown_link = self.convert_wikilink_to_markdown(match, file_path)
            new_content = new_content.replace(match.original, markdown_link, 1)

            changes.append(
                f"  Line {match.line_num}: {match.original} → {markdown_link}"
            )

        if not dry_run:
            file_path.write_text(new_content, encoding='utf-8')

        return len(matches), changes

    def scan_all_files(self, category: str = None) -> Dict[Path, List[WikilinkMatch]]:
        """掃描所有檔案，找出包含 wikilinks 的檔案"""
        results = {}

        # 決定掃描範圍
        if category:
            search_pattern = f"{category}/*.md"
        else:
            search_pattern = "**/*.md"

        for file_path in self.root.glob(search_pattern):
            # 跳過 index.md 和 _meta 目錄
            if file_path.name == 'index.md' or '_meta' in file_path.parts:
                continue

            matches = self.find_wikilinks_in_file(file_path)
            if matches:
                results[file_path] = matches

        return results

    def verify_links(self, category: str = None) -> List[Tuple[Path, str, bool]]:
        """驗證所有連結是否有效"""
        issues = []

        # 標準 Markdown 連結模式
        md_link_pattern = re.compile(r'\[([^\]]+)\]\(([^\)]+)\)')

        if category:
            search_pattern = f"{category}/*.md"
        else:
            search_pattern = "**/*.md"

        for file_path in self.root.glob(search_pattern):
            if file_path.name == 'index.md' or '_meta' in file_path.parts:
                continue

            content = file_path.read_text(encoding='utf-8')

            for match in md_link_pattern.finditer(content):
                link_text = match.group(1)
                link_path = match.group(2)

                # 解析相對路徑
                if link_path.startswith('http'):
                    continue  # 跳過外部連結

                # 計算絕對路徑
                if link_path.startswith('../'):
                    target_path = (file_path.parent / link_path).resolve()
                else:
                    target_path = (file_path.parent / link_path).resolve()

                # 檢查檔案是否存在
                exists = target_path.exists()
                if not exists:
                    issues.append((file_path, link_path, False))

        return issues


def print_check_results(results: Dict[Path, List[WikilinkMatch]], root: Path):
    """列印檢測結果"""
    total_files = len(results)
    total_links = sum(len(matches) for matches in results.values())

    print(f"📊 掃描結果")
    print(f"  - 發現 {total_files} 個檔案包含 Wikilink 格式")
    print(f"  - 總共 {total_links} 個 Wikilink 需要修正")
    print()

    # 按分類統計
    by_category = {}
    for file_path, matches in results.items():
        category = file_path.parent.name
        by_category[category] = by_category.get(category, 0) + len(matches)

    print("📁 各分類統計：")
    for category in sorted(by_category.keys()):
        count = by_category[category]
        print(f"  - {category}: {count} 個 wikilinks")
    print()

    # 顯示前 10 個檔案作為範例
    print("📄 前 10 個受影響的檔案：")
    for i, (file_path, matches) in enumerate(list(results.items())[:10], start=1):
        rel_path = file_path.relative_to(root)
        print(f"  {i}. {rel_path} - {len(matches)} 個 wikilinks")
        # 顯示第一個 wikilink 作為範例
        if matches:
            print(f"     範例: {matches[0].original}")

    if total_files > 10:
        print(f"  ... 還有 {total_files - 10} 個檔案")
    print()


def print_dry_run_results(results: Dict[Path, Tuple[int, List[str]]], root: Path):
    """列印 dry-run 結果"""
    total_changes = sum(count for count, _ in results.values())

    print(f"🔍 預覽修正結果")
    print(f"  - 將修正 {len(results)} 個檔案")
    print(f"  - 總共 {total_changes} 個變更")
    print()

    for file_path, (count, changes) in results.items():
        rel_path = file_path.relative_to(root)
        print(f"📝 {rel_path} ({count} 個變更)")
        for change in changes[:3]:  # 只顯示前 3 個
            print(change)
        if len(changes) > 3:
            print(f"  ... 還有 {len(changes) - 3} 個變更")
        print()


def main():
    import argparse

    parser = argparse.ArgumentParser(
        description='修正 Wikilink 格式為標準 Markdown 連結',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
範例：
  # 檢測問題
  uv run scripts/fix-wikilinks.py --check

  # 預覽變更
  uv run scripts/fix-wikilinks.py --dry-run

  # 執行修正
  uv run scripts/fix-wikilinks.py --fix

  # 只修正特定分類
  uv run scripts/fix-wikilinks.py --fix --category grammar

  # 驗證修正結果
  uv run scripts/fix-wikilinks.py --verify
        """
    )

    parser.add_argument('--check', action='store_true', help='只檢測問題，不修正')
    parser.add_argument('--dry-run', action='store_true', help='預覽變更，不實際修改檔案')
    parser.add_argument('--fix', action='store_true', help='執行修正')
    parser.add_argument('--verify', action='store_true', help='驗證連結有效性')
    parser.add_argument('--category', type=str, help='只處理特定分類')

    args = parser.parse_args()

    # 至少要選一個模式
    if not any([args.check, args.dry_run, args.fix, args.verify]):
        parser.print_help()
        sys.exit(1)

    # 找到 zettelkasten 根目錄
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    zettelkasten_root = project_root / 'zettelkasten'

    if not zettelkasten_root.exists():
        print(f"❌ 找不到 zettelkasten 目錄: {zettelkasten_root}", file=sys.stderr)
        sys.exit(1)

    fixer = WikilinkFixer(zettelkasten_root)

    # 檢測模式
    if args.check:
        print("🔍 掃描 Wikilink 格式...")
        results = fixer.scan_all_files(args.category)
        print_check_results(results, zettelkasten_root)
        return

    # 預覽模式
    if args.dry_run:
        print("🔍 預覽修正變更...")
        all_files = fixer.scan_all_files(args.category)
        results = {}

        for file_path in all_files.keys():
            count, changes = fixer.fix_file(file_path, dry_run=True)
            if count > 0:
                results[file_path] = (count, changes)

        print_dry_run_results(results, zettelkasten_root)
        print("💡 使用 --fix 執行實際修正")
        return

    # 修正模式
    if args.fix:
        print("✏️  開始修正 Wikilink...")
        all_files = fixer.scan_all_files(args.category)

        total_files = 0
        total_changes = 0

        for file_path in all_files.keys():
            count, changes = fixer.fix_file(file_path, dry_run=False)
            if count > 0:
                rel_path = file_path.relative_to(zettelkasten_root)
                print(f"✅ {rel_path} - 修正 {count} 個連結")
                total_files += 1
                total_changes += count

        print()
        print(f"🎉 完成！修正了 {total_files} 個檔案，共 {total_changes} 個連結")
        print()
        print("💡 建議執行 --verify 驗證連結有效性")
        return

    # 驗證模式
    if args.verify:
        print("🔍 驗證連結有效性...")
        issues = fixer.verify_links(args.category)

        if not issues:
            print("✅ 所有連結都有效！")
        else:
            print(f"⚠️  發現 {len(issues)} 個失效連結：")
            for file_path, link_path, _ in issues[:20]:
                rel_path = file_path.relative_to(zettelkasten_root)
                print(f"  - {rel_path}: {link_path}")

            if len(issues) > 20:
                print(f"  ... 還有 {len(issues) - 20} 個失效連結")
        return


if __name__ == '__main__':
    main()
