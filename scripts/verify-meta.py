#!/usr/bin/env python3
# /// script
# dependencies = []
# requires-python = ">=3.10"
# ///

"""
驗證 _meta 資料夾與實際系統的一致性

用途：檢查 _meta 中的定義是否與實際的分類和 tags 一致
執行：uv run scripts/verify-meta.py [選項]

選項：
  --categories       只檢查分類
  --tags            只檢查 tags
  --verbose         顯示詳細資訊
  --json            以 JSON 格式輸出

檢查項目：
  1. _meta/categories/ 中的卡片數量是否與實際分類數量一致
  2. _meta/tags/ 中的 tag 定義是否與實際使用的 tags 一致
  3. 是否有新增的分類或 tag 未在 _meta 中定義
  4. 是否有 _meta 中定義但實際不存在的分類或 tag

輸出：
  - ✅ 一致：_meta 與實際系統同步
  - ⚠️  警告：有輕微不一致（如使用次數不同）
  - ❌ 錯誤：有嚴重不一致（如缺少定義）
"""

import json
import sys
import re
from pathlib import Path
from collections import defaultdict

# 專案根目錄
PROJECT_ROOT = Path(__file__).parent.parent
ZETTELKASTEN_DIR = PROJECT_ROOT / "zettelkasten"
META_DIR = ZETTELKASTEN_DIR / "_meta"
META_CATEGORIES_DIR = META_DIR / "categories"
META_TAGS_DIR = META_DIR / "tags"

# 不計入的特殊目錄
EXCLUDE_DIRS = {"_meta", ".DS_Store"}


def parse_yaml_frontmatter(content: str) -> dict:
    """解析 YAML frontmatter"""
    yaml_match = re.search(r'^---\s*\n(.*?)\n---\s*\n', content, re.DOTALL)
    if not yaml_match:
        return {}

    yaml_content = yaml_match.group(1)
    data = {}
    current_key = None
    current_list = []

    for line in yaml_content.split("\n"):
        line = line.strip()

        if ":" in line and not line.startswith("-"):
            parts = line.split(":", 1)
            key = parts[0].strip()
            value = parts[1].strip() if len(parts) > 1 else ""

            if key == "tags":
                current_key = "tags"
                if value.startswith("[") and value.endswith("]"):
                    tags_str = value[1:-1]
                    data["tags"] = [t.strip() for t in tags_str.split(",") if t.strip()]
                    current_key = None
                else:
                    current_list = []
            else:
                data[key] = value
                current_key = None

        elif line.startswith("- ") and current_key == "tags":
            tag = line[2:].strip()
            current_list.append(tag)
            data["tags"] = current_list

    return data


def get_actual_categories() -> set[str]:
    """取得實際存在的分類"""
    categories = set()

    if not ZETTELKASTEN_DIR.exists():
        return categories

    for item in ZETTELKASTEN_DIR.iterdir():
        if item.name in EXCLUDE_DIRS or not item.is_dir():
            continue
        categories.add(item.name)

    return categories


def get_meta_categories() -> set[str]:
    """取得 _meta/categories/ 中定義的分類"""
    categories = set()

    if not META_CATEGORIES_DIR.exists():
        return categories

    for file in META_CATEGORIES_DIR.iterdir():
        if not file.is_file() or file.suffix != ".md" or file.name == "index.md":
            continue

        content = file.read_text(encoding="utf-8")
        yaml_data = parse_yaml_frontmatter(content)

        # 從 title 提取分類名稱 (如: _meta/categories/verb-ru -> verb-ru)
        title = yaml_data.get("title", "")
        if title.startswith("_meta/categories/"):
            category_name = title.replace("_meta/categories/", "")
            categories.add(category_name)

    return categories


def get_actual_tags() -> dict[str, int]:
    """取得實際使用的 tags 及其使用次數"""
    tags = defaultdict(int)

    if not ZETTELKASTEN_DIR.exists():
        return dict(tags)

    for category_dir in ZETTELKASTEN_DIR.iterdir():
        if not category_dir.is_dir() or category_dir.name == "_meta":
            continue

        for card_file in category_dir.iterdir():
            if not card_file.is_file() or card_file.suffix != ".md" or card_file.name == "index.md":
                continue

            try:
                content = card_file.read_text(encoding="utf-8")
                yaml_data = parse_yaml_frontmatter(content)
                card_tags = yaml_data.get("tags", [])

                for tag in card_tags:
                    tags[tag] += 1
            except Exception:
                continue

    return dict(tags)


def get_meta_tags() -> set[str]:
    """取得 _meta/tags/ 中定義的 tags"""
    tags = set()

    if not META_TAGS_DIR.exists():
        return tags

    for tag_type_dir in META_TAGS_DIR.iterdir():
        if not tag_type_dir.is_dir():
            continue

        for tag_file in tag_type_dir.iterdir():
            if not tag_file.is_file() or tag_file.suffix != ".md" or tag_file.name == "index.md":
                continue

            content = tag_file.read_text(encoding="utf-8")
            yaml_data = parse_yaml_frontmatter(content)

            # 從 title 提取 tag 名稱
            title = yaml_data.get("title", "")
            if title:
                # 如果 title 包含 _meta/tags/ 前綴，移除它
                if title.startswith("_meta/tags/"):
                    tag_name = title.replace("_meta/tags/", "")
                else:
                    # 直接使用 title（如 context/business）
                    tag_name = title
                tags.add(tag_name)

    return tags


