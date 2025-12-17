#!/usr/bin/env python3
# /// script
# dependencies = []
# requires-python = ">=3.10"
# ///

"""
檢查和修復卡片編號問題

用途：檢測編號缺口、跳號、以及檔名格式問題，並提供修復方案
執行：uv run scripts/fix-numbering.py [選項]

選項：
  --check             只檢查，不修復
  --check-format      檢查檔名格式問題（不符合 ###_name.md 的檔案）
  --category NAME     只處理特定分類
  --fix              執行修復（重新編號）
  --dry-run          預覽修復結果，不實際執行

功能：
  1. 檢測編號缺口（如 001, 002, 005 缺少 003, 004）
  2. 檢測編號跳號（如 017 直接跳到 022）
  3. 檢測檔名格式問題（不符合 ###_name.md 標準格式）
  4. 提供重新編號方案
  5. 支援延伸卡片的編號修復

標準檔名格式：
  - 基本卡片：###_name.md（如 001_taberu.md）
  - 延伸卡片：###_name_###_extension.md
  - 名稱使用小寫英文或羅馬拼音，用底線分隔

不合格式範例：
  - 013-顧客.md（用 - 而非 _）
  - noun-015-場所.md（格式混亂）
  - aspect.md（無編號）
"""

import re
import sys
from pathlib import Path
from typing import Optional

# 專案根目錄
PROJECT_ROOT = Path(__file__).parent.parent
ZETTELKASTEN_DIR = PROJECT_ROOT / "zettelkasten"


def parse_filename(filename: str) -> Optional[dict]:
    """
    解析檔名，提取編號和名稱

    支援格式：
    - 001_name.md （基本卡片）
    - 001_name_001_extension.md （延伸卡片）

    Returns:
        {
            'number': 基本編號,
            'name': 卡片名稱,
            'is_extension': 是否為延伸卡片,
            'extension_number': 延伸編號（如果是延伸卡片）,
            'full_name': 完整名稱（包含延伸部分）
        }
    """
    # 移除 .md 後綴
    name_without_ext = filename[:-3] if filename.endswith('.md') else filename

    # 嘗試匹配延伸卡片格式：001_name_001_extension
    ext_match = re.match(r'^(\d{3})_(.+?)_(\d{3})_(.+)$', name_without_ext)
    if ext_match:
        return {
            'number': int(ext_match.group(1)),
            'name': ext_match.group(2),
            'is_extension': True,
            'extension_number': int(ext_match.group(3)),
            'extension_name': ext_match.group(4),
            'full_name': name_without_ext,
        }

    # 嘗試匹配基本卡片格式：001_name
    basic_match = re.match(r'^(\d{3})_(.+)$', name_without_ext)
    if basic_match:
        return {
            'number': int(basic_match.group(1)),
            'name': basic_match.group(2),
            'is_extension': False,
            'extension_number': None,
            'full_name': name_without_ext,
        }

    return None


