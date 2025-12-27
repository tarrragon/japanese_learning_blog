#!/usr/bin/env python3
# /// script
# dependencies = []
# requires-python = ">=3.10"
# ///

"""
replace_pending_links.py - 自動替換「待建立」連結標記

用途：掃描所有卡片，將「待建立」標記替換為實際連結路徑
執行：uv run scripts/replace_pending_links.py [選項]

選項：
  --check             檢查模式：統計待建立連結數量（預設）
  --dry-run           預覽變更，不實際修改檔案
  --fix               執行替換
  --report            生成缺口報告（Markdown 格式）
  --json              輸出 JSON 格式的缺口清單
  --add-to-csv        直接新增缺口到 Active CSV
  --category CAT      只處理特定分類
  --quiet             靜默模式

工作流程整合（階段 3：Link Building）：
  uv run scripts/replace_pending_links.py --fix --add-to-csv --report

效率優化：
  - 預建卡片索引（japanese → path），O(1) 查找
  - 只讀前 30 行建立索引
  - 行級替換，不解析整個 Markdown
"""

import argparse
import json
import re
import sys
from datetime import datetime
from pathlib import Path
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Optional

# 分類關鍵字映射（用於猜測缺口卡片的分類）
CATEGORY_KEYWORDS = {
    "grammar": ["形", "動詞", "助詞", "表現", "文法", "接続", "形式", "用法"],
    "concept": ["概念", "理論", "系統", "特徴", "構造", "原則"],
    "noun": ["名詞", "語", "詞"],
    "verb-ru": ["る動詞", "一段"],
    "verb-u": ["う動詞", "五段"],
    "keigo": ["敬語", "尊敬", "謙譲", "丁寧"],
    "particle": ["助詞"],
}

# 專案根目錄
PROJECT_ROOT = Path(__file__).parent.parent
ZETTELKASTEN_DIR = PROJECT_ROOT / "zettelkasten"

# 不掃描的目錄
EXCLUDE_DIRS = {"_meta", ".DS_Store"}

# 待建立標記的正則表達式（從 detect_pending_links.py 複用）
PENDING_PATTERNS = [
    # [文字](待建立) 或 [文字](【待建立】)
    re.compile(r'\[([^\]]+)\]\((待建立|【待建立】)\)'),
    # [待建立](pending) 或 [待建立: xxx](...)
    re.compile(r'\[待建立[：:\s]*([^\]]*)\]\([^)]*\)'),
    # [文字](path)（待建立） - 連結後跟待建立
    re.compile(r'(\[[^\]]+\]\([^)]+\))（待建立）'),
]


@dataclass
class CardEntry:
    """卡片索引項目"""
    path: Path
    category: str
    number: str
    title: str
    japanese: str
    aliases: list = field(default_factory=list)


@dataclass
class Gap:
    """缺口記錄"""
    text: str
    source_files: list = field(default_factory=list)
    count: int = 0


