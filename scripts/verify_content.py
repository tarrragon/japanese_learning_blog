#!/usr/bin/env python3
# /// script
# dependencies = []
# requires-python = ">=3.10"
# ///

"""
驗證卡片內容完整性

用途：檢查卡片是否包含必要的內容區塊
執行：uv run scripts/verify_content.py [選項]

選項：
  --scan              掃描所有卡片（預設）
  --category CAT      只掃描特定分類
  --incomplete-only   只顯示不完整的卡片
  --format text|json  輸出格式（預設 text）
  --verbose           顯示詳細資訊

驗證項目：
  1. 三語解釋（日文解釋、英文解釋、中文解釋）
  2. 例句數量（至少 1 個）
  3. YAML frontmatter 完整性
"""

import json
import re
import sys
from pathlib import Path
from collections import defaultdict
from dataclasses import dataclass, field

# 專案根目錄
PROJECT_ROOT = Path(__file__).parent.parent
ZETTELKASTEN_DIR = PROJECT_ROOT / "zettelkasten"

# 不掃描的目錄
EXCLUDE_DIRS = {"_meta", ".DS_Store"}

# 必要的內容區塊
REQUIRED_SECTIONS = {
    "japanese": ["## 日文解釋", "## 日文説明"],
    "english": ["## 英文解釋", "## English"],
    "chinese": ["## 中文解釋", "## 中文"],
}

# 必要的 YAML 欄位
REQUIRED_YAML_FIELDS = ["title", "type", "jlpt", "stage"]


@dataclass
class ContentVerification:
    """內容驗證結果"""
    path: str
    category: str
    card_name: str

    # YAML 完整性
    yaml_fields_present: dict = field(default_factory=dict)
    yaml_complete: bool = False

    # 三語解釋
    has_japanese: bool = False
    has_english: bool = False
    has_chinese: bool = False
    explanations_complete: bool = False

    # 例句
    examples_count: int = 0
    has_examples: bool = False

    # 待建立連結
    pending_links_count: int = 0

    @property
    def is_complete(self) -> bool:
        return (
            self.yaml_complete and
            self.explanations_complete and
            self.has_examples
        )

    @property
    def completeness_score(self) -> int:
        """完整度分數 (0-100)"""
        score = 0
        # YAML (30%)
        if self.yaml_complete:
            score += 30
        else:
            present = sum(1 for v in self.yaml_fields_present.values() if v)
            score += int(30 * present / len(REQUIRED_YAML_FIELDS))

        # 三語解釋 (40%)
        lang_count = sum([self.has_japanese, self.has_english, self.has_chinese])
        score += int(40 * lang_count / 3)

        # 例句 (30%)
        if self.examples_count >= 3:
            score += 30
        elif self.examples_count >= 1:
            score += 20
        elif self.examples_count > 0:
            score += 10

        return score


def parse_yaml_frontmatter(content: str) -> dict:
    """解析 YAML frontmatter"""
    yaml_match = re.search(r'^---\s*\n(.*?)\n---\s*\n', content, re.DOTALL)
    if not yaml_match:
        return {}

    yaml_content = yaml_match.group(1)
    data = {}

    for line in yaml_content.split("\n"):
        if ":" in line and not line.startswith("-") and not line.startswith(" "):
            parts = line.split(":", 1)
            key = parts[0].strip()
            value = parts[1].strip() if len(parts) > 1 else ""
            data[key] = value

    return data


def count_examples(content: str) -> int:
    """計算例句數量"""
    # 找 **例句1**, **例句2** 等模式
    pattern1 = re.findall(r'\*\*例句\d+\*\*', content)
    if pattern1:
        return len(pattern1)

    # 找 ```...``` 代碼區塊（在例句區域）
    example_section = re.search(r'## 例句(.*?)(?=\n---|\n## |$)', content, re.DOTALL)
    if example_section:
        blocks = re.findall(r'```', example_section.group(1))
        return len(blocks) // 2  # 每個區塊有開頭和結尾

    return 0