def check_filename_format(category_path: Path) -> dict:
    """
    檢查分類中檔名格式不正確的檔案

    Returns:
        {
            'category': 分類名稱,
            'invalid_files': [
                {
                    'file': 檔案路徑,
                    'filename': 檔名,
                    'issue': 問題描述,
                    'suggestion': 建議修正
                },
                ...
            ],
            'valid_count': 格式正確的檔案數,
            'invalid_count': 格式不正確的檔案數,
        }
    """
    category_name = category_path.name
    files = [f for f in category_path.iterdir()
             if f.is_file() and f.suffix == '.md'
             and f.name not in ('index.md', '_index.md')]

    invalid_files = []
    valid_count = 0

    # 標準格式：###_name.md 或 ###_name_###_extension.md
    basic_pattern = re.compile(r'^(\d{3})_([a-z0-9_]+)\.md$')
    ext_pattern = re.compile(r'^(\d{3})_([a-z0-9_]+)_(\d{3})_([a-z0-9_]+)\.md$')

    for file in files:
        filename = file.name

        # 檢查是否符合標準格式
        if basic_pattern.match(filename) or ext_pattern.match(filename):
            valid_count += 1
            continue

        # 分析問題類型
        issue = ""
        suggestion = ""

        if not re.match(r'^\d{3}', filename):
            # 沒有編號前綴
            if '-' in filename:
                # 有 - 但格式錯誤
                issue = "缺少標準編號前綴，使用了 - 而非 _"
                # 嘗試提取可能的編號
                match = re.search(r'(\d{2,3})', filename)
                if match:
                    num = match.group(1).zfill(3)
                    name_part = re.sub(r'[\d-]+', '', filename).replace('.md', '').strip('-_')
                    name_part = name_part.lower().replace('-', '_')
                    suggestion = f"{num}_{name_part}.md"
            else:
                issue = "缺少編號前綴（###_）"
                name_part = filename.replace('.md', '').lower().replace('-', '_')
                suggestion = f"需要分配編號：###_{name_part}.md"
        elif '-' in filename:
            # 有編號但使用 - 而非 _
            issue = "使用 - 作為分隔符，應使用 _"
            fixed = filename.replace('-', '_')
            suggestion = fixed
        elif re.match(r'^\d{3}', filename) and not re.match(r'^\d{3}_', filename):
            # 編號後沒有底線
            issue = "編號後缺少底線分隔符"
            suggestion = filename[:3] + '_' + filename[3:]
        else:
            # 其他格式問題（可能包含非 ASCII 字符）
            issue = "檔名包含非標準字符（應使用小寫英文和底線）"
            # 提取編號（如果有）
            match = re.match(r'^(\d{3})', filename)
            if match:
                num = match.group(1)
                suggestion = f"建議重新命名：{num}_<romaji>.md"
            else:
                suggestion = "需要重新命名為標準格式"

        invalid_files.append({
            'file': file,
            'filename': filename,
            'issue': issue,
            'suggestion': suggestion,
        })

    return {
        'category': category_name,
        'invalid_files': invalid_files,
        'valid_count': valid_count,
        'invalid_count': len(invalid_files),
    }


def format_filename_report(results: list[dict]):
    """格式化輸出檔名格式檢查報告"""
    print("\n" + "=" * 80)
    print("                    📋 檔名格式檢查報告")
    print("=" * 80 + "\n")

    total_invalid = sum(r['invalid_count'] for r in results)
    total_valid = sum(r['valid_count'] for r in results)

    print(f"格式正確：{total_valid} 個檔案")
    print(f"格式異常：{total_invalid} 個檔案")
    print()

    if total_invalid == 0:
        print("✅ 所有檔案的命名格式都正確！\n")
        return

    print("標準格式：###_name.md（如 001_taberu.md）")
    print("         名稱使用小寫英文或羅馬拼音，用底線分隔\n")

    for result in results:
        if result['invalid_count'] == 0:
            continue

        print(f"❌ 【{result['category']}】{result['invalid_count']} 個異常")

        for item in result['invalid_files']:
            print(f"   - {item['filename']}")
            print(f"     問題：{item['issue']}")
            if item['suggestion']:
                print(f"     建議：{item['suggestion']}")

        print()

    print("💡 修復建議：")
    print("   1. 手動重新命名檔案為標準格式")
    print("   2. 確保使用三位數編號（001, 002, ...）")
    print("   3. 使用底線 _ 作為分隔符")
    print("   4. 檔名使用小寫英文或羅馬拼音")
    print()