class CardIndex:
    """卡片索引：建立 japanese → path 的映射"""

    def __init__(self, zettelkasten_dir: Path):
        self.zettelkasten_dir = zettelkasten_dir
        # 主索引：日文詞彙 -> CardEntry
        self.japanese_to_card: dict[str, CardEntry] = {}
        # 別名索引
        self.alias_to_card: dict[str, CardEntry] = {}
        # 標題索引
        self.title_to_card: dict[str, CardEntry] = {}
        # 統計
        self.total_cards = 0

    def build_index(self) -> None:
        """掃描所有卡片，只讀前 30 行建立索引"""
        for category_dir in self.zettelkasten_dir.iterdir():
            if not category_dir.is_dir() or category_dir.name in EXCLUDE_DIRS:
                continue

            for card_file in category_dir.glob("*.md"):
                if card_file.name in ("index.md", "_index.md"):
                    continue

                entry = self._parse_card_header(card_file)
                if entry:
                    self._add_to_index(entry)
                    self.total_cards += 1

    def _parse_card_header(self, path: Path) -> Optional[CardEntry]:
        """只讀前 30 行，解析 YAML frontmatter"""
        try:
            lines = []
            with path.open("r", encoding="utf-8") as f:
                for i, line in enumerate(f):
                    if i >= 30:
                        break
                    lines.append(line)

            # 解析 YAML
            yaml_data = self._extract_yaml(lines)
            title = yaml_data.get("title", "")

            # 從標題提取日文和別名
            japanese, aliases = self._extract_japanese_from_title(title)

            # 提取編號
            number = self._extract_number(path.name)

            return CardEntry(
                path=path,
                category=path.parent.name,
                number=number,
                title=title,
                japanese=japanese,
                aliases=aliases
            )
        except Exception:
            return None

    def _extract_yaml(self, lines: list[str]) -> dict:
        """從行列表解析 YAML"""
        in_yaml = False
        yaml_lines = []

        for line in lines:
            stripped = line.strip()
            if stripped == "---":
                if not in_yaml:
                    in_yaml = True
                    continue
                else:
                    break
            if in_yaml:
                yaml_lines.append(line)

        data = {}
        for line in yaml_lines:
            if ":" in line and not line.strip().startswith("-"):
                parts = line.split(":", 1)
                key = parts[0].strip()
                value = parts[1].strip().strip('"').strip("'") if len(parts) > 1 else ""
                data[key] = value

        return data

    def _extract_japanese_from_title(self, title: str) -> tuple[str, list[str]]:
        """
        從標題提取日文詞彙和別名

        範例：
          "食べる（たべる）" -> ("食べる", ["たべる"])
          "朝ごはん（あさごはん）" -> ("朝ごはん", ["あさごはん"])
        """
        aliases = []

        # 提取括號內容作為別名
        paren_match = re.search(r'[（(]([^）)]+)[）)]', title)
        if paren_match:
            aliases.append(paren_match.group(1))
            main_text = re.sub(r'[（(][^）)]+[）)]', '', title).strip()
        else:
            main_text = title.strip()

        # 處理「・」分隔的多個詞
        if '・' in main_text:
            parts = main_text.split('・')
            main_text = parts[0].strip()
            aliases.extend([p.strip() for p in parts[1:]])

        return main_text, aliases

    def _extract_number(self, filename: str) -> str:
        """從檔名提取編號"""
        match = re.match(r'(\d+)_', filename)
        return match.group(1) if match else ""

    def _add_to_index(self, entry: CardEntry) -> None:
        """將卡片加入索引"""
        # 正規化並加入主索引
        if entry.japanese:
            norm_jp = self._normalize(entry.japanese)
            self.japanese_to_card[norm_jp] = entry

        # 加入別名索引
        for alias in entry.aliases:
            norm_alias = self._normalize(alias)
            if norm_alias not in self.alias_to_card:
                self.alias_to_card[norm_alias] = entry

        # 加入標題索引
        if entry.title:
            norm_title = self._normalize(entry.title)
            self.title_to_card[norm_title] = entry

    def _normalize(self, text: str) -> str:
        """正規化文字"""
        return text.strip().replace('（', '(').replace('）', ')')

    def find_card(self, text: str) -> Optional[CardEntry]:
        """根據日文文字查找卡片"""
        clean_text = self._normalize(text)

        # 1. 主索引查找
        if clean_text in self.japanese_to_card:
            return self.japanese_to_card[clean_text]

        # 2. 別名查找
        if clean_text in self.alias_to_card:
            return self.alias_to_card[clean_text]

        # 3. 標題查找
        if clean_text in self.title_to_card:
            return self.title_to_card[clean_text]

        # 4. 去除括號後再查找
        no_paren = re.sub(r'[（(][^）)]*[）)]', '', clean_text).strip()
        if no_paren and no_paren != clean_text:
            if no_paren in self.japanese_to_card:
                return self.japanese_to_card[no_paren]

        return None


