#!/usr/bin/env python3
# /// script
# dependencies = []
# requires-python = ">=3.10"
# ///

"""
add-footnote-links.py - 自動補充腳註中缺少的卡片連結

這個腳本會掃描所有卡片的腳註定義，識別缺少連結的概念，並自動補充對應的卡片連結。

核心功能：
1. 提取腳註定義 [^key]: **概念** - 說明
2. 從粗體關鍵字識別概念名稱
3. 使用 Glob + YAML 搜尋對應卡片
4. 補充標準 Markdown 連結：詳見 [標題](路徑.md)
5. 生成缺失卡片報告

使用方式：
    # 檢查狀態（只報告）
    uv run scripts/add-footnote-links.py --check

    # 預覽變更
    uv run scripts/add-footnote-links.py --dry-run

    # 執行修正
    uv run scripts/add-footnote-links.py --fix

    # 生成缺失卡片清單
    uv run scripts/add-footnote-links.py --list-missing

    # 詳細模式
    uv run scripts/add-footnote-links.py --fix --verbose
"""

import re
import sys
from pathlib import Path
from typing import List, Tuple, Dict, Optional
from dataclasses import dataclass, field


@dataclass
class FootnoteDefinition:
    """腳註定義"""
    key: str              # 腳註 key，如 "na-adj"
    content: str          # 完整內容
    concept: str          # 提取的概念名稱（粗體部分）
    has_link: bool        # 是否已包含連結
    line_num: int         # 行號
    file_path: Path       # 所屬檔案


@dataclass
class CardMatch:
    """卡片匹配結果"""
    card_path: Path       # 卡片路徑
    title: str            # 卡片標題
    relevance: int        # 相關性評分（1-10）
    reason: str           # 匹配原因


@dataclass
class FixResult:
    """修正結果"""
    file_path: Path
    footnotes_checked: int = 0
    links_added: int = 0
    already_linked: int = 0
    missing_cards: List[str] = field(default_factory=list)
    changes: List[Tuple[int, str, str]] = field(default_factory=list)  # (line, old, new)


class FootnoteExtractor:
    """提取腳註定義和引用"""

    # 腳註定義：[^key]: **概念** - 說明...
    FOOTNOTE_DEF_PATTERN = re.compile(r'^\[(\^[a-zA-Z0-9_-]+)\]:\s*(.+)$')

    # 粗體關鍵字：**文字**
    BOLD_PATTERN = re.compile(r'\*\*([^*]+?)\*\*')

    # Markdown 連結：[text](path)
    LINK_PATTERN = re.compile(r'\[([^\]]+)\]\(([^)]+)\)')

    def extract_footnotes(self, file_path: Path) -> List[FootnoteDefinition]:
        """提取檔案中的所有腳註定義"""
        footnotes = []

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()

            for i, line in enumerate(lines, 1):
                match = self.FOOTNOTE_DEF_PATTERN.match(line.strip())
                if match:
                    key = match.group(1)
                    content = match.group(2)

                    # 提取概念名稱（第一個粗體文字）
                    bold_match = self.BOLD_PATTERN.search(content)
                    concept = bold_match.group(1) if bold_match else ""

                    # 檢查是否已包含內部連結（排除外部 URL）
                    has_link = False
                    for link_match in self.LINK_PATTERN.finditer(content):
                        link_target = link_match.group(2)
                        if not link_target.startswith(('http://', 'https://')):
                            has_link = True
                            break

                    footnotes.append(FootnoteDefinition(
                        key=key,
                        content=content,
                        concept=concept,
                        has_link=has_link,
                        line_num=i,
                        file_path=file_path
                    ))

        except Exception as e:
            print(f"❌ 讀取檔案失敗 {file_path}: {e}", file=sys.stderr)

        return footnotes

    def should_skip_concept(self, concept: str) -> bool:
        """判斷是否應跳過這個概念（不需要連結）"""
        # 跳過空概念
        if not concept or not concept.strip():
            return True

        # 跳過過短的概念（少於 2 個字元）
        if len(concept.strip()) < 2:
            return True

        # 跳過過於通用或無需連結的概念
        skip_patterns = [
            r'^例[：:]',  # 例：、例子
            r'^參考',     # 參考資料
            r'^注意',     # 注意事項
            r'^提示',     # 提示
            r'^\d+',      # 純數字
            r'^[（(]',    # 純括號開頭
        ]

        for pattern in skip_patterns:
            if re.match(pattern, concept):
                return True

        return False


