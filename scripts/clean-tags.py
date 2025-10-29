#!/usr/bin/env python3
# /// script
# dependencies = []
# requires-python = ">=3.10"
# ///

"""
清理和標準化卡片中的 tags

用途：移除重複的、非標準的 tags，並將其標準化
執行：uv run scripts/clean-tags.py [選項]

選項：
  --dry-run          只顯示會進行的變更，不實際寫入
  --verbose          顯示詳細資訊
  --category NAME    只處理特定分類
  --report           只生成報告，不進行清理
"""

import re
import sys
from pathlib import Path
from collections import defaultdict

# 專案根目錄
PROJECT_ROOT = Path(__file__).parent.parent
ZETTELKASTEN_DIR = PROJECT_ROOT / "zettelkasten"

# 要移除的重複 tags（與 YAML 欄位重複）
REDUNDANT_TAGS = {
    'verb', 'noun', 'particle', 'auxiliary', 'adjective',
    'ichidan', 'godan', 'ru-verb', 'u-verb', 'suru-verb',
    'i-adjective', 'na-adjective',
}

# 等級標籤轉換（非標準 -> 標準）
JLPT_CONVERSION = {
    'n5': 'jlpt/n5',
    'n4': 'jlpt/n4',
    'n3': 'jlpt/n3',
    'n2': 'jlpt/n2',
    'n1': 'jlpt/n1',
}

# 可以轉換為 domain 的語意標籤
SEMANTIC_TO_DOMAIN = {
    'daily_life': 'domain/daily_life',
    'movement': 'domain/movement',
    'communication': 'domain/communication',
    'cognition': 'domain/cognition',
    'perception': 'domain/perception',
    'emotion': 'domain/emotion',
}


def parse_yaml_frontmatter(content: str) -> tuple[dict, str, str]:
    """
    解析 YAML frontmatter

    Returns:
        (yaml_data, yaml_section, rest_content)
    """
    yaml_match = re.search(r'^---\s*\n(.*?)\n---\s*\n', content, re.DOTALL)
    if not yaml_match:
        return {}, "", content

    yaml_section = yaml_match.group(1)
    rest_content = content[yaml_match.end():]

    # 解析 YAML
    yaml_data = {}
    current_key = None
    current_list = []

    for line in yaml_section.split('\n'):
        stripped = line.strip()

        if ':' in stripped and not stripped.startswith('-'):
            parts = stripped.split(':', 1)
            key = parts[0].strip()
            value = parts[1].strip() if len(parts) > 1 else ""

            if key == 'tags':
                current_key = 'tags'
                # 檢查是否是 inline array
                if value.startswith('[') and value.endswith(']'):
                    tags_str = value[1:-1]
                    yaml_data['tags'] = [t.strip() for t in tags_str.split(',') if t.strip()]
                    current_key = None
                else:
                    current_list = []
            else:
                yaml_data[key] = value
                current_key = None

        elif stripped.startswith('- ') and current_key == 'tags':
            tag = stripped[2:].strip()
            current_list.append(tag)
            yaml_data['tags'] = current_list

    return yaml_data, yaml_section, rest_content


def clean_tags(tags: list[str], yaml_data: dict) -> tuple[list[str], dict]:
    """
    清理 tags 列表

    Returns:
        (cleaned_tags, changes_dict)
    """
    original_tags = tags.copy()
    cleaned = []
    changes = {
        'removed_redundant': [],
        'converted_jlpt': [],
        'converted_domain': [],
        'kept': [],
    }

    for tag in tags:
        # 1. 移除重複的 tags
        if tag in REDUNDANT_TAGS:
            changes['removed_redundant'].append(tag)
            continue

        # 2. 轉換 JLPT 等級
        if tag in JLPT_CONVERSION:
            new_tag = JLPT_CONVERSION[tag]
            if new_tag not in cleaned:  # 避免重複添加
                cleaned.append(new_tag)
                changes['converted_jlpt'].append(f"{tag} -> {new_tag}")
            continue

        # 3. 轉換語意標籤為 domain
        if tag in SEMANTIC_TO_DOMAIN:
            new_tag = SEMANTIC_TO_DOMAIN[tag]
            if new_tag not in cleaned:
                cleaned.append(new_tag)
                changes['converted_domain'].append(f"{tag} -> {new_tag}")
            continue

        # 4. 保留其他 tags（包括已經是標準格式的）
        if tag not in cleaned:  # 避免重複
            cleaned.append(tag)
            changes['kept'].append(tag)

    return cleaned, changes


def format_tags_yaml(tags: list[str]) -> str:
    """格式化 tags 為 YAML 格式"""
    if not tags:
        return "tags: []"

    if len(tags) <= 3:
        # 短列表用 inline 格式
        return f"tags: [{', '.join(tags)}]"
    else:
        # 長列表用多行格式
        lines = ["tags:"]
        for tag in tags:
            lines.append(f"  - {tag}")
        return '\n'.join(lines)


def rebuild_yaml_section(yaml_data: dict, cleaned_tags: list[str], original_yaml: str) -> str:
    """重建 YAML section，只替換 tags 部分"""
    lines = original_yaml.split('\n')
    result_lines = []
    in_tags_section = False
    tags_replaced = False

    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        # 檢查是否是 tags 的開始
        if stripped.startswith('tags:'):
            in_tags_section = True
            tags_value = stripped[5:].strip()

            # 如果是 inline 格式 tags: [...]
            if tags_value.startswith('['):
                result_lines.append(format_tags_yaml(cleaned_tags))
                tags_replaced = True
                in_tags_section = False
            else:
                # 多行格式，添加新的 tags
                result_lines.append(format_tags_yaml(cleaned_tags))
                tags_replaced = True
                # 跳過原來的 tags 列表項
                i += 1
                while i < len(lines) and lines[i].strip().startswith('- '):
                    i += 1
                i -= 1  # 回退一行，因為外層循環會 +1
        elif in_tags_section and stripped.startswith('- '):
            # 跳過舊的 tags 列表項（在上面已經處理）
            pass
        else:
            in_tags_section = False
            result_lines.append(line)

        i += 1

    return '\n'.join(result_lines)