def check_category_numbering(category_path: Path) -> dict:
    """
    檢查分類的編號問題

    Returns:
        {
            'category': 分類名稱,
            'total_files': 總檔案數,
            'base_cards': 基本卡片列表,
            'extensions': 延伸卡片列表,
            'gaps': 編號缺口列表,
            'max_number': 最大編號,
            'expected_max': 預期最大編號,
            'has_issues': 是否有問題,
        }
    """
    category_name = category_path.name
    files = sorted([f for f in category_path.iterdir()
                   if f.is_file() and f.suffix == '.md' and f.name != 'index.md'])

    base_cards = []
    extensions = {}  # {base_number: [extension_cards]}

    for file in files:
        parsed = parse_filename(file.name)
        if not parsed:
            continue

        if parsed['is_extension']:
            base_num = parsed['number']
            if base_num not in extensions:
                extensions[base_num] = []
            extensions[base_num].append({
                'file': file,
                'parsed': parsed,
            })
        else:
            base_cards.append({
                'file': file,
                'parsed': parsed,
            })

    # 排序基本卡片
    base_cards.sort(key=lambda x: x['parsed']['number'])

    # 檢查編號缺口
    if not base_cards:
        return {
            'category': category_name,
            'total_files': 0,
            'base_cards': [],
            'extensions': {},
            'gaps': [],
            'max_number': 0,
            'expected_max': 0,
            'has_issues': False,
        }

    numbers = [card['parsed']['number'] for card in base_cards]
    max_number = max(numbers)
    expected_max = len(base_cards)

    # 找出缺口
    gaps = []
    expected_numbers = set(range(1, len(base_cards) + 1))
    actual_numbers = set(numbers)
    missing = sorted(expected_numbers - actual_numbers)

    if missing:
        gaps.append({
            'type': 'missing',
            'numbers': missing,
            'description': f"缺少編號: {', '.join(f'{n:03d}' for n in missing)}"
        })

    # 檢查跳號
    for i in range(len(numbers) - 1):
        current = numbers[i]
        next_num = numbers[i + 1]
        if next_num - current > 1:
            gaps.append({
                'type': 'jump',
                'from': current,
                'to': next_num,
                'description': f"編號跳躍: {current:03d} → {next_num:03d} (跳過 {next_num - current - 1} 個)"
            })

    has_issues = len(gaps) > 0 or max_number != expected_max

    return {
        'category': category_name,
        'total_files': len(files),
        'base_cards': base_cards,
        'extensions': extensions,
        'gaps': gaps,
        'max_number': max_number,
        'expected_max': expected_max,
        'has_issues': has_issues,
    }


def generate_renumbering_plan(result: dict) -> list[dict]:
    """
    生成重新編號計畫

    Returns:
        [
            {
                'old_file': 舊檔案路徑,
                'new_file': 新檔案路徑,
                'old_number': 舊編號,
                'new_number': 新編號,
            },
            ...
        ]
    """
    if not result['has_issues']:
        return []

    plan = []
    base_cards = result['base_cards']
    extensions = result['extensions']

    # 為每張基本卡片分配新編號
    for new_num, card in enumerate(base_cards, start=1):
        old_num = card['parsed']['number']

        if old_num != new_num:
            old_file = card['file']
            parsed = card['parsed']

            # 生成新檔名
            new_filename = f"{new_num:03d}_{parsed['name']}.md"
            new_file = old_file.parent / new_filename

            plan.append({
                'type': 'base',
                'old_file': old_file,
                'new_file': new_file,
                'old_number': old_num,
                'new_number': new_num,
                'name': parsed['name'],
            })

            # 處理此卡片的延伸卡片
            if old_num in extensions:
                for ext_card in extensions[old_num]:
                    ext_parsed = ext_card['parsed']
                    old_ext_file = ext_card['file']

                    # 生成新的延伸卡片檔名
                    new_ext_filename = (f"{new_num:03d}_{parsed['name']}_"
                                       f"{ext_parsed['extension_number']:03d}_"
                                       f"{ext_parsed['extension_name']}.md")
                    new_ext_file = old_ext_file.parent / new_ext_filename

                    plan.append({
                        'type': 'extension',
                        'old_file': old_ext_file,
                        'new_file': new_ext_file,
                        'old_number': old_num,
                        'new_number': new_num,
                        'extension_number': ext_parsed['extension_number'],
                        'name': parsed['name'],
                    })

    return plan


def execute_renumbering(plan: list[dict], dry_run: bool = False) -> bool:
    """
    執行重新編號

    Returns:
        是否成功
    """
    if not plan:
        return True

    # 按編號降序排列，避免覆蓋問題
    plan.sort(key=lambda x: x['old_number'], reverse=True)

    for item in plan:
        old_file = item['old_file']
        new_file = item['new_file']

        if dry_run:
            print(f"  重命名: {old_file.name} → {new_file.name}")
        else:
            try:
                old_file.rename(new_file)
                print(f"  ✅ {old_file.name} → {new_file.name}")
            except Exception as e:
                print(f"  ❌ 錯誤: {old_file.name} - {e}")
                return False

    return True


