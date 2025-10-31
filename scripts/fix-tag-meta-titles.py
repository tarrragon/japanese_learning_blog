#!/usr/bin/env python3
# /// script
# dependencies = []
# requires-python = ">=3.10"
# ///
"""
修復 Tag Meta 卡片的 title 格式

將 title 從路徑格式（如 keigo/honorific）改為簡短格式（如 honorific），
以匹配實際內容卡片中使用的 tag 名稱。

特殊情況：
- context/daily_life 保持不變（這是實際使用的格式）
- context/business, context/formal 等保持 context/ 前綴
- domain/xxx 保持 domain/ 前綴
- grammar/aspect, grammar/verb-classification 保持 grammar/ 前綴
"""

import re
from pathlib import Path

# 專案根目錄
PROJECT_ROOT = Path(__file__).parent.parent
META_TAGS_DIR = PROJECT_ROOT / "zettelkasten" / "_meta" / "tags"

# 需要保持路徑前綴的 tags（這些是實際使用時包含路徑的）
KEEP_PREFIX_PATTERNS = [
    r"^context/",
    r"^domain/",
    r"^grammar/",
]

# 特殊映射：將某些 title 映射為特定名稱
SPECIAL_MAPPING = {
    "special/giving_receiving": "授受表現",
}


def should_keep_prefix(title: str) -> bool:
    """判斷是否應該保留路徑前綴"""
    for pattern in KEEP_PREFIX_PATTERNS:
        if re.match(pattern, title):
            return True
    return False


def extract_yaml_frontmatter(content: str) -> tuple[dict, str, str]:
    """
    提取 YAML frontmatter 和內容

    返回: (yaml_dict, yaml_section, remaining_content)
    """
    if not content.startswith("---\n"):
        return {}, "", content

    # 找到第二個 ---
    parts = content.split("---\n", 2)
    if len(parts) < 3:
        return {}, "", content

    yaml_section = parts[1]
    remaining = parts[2]

    # 解析 YAML
    yaml_dict = {}
    for line in yaml_section.strip().split("\n"):
        if ": " in line:
            key, value = line.split(": ", 1)
            yaml_dict[key.strip()] = value.strip()

    return yaml_dict, yaml_section, remaining


def fix_tag_meta_title(file_path: Path, dry_run: bool = False) -> bool:
    """
    修復單個 Tag Meta 卡片的 title

    返回: True 如果有修改，False 如果無需修改
    """
    content = file_path.read_text(encoding="utf-8")
    yaml_dict, yaml_section, remaining = extract_yaml_frontmatter(content)

    if "title" not in yaml_dict:
        return False

    original_title = yaml_dict["title"]

    # 檢查特殊映射
    if original_title in SPECIAL_MAPPING:
        new_title = SPECIAL_MAPPING[original_title]
    # 檢查是否需要保留前綴
    elif should_keep_prefix(original_title):
        return False
    # 移除路徑前綴
    elif "/" in original_title:
        new_title = original_title.split("/")[-1]
    else:
        new_title = original_title

    # 如果沒有變化，跳過
    if new_title == original_title:
        return False

    print(f"  {file_path.name}: {original_title} → {new_title}")

    if not dry_run:
        # 替換 title 行
        new_yaml = yaml_section.replace(f"title: {original_title}", f"title: {new_title}")
        new_content = f"---\n{new_yaml}---\n{remaining}"
        file_path.write_text(new_content, encoding="utf-8")

    return True


def main():
    """主函數"""
    import sys

    dry_run = "--dry-run" in sys.argv

    if dry_run:
        print("🔍 預覽模式（不會實際修改檔案）\n")
    else:
        print("🔧 開始修復 Tag Meta 卡片 title\n")

    total_fixed = 0

    # 遍歷所有子目錄
    for tag_type_dir in sorted(META_TAGS_DIR.iterdir()):
        if not tag_type_dir.is_dir():
            continue

        tag_type = tag_type_dir.name
        print(f"📂 {tag_type}/")

        files_fixed = 0
        for tag_file in sorted(tag_type_dir.iterdir()):
            if not tag_file.is_file() or tag_file.suffix != ".md" or tag_file.name == "index.md":
                continue

            if fix_tag_meta_title(tag_file, dry_run):
                files_fixed += 1
                total_fixed += 1

        if files_fixed == 0:
            print("  (無需修改)")
        print()

    print("=" * 80)
    if dry_run:
        print(f"✅ 預覽完成，共 {total_fixed} 個檔案需要修改")
        print("\n執行 `uv run scripts/fix-tag-meta-titles.py` 進行實際修改")
    else:
        print(f"✅ 修復完成，共修改 {total_fixed} 個檔案")
        print("\n請執行 `uv run scripts/verify-meta.py --verbose` 驗證修復結果")


if __name__ == "__main__":
    main()