class GapReport:
    """缺口報告生成器"""

    def __init__(self):
        self.gaps: dict[str, Gap] = {}

    def add(self, text: str, source_file: str) -> None:
        """記錄一個缺口"""
        if text not in self.gaps:
            self.gaps[text] = Gap(text=text, source_files=[], count=0)
        self.gaps[text].source_files.append(source_file)
        self.gaps[text].count += 1

    def _calc_priority(self, count: int) -> str:
        """根據出現次數計算優先級"""
        if count >= 5:
            return "Critical"
        if count >= 3:
            return "High"
        if count >= 2:
            return "Medium"
        return "Low"

    def _guess_category(self, text: str) -> str:
        """根據文字內容猜測分類"""
        for category, keywords in CATEGORY_KEYWORDS.items():
            for keyword in keywords:
                if keyword in text:
                    return category
        # 預設分類
        return "concept"

    def to_json(self) -> list[dict]:
        """生成 JSON 格式的缺口清單（供 add_pending_cards.py 使用）"""
        date_str = datetime.now().strftime("%Y%m%d")
        sorted_gaps = sorted(
            self.gaps.values(),
            key=lambda g: g.count,
            reverse=True
        )

        cards = []
        for gap in sorted_gaps:
            # 過濾無效的缺口（如空字串、純標記等）
            if not gap.text or gap.text in ("待建立", "【待建立】", "pending"):
                continue

            cards.append({
                "japanese": gap.text,
                "chinese": "（待填寫）",  # 佔位符，待填寫
                "category": self._guess_category(gap.text),
                "jlpt": "n3",  # 預設值
                "priority": self._calc_priority(gap.count),
                "source": f"gap-{date_str}",
                "stage": "pending",
                "note": f"出現 {gap.count} 次"
            })

        return cards

    def generate_markdown(self) -> str:
        """生成 Markdown 格式報告"""
        lines = [
            "# 待建立卡片缺口報告",
            "",
            f"生成時間：{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            "",
            "## 摘要",
            "",
            f"- 缺口總數：{len(self.gaps)}",
            f"- 總出現次數：{sum(g.count for g in self.gaps.values())}",
            "",
            "## 按出現次數排序",
            "",
            "| 日文詞彙 | 出現次數 | 優先級 | 出現位置（前3個）|",
            "|----------|----------|--------|------------------|",
        ]

        sorted_gaps = sorted(
            self.gaps.values(),
            key=lambda g: g.count,
            reverse=True
        )

        for gap in sorted_gaps:
            sources = ", ".join(Path(f).name for f in gap.source_files[:3])
            if len(gap.source_files) > 3:
                sources += f" (+{len(gap.source_files) - 3})"
            priority = self._calc_priority(gap.count)
            lines.append(f"| {gap.text} | {gap.count} | {priority} | {sources} |")

        return "\n".join(lines)

    def save(self, output_path: Path) -> None:
        """儲存報告"""
        output_path.write_text(self.generate_markdown(), encoding="utf-8")

    def save_json(self, output_path: Path) -> None:
        """儲存 JSON 格式報告"""
        output_path.write_text(
            json.dumps(self.to_json(), ensure_ascii=False, indent=2),
            encoding="utf-8"
        )