class ConceptMapper:
    """將腳註概念映射到卡片"""

    def __init__(self, zettelkasten_root: Path):
        self.root = zettelkasten_root

        # Key 正規化映射表
        self.key_normalization = {
            # 動詞類型
            'ichidan': 'ichidan_verb',
            'ichidan-verb': 'ichidan_verb',
            'ru-verb': 'ichidan_verb',
            '一段動詞': 'ichidan_verb',
            'godan': 'godan_verb',
            'godan-verb': 'godan_verb',
            'u-verb': 'godan_verb',
            '五段動詞': 'godan_verb',

            # 形容詞
            'na-adj': 'na_adjective',
            'na-adjective': 'na_adjective',
            'i-adj': 'i_adjective',
            'i-adjective': 'i_adjective',

            # 動詞形式
            'te-form': 'te_form',
            'ta-form': 'ta_form',
            'nai-form': 'nai_form',
            'masu-form': 'masu_form',
            'dict-form': 'dictionary_form',

            # 助詞
            'wo': 'wo',
            'を': 'wo',
            'ni': 'ni',
            'に': 'ni',
            'ga': 'ga',
            'が': 'ga',
            'wa': 'wa',
            'は': 'wa',
            'de': 'de',
            'で': 'de',
        }

    def normalize_concept(self, concept: str) -> str:
        """正規化概念名稱"""
        # 移除括號內容
        concept = re.sub(r'[（(].*?[）)]', '', concept)
        # 移除標點符號
        concept = re.sub(r'[「」『』：:、，。]', '', concept)
        # 轉小寫
        concept_lower = concept.strip().lower()

        # 查找映射表
        if concept_lower in self.key_normalization:
            return self.key_normalization[concept_lower]

        return concept.strip()

    def find_card_by_concept(self, concept: str, from_file: Path, verbose: bool = False) -> Optional[CardMatch]:
        """根據概念尋找對應的卡片"""
        if not concept:
            return None

        normalized = self.normalize_concept(concept)

        # 生成搜尋關鍵字（移除空格和特殊字元）
        search_keywords = [
            normalized.lower().replace(' ', '_'),
            normalized.lower().replace(' ', '-'),
            concept.lower().replace(' ', '_'),
            concept.lower().replace(' ', '-'),
        ]

        # 添加特殊關鍵字映射（處理日文概念名稱）
        concept_mapping = {
            'な形容詞': ['na', 'adj-na', 'na-adjective'],
            'い形容詞': ['i', 'adj-i', 'i-adjective'],
            '一段動詞': ['ichidan', 'ru-verb'],
            '五段動詞': ['godan', 'u-verb'],
            '他動詞': ['transitive'],
            '自動詞': ['intransitive'],
        }

        for jp_concept, en_keywords in concept_mapping.items():
            if jp_concept in concept:
                search_keywords.extend(en_keywords)

        candidates = []

        # 策略 1: Glob 搜尋檔名
        for keyword in search_keywords:
            if keyword:
                # 移除日文字元進行搜尋（假設檔名是羅馬拼音）
                keyword_clean = re.sub(r'[ぁ-んァ-ン一-龯]', '', keyword).strip('_-')
                if keyword_clean:
                    patterns = [
                        f"**/*{keyword_clean}*.md",
                        f"**/{keyword_clean}.md",
                    ]

                    for pattern in patterns:
                        for card_path in self.root.glob(pattern):
                            if self._is_valid_card(card_path):
                                relevance = self._calculate_relevance(card_path, concept, keyword_clean)
                                candidates.append(CardMatch(
                                    card_path=card_path,
                                    title=self._extract_title(card_path),
                                    relevance=relevance,
                                    reason=f"檔名匹配: {keyword_clean}"
                                ))

        # 策略 2: 搜尋 YAML frontmatter
        if not candidates:
            candidates.extend(self._search_by_yaml(concept, normalized))

        # 去重並排序
        seen = set()
        unique_candidates = []
        for c in candidates:
            if c.card_path not in seen:
                seen.add(c.card_path)
                unique_candidates.append(c)

        # 按相關性排序
        unique_candidates.sort(key=lambda x: x.relevance, reverse=True)

        if verbose and unique_candidates:
            print(f"  找到 {len(unique_candidates)} 個候選卡片：")
            for c in unique_candidates[:3]:
                print(f"    - {c.card_path.relative_to(self.root)} (評分: {c.relevance})")

        # 返回最佳匹配
        return unique_candidates[0] if unique_candidates else None

    def _is_valid_card(self, path: Path) -> bool:
        """檢查是否是有效的卡片檔案"""
        # 排除索引檔案
        if path.name in ['index.md', 'README.md']:
            return False
        # _meta 目錄下的卡片是有效的（包含 categories 和 tags 定義）
        return True

    def _calculate_relevance(self, card_path: Path, original_concept: str, keyword: str) -> int:
        """計算卡片相關性評分（1-10）"""
        score = 5  # 基礎分

        filename = card_path.stem.lower()
        parts = card_path.parts

        # Meta 定義卡片優先級最高
        if '_meta' in parts and 'categories' in parts:
            score += 8  # Meta categories 卡片大幅加分
        elif '_meta' in parts and 'tags' in parts:
            score += 6  # Meta tags 卡片加分

        # 檔名匹配度
        filename_tokens = filename.split('_')
        # 完全匹配（排除數字編號）
        non_numeric_tokens = [t for t in filename_tokens if not t.isdigit()]
        if keyword in non_numeric_tokens:
            score += 5
        # 包含關鍵字
        elif keyword in filename:
            # 但如果只是部分匹配，降低評分
            score += 1

        # 特定類別加分
        parent = card_path.parent.name
        if parent in ['grammar', 'particle']:
            score += 2
        elif parent in ['concept', 'contrast']:
            score += 1

        return min(score, 15)

    def _extract_title(self, card_path: Path) -> str:
        """從卡片 YAML 提取標題"""
        try:
            with open(card_path, 'r', encoding='utf-8') as f:
                # 只讀前 30 行（YAML 部分）
                lines = f.readlines()[:30]

            # 簡單解析 YAML（避免依賴外部庫）
            in_yaml = False
            title = None
            description = None

            for line in lines:
                if line.strip() == '---':
                    if not in_yaml:
                        in_yaml = True
                        continue
                    else:
                        break  # YAML 結束

                if in_yaml:
                    # 提取 title
                    title_match = re.match(r'^title:\s*(.+)$', line.strip())
                    if title_match:
                        title = title_match.group(1).strip('"\'')

                    # 提取 description
                    desc_match = re.match(r'^description:\s*(.+)$', line.strip())
                    if desc_match:
                        description = desc_match.group(1).strip('"\'')

            # 優先返回 title，其次 description
            if title:
                return title
            if description:
                return description

        except Exception:
            pass

        # 回退到檔名
        return card_path.stem.replace('_', ' ').title()

    def _search_by_yaml(self, concept: str, normalized: str) -> List[CardMatch]:
        """透過 YAML frontmatter 搜尋"""
        candidates = []

        # 這裡可以實作更進階的 YAML 搜尋
        # 為了效率考量，目前先以檔名搜尋為主

        return candidates


