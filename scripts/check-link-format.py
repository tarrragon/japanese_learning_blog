#!/usr/bin/env python3
# /// script
# dependencies = []
# requires-python = ">=3.10"
# ///

"""
check-link-format.py - 檢查卡片中的連結格式是否符合規範

這個腳本會掃描所有卡片，檢查：
1. 是否有使用 Wikilink 格式 [[...]]（禁止）
2. 是否有無效的連結
3. 是否有格式不正確的連結

使用方式：
    # 檢查所有卡片
    uv run scripts/check-link-format.py

    # 只檢查特定分類
    uv run scripts/check-link-format.py --category grammar

    # JSON 格式輸出
    uv run scripts/check-link-format.py --json

    # 嚴格模式（視任何問題為錯誤，返回非零退出碼）
    uv run scripts/check-link-format.py --strict
"""

import re
import sys
import json
from pathlib import Path
from typing import List, Dict, Tuple
from dataclasses import dataclass, asdict


@dataclass
class LinkIssue:
    """連結問題"""
    file: str
    line_num: int
    issue_type: str  # 'wikilink', 'broken_link', 'invalid_format'
    content: str
    severity: str    # 'error', 'warning'
    message: str


class LinkFormatChecker:
    def __init__(self, zettelkasten_root: Path):
        self.root = zettelkasten_root
        self.wikilink_pattern = re.compile(r'\[\[([^\]]+)\]\]')
        self.markdown_link_pattern = re.compile(r'\[([^\]]+)\]\(([^\)]+)\)')

    def check_file(self, file_path: Path) -> List[LinkIssue]:
        """檢查單一檔案"""
        issues = []

        try:
            content = file_path.read_text(encoding='utf-8')
            lines = content.split('\n')

            for line_num, line in enumerate(lines, start=1):
                # 檢查 Wikilink（禁止使用）
                for match in self.wikilink_pattern.finditer(line):
                    issues.append(LinkIssue(
                        file=str(file_path.relative_to(self.root)),
                        line_num=line_num,
                        issue_type='wikilink',
                        content=match.group(0),
                        severity='error',
                        message=f'禁止使用 Wikilink 格式：{match.group(0)}'
                    ))

                # 檢查標準 Markdown 連結
                for match in self.markdown_link_pattern.finditer(line):
                    link_text = match.group(1)
                    link_path = match.group(2)

                    # 跳過外部連結
                    if link_path.startswith('http://') or link_path.startswith('https://'):
                        continue

                    # 檢查連結是否有 .md 副檔名
                    if not link_path.endswith('.md'):
                        issues.append(LinkIssue(
                            file=str(file_path.relative_to(self.root)),
                            line_num=line_num,
                            issue_type='invalid_format',
                            content=match.group(0),
                            severity='warning',
                            message=f'連結缺少 .md 副檔名：{link_path}'
                        ))

                    # 檢查連結檔案是否存在
                    if link_path.startswith('../'):
                        target_path = (file_path.parent / link_path).resolve()
                    else:
                        target_path = (file_path.parent / link_path).resolve()

                    if not target_path.exists():
                        issues.append(LinkIssue(
                            file=str(file_path.relative_to(self.root)),
                            line_num=line_num,
                            issue_type='broken_link',
                            content=match.group(0),
                            severity='warning',
                            message=f'連結指向不存在的檔案：{link_path}'
                        ))

        except Exception as e:
            issues.append(LinkIssue(
                file=str(file_path.relative_to(self.root)),
                line_num=0,
                issue_type='error',
                content='',
                severity='error',
                message=f'讀取檔案失敗：{e}'
            ))

        return issues

    def check_all_files(self, category: str = None) -> Dict[str, List[LinkIssue]]:
        """檢查所有檔案"""
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

            issues = self.check_file(file_path)
            if issues:
                results[str(file_path.relative_to(self.root))] = issues

        return results