def verify_categories(verbose: bool = False) -> dict:
    """驗證分類的一致性"""
    actual = get_actual_categories()
    meta = get_meta_categories()

    missing_in_meta = actual - meta
    extra_in_meta = meta - actual

    result = {
        "status": "ok",
        "actual_count": len(actual),
        "meta_count": len(meta),
        "missing_in_meta": sorted(missing_in_meta),
        "extra_in_meta": sorted(extra_in_meta),
    }

    if missing_in_meta:
        result["status"] = "error"
    elif extra_in_meta:
        result["status"] = "warning"

    if verbose:
        result["actual_categories"] = sorted(actual)
        result["meta_categories"] = sorted(meta)

    return result


def verify_tags(verbose: bool = False) -> dict:
    """驗證 tags 的一致性"""
    actual = get_actual_tags()
    meta = get_meta_tags()

    actual_set = set(actual.keys())
    missing_in_meta = actual_set - meta
    extra_in_meta = meta - actual_set

    result = {
        "status": "ok",
        "actual_count": len(actual_set),
        "meta_count": len(meta),
        "missing_in_meta": sorted(missing_in_meta),
        "extra_in_meta": sorted(extra_in_meta),
    }

    if missing_in_meta:
        result["status"] = "error"
    elif extra_in_meta:
        result["status"] = "warning"

    if verbose:
        result["actual_tags"] = {tag: actual[tag] for tag in sorted(actual.keys())}
        result["meta_tags"] = sorted(meta)

    return result


def format_output(categories_result: dict, tags_result: dict, verbose: bool = False):
    """格式化輸出驗證結果"""
    print("\n🔍 _meta 一致性驗證報告\n")
    print("=" * 80)

    # 分類驗證結果
    print("\n【分類 (Categories)】")
    print(f"  實際分類數量: {categories_result['actual_count']}")
    print(f"  Meta 定義數量: {categories_result['meta_count']}")

    if categories_result["status"] == "ok":
        print("  ✅ 狀態: 一致")
    elif categories_result["status"] == "warning":
        print("  ⚠️  狀態: 警告")
    else:
        print("  ❌ 狀態: 錯誤")

    if categories_result["missing_in_meta"]:
        print("\n  ❌ 缺少 _meta 定義的分類:")
        for cat in categories_result["missing_in_meta"]:
            print(f"     - {cat}")
        print(f"\n  💡 建議: 在 _meta/categories/ 中為這些分類建立定義卡片")

    if categories_result["extra_in_meta"]:
        print("\n  ⚠️  _meta 中定義但實際不存在的分類:")
        for cat in categories_result["extra_in_meta"]:
            print(f"     - {cat}")
        print(f"\n  💡 建議: 移除這些過時的定義卡片或建立對應的分類")

    # Tags 驗證結果
    print("\n" + "-" * 80)
    print("\n【Tags】")
    print(f"  實際使用 tags: {tags_result['actual_count']}")
    print(f"  Meta 定義 tags: {tags_result['meta_count']}")

    if tags_result["status"] == "ok":
        print("  ✅ 狀態: 一致")
    elif tags_result["status"] == "warning":
        print("  ⚠️  狀態: 警告")
    else:
        print("  ❌ 狀態: 錯誤")

    if tags_result["missing_in_meta"]:
        print("\n  ❌ 缺少 _meta 定義的 tags:")
        for tag in tags_result["missing_in_meta"]:
            print(f"     - {tag}")
        print(f"\n  💡 建議: 在 _meta/tags/ 的對應子目錄中建立定義卡片")

    if tags_result["extra_in_meta"]:
        print("\n  ⚠️  _meta 中定義但未使用的 tags:")
        for tag in tags_result["extra_in_meta"]:
            print(f"     - {tag}")
        print(f"\n  💡 建議: 這些 tag 可能是預先定義但尚未使用")

    # 總體狀態
    print("\n" + "=" * 80)

    overall_status = "ok"
    if categories_result["status"] == "error" or tags_result["status"] == "error":
        overall_status = "error"
    elif categories_result["status"] == "warning" or tags_result["status"] == "warning":
        overall_status = "warning"

    if overall_status == "ok":
        print("\n✅ 總體狀態: _meta 與實際系統完全一致\n")
    elif overall_status == "warning":
        print("\n⚠️  總體狀態: _meta 與實際系統有輕微不一致\n")
    else:
        print("\n❌ 總體狀態: _meta 與實際系統有嚴重不一致，請立即修正\n")


def main():
    """主要邏輯"""
    args = sys.argv[1:]

    # 解析選項
    check_categories = "--categories" in args or (not "--tags" in args)
    check_tags = "--tags" in args or (not "--categories" in args)
    verbose = "--verbose" in args
    show_json = "--json" in args

    results = {}

    # 執行驗證
    if check_categories:
        results["categories"] = verify_categories(verbose)

    if check_tags:
        results["tags"] = verify_tags(verbose)

    # 輸出結果
    if show_json:
        print(json.dumps(results, ensure_ascii=False, indent=2))
    else:
        if check_categories and check_tags:
            format_output(results["categories"], results["tags"], verbose)
        elif check_categories:
            dummy_tags = {"status": "ok", "actual_count": 0, "meta_count": 0, "missing_in_meta": [], "extra_in_meta": []}
            format_output(results["categories"], dummy_tags, verbose)
        elif check_tags:
            dummy_categories = {"status": "ok", "actual_count": 0, "meta_count": 0, "missing_in_meta": [], "extra_in_meta": []}
            format_output(dummy_categories, results["tags"], verbose)

    # 返回適當的 exit code
    has_errors = any(
        r.get("status") == "error"
        for r in results.values()
        if isinstance(r, dict)
    )

    sys.exit(1 if has_errors else 0)


if __name__ == "__main__":
    main()
