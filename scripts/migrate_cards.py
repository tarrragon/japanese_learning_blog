#!/usr/bin/env python3
# /// script
# dependencies = ["ruamel.yaml"]
# requires-python = ">=3.10"
# ///

"""
遷移卡片 YAML 結構到 v1.5.0 格式

用途：為卡片 YAML frontmatter 新增 v1.5.0 所需的新欄位
執行：uv run scripts/migrate_cards.py [選項]

選項：
  --dry-run           預覽遷移（不實際修改）
  --execute           執行遷移
  --category CAT      只遷移特定分類
  --limit N           限制遷移數量
  --verbose           顯示詳細資訊
  --format text|json  輸出格式（預設 text）

新增的欄位：
  - version_history: 版本歷史追蹤
  - content_verification: 內容驗證狀態
  - link_status: 連結統計
"""

import json
import re
import sys
from pathlib import Path
from datetime import date
from collections import defaultdict
from dataclasses import dataclass, field

# 專案根目錄
PROJECT_ROOT = Path(__file__).parent.parent
ZETTELKASTEN_DIR = PROJECT_ROOT / "zettelkasten"

# 不處理的目錄
EXCLUDE_DIRS = {"_meta", ".DS_Store"}

# 必要的內容區塊
REQUIRED_SECTIONS = {
    "japanese": ["## 日文解釋", "## 日文説明"],
    "english": ["## 英文解釋", "## English"],
    "chinese": ["## 中文解釋", "## 中文"],
}


@dataclass
class MigrationResult:
    """遷移結果"""
    path: str
    category: str
    card_name: str
    status: str = "pending"  # "migrated", "skipped", "error", "dry-run"
    changes: list = field(default_factory=list)
    error_message: str = ""


def parse_yaml_frontmatter(content: str) -> tuple[dict, str, str]:
    """解析 YAML frontmatter，返回 (yaml_dict, yaml_str, body)"""
    yaml_match = re.search(r'^(---\s*\n)(.*?)(\n---\s*\n)', content, re.DOTALL)
    if not yaml_match:
        return {}, "", content

    yaml_str = yaml_match.group(2)
    body = content[yaml_match.end():]
    prefix = yaml_match.group(1)
    suffix = yaml_match.group(3)

    # 簡單解析 YAML
    data = {}
    current_key = None
    current_list = []
    in_list = False

    for line in yaml_str.split("\n"):
        stripped = line.strip()

        if ":" in line and not stripped.startswith("-"):
            # 如果之前在列表模式，先保存
            if in_list and current_key:
                data[current_key] = current_list
                current_list = []
                in_list = False

            parts = line.split(":", 1)
            key = parts[0].strip()
            value = parts[1].strip() if len(parts) > 1 else ""

            if value.startswith("[") and value.endswith("]"):
                # 行內列表
                items = value[1:-1].split(",")
                data[key] = [i.strip() for i in items if i.strip()]
            elif value:
                data[key] = value
            else:
                current_key = key
                in_list = True
                current_list = []

        elif stripped.startswith("- ") and in_list:
            current_list.append(stripped[2:].strip())

    if in_list and current_key:
        data[current_key] = current_list

    return data, yaml_str, body


def count_examples(content: str) -> int:
    """計算例句數量"""
    pattern = re.findall(r'\*\*例句\d+\*\*', content)
    if pattern:
        return len(pattern)

    example_section = re.search(r'## 例句(.*?)(?=\n---|\n## |$)', content, re.DOTALL)
    if example_section:
        blocks = re.findall(r'```', example_section.group(1))
        return len(blocks) // 2

    return 0


def count_pending_links(content: str) -> list[str]:
    """找出待建立連結"""
    pending = []
    patterns = [
        (r'\[([^\]]+)\]\((待建立|【待建立】)\)', 1),  # group 1 是文字
        (r'\[待建立[：:\s]*([^\]]*)\]\([^)]*\)', 1),
    ]

    for pattern, group in patterns:
        matches = re.findall(pattern, content)
        for match in matches:
            text = match if isinstance(match, str) else match[0] if match else ""
            if text and text not in pending:
                pending.append(text)

    return pending


def count_links(content: str) -> tuple[int, int]:
    """計算連結數量 (outgoing, internal references approximation)"""
    # 計算 markdown 連結
    outgoing = len(re.findall(r'\[([^\]]+)\]\(([^)]+\.md)\)', content))

    # incoming 需要從其他文件計算，這裡先設為 0
    return outgoing, 0