def print_results(results: Dict[str, List[LinkIssue]]):
    """列印檢查結果（人類可讀格式）"""
    total_errors = sum(
        len([i for i in issues if i.severity == 'error'])
        for issues in results.values()
    )
    total_warnings = sum(
        len([i for i in issues if i.severity == 'warning'])
        for issues in results.values()
    )

    print(f"📊 連結格式檢查結果")
    print(f"  - 檢查了 {len(results)} 個檔案")
    print(f"  - 發現 {total_errors} 個錯誤")
    print(f"  - 發現 {total_warnings} 個警告")
    print()

    if not results:
        print("✅ 所有檔案的連結格式都正確！")
        return

    # 按嚴重性分組
    errors_by_type = {}
    warnings_by_type = {}

    for file_path, issues in results.items():
        for issue in issues:
            if issue.severity == 'error':
                errors_by_type.setdefault(issue.issue_type, []).append(issue)
            else:
                warnings_by_type.setdefault(issue.issue_type, []).append(issue)

    # 顯示錯誤
    if errors_by_type:
        print("❌ 錯誤（必須修正）：")
        print()

        for issue_type, issues in errors_by_type.items():
            print(f"  🚨 {issue_type.upper()} ({len(issues)} 個)")
            for issue in issues[:10]:  # 只顯示前 10 個
                print(f"    - {issue.file}:{issue.line_num}")
                print(f"      {issue.message}")
                print(f"      內容：{issue.content}")
            if len(issues) > 10:
                print(f"    ... 還有 {len(issues) - 10} 個 {issue_type}")
            print()

    # 顯示警告
    if warnings_by_type:
        print("⚠️  警告（建議修正）：")
        print()

        for issue_type, issues in warnings_by_type.items():
            print(f"  ⚡ {issue_type.upper()} ({len(issues)} 個)")
            for issue in issues[:5]:  # 只顯示前 5 個
                print(f"    - {issue.file}:{issue.line_num}")
                print(f"      {issue.message}")
            if len(issues) > 5:
                print(f"    ... 還有 {len(issues) - 5} 個 {issue_type}")
            print()


def main():
    import argparse

    parser = argparse.ArgumentParser(
        description='檢查卡片中的連結格式是否符合規範',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
範例：
  # 檢查所有卡片
  uv run scripts/check-link-format.py

  # 只檢查特定分類
  uv run scripts/check-link-format.py --category grammar

  # JSON 格式輸出
  uv run scripts/check-link-format.py --json

  # 嚴格模式（視任何問題為錯誤）
  uv run scripts/check-link-format.py --strict
        """
    )

    parser.add_argument('--category', type=str, help='只檢查特定分類')
    parser.add_argument('--json', action='store_true', help='JSON 格式輸出')
    parser.add_argument('--strict', action='store_true', help='嚴格模式（視任何問題為錯誤）')

    args = parser.parse_args()

    # 找到 zettelkasten 根目錄
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    zettelkasten_root = project_root / 'zettelkasten'

    if not zettelkasten_root.exists():
        print(f"❌ 找不到 zettelkasten 目錄: {zettelkasten_root}", file=sys.stderr)
        sys.exit(1)

    checker = LinkFormatChecker(zettelkasten_root)
    results = checker.check_all_files(args.category)

    # JSON 輸出
    if args.json:
        json_results = {
            file_path: [asdict(issue) for issue in issues]
            for file_path, issues in results.items()
        }
        print(json.dumps(json_results, ensure_ascii=False, indent=2))
        return

    # 人類可讀輸出
    print_results(results)

    # 嚴格模式：任何問題都返回非零退出碼
    if args.strict and results:
        sys.exit(1)

    # 一般模式：只有錯誤才返回非零退出碼
    has_errors = any(
        issue.severity == 'error'
        for issues in results.values()
        for issue in issues
    )
    if has_errors:
        sys.exit(1)


if __name__ == '__main__':
    main()