def process_file(file_path: Path, dry_run: bool = False, verbose: bool = False) -> dict:
    """
    處理單個卡片檔案

    Returns:
        處理結果統計
    """
    try:
        content = file_path.read_text(encoding='utf-8')
        yaml_data, yaml_section, rest_content = parse_yaml_frontmatter(content)

        if not yaml_data or 'tags' not in yaml_data:
            return {'status': 'skipped', 'reason': 'no_tags'}

        original_tags = yaml_data['tags']
        if not original_tags:
            return {'status': 'skipped', 'reason': 'empty_tags'}

        # 清理 tags
        cleaned_tags, changes = clean_tags(original_tags, yaml_data)

        # 檢查是否有變更
        if cleaned_tags == original_tags:
            return {'status': 'unchanged'}

        # 重建檔案內容
        new_yaml_section = rebuild_yaml_section(yaml_data, cleaned_tags, yaml_section)
        new_content = f"---\n{new_yaml_section}\n---\n{rest_content}"

        result = {
            'status': 'modified',
            'file': str(file_path.relative_to(ZETTELKASTEN_DIR)),
            'original_tags': original_tags,
            'cleaned_tags': cleaned_tags,
            'changes': changes,
        }

        if not dry_run:
            file_path.write_text(new_content, encoding='utf-8')
            result['written'] = True

        return result

    except Exception as e:
        return {'status': 'error', 'error': str(e), 'file': str(file_path)}


def generate_report(results: list[dict]) -> str:
    """生成清理報告"""
    total = len(results)
    modified = sum(1 for r in results if r['status'] == 'modified')
    unchanged = sum(1 for r in results if r['status'] == 'unchanged')
    skipped = sum(1 for r in results if r['status'] == 'skipped')
    errors = sum(1 for r in results if r['status'] == 'error')

    # 統計變更類型
    total_removed = 0
    total_converted_jlpt = 0
    total_converted_domain = 0

    for r in results:
        if r['status'] == 'modified':
            changes = r['changes']
            total_removed += len(changes['removed_redundant'])
            total_converted_jlpt += len(changes['converted_jlpt'])
            total_converted_domain += len(changes['converted_domain'])

    report = f"""
================================================================================
                          Tags 清理報告
================================================================================

處理統計：
  總檔案數：{total}
  已修改：{modified}
  無變更：{unchanged}
  跳過：{skipped}
  錯誤：{errors}

變更統計：
  移除重複 tags：{total_removed} 個
  轉換 JLPT 格式：{total_converted_jlpt} 個
  轉換為 domain：{total_converted_domain} 個

================================================================================
"""

    return report


def main():
    """主要邏輯"""
    args = sys.argv[1:]

    dry_run = '--dry-run' in args
    verbose = '--verbose' in args
    report_only = '--report' in args

    category = None
    if '--category' in args:
        cat_idx = args.index('--category')
        if cat_idx + 1 < len(args):
            category = args[cat_idx + 1]

    print("\n🧹 開始清理 tags...")
    if dry_run:
        print("   (預覽模式 - 不會實際修改檔案)")
    print()

    # 收集要處理的檔案
    files_to_process = []

    if category:
        category_dir = ZETTELKASTEN_DIR / category
        if category_dir.exists():
            files_to_process = list(category_dir.glob('*.md'))
        else:
            print(f"❌ 分類「{category}」不存在")
            sys.exit(1)
    else:
        # 處理所有分類
        for item in ZETTELKASTEN_DIR.iterdir():
            if item.is_dir() and item.name != '_meta':
                files_to_process.extend(item.glob('*.md'))

    # 排除 index.md
    files_to_process = [f for f in files_to_process if f.name != 'index.md']

    print(f"找到 {len(files_to_process)} 個檔案")
    print()

    # 處理檔案
    results = []
    for i, file_path in enumerate(files_to_process, 1):
        result = process_file(file_path, dry_run, verbose)
        results.append(result)

        if verbose or (result['status'] == 'modified' and not report_only):
            if result['status'] == 'modified':
                print(f"[{i}/{len(files_to_process)}] ✏️  {result['file']}")
                changes = result['changes']
                if changes['removed_redundant']:
                    print(f"      移除: {', '.join(changes['removed_redundant'])}")
                if changes['converted_jlpt']:
                    print(f"      轉換: {', '.join(changes['converted_jlpt'])}")
                if changes['converted_domain']:
                    print(f"      轉換: {', '.join(changes['converted_domain'])}")

    # 生成報告
    report = generate_report(results)
    print(report)

    # 顯示詳細變更（如果是 dry-run 或 verbose）
    if (dry_run or verbose) and not report_only:
        modified_files = [r for r in results if r['status'] == 'modified']
        if modified_files:
            print("\n詳細變更：\n")
            for r in modified_files[:10]:  # 只顯示前 10 個
                print(f"📄 {r['file']}")
                print(f"   原始: {r['original_tags']}")
                print(f"   清理: {r['cleaned_tags']}")
                print()

            if len(modified_files) > 10:
                print(f"   ... 還有 {len(modified_files) - 10} 個檔案有變更")

    if dry_run:
        print("\n💡 使用 uv run scripts/clean-tags.py 執行實際清理")

    sys.exit(0)


if __name__ == "__main__":
    main()