def check_sections(content: str) -> dict:
    """檢查三語解釋是否存在"""
    result = {}
    for lang, headers in REQUIRED_SECTIONS.items():
        result[lang] = any(header in content for header in headers)
    return result


def needs_migration(yaml_data: dict) -> bool:
    """檢查是否需要遷移"""
    # 如果已經有 v1.5.0 的新欄位，則不需要遷移
    if "content_verification" in yaml_data:
        return False
    if "version_history" in yaml_data:
        return False
    if "link_status" in yaml_data:
        return False
    return True


def generate_new_yaml(yaml_data: dict, content: str, file_path: Path) -> str:
    """生成新的 YAML frontmatter"""
    today = date.today().isoformat()

    # 保留原有欄位
    lines = []

    # 基本資訊
    for key in ["title", "description", "type", "jlpt"]:
        if key in yaml_data:
            lines.append(f"{key}: {yaml_data[key]}")

    # stage
    stage = yaml_data.get("stage", "pending")
    lines.append(f"stage: {stage}")

    # tags
    if "tags" in yaml_data:
        tags = yaml_data["tags"]
        if isinstance(tags, list):
            lines.append("tags:")
            for tag in tags:
                lines.append(f"  - {tag}")

    # 日期
    created = yaml_data.get("date", yaml_data.get("created", today))
    updated = yaml_data.get("updated", today)
    lines.append(f"created: {created}")
    lines.append(f"updated: {updated}")

    # 新增：version_history
    lines.append("")
    lines.append("# 版本歷史")
    lines.append("version_history:")
    lines.append(f'  - version: "1.5.0"')
    lines.append(f'    stage: "{stage}"')
    lines.append(f"    date: {today}")

    # 新增：content_verification
    sections = check_sections(content)
    examples = count_examples(content)
    pending = count_pending_links(content)

    lines.append("")
    lines.append("# 內容驗證")
    lines.append("content_verification:")
    lines.append(f"  japanese: {str(sections['japanese']).lower()}")
    lines.append(f"  english: {str(sections['english']).lower()}")
    lines.append(f"  chinese: {str(sections['chinese']).lower()}")
    lines.append(f"  examples_count: {examples}")
    if pending:
        lines.append("  pending_links:")
        for p in pending[:5]:  # 最多列 5 個
            lines.append(f'    - "{p}"')
    else:
        lines.append("  pending_links: []")

    # 新增：link_status
    outgoing, incoming = count_links(content)

    lines.append("")
    lines.append("# 連結狀態")
    lines.append("link_status:")
    lines.append(f"  incoming: {incoming}")
    lines.append(f"  outgoing: {outgoing}")
    lines.append(f"  pending: {len(pending)}")
    lines.append(f"  verified_date: {today}")

    # 保留 links（如果有）
    if "links" in yaml_data:
        lines.append("")
        lines.append("# 連結")
        lines.append("links:")
        if isinstance(yaml_data["links"], dict):
            for k, v in yaml_data["links"].items():
                lines.append(f"  {k}: {v}")

    return "\n".join(lines)


def migrate_card(file_path: Path, execute: bool = False) -> MigrationResult:
    """遷移單個卡片"""
    result = MigrationResult(
        path=str(file_path.relative_to(PROJECT_ROOT)),
        category=file_path.parent.name,
        card_name=file_path.stem
    )

    try:
        content = file_path.read_text(encoding="utf-8")
        yaml_data, yaml_str, body = parse_yaml_frontmatter(content)

        if not yaml_data:
            result.status = "skipped"
            result.changes.append("無 YAML frontmatter")
            return result

        if not needs_migration(yaml_data):
            result.status = "skipped"
            result.changes.append("已是 v1.5.0 格式")
            return result

        # 生成新 YAML
        new_yaml = generate_new_yaml(yaml_data, content, file_path)

        # 記錄變更
        result.changes.append("新增 version_history")
        result.changes.append("新增 content_verification")
        result.changes.append("新增 link_status")

        if execute:
            # 組合新內容
            new_content = f"---\n{new_yaml}\n---\n{body}"
            file_path.write_text(new_content, encoding="utf-8")
            result.status = "migrated"
        else:
            result.status = "dry-run"

    except Exception as e:
        result.status = "error"
        result.error_message = str(e)

    return result