class LinkBuilder:
    """建立腳註連結"""

    def calculate_relative_path(self, from_file: Path, to_file: Path) -> str:
        """計算相對路徑"""
        try:
            # 取得相對路徑
            rel_path = to_file.relative_to(from_file.parent)
            return str(rel_path)
        except ValueError:
            # 如果不在同一目錄樹，使用 ../ 導航
            from_parts = from_file.parent.parts
            to_parts = to_file.parts

            # 找到共同祖先
            common_length = 0
            for i, (f, t) in enumerate(zip(from_parts, to_parts)):
                if f == t:
                    common_length = i + 1
                else:
                    break

            # 計算需要多少個 ../
            up_levels = len(from_parts) - common_length
            down_parts = to_parts[common_length:]

            rel_parts = ['..'] * up_levels + list(down_parts)
            return '/'.join(rel_parts)

    def format_footnote_link(self, definition: str, card_title: str, card_path: str) -> str:
        """格式化腳註連結"""
        # 檢查是否已經以句號結尾
        if definition.rstrip().endswith(('。', '.')):
            # 移除結尾標點
            definition = definition.rstrip().rstrip('。.')

        # 添加連結
        link = f"[{card_title}]({card_path})"
        new_definition = f"{definition}。詳見 {link}"

        return new_definition

    def validate_link(self, link_path: str, base_file: Path) -> bool:
        """驗證連結是否有效"""
        try:
            # 解析相對路徑
            target = (base_file.parent / link_path).resolve()
            return target.exists()
        except Exception:
            return False


