#!/usr/bin/env python3
# /// script
# dependencies = []
# requires-python = ">=3.10"
# ///

"""
列出系統中所有既有的 tags

用途：在建立新卡片或添加 tag 時，快速查看可用的 tags
執行：uv run scripts/list-tags.py [選項]

選項：
  --json              以 JSON 格式輸出
  --count             顯示每個 tag 的使用次數
  --type TYPE         只顯示特定類型的 tags (context/jlpt…；領域請用 list-domains.py)
  [tag_name]          顯示特定 tag 的詳細資訊
"""

import json
import sys
import re
from pathlib import Path
from collections import defaultdict
from typing import Optional

# 專案根目錄
PROJECT_ROOT = Path(__file__).parent.parent
ZETTELKASTEN_DIR = PROJECT_ROOT / "zettelkasten"
META_TAGS_DIR = ZETTELKASTEN_DIR / "_meta" / "tags"

# Tag 類型
TAG_TYPES = {
    "context": "使用情境",
    "domain": "領域",
    "jlpt": "JLPT等級"
}


def parse_yaml_frontmatter(content: str) -> dict:
    """解析 YAML frontmatter"""
    yaml_match = re.search(r'^---\s*\n(.*?)\n---\s*\n', content, re.DOTALL)
    if not yaml_match:
        return {}

    yaml_content = yaml_match.group(1)
    data = {}

    # 簡單解析 YAML（只處理我們需要的欄位）
    current_key = None
    current_list = []

    for line in yaml_content.split("\n"):
        line = line.strip()

        # 處理 key: value 格式
        if ":" in line and not line.startswith("-"):
            parts = line.split(":", 1)
            key = parts[0].strip()
            value = parts[1].strip() if len(parts) > 1 else ""

            # 如果是 tags: 開始
            if key == "tags":
                current_key = "tags"
                # 檢查是否是 inline array [tag1, tag2]
                if value.startswith("[") and value.endswith("]"):
                    # 移除 [ ] 並分割
                    tags_str = value[1:-1]
                    data["tags"] = [t.strip() for t in tags_str.split(",") if t.strip()]
                    current_key = None
                else:
                    current_list = []
            else:
                data[key] = value
                current_key = None

        # 處理 list item
        elif line.startswith("- ") and current_key == "tags":
            tag = line[2:].strip()
            current_list.append(tag)
            data["tags"] = current_list

    return data


def get_all_tags_from_meta() -> dict[str, dict]:
    """
    從 _meta/tags/ 讀取所有定義的 tags

    Returns:
        {tag_name: {type, description, ...}}
    """
    tags = {}

    if not META_TAGS_DIR.exists():
        return tags

    for tag_type_dir in META_TAGS_DIR.iterdir():
        if not tag_type_dir.is_dir() or tag_type_dir.name == "index.md":
            continue

        tag_type = tag_type_dir.name

        for tag_file in tag_type_dir.iterdir():
            if not tag_file.is_file() or tag_file.suffix != ".md" or tag_file.name == "index.md":
                continue

            content = tag_file.read_text(encoding="utf-8")
            yaml_data = parse_yaml_frontmatter(content)

            tag_name = yaml_data.get("title", "").replace("_meta/tags/", "")
            description = yaml_data.get("description", "")

            if tag_name:
                tags[tag_name] = {
                    "type": tag_type,
                    "description": description,
                    "file": str(tag_file.relative_to(PROJECT_ROOT)),
                    "usage_count": 0,  # 稍後計算
                }

    return tags


def count_tag_usage(tags: dict[str, dict]) -> dict[str, dict]:
    """
    計算每個 tag 在卡片中的使用次數

    Args:
        tags: 從 meta 讀取的 tags

    Returns:
        更新 usage_count 的 tags
    """
    tag_counts = defaultdict(int)

    # 遍歷所有分類目錄
    if not ZETTELKASTEN_DIR.exists():
        return tags

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
                    tag_counts[tag] += 1
            except Exception:
                continue

    # 更新 usage_count
    for tag_name in tags:
        tags[tag_name]["usage_count"] = tag_counts.get(tag_name, 0)

    return tags