class PendingLinkReplacer:
    """待建立連結替換器"""

    def __init__(self, index: CardIndex, zettelkasten_dir: Path):
        self.index = index
        self.zettelkasten_dir = zettelkasten_dir
        self.gaps = GapReport()
        self.stats = {
            "files_scanned": 0,
            "files_modified": 0,
            "links_replaced": 0,
            "links_not_found": 0
        }

    def process_all(self, category_filter: str = None, dry_run: bool = True, quiet: bool = False) -> None:
        """處理所有卡片"""
        for category_dir in sorted(self.zettelkasten_dir.iterdir()):
            if not category_dir.is_dir() or category_dir.name in EXCLUDE_DIRS:
                continue

            if category_filter and category_dir.name != category_filter:
                continue

            for card_file in sorted(category_dir.glob("*.md")):
                if card_file.name in ("index.md", "_index.md"):
                    continue

                self._process_file(card_file, dry_run, quiet)

    def _process_file(self, file_path: Path, dry_run: bool, quiet: bool) -> None:
        """處理單一檔案"""
        self.stats["files_scanned"] += 1

        try:
            content = file_path.read_text(encoding="utf-8")
            lines = content.split("\n")
        except Exception as e:
            if not quiet:
                print(f"❌ 讀取失敗 {file_path}: {e}", file=sys.stderr)
            return

        modified = False
        new_lines = []

        for line_num, line in enumerate(lines, start=1):
            new_line = self._process_line(line, file_path, line_num, quiet)
            if new_line != line:
                modified = True
            new_lines.append(new_line)

        if modified:
            self.stats["files_modified"] += 1
            if not dry_run:
                file_path.write_text("\n".join(new_lines), encoding="utf-8")
            elif not quiet:
                print(f"📝 {file_path.relative_to(PROJECT_ROOT)}")

    def _process_line(self, line: str, file_path: Path, line_num: int, quiet: bool) -> str:
        """處理單一行，返回替換後的行"""
        new_line = line

        # 模式 1：[文字](待建立)
        for match in reversed(list(PENDING_PATTERNS[0].finditer(line))):
            link_text = match.group(1)
            card = self.index.find_card(link_text)

            if card:
                rel_path = self._compute_relative_path(file_path, card.path)
                replacement = f"[{link_text}]({rel_path})"
                new_line = new_line[:match.start()] + replacement + new_line[match.end():]
                self.stats["links_replaced"] += 1
                if not quiet:
                    print(f"  ✓ L{line_num}: [{link_text}] → {rel_path}")
            else:
                self.gaps.add(link_text, str(file_path))
                self.stats["links_not_found"] += 1

        # 模式 2：[待建立: xxx](...) - 通常不替換，只記錄
        for match in PENDING_PATTERNS[1].finditer(line):
            link_text = match.group(1)
            if link_text:
                card = self.index.find_card(link_text)
                if not card:
                    self.gaps.add(link_text, str(file_path))
                    self.stats["links_not_found"] += 1

        # 模式 3：[文字](path)（待建立）- 移除尾部的（待建立）標記
        for match in reversed(list(PENDING_PATTERNS[2].finditer(line))):
            # 檢查連結是否有效
            link_part = match.group(1)
            # 只移除（待建立）標記，保留連結
            new_line = new_line[:match.start()] + link_part + new_line[match.end():]

        return new_line

    def _compute_relative_path(self, source: Path, target: Path) -> str:
        """計算相對路徑"""
        source_cat = source.parent.name
        target_cat = target.parent.name

        if source_cat == target_cat:
            return target.name
        else:
            return f"../{target_cat}/{target.name}"


def print_stats(replacer: PendingLinkReplacer, quiet: bool = False) -> None:
    """輸出統計資訊"""
    if quiet:
        return

    print("\n" + "=" * 60)
    print("📊 統計結果")
    print("=" * 60)
    print(f"  掃描檔案數：{replacer.stats['files_scanned']}")
    print(f"  修改檔案數：{replacer.stats['files_modified']}")
    print(f"  替換連結數：{replacer.stats['links_replaced']}")
    print(f"  未找到連結：{replacer.stats['links_not_found']}")
    print(f"  缺口詞彙數：{len(replacer.gaps.gaps)}")
    print("=" * 60)