def count_pending_links(content: str) -> int:
    """計算待建立連結數量"""
    patterns = [
        r'\[([^\]]+)\]\((待建立|【待建立】)\)',
        r'\[待建立[：:\s]*([^\]]*)\]\([^)]*\)',
        r'[（(]待建立[）)]',
    ]
    count = 0
    for pattern in patterns:
        count += len(re.findall(pattern, content))
    return count


def verify_card(file_path: Path) -> ContentVerification:
    """驗證單個卡片"""
    content = file_path.read_text(encoding="utf-8")
    yaml_data = parse_yaml_frontmatter(content)

    category = file_path.parent.name
    card_name = file_path.stem

    result = ContentVerification(
        path=str(file_path.relative_to(PROJECT_ROOT)),
        category=category,
        card_name=card_name
    )

    # 驗證 YAML 欄位
    for field in REQUIRED_YAML_FIELDS:
        result.yaml_fields_present[field] = bool(yaml_data.get(field))
    result.yaml_complete = all(result.yaml_fields_present.values())

    # 驗證三語解釋
    for lang, headers in REQUIRED_SECTIONS.items():
        for header in headers:
            if header in content:
                setattr(result, f"has_{lang}", True)
                break

    result.explanations_complete = (
        result.has_japanese and
        result.has_english and
        result.has_chinese
    )

    # 計算例句
    result.examples_count = count_examples(content)
    result.has_examples = result.examples_count > 0

    # 計算待建立連結
    result.pending_links_count = count_pending_links(content)

    return result


def scan_all_cards(category_filter: str = None) -> list[ContentVerification]:
    """掃描所有卡片"""
    results = []

    if not ZETTELKASTEN_DIR.exists():
        return results

    for category_dir in sorted(ZETTELKASTEN_DIR.iterdir()):
        if not category_dir.is_dir() or category_dir.name in EXCLUDE_DIRS:
            continue

        if category_filter and category_dir.name != category_filter:
            continue

        for card_file in sorted(category_dir.iterdir()):
            if not card_file.is_file() or card_file.suffix != ".md":
                continue
            if card_file.name in ["index.md", "_index.md"]:
                continue

            try:
                result = verify_card(card_file)
                results.append(result)
            except Exception as e:
                print(f"警告: 無法處理 {card_file}: {e}", file=sys.stderr)

    return results


def generate_summary(results: list[ContentVerification]) -> dict:
    """生成摘要統計"""
    total = len(results)
    complete = sum(1 for r in results if r.is_complete)
    incomplete = total - complete

    by_category = defaultdict(lambda: {
        "total": 0,
        "complete": 0,
        "incomplete": 0,
        "avg_score": 0
    })

    for r in results:
        by_category[r.category]["total"] += 1
        if r.is_complete:
            by_category[r.category]["complete"] += 1
        else:
            by_category[r.category]["incomplete"] += 1

    # 計算平均分數
    for cat, stats in by_category.items():
        cat_results = [r for r in results if r.category == cat]
        if cat_results:
            stats["avg_score"] = sum(r.completeness_score for r in cat_results) // len(cat_results)

    # 統計缺失項目
    missing_yaml = sum(1 for r in results if not r.yaml_complete)
    missing_japanese = sum(1 for r in results if not r.has_japanese)
    missing_english = sum(1 for r in results if not r.has_english)
    missing_chinese = sum(1 for r in results if not r.has_chinese)
    missing_examples = sum(1 for r in results if not r.has_examples)

    return {
        "total_cards": total,
        "complete": complete,
        "incomplete": incomplete,
        "completion_rate": round(complete / total * 100, 1) if total > 0 else 0,
        "by_category": dict(by_category),
        "missing": {
            "yaml": missing_yaml,
            "japanese": missing_japanese,
            "english": missing_english,
            "chinese": missing_chinese,
            "examples": missing_examples
        }
    }