class FootnoteLinkFixer:
    """主控制器"""

    def __init__(self, zettelkasten_root: Path, verbose: bool = False):
        self.root = zettelkasten_root
        self.verbose = verbose
        self.extractor = FootnoteExtractor()
        self.mapper = ConceptMapper(zettelkasten_root)
        self.link_builder = LinkBuilder()

        self.stats = {
            'files_scanned': 0,
            'footnotes_found': 0,
            'footnotes_with_links': 0,
            'footnotes_without_links': 0,
            'links_added': 0,
            'missing_cards': []
        }

    def scan_all_cards(self) -> List[Path]:
        """掃描所有卡片"""
        cards = []
        for md_file in self.root.rglob('*.md'):
            # 排除索引和 meta
            if md_file.name not in ['index.md', 'README.md']:
                if '_meta' not in md_file.parts:
                    cards.append(md_file)
        return cards

    def check_file(self, file_path: Path) -> FixResult:
        """檢查單一檔案"""
        result = FixResult(file_path=file_path)

        # 提取腳註
        footnotes = self.extractor.extract_footnotes(file_path)
        result.footnotes_checked = len(footnotes)

        for fn in footnotes:
            self.stats['footnotes_found'] += 1

            if fn.has_link:
                self.stats['footnotes_with_links'] += 1
                result.already_linked += 1
                continue

            self.stats['footnotes_without_links'] += 1

            # 跳過不需要連結的概念
            if self.extractor.should_skip_concept(fn.concept):
                continue

            # 尋找對應卡片
            if self.verbose:
                print(f"  搜尋概念: {fn.concept}")

            card_match = self.mapper.find_card_by_concept(fn.concept, file_path, self.verbose)

            if card_match:
                # 找到卡片，記錄變更
                rel_path = self.link_builder.calculate_relative_path(file_path, card_match.card_path)
                new_content = self.link_builder.format_footnote_link(
                    fn.content,
                    card_match.title,
                    rel_path
                )
                result.changes.append((fn.line_num, fn.content, new_content))
                result.links_added += 1
            else:
                # 未找到卡片
                if self.verbose:
                    print(f"  ❌ 未找到對應卡片: {fn.concept}")
                result.missing_cards.append(fn.concept)

        return result

    def fix_file(self, file_path: Path, dry_run: bool = True) -> FixResult:
        """修正單一檔案"""
        result = self.check_file(file_path)

        if not result.changes:
            return result

        if dry_run:
            return result

        # 實際寫入變更
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()

            # 應用變更（從後往前，避免行號偏移）
            for line_num, old_content, new_content in sorted(result.changes, reverse=True):
                # 找到對應行並替換
                for i in range(line_num - 1, min(line_num + 2, len(lines))):
                    if old_content in lines[i]:
                        lines[i] = lines[i].replace(f': {old_content}', f': {new_content}')
                        break

            # 寫回檔案
            with open(file_path, 'w', encoding='utf-8') as f:
                f.writelines(lines)

            self.stats['links_added'] += result.links_added

        except Exception as e:
            print(f"❌ 寫入檔案失敗 {file_path}: {e}", file=sys.stderr)

        return result

    def process_all(self, dry_run: bool = True) -> Dict:
        """處理所有卡片"""
        cards = self.scan_all_cards()
        results = []

        print(f"📊 掃描 {len(cards)} 張卡片...")

        for card in cards:
            self.stats['files_scanned'] += 1

            if self.verbose:
                print(f"\n📄 處理: {card.relative_to(self.root)}")

            result = self.fix_file(card, dry_run)

            if result.footnotes_checked > 0:
                results.append(result)

                if not self.verbose and result.links_added > 0:
                    status = "🔍 預覽" if dry_run else "✅ 已修正"
                    print(f"{status}: {card.relative_to(self.root)} (+{result.links_added} 連結)")

            # 收集缺失卡片
            for concept in result.missing_cards:
                if concept not in self.stats['missing_cards']:
                    self.stats['missing_cards'].append(concept)

        return {
            'results': results,
            'stats': self.stats
        }

    def generate_report(self, output_path: Path, missing_cards: List[str]):
        """生成缺失卡片報告"""
        try:
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write("# 缺失腳註卡片報告\n\n")
                f.write(f"生成時間：{Path(__file__).name}\n\n")
                f.write("## 統計資訊\n\n")
                f.write(f"- 缺失卡片概念數：{len(missing_cards)}\n\n")
                f.write("## 缺失卡片清單\n\n")

                if missing_cards:
                    for i, concept in enumerate(sorted(set(missing_cards)), 1):
                        f.write(f"{i}. **{concept}**\n")
                else:
                    f.write("*無缺失卡片*\n")

            print(f"\n✅ 報告已生成: {output_path}")

        except Exception as e:
            print(f"❌ 生成報告失敗: {e}", file=sys.stderr)