def format_output(tags: dict[str, dict], show_count: bool = False, filter_type: Optional[str] = None):
    """格式化輸出 tag 列表"""
    print("\n🏷️  既有 Tags 清單\n")
    print("=" * 80)

    # 按類型分組
    tags_by_type = defaultdict(list)
    for tag_name, tag_info in tags.items():
        tags_by_type[tag_info["type"]].append((tag_name, tag_info))

    # 如果指定了 filter_type，只顯示該類型
    if filter_type:
        tags_by_type = {filter_type: tags_by_type.get(filter_type, [])}

    total_tags = 0
    total_usage = 0

    for tag_type in sorted(tags_by_type.keys()):
        type_label = TAG_TYPES.get(tag_type, tag_type)
        type_tags = tags_by_type[tag_type]

        print(f"\n【{type_label}】({len(type_tags)} 個)")
        print("-" * 80)

        # 按名稱排序
        type_tags.sort(key=lambda x: x[0])

        for tag_name, tag_info in type_tags:
            simple_name = tag_name.split("/")[-1]
            print(f"\n  {tag_name}")
            print(f"    說明: {tag_info['description']}")

            if show_count:
                print(f"    使用次數: {tag_info['usage_count']} 次")

        total_tags += len(type_tags)
        total_usage += sum(info["usage_count"] for _, info in type_tags)

    print("\n" + "=" * 80)
    print(f"\n總計: {total_tags} 個 tags", end="")
    if show_count:
        print(f"，總使用次數: {total_usage} 次", end="")
    print("\n")


def get_tag_info(tag_name: str, tags: dict[str, dict]) -> Optional[dict]:
    """取得特定 tag 的詳細資訊"""
    # 支持完整名稱（context/business）或簡短名稱（business）
    if tag_name in tags:
        return tags[tag_name]

    # 嘗試匹配簡短名稱
    for full_name, info in tags.items():
        if full_name.endswith(f"/{tag_name}") or full_name == tag_name:
            return {**info, "full_name": full_name}

    return None


def main():
    """主要邏輯"""
    args = sys.argv[1:]

    # 解析選項
    show_json = "--json" in args
    show_count = "--count" in args

    filter_type = None
    if "--type" in args:
        type_idx = args.index("--type")
        if type_idx + 1 < len(args):
            filter_type = args[type_idx + 1]

    # 移除選項參數，剩下的是 tag 名稱
    tag_arg = None
    for arg in args:
        if not arg.startswith("--") and arg != filter_type:
            tag_arg = arg
            break

    # 取得所有 tags
    if filter_type == "domain":
        print("ℹ️  領域已改用 frontmatter 的 domains / domain_topics 欄位，不再使用 domain/* tag。")
        print("   請執行：uv run scripts/list-domains.py")
        return

    tags = get_all_tags_from_meta()

    # 如果需要顯示使用次數，計算
    if show_count or tag_arg:
        tags = count_tag_usage(tags)

    # 如果指定了特定 tag
    if tag_arg:
        info = get_tag_info(tag_arg, tags)
        if info:
            if show_json:
                print(json.dumps(info, ensure_ascii=False, indent=2))
            else:
                full_name = info.get("full_name", tag_arg)
                print(f"\nTag: {full_name}")
                print(f"類型: {TAG_TYPES.get(info['type'], info['type'])}")
                print(f"說明: {info['description']}")
                print(f"使用次數: {info['usage_count']} 次")
                print(f"定義檔案: {info['file']}\n")
        else:
            print(f"❌ Tag「{tag_arg}」不存在", file=sys.stderr)
            sys.exit(1)
    else:
        # 顯示所有 tags
        if show_json:
            print(json.dumps(tags, ensure_ascii=False, indent=2))
        else:
            format_output(tags, show_count, filter_type)


if __name__ == "__main__":
    main()