def format_text_output(results: list[ContentVerification], incomplete_only: bool = False, verbose: bool = False):
    """格式化文字輸出"""
    summary = generate_summary(results)

    print("\n" + "=" * 80)
    print("卡片內容完整性驗證報告")
    print("=" * 80)

    print(f"\n📊 摘要統計")
    print(f"  總卡片數: {summary['total_cards']}")
    print(f"  完整: {summary['complete']} ({summary['completion_rate']}%)")
    print(f"  不完整: {summary['incomplete']}")

    print(f"\n⚠️  缺失項目統計:")
    print(f"  缺少 YAML 欄位: {summary['missing']['yaml']}")
    print(f"  缺少日文解釋: {summary['missing']['japanese']}")
    print(f"  缺少英文解釋: {summary['missing']['english']}")
    print(f"  缺少中文解釋: {summary['missing']['chinese']}")
    print(f"  缺少例句: {summary['missing']['examples']}")

    print(f"\n📁 按分類統計:")
    print(f"{'分類':<20} {'總數':>6} {'完整':>6} {'不完整':>8} {'分數':>6}")
    print("-" * 50)
    for cat, stats in sorted(summary["by_category"].items()):
        print(f"{cat:<20} {stats['total']:>6} {stats['complete']:>6} {stats['incomplete']:>8} {stats['avg_score']:>5}%")

    if verbose or incomplete_only:
        display_results = [r for r in results if not r.is_complete] if incomplete_only else results
        print(f"\n📝 {'不完整' if incomplete_only else '全部'}卡片清單 ({len(display_results)} 張):")
        print("-" * 80)

        for r in display_results:
            status = "✅" if r.is_complete else "❌"
            missing = []
            if not r.yaml_complete:
                missing.append("YAML")
            if not r.has_japanese:
                missing.append("日")
            if not r.has_english:
                missing.append("英")
            if not r.has_chinese:
                missing.append("中")
            if not r.has_examples:
                missing.append("例句")

            missing_str = f" [缺: {', '.join(missing)}]" if missing else ""
            print(f"{status} {r.path} ({r.completeness_score}%){missing_str}")

    print("\n" + "=" * 80)


def format_json_output(results: list[ContentVerification], incomplete_only: bool = False):
    """格式化 JSON 輸出"""
    summary = generate_summary(results)
    display_results = [r for r in results if not r.is_complete] if incomplete_only else results

    output = {
        "summary": summary,
        "cards": []
    }

    for r in display_results:
        card_dict = {
            "path": r.path,
            "category": r.category,
            "card_name": r.card_name,
            "is_complete": r.is_complete,
            "completeness_score": r.completeness_score,
            "yaml_complete": r.yaml_complete,
            "yaml_fields": r.yaml_fields_present,
            "has_japanese": r.has_japanese,
            "has_english": r.has_english,
            "has_chinese": r.has_chinese,
            "examples_count": r.examples_count,
            "pending_links_count": r.pending_links_count
        }
        output["cards"].append(card_dict)

    print(json.dumps(output, ensure_ascii=False, indent=2))


def main():
    """主要邏輯"""
    args = sys.argv[1:]

    # 解析選項
    incomplete_only = "--incomplete-only" in args
    verbose = "--verbose" in args
    output_format = "json" if "--format" in args and "json" in args else "text"

    category_filter = None
    if "--category" in args:
        idx = args.index("--category")
        if idx + 1 < len(args):
            category_filter = args[idx + 1]

    # 掃描
    results = scan_all_cards(category_filter)

    # 輸出
    if output_format == "json":
        format_json_output(results, incomplete_only)
    else:
        format_text_output(results, incomplete_only, verbose)

    # 返回狀態（有不完整卡片則返回 1）
    incomplete = sum(1 for r in results if not r.is_complete)
    sys.exit(0 if incomplete == 0 else 1)


if __name__ == "__main__":
    main()