def main():
    import argparse

    parser = argparse.ArgumentParser(description='自動補充腳註中缺少的卡片連結')
    parser.add_argument('--check', action='store_true', help='只檢查，不修改')
    parser.add_argument('--dry-run', action='store_true', help='預覽變更（不實際寫入）')
    parser.add_argument('--fix', action='store_true', help='執行修正')
    parser.add_argument('--list-missing', action='store_true', help='生成缺失卡片清單')
    parser.add_argument('--verbose', '-v', action='store_true', help='詳細輸出')

    args = parser.parse_args()

    # 預設為 check 模式
    if not any([args.check, args.dry_run, args.fix, args.list_missing]):
        args.check = True

    # 找到專案根目錄
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    zettelkasten_root = project_root / 'zettelkasten'

    if not zettelkasten_root.exists():
        print(f"❌ 找不到 zettelkasten 目錄: {zettelkasten_root}", file=sys.stderr)
        sys.exit(1)

    # 建立 Fixer
    fixer = FootnoteLinkFixer(zettelkasten_root, verbose=args.verbose)

    # 執行處理
    dry_run = not args.fix

    if args.check or args.dry_run or args.fix:
        print(f"{'='*60}")
        if args.fix:
            print("🔧 執行模式：正式修正")
        elif args.dry_run:
            print("🔍 執行模式：預覽變更（Dry Run）")
        else:
            print("📊 執行模式：僅檢查")
        print(f"{'='*60}\n")

        result = fixer.process_all(dry_run=dry_run)

        # 輸出統計
        stats = result['stats']
        print(f"\n{'='*60}")
        print("📊 統計資訊")
        print(f"{'='*60}")
        print(f"掃描檔案數：{stats['files_scanned']}")
        print(f"找到腳註數：{stats['footnotes_found']}")
        print(f"  - 已有連結：{stats['footnotes_with_links']}")
        print(f"  - 缺少連結：{stats['footnotes_without_links']}")
        if not dry_run:
            print(f"新增連結數：{stats['links_added']}")
        else:
            total_to_add = sum(r.links_added for r in result['results'])
            print(f"可新增連結：{total_to_add}")
        print(f"缺失卡片數：{len(stats['missing_cards'])}")
        print(f"{'='*60}\n")

        if stats['missing_cards']:
            print("⚠️  以下概念缺少對應卡片：")
            for concept in sorted(set(stats['missing_cards']))[:10]:
                print(f"  - {concept}")
            if len(stats['missing_cards']) > 10:
                print(f"  ... 及其他 {len(stats['missing_cards']) - 10} 個")

    if args.list_missing:
        output_path = project_root / 'doc' / 'missing-footnote-cards.md'
        output_path.parent.mkdir(exist_ok=True)

        # 如果還沒執行過 scan，先執行
        if not fixer.stats['files_scanned']:
            result = fixer.process_all(dry_run=True)

        fixer.generate_report(output_path, fixer.stats['missing_cards'])

    if args.fix:
        print("\n✅ 修正完成！")
    elif args.dry_run:
        print("\n💡 提示：使用 --fix 執行實際修正")


if __name__ == '__main__':
    main()