def format_report(results: list[dict], show_all: bool = False):
    """格式化輸出報告"""
    print("\n" + "=" * 80)
    print("                    📋 編號檢查報告")
    print("=" * 80 + "\n")

    total_categories = len(results)
    categories_with_issues = sum(1 for r in results if r['has_issues'])

    print(f"總分類數: {total_categories}")
    print(f"有問題的分類: {categories_with_issues}")
    print()

    if categories_with_issues == 0:
        print("✅ 所有分類的編號都正確！\n")
        return

    # 顯示有問題的分類
    for result in results:
        if not result['has_issues'] and not show_all:
            continue

        status = "❌" if result['has_issues'] else "✅"
        print(f"{status} 【{result['category']}】")
        print(f"   總卡片數: {result['total_files']}")
        print(f"   基本卡片: {len(result['base_cards'])}")
        print(f"   最大編號: {result['max_number']:03d}")
        print(f"   預期編號: {result['expected_max']:03d}")

        if result['has_issues']:
            print(f"\n   問題:")
            for gap in result['gaps']:
                print(f"   - {gap['description']}")

            # 生成修復計畫
            plan = generate_renumbering_plan(result)
            if plan:
                print(f"\n   需要重新編號: {len(plan)} 個檔案")

        print()


def main():
    """主要邏輯"""
    args = sys.argv[1:]

    check_only = '--check' in args
    check_format = '--check-format' in args
    do_fix = '--fix' in args
    dry_run = '--dry-run' in args
    show_all = '--all' in args

    category = None
    if '--category' in args:
        cat_idx = args.index('--category')
        if cat_idx + 1 < len(args):
            category = args[cat_idx + 1]

    # 收集要檢查的分類
    categories = []
    if category:
        cat_path = ZETTELKASTEN_DIR / category
        if cat_path.exists():
            categories = [cat_path]
        else:
            print(f"❌ 分類「{category}」不存在")
            sys.exit(1)
    else:
        categories = [d for d in ZETTELKASTEN_DIR.iterdir()
                     if d.is_dir() and d.name != '_meta']

    # 如果是檔名格式檢查模式
    if check_format:
        print("\n🔍 開始檢查檔名格式...")

        format_results = []
        for cat_path in sorted(categories):
            result = check_filename_format(cat_path)
            format_results.append(result)

        format_filename_report(format_results)

        # 返回適當的 exit code
        has_issues = any(r['invalid_count'] > 0 for r in format_results)
        sys.exit(1 if has_issues else 0)

    print("\n🔍 開始檢查編號...")

    # 檢查每個分類
    results = []
    for cat_path in sorted(categories):
        result = check_category_numbering(cat_path)
        results.append(result)

    # 顯示報告
    format_report(results, show_all)

    # 如果需要修復
    if do_fix or dry_run:
        categories_to_fix = [r for r in results if r['has_issues']]

        if not categories_to_fix:
            print("沒有需要修復的分類。")
            sys.exit(0)

        print("=" * 80)
        print("                    🔧 開始修復編號")
        print("=" * 80 + "\n")

        if dry_run:
            print("（預覽模式 - 不會實際修改檔案）\n")

        for result in categories_to_fix:
            print(f"處理 【{result['category']}】...")
            plan = generate_renumbering_plan(result)

            if plan:
                success = execute_renumbering(plan, dry_run)
                if success and not dry_run:
                    print(f"  ✅ 完成！已重新編號 {len(plan)} 個檔案\n")
                elif dry_run:
                    print(f"  預覽完成\n")
                else:
                    print(f"  ❌ 修復失敗\n")
                    sys.exit(1)

        if dry_run:
            print("\n💡 使用 --fix 執行實際修復")

    elif check_only:
        # 只檢查模式，返回適當的 exit code
        has_issues = any(r['has_issues'] for r in results)
        sys.exit(1 if has_issues else 0)
    else:
        # 預設模式：顯示建議
        has_issues = any(r['has_issues'] for r in results)
        if has_issues:
            print("💡 使用選項：")
            print("   --dry-run  預覽修復方案")
            print("   --fix      執行修復")
            sys.exit(1)


if __name__ == "__main__":
    main()