def main():
    parser = argparse.ArgumentParser(
        description="自動替換「待建立」連結標記",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
工作流程整合範例：
  # 階段 3：Link Building 完整處理
  uv run scripts/replace_pending_links.py --fix --add-to-csv --report

  # 只生成 JSON 格式缺口清單
  uv run scripts/replace_pending_links.py --fix --json > gaps.json
        """
    )

    parser.add_argument("--check", action="store_true",
                        help="檢查模式：統計待建立連結數量（預設）")
    parser.add_argument("--dry-run", action="store_true",
                        help="預覽變更，不實際修改檔案")
    parser.add_argument("--fix", action="store_true",
                        help="執行替換")
    parser.add_argument("--report", action="store_true",
                        help="生成缺口報告到 doc/worklog/（Markdown 格式）")
    parser.add_argument("--json", action="store_true",
                        help="輸出 JSON 格式的缺口清單")
    parser.add_argument("--add-to-csv", action="store_true",
                        help="直接新增缺口到 Active CSV")
    parser.add_argument("--category", type=str,
                        help="只處理特定分類")
    parser.add_argument("--quiet", action="store_true",
                        help="靜默模式")

    args = parser.parse_args()

    # 預設為 check 模式
    if not (args.dry_run or args.fix):
        args.check = True

    # 1. 建立索引
    if not args.quiet:
        print("🔍 建立卡片索引...")

    index = CardIndex(ZETTELKASTEN_DIR)
    index.build_index()

    if not args.quiet:
        print(f"  索引完成：{index.total_cards} 張卡片")
        print(f"  主索引：{len(index.japanese_to_card)} 項")
        print(f"  別名索引：{len(index.alias_to_card)} 項")

    # 2. 處理卡片
    if not args.quiet:
        mode = "fix" if args.fix else "dry-run" if args.dry_run else "check"
        print(f"\n📝 處理模式：{mode}")

    replacer = PendingLinkReplacer(index, ZETTELKASTEN_DIR)
    dry_run = not args.fix
    replacer.process_all(args.category, dry_run, args.quiet)

    # 3. 輸出統計
    if not args.json:  # JSON 模式下不輸出統計
        print_stats(replacer, args.quiet)

    # 4. JSON 輸出
    if args.json:
        gaps_json = replacer.gaps.to_json()
        print(json.dumps(gaps_json, ensure_ascii=False, indent=2))
        sys.exit(0)

    # 5. 生成 Markdown 報告
    if args.report and len(replacer.gaps.gaps) > 0:
        report_dir = PROJECT_ROOT / "doc" / "worklog"
        report_dir.mkdir(parents=True, exist_ok=True)

        date_str = datetime.now().strftime("%Y%m%d")
        report_path = report_dir / f"gap-report-{date_str}.md"
        replacer.gaps.save(report_path)

        if not args.quiet:
            print(f"\n📄 缺口報告已儲存：{report_path.relative_to(PROJECT_ROOT)}")

    # 6. 新增缺口到 CSV
    if args.add_to_csv and len(replacer.gaps.gaps) > 0:
        gaps_json = replacer.gaps.to_json()

        if len(gaps_json) > 0:
            # 寫入臨時 JSON 檔案
            import tempfile
            import subprocess

            with tempfile.NamedTemporaryFile(
                mode='w',
                suffix='.json',
                delete=False,
                encoding='utf-8'
            ) as f:
                json.dump(gaps_json, f, ensure_ascii=False, indent=2)
                temp_json_path = f.name

            try:
                # 呼叫 add_pending_cards.py batch（直接使用當前 Python 環境）
                # --csv-only 是主程式選項，必須放在 batch 子命令之前
                result = subprocess.run(
                    [
                        sys.executable,
                        str(PROJECT_ROOT / "scripts" / "add_pending_cards.py"),
                        "--csv-only",  # 只新增到 CSV，不建立卡片檔案
                        "batch",
                        "--from-json", temp_json_path,
                    ],
                    capture_output=True,
                    text=True,
                    cwd=PROJECT_ROOT
                )

                if result.returncode == 0:
                    if not args.quiet:
                        print(f"\n✅ 已新增 {len(gaps_json)} 個缺口到 Active CSV")
                else:
                    error_msg = result.stderr or result.stdout
                    print(f"\n❌ 新增到 CSV 失敗：{error_msg}", file=sys.stderr)
            finally:
                # 清理臨時檔案
                Path(temp_json_path).unlink(missing_ok=True)
        else:
            if not args.quiet:
                print("\n⚠️ 沒有有效的缺口需要新增")

    # 返回狀態
    sys.exit(0)


if __name__ == "__main__":
    main()