def scan_and_migrate(category_filter: str = None, limit: int = None, execute: bool = False) -> list[MigrationResult]:
    """掃描並遷移卡片"""
    results = []
    count = 0

    if not ZETTELKASTEN_DIR.exists():
        return results

    for category_dir in sorted(ZETTELKASTEN_DIR.iterdir()):
        if not category_dir.is_dir() or category_dir.name in EXCLUDE_DIRS:
            continue

        if category_filter and category_dir.name != category_filter:
            continue

        for card_file in sorted(category_dir.iterdir()):
            if limit and count >= limit:
                break

            if not card_file.is_file() or card_file.suffix != ".md":
                continue
            if card_file.name in ["index.md", "_index.md"]:
                continue

            result = migrate_card(card_file, execute)
            results.append(result)

            if result.status in ["migrated", "dry-run"]:
                count += 1

        if limit and count >= limit:
            break

    return results


def generate_summary(results: list[MigrationResult]) -> dict:
    """生成摘要"""
    by_status = defaultdict(int)
    by_category = defaultdict(lambda: {"total": 0, "migrated": 0, "skipped": 0, "error": 0})

    for r in results:
        by_status[r.status] += 1
        by_category[r.category]["total"] += 1
        if r.status in ["migrated", "dry-run"]:
            by_category[r.category]["migrated"] += 1
        elif r.status == "skipped":
            by_category[r.category]["skipped"] += 1
        elif r.status == "error":
            by_category[r.category]["error"] += 1

    return {
        "total": len(results),
        "by_status": dict(by_status),
        "by_category": dict(by_category)
    }


def format_text_output(results: list[MigrationResult], verbose: bool = False):
    """格式化文字輸出"""
    summary = generate_summary(results)

    print("\n" + "=" * 80)
    print("YAML 遷移報告")
    print("=" * 80)

    print(f"\n📊 摘要統計")
    print(f"  總卡片數: {summary['total']}")
    for status, count in summary["by_status"].items():
        icon = "✅" if status == "migrated" else "🔍" if status == "dry-run" else "⏭️" if status == "skipped" else "❌"
        print(f"  {icon} {status}: {count}")

    print(f"\n📁 按分類統計:")
    print(f"{'分類':<20} {'總數':>6} {'遷移':>6} {'跳過':>6} {'錯誤':>6}")
    print("-" * 50)
    for cat, stats in sorted(summary["by_category"].items()):
        print(f"{cat:<20} {stats['total']:>6} {stats['migrated']:>6} {stats['skipped']:>6} {stats['error']:>6}")

    if verbose:
        print(f"\n📝 詳細清單:")
        print("-" * 80)
        for r in results:
            icon = "✅" if r.status == "migrated" else "🔍" if r.status == "dry-run" else "⏭️" if r.status == "skipped" else "❌"
            changes = ", ".join(r.changes) if r.changes else r.error_message or "(無)"
            print(f"{icon} {r.path}")
            print(f"   變更: {changes}")

    print("\n" + "=" * 80)


def format_json_output(results: list[MigrationResult]):
    """格式化 JSON 輸出"""
    summary = generate_summary(results)
    output = {
        "summary": summary,
        "results": [
            {
                "path": r.path,
                "category": r.category,
                "status": r.status,
                "changes": r.changes,
                "error": r.error_message
            }
            for r in results
        ]
    }
    print(json.dumps(output, ensure_ascii=False, indent=2))


def main():
    """主要邏輯"""
    args = sys.argv[1:]

    # 解析選項
    execute = "--execute" in args
    dry_run = "--dry-run" in args or not execute
    verbose = "--verbose" in args
    output_format = "json" if "--format" in args and "json" in args else "text"

    category_filter = None
    if "--category" in args:
        idx = args.index("--category")
        if idx + 1 < len(args):
            category_filter = args[idx + 1]

    limit = None
    if "--limit" in args:
        idx = args.index("--limit")
        if idx + 1 < len(args):
            try:
                limit = int(args[idx + 1])
            except ValueError:
                pass

    # 執行遷移
    if not execute:
        print("\n⚠️  Dry-run 模式：不會實際修改檔案")
        print("   使用 --execute 來執行實際遷移\n")

    results = scan_and_migrate(category_filter, limit, execute)

    # 輸出
    if output_format == "json":
        format_json_output(results)
    else:
        format_text_output(results, verbose)

    # 返回狀態
    errors = sum(1 for r in results if r.status == "error")
    sys.exit(1 if errors > 0 else 0)


if __name__ == "__main__":
    main()
