#!/usr/bin/env python3
# /// script
# dependencies = []
# requires-python = ">=3.10"
# ///

"""
更新 index.md 索引檔案

用途：新增卡片後自動更新分類的 index.md，保持索引同步
執行：uv run scripts/update-index.py <category> [選項]

參數：
  category            分類名稱 (如: verb-ru, noun)
                     或 "_meta/tags/context" 等 meta 路徑

選項：
  --dry-run          只顯示會進行的變更，不實際寫入
  --force            強制重建整個索引
  --card FILENAME    指定要添加的卡片檔名 (如: 026_taberu.md)

功能：
  1. 掃描資料夾中的所有卡片
  2. 更新「最後編號」和「總卡片數」
  3. 更新卡片列表（依編號和主題）
  4. 保留索引檔的其他內容

範例：
  # 掃描並更新 verb-ru 的索引
  uv run scripts/update-index.py verb-ru

  # 預覽變更（不實際寫入）
  uv run scripts/update-index.py verb-ru --dry-run

  # 強制重建索引
  uv run scripts/update-index.py verb-ru --force

  # 添加特定卡片到索引
  uv run scripts/update-index.py verb-ru --card 026_taberu.md
"""

import sys
import re
from pathlib import Path
from typing import Optional
from datetime import datetime

# 專案根目錄
PROJECT_ROOT = Path(__file__).parent.parent
ZETTELKASTEN_DIR = PROJECT_ROOT / "zettelkasten"


def parse_yaml_frontmatter(content: str) -> dict:
    """解析 YAML frontmatter"""
    yaml_match = re.search(r'^---\s*\n(.*?)\n---\s*\n', content, re.DOTALL)
    if not yaml_match:
        return {}

    yaml_content = yaml_match.group(1)
    data = {}

    for line in yaml_content.split("\n"):
        line = line.strip()
        if ":" in line and not line.startswith("-"):
            parts = line.split(":", 1)
            key = parts[0].strip()
            value = parts[1].strip() if len(parts) > 1 else ""

            # 處理 tags 的 inline array
            if key == "tags" and value.startswith("[") and value.endswith("]"):
                tags_str = value[1:-1]
                data["tags"] = [t.strip() for t in tags_str.split(",") if t.strip()]
            else:
                data[key] = value

    return data


def extract_card_info(card_path: Path) -> dict:
    """從卡片檔案中提取資訊"""
    try:
        content = card_path.read_text(encoding="utf-8")
        yaml_data = parse_yaml_frontmatter(content)

        # 從檔名提取編號
        match = re.match(r"^(\d{3})", card_path.name)
        number = int(match.group(1)) if match else 0

        return {
            "filename": card_path.name,
            "number": number,
            "title": yaml_data.get("title", ""),
            "description": yaml_data.get("description", ""),
            "tags": yaml_data.get("tags", []),
            "type": yaml_data.get("type", ""),
        }
    except Exception as e:
        print(f"⚠️  讀取 {card_path.name} 失敗: {e}", file=sys.stderr)
        return None


def scan_cards(category_path: Path) -> list[dict]:
    """掃描資料夾中的所有卡片"""
    cards = []

    for file in category_path.iterdir():
        if not file.is_file() or file.suffix != ".md" or file.name == "index.md":
            continue

        card_info = extract_card_info(file)
        if card_info:
            cards.append(card_info)

    # 按編號排序
    cards.sort(key=lambda x: x["number"])

    return cards


def generate_index_content(category: str, cards: list[dict], original_content: str = "") -> str:
    """
    生成 index.md 內容

    保留原有的說明和結構，只更新：
    - 最後編號
    - 總卡片數
    - 卡片列表
    """
    # 提取分類名稱（去掉路徑）
    category_name = category.split("/")[-1]

    # 統計資訊
    last_number = max((c["number"] for c in cards), default=0)
    total_cards = len(cards)

    # 嘗試從原內容提取標題
    title_line = None
    if original_content:
        for line in original_content.split("\n"):
            if line.startswith("# "):
                title_line = line
                break

    if not title_line:
        title_line = f"# {category_name.replace('-', ' ').title()} 索引"

    # 生成內容
    lines = [
        title_line,
        "",
        f"最後編號：{last_number:03d}",
        f"總卡片數：{total_cards}",
        "",
        "## 卡片列表",
        "",
        "### 依編號",
    ]

    # 卡片列表（依編號）
    for card in cards:
        # 格式：- [001 - 描述](檔名/) #tag1 #tag2
        # 注意：使用 / 結尾而非 .md，確保 Hugo 正確解析連結
        tags_str = " ".join(f"#{tag}" for tag in card["tags"][:3])  # 只顯示前3個tag
        desc = card["description"] or card["title"]
        # 移除 .md 副檔名，改用 / 結尾（Hugo 友好格式）
        link_path = card['filename'].replace('.md', '/')
        lines.append(f"- [{card['number']:03d} - {desc}]({link_path}) {tags_str}")

    # 依主題分組（可選，未來擴展）
    # 這裡先保持簡單，只有依編號的列表

    lines.append("")
    lines.append(f"---")
    lines.append(f"最後更新: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    return "\n".join(lines) + "\n"


def update_index(category: str, dry_run: bool = False, force: bool = False, specific_card: Optional[str] = None) -> bool:
    """
    更新索引檔案

    Returns:
        是否成功更新
    """
    # 處理路徑
    if category.startswith("_meta"):
        category_path = ZETTELKASTEN_DIR / category
    else:
        category_path = ZETTELKASTEN_DIR / category

    if not category_path.exists() or not category_path.is_dir():
        print(f"❌ 分類「{category}」不存在", file=sys.stderr)
        return False

    index_path = category_path / "index.md"

    # 讀取原內容（如果存在）
    original_content = ""
    if index_path.exists() and not force:
        original_content = index_path.read_text(encoding="utf-8")

    # 掃描卡片
    cards = scan_cards(category_path)

    if not cards:
        print(f"⚠️  分類「{category}」中沒有卡片", file=sys.stderr)
        return False

    # 生成新內容
    new_content = generate_index_content(category, cards, original_content)

    # 預覽模式
    if dry_run:
        print(f"\n📋 預覽 {category}/index.md 的變更：\n")
        print("=" * 80)
        print(new_content)
        print("=" * 80)
        print("\n✅ 預覽完成（未實際寫入）\n")
        return True

    # 寫入檔案
    try:
        index_path.write_text(new_content, encoding="utf-8")
        print(f"✅ 已更新 {category}/index.md")
        print(f"   最後編號: {max((c['number'] for c in cards)):03d}")
        print(f"   總卡片數: {len(cards)}")
        return True
    except Exception as e:
        print(f"❌ 寫入索引失敗: {e}", file=sys.stderr)
        return False


def main():
    """主要邏輯"""
    args = sys.argv[1:]

    if not args or args[0].startswith("--"):
        print("❌ 請指定分類名稱", file=sys.stderr)
        print("\n使用方式：uv run scripts/update-index.py <category> [選項]", file=sys.stderr)
        sys.exit(1)

    category = args[0]

    # 解析選項
    dry_run = "--dry-run" in args
    force = "--force" in args

    specific_card = None
    if "--card" in args:
        card_idx = args.index("--card")
        if card_idx + 1 < len(args):
            specific_card = args[card_idx + 1]

    # 執行更新
    success = update_index(category, dry_run, force, specific_card)

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
