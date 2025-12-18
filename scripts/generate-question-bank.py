#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "pykakasi",
#     "pyyaml",
# ]
# ///

"""
題庫產生腳本

從 Zettelkasten 卡片的「日文解釋」區塊提取題目，
產生結構化的 JSON 題庫檔案供輸入練習使用。

用法：
    uv run scripts/generate-question-bank.py
    uv run scripts/generate-question-bank.py --output static/data/questions.json
    uv run scripts/generate-question-bank.py --verbose
"""

import argparse
import json
import re
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path

import pykakasi
import yaml


# ===== 羅馬字對應表 =====
# 與 src/domain/RomajiMap.js 保持一致

ROMAJI_MAP: dict[str, list[str]] = {
    # 母音
    'あ': ['a'], 'い': ['i'], 'う': ['u'], 'え': ['e'], 'お': ['o'],
    'ア': ['a'], 'イ': ['i'], 'ウ': ['u'], 'エ': ['e'], 'オ': ['o'],

    # か行
    'か': ['ka'], 'き': ['ki'], 'く': ['ku'], 'け': ['ke'], 'こ': ['ko'],
    'カ': ['ka'], 'キ': ['ki'], 'ク': ['ku'], 'ケ': ['ke'], 'コ': ['ko'],

    # さ行
    'さ': ['sa'], 'し': ['si', 'shi'], 'す': ['su'], 'せ': ['se'], 'そ': ['so'],
    'サ': ['sa'], 'シ': ['si', 'shi'], 'ス': ['su'], 'セ': ['se'], 'ソ': ['so'],

    # た行
    'た': ['ta'], 'ち': ['ti', 'chi'], 'つ': ['tu', 'tsu'], 'て': ['te'], 'と': ['to'],
    'タ': ['ta'], 'チ': ['ti', 'chi'], 'ツ': ['tu', 'tsu'], 'テ': ['te'], 'ト': ['to'],

    # な行
    'な': ['na'], 'に': ['ni'], 'ぬ': ['nu'], 'ね': ['ne'], 'の': ['no'],
    'ナ': ['na'], 'ニ': ['ni'], 'ヌ': ['nu'], 'ネ': ['ne'], 'ノ': ['no'],

    # は行
    'は': ['ha'], 'ひ': ['hi'], 'ふ': ['hu', 'fu'], 'へ': ['he'], 'ほ': ['ho'],
    'ハ': ['ha'], 'ヒ': ['hi'], 'フ': ['hu', 'fu'], 'ヘ': ['he'], 'ホ': ['ho'],

    # ま行
    'ま': ['ma'], 'み': ['mi'], 'む': ['mu'], 'め': ['me'], 'も': ['mo'],
    'マ': ['ma'], 'ミ': ['mi'], 'ム': ['mu'], 'メ': ['me'], 'モ': ['mo'],

    # や行
    'や': ['ya'], 'ゆ': ['yu'], 'よ': ['yo'],
    'ヤ': ['ya'], 'ユ': ['yu'], 'ヨ': ['yo'],

    # ら行
    'ら': ['ra'], 'り': ['ri'], 'る': ['ru'], 'れ': ['re'], 'ろ': ['ro'],
    'ラ': ['ra'], 'リ': ['ri'], 'ル': ['ru'], 'レ': ['re'], 'ロ': ['ro'],

    # わ行
    'わ': ['wa'], 'を': ['wo'], 'ん': ['n', 'nn'],
    'ワ': ['wa'], 'ヲ': ['wo'], 'ン': ['n', 'nn'],

    # 濁音
    'が': ['ga'], 'ぎ': ['gi'], 'ぐ': ['gu'], 'げ': ['ge'], 'ご': ['go'],
    'ガ': ['ga'], 'ギ': ['gi'], 'グ': ['gu'], 'ゲ': ['ge'], 'ゴ': ['go'],

    'ざ': ['za'], 'じ': ['zi', 'ji'], 'ず': ['zu'], 'ぜ': ['ze'], 'ぞ': ['zo'],
    'ザ': ['za'], 'ジ': ['zi', 'ji'], 'ズ': ['zu'], 'ゼ': ['ze'], 'ゾ': ['zo'],

    'だ': ['da'], 'ぢ': ['di'], 'づ': ['du', 'dzu'], 'で': ['de'], 'ど': ['do'],
    'ダ': ['da'], 'ヂ': ['di'], 'ヅ': ['du', 'dzu'], 'デ': ['de'], 'ド': ['do'],

    'ば': ['ba'], 'び': ['bi'], 'ぶ': ['bu'], 'べ': ['be'], 'ぼ': ['bo'],
    'バ': ['ba'], 'ビ': ['bi'], 'ブ': ['bu'], 'ベ': ['be'], 'ボ': ['bo'],

    # 半濁音
    'ぱ': ['pa'], 'ぴ': ['pi'], 'ぷ': ['pu'], 'ぺ': ['pe'], 'ぽ': ['po'],
    'パ': ['pa'], 'ピ': ['pi'], 'プ': ['pu'], 'ペ': ['pe'], 'ポ': ['po'],

    # 拗音
    'きゃ': ['kya'], 'きゅ': ['kyu'], 'きょ': ['kyo'],
    'しゃ': ['sya', 'sha'], 'しゅ': ['syu', 'shu'], 'しょ': ['syo', 'sho'],
    'ちゃ': ['tya', 'cha'], 'ちゅ': ['tyu', 'chu'], 'ちょ': ['tyo', 'cho'],
    'にゃ': ['nya'], 'にゅ': ['nyu'], 'にょ': ['nyo'],
    'ひゃ': ['hya'], 'ひゅ': ['hyu'], 'ひょ': ['hyo'],
    'みゃ': ['mya'], 'みゅ': ['myu'], 'みょ': ['myo'],
    'りゃ': ['rya'], 'りゅ': ['ryu'], 'りょ': ['ryo'],
    'ぎゃ': ['gya'], 'ぎゅ': ['gyu'], 'ぎょ': ['gyo'],
    'じゃ': ['zya', 'ja', 'jya'], 'じゅ': ['zyu', 'ju', 'jyu'], 'じょ': ['zyo', 'jo', 'jyo'],
    'びゃ': ['bya'], 'びゅ': ['byu'], 'びょ': ['byo'],
    'ぴゃ': ['pya'], 'ぴゅ': ['pyu'], 'ぴょ': ['pyo'],

    # 片假名拗音
    'キャ': ['kya'], 'キュ': ['kyu'], 'キョ': ['kyo'],
    'シャ': ['sya', 'sha'], 'シュ': ['syu', 'shu'], 'ショ': ['syo', 'sho'],
    'チャ': ['tya', 'cha'], 'チュ': ['tyu', 'chu'], 'チョ': ['tyo', 'cho'],
    'ニャ': ['nya'], 'ニュ': ['nyu'], 'ニョ': ['nyo'],
    'ヒャ': ['hya'], 'ヒュ': ['hyu'], 'ヒョ': ['hyo'],
    'ミャ': ['mya'], 'ミュ': ['myu'], 'ミョ': ['myo'],
    'リャ': ['rya'], 'リュ': ['ryu'], 'リョ': ['ryo'],
    'ギャ': ['gya'], 'ギュ': ['gyu'], 'ギョ': ['gyo'],
    'ジャ': ['zya', 'ja', 'jya'], 'ジュ': ['zyu', 'ju', 'jyu'], 'ジョ': ['zyo', 'jo', 'jyo'],
    'ビャ': ['bya'], 'ビュ': ['byu'], 'ビョ': ['byo'],
    'ピャ': ['pya'], 'ピュ': ['pyu'], 'ピョ': ['pyo'],

    # 促音
    'っ': ['xtu', 'ltu', 'xtsu', 'ltsu'],
    'ッ': ['xtu', 'ltu', 'xtsu', 'ltsu'],

    # 小字
    'ぁ': ['xa', 'la'], 'ぃ': ['xi', 'li'], 'ぅ': ['xu', 'lu'], 'ぇ': ['xe', 'le'], 'ぉ': ['xo', 'lo'],
    'ゃ': ['xya', 'lya'], 'ゅ': ['xyu', 'lyu'], 'ょ': ['xyo', 'lyo'],
    'ァ': ['xa', 'la'], 'ィ': ['xi', 'li'], 'ゥ': ['xu', 'lu'], 'ェ': ['xe', 'le'], 'ォ': ['xo', 'lo'],
    'ャ': ['xya', 'lya'], 'ュ': ['xyu', 'lyu'], 'ョ': ['xyo', 'lyo'],

    # 標點符號
    '、': [','], '。': ['.'], '？': ['?'], '！': ['!'],
    '「': ['['], '」': [']'],
    'ー': ['-'],

    # 外來語片假名
    'ティ': ['thi', 'texi', 'teli'],
    'ディ': ['dhi', 'dexi', 'deli'],
    'ファ': ['fa', 'huxa', 'hula'],
    'フィ': ['fi', 'huxi', 'huli'],
    'フェ': ['fe', 'huxe', 'hule'],
    'フォ': ['fo', 'huxo', 'hulo'],
    'ウィ': ['wi', 'uxi', 'uli'],
    'ウェ': ['we', 'uxe', 'ule'],
    'ウォ': ['wo', 'uxo', 'ulo'],
    'ヴァ': ['va', 'vuxa'],
    'ヴィ': ['vi', 'vuxi'],
    'ヴ': ['vu'],
    'ヴェ': ['ve', 'vuxe'],
    'ヴォ': ['vo', 'vuxo'],

    # 古典假名
    'ゐ': ['wi'], 'ヰ': ['wi'],
    'ゑ': ['we'], 'ヱ': ['we'],
}

# 促音字元
SOKUON = {'っ', 'ッ'}

# 拗音小字
YOUON_SMALL = {'ゃ', 'ゅ', 'ょ', 'ャ', 'ュ', 'ョ'}


@dataclass
class CardInfo:
    """卡片資訊"""
    path: Path
    category: str
    number: str
    title: str
    jlpt: str = 'n5'
    japanese_explanation: str = ''


@dataclass
class Character:
    """字元資訊"""
    display: str  # 顯示文字（可能是漢字）
    kana: str     # 假名（用於轉換羅馬字）
    romaji: list[str] = field(default_factory=list)


@dataclass
class Question:
    """題目"""
    id: str
    text: str
    characters: list[dict]
    source: dict
    metadata: dict


class QuestionGenerator:
    """題目產生器"""

    def __init__(self, verbose: bool = False):
        self.verbose = verbose
        self.kks = pykakasi.kakasi()
        self.warnings: list[str] = []

    def log(self, msg: str) -> None:
        """輸出日誌"""
        if self.verbose:
            print(msg)

    def warn(self, msg: str) -> None:
        """記錄警告"""
        self.warnings.append(msg)
        if self.verbose:
            print(f"⚠️  {msg}")

    def scan_cards(self, zettelkasten_dir: Path) -> list[CardInfo]:
        """掃描所有卡片"""
        cards = []

        for category_dir in zettelkasten_dir.iterdir():
            # 跳過非目錄、索引檔、meta 目錄
            if not category_dir.is_dir():
                continue
            if category_dir.name.startswith('_'):
                continue

            category = category_dir.name

            for card_file in category_dir.glob('*.md'):
                # 跳過索引檔
                if card_file.name.startswith('_'):
                    continue

                card = self.parse_card(card_file, category)
                if card and card.japanese_explanation:
                    cards.append(card)

        self.log(f"掃描到 {len(cards)} 張有日文解釋的卡片")
        return cards

    def parse_card(self, card_path: Path, category: str) -> CardInfo | None:
        """解析單張卡片"""
        try:
            content = card_path.read_text(encoding='utf-8')
        except Exception as e:
            self.warn(f"無法讀取 {card_path}: {e}")
            return None

        # 解析 frontmatter
        frontmatter = self.extract_frontmatter(content)
        if not frontmatter:
            return None

        # 提取編號
        match = re.match(r'^(\d+)_', card_path.stem)
        number = match.group(1) if match else '000'

        # 提取日文解釋
        jp_explanation = self.extract_japanese_explanation(content)

        return CardInfo(
            path=card_path,
            category=category,
            number=number,
            title=frontmatter.get('title', card_path.stem),
            jlpt=self.normalize_jlpt(frontmatter.get('jlpt', 'n5')),
            japanese_explanation=jp_explanation,
        )

    def extract_frontmatter(self, content: str) -> dict | None:
        """提取 YAML frontmatter"""
        match = re.match(r'^---\s*\n(.*?)\n---\s*\n', content, re.DOTALL)
        if not match:
            return None

        try:
            return yaml.safe_load(match.group(1))
        except yaml.YAMLError:
            return None

    def extract_japanese_explanation(self, content: str) -> str:
        """提取日文解釋區塊"""
        # 尋找 ## 日文解釋 標題
        match = re.search(r'^## 日文解釋\s*\n\n(.+?)(?=\n## |\n---|\Z)', content, re.MULTILINE | re.DOTALL)
        if not match:
            return ''

        text = match.group(1).strip()

        # 清理文字
        text = self.clean_japanese_text(text)

        # 如果太長，取第一句
        if len(text) > 200:
            # 在句號處截斷
            first_sentence_match = re.match(r'^.+?。', text)
            if first_sentence_match:
                text = first_sentence_match.group(0)

        return text

    def clean_japanese_text(self, text: str) -> str:
        """清理日文文字"""
        # 移除 markdown 腳註標記 [^xxx]
        text = re.sub(r'\[\^[^\]]+\]', '', text)

        # 移除括號內的英文註解（但保留日文括號內容）
        # 例如：「朝」（あさ、morning） → 「朝」（あさ）
        text = re.sub(r'（[^）]*[a-zA-Z][^）]*）', '', text)
        text = re.sub(r'\([^)]*[a-zA-Z][^)]*\)', '', text)

        # 移除連續空白
        text = re.sub(r'\s+', '', text)

        return text.strip()

    def normalize_jlpt(self, jlpt: str) -> str:
        """標準化 JLPT 等級"""
        if isinstance(jlpt, str):
            jlpt = jlpt.lower().strip()
            if jlpt in ['n5', 'n4', 'n3', 'n2', 'n1']:
                return jlpt
        return 'n5'

    def process_card(self, card: CardInfo) -> Question | None:
        """處理單張卡片，產生題目"""
        text = card.japanese_explanation
        if not text:
            return None

        # 產生字元分解
        characters = self.decompose_text(text)
        if not characters:
            self.warn(f"無法分解文字: {card.path}")
            return None

        # 計算 metadata
        has_kanji = any(self.is_kanji(c['display']) for c in characters)
        difficulty = self.calculate_difficulty(text, has_kanji)

        return Question(
            id=f"{card.category}-{card.number}",
            text=text,
            characters=characters,
            source={
                'path': f"/{card.category}/{card.path.stem}/",
                'title': card.title,
                'category': card.category,
                'jlpt': card.jlpt,
            },
            metadata={
                'characterCount': len(characters),
                'difficulty': difficulty,
                'hasKanji': has_kanji,
            },
        )

    def decompose_text(self, text: str) -> list[dict]:
        """分解文字為字元陣列"""
        # 使用 pykakasi 取得讀音資訊（保留上下文）
        result = self.kks.convert(text)

        characters = []

        for item in result:
            orig = item['orig']    # 原始文字
            hira = item['hira']    # 平假名

            # 逐字處理，並使用 pykakasi 提供的讀音
            chars = self.process_segment(orig, hira)
            characters.extend(chars)

        return characters

    def process_segment(self, orig: str, hira: str) -> list[dict]:
        """處理一個片段（可能是單字或詞組）"""
        chars = []

        # 如果原文與假名相同（純假名或符號），直接逐字處理
        if orig == hira:
            i = 0
            while i < len(orig):
                char, consumed = self.get_kana_with_romaji(orig, i)
                chars.append(char)
                i += consumed
            return chars

        # 漢字或混合文字：精確對齊原文與假名讀音
        chars = self.align_kanji_kana_precise(orig, hira)
        return chars

    def align_kanji_kana_precise(self, orig: str, hira: str) -> list[dict]:
        """精確對齊漢字與假名讀音

        策略：找出原文中的假名「錨點」，用它們來分割假名讀音
        例如：「覚える」(orig) 與「おぼえる」(hira)
        - 「える」是錨點，可以確定「覚」= 「おぼ」
        """
        chars = []

        # 分析原文結構，找出漢字區塊和假名錨點
        segments = self.segment_text(orig, hira)

        for segment in segments:
            if segment['type'] == 'kana':
                # 假名直接逐字處理
                text = segment['text']
                i = 0
                while i < len(text):
                    char_data, consumed = self.get_kana_with_romaji(text, i)
                    chars.append(char_data)
                    i += consumed

            elif segment['type'] == 'kanji':
                # 漢字區塊：使用完整讀音
                kanji_text = segment['text']
                kana_reading = segment['kana']
                romaji = self.build_romaji_for_kana(kana_reading)

                # 如果只有一個漢字，直接使用
                if len(kanji_text) == 1:
                    chars.append({
                        'display': kanji_text,
                        'kana': kana_reading,
                        'romaji': romaji,
                    })
                else:
                    # 多個漢字：作為一個整體輸入單位
                    chars.append({
                        'display': kanji_text,
                        'kana': kana_reading,
                        'romaji': romaji,
                    })

            elif segment['type'] == 'other':
                # 其他字元
                char = segment['text']
                if char in ROMAJI_MAP:
                    chars.append({
                        'display': char,
                        'kana': char,
                        'romaji': ROMAJI_MAP[char],
                    })
                else:
                    chars.append({
                        'display': char,
                        'kana': char,
                        'romaji': [char],
                    })

        return chars

    def segment_text(self, orig: str, hira: str) -> list[dict]:
        """將原文分割為假名、漢字區塊、其他字元

        返回：[{'type': 'kana'|'kanji'|'other', 'text': str, 'kana': str}, ...]
        """
        segments = []
        hira_pos = 0

        i = 0
        while i < len(orig):
            char = orig[i]

            if self.is_kana(char) or char in ROMAJI_MAP:
                # 假名或標點：收集連續的假名
                kana_start = i
                while i < len(orig) and (self.is_kana(orig[i]) or orig[i] in ROMAJI_MAP):
                    i += 1
                kana_text = orig[kana_start:i]

                # 對應的假名讀音應該相同
                hira_len = len(kana_text)
                hira_part = hira[hira_pos:hira_pos + hira_len]
                hira_pos += hira_len

                segments.append({
                    'type': 'kana',
                    'text': kana_text,
                    'kana': hira_part,
                })

            elif self.is_kanji(char):
                # 漢字：收集連續的漢字
                kanji_start = i
                while i < len(orig) and self.is_kanji(orig[i]):
                    i += 1
                kanji_text = orig[kanji_start:i]

                # 找出對應的假名讀音
                # 方法：找到下一個假名錨點
                if i < len(orig):
                    # 找下一個原文中的假名
                    next_kana_in_orig = None
                    for c in orig[i:]:
                        if self.is_kana(c):
                            next_kana_in_orig = c
                            break

                    if next_kana_in_orig and next_kana_in_orig in hira[hira_pos:]:
                        # 找到錨點，確定漢字讀音的範圍
                        anchor_in_hira = hira.find(next_kana_in_orig, hira_pos)
                        kana_reading = hira[hira_pos:anchor_in_hira]
                        hira_pos = anchor_in_hira
                    else:
                        # 沒有錨點，使用剩餘全部
                        kana_reading = hira[hira_pos:]
                        hira_pos = len(hira)
                else:
                    # 漢字在末尾
                    kana_reading = hira[hira_pos:]
                    hira_pos = len(hira)

                segments.append({
                    'type': 'kanji',
                    'text': kanji_text,
                    'kana': kana_reading,
                })

            else:
                # 其他字元（數字、英文等）
                segments.append({
                    'type': 'other',
                    'text': char,
                    'kana': char,
                })
                i += 1
                # 假名位置不變（其他字元沒有對應讀音）

        return segments

    def build_romaji_for_kana(self, kana: str) -> list[str]:
        """為假名字串建立羅馬字選項

        回傳所有可能的羅馬字組合（最多保留前 4 個）
        """
        if not kana:
            return []

        # 單字元直接查表
        if len(kana) == 1 and kana in ROMAJI_MAP:
            return ROMAJI_MAP[kana]

        # 多字元：使用 DFS 組合各字元的所有羅馬字選項
        all_options = self.generate_romaji_combinations(kana)

        # 限制返回數量，避免組合爆炸
        return all_options[:4] if all_options else [kana]

    def generate_romaji_combinations(self, kana: str) -> list[str]:
        """使用 DFS 生成所有羅馬字組合"""
        if not kana:
            return ['']

        results = []

        # 嘗試兩字組合（拗音）
        if len(kana) >= 2 and kana[:2] in ROMAJI_MAP:
            for option in ROMAJI_MAP[kana[:2]]:
                for suffix in self.generate_romaji_combinations(kana[2:]):
                    results.append(option + suffix)

        # 嘗試單字
        if kana[0] in ROMAJI_MAP:
            for option in ROMAJI_MAP[kana[0]]:
                for suffix in self.generate_romaji_combinations(kana[1:]):
                    results.append(option + suffix)
        elif not results:
            # 無法匹配，直接使用原字元
            for suffix in self.generate_romaji_combinations(kana[1:]):
                results.append(kana[0] + suffix)

        # 去重並限制數量
        seen = set()
        unique = []
        for r in results:
            if r not in seen:
                seen.add(r)
                unique.append(r)
            if len(unique) >= 8:  # 內部限制
                break

        return unique

    def get_kana_with_romaji(self, text: str, pos: int) -> tuple[dict, int]:
        """取得假名及其羅馬字"""
        # 優先檢查兩字組合（拗音等）
        if pos + 1 < len(text):
            two_char = text[pos:pos + 2]
            if two_char in ROMAJI_MAP:
                return {
                    'display': two_char,
                    'kana': two_char,
                    'romaji': ROMAJI_MAP[two_char],
                }, 2

        # 單字處理
        char = text[pos]

        # 檢查是否有羅馬字對應
        if char in ROMAJI_MAP:
            return {
                'display': char,
                'kana': char,
                'romaji': ROMAJI_MAP[char],
            }, 1

        # 其他字元（漢字、英數字等）直接保留
        return {
            'display': char,
            'kana': char,
            'romaji': [char],  # 直接輸入原字元
        }, 1

    def is_kanji(self, text: str) -> bool:
        """檢查是否包含漢字"""
        for char in text:
            code = ord(char)
            if (0x4E00 <= code <= 0x9FFF or  # CJK 統一漢字
                0x3400 <= code <= 0x4DBF or  # CJK 統一漢字擴展 A
                0xF900 <= code <= 0xFAFF):   # CJK 相容漢字
                return True
        return False

    def is_kana(self, char: str) -> bool:
        """檢查是否為假名"""
        code = ord(char)
        return (0x3040 <= code <= 0x309F or  # 平假名
                0x30A0 <= code <= 0x30FF)    # 片假名

    def calculate_difficulty(self, text: str, has_kanji: bool) -> str:
        """計算難度"""
        length = len(text)

        if length < 30 and not has_kanji:
            return 'easy'
        elif length < 60:
            return 'medium'
        else:
            return 'hard'

    def calculate_stats(self, questions: list[Question]) -> dict:
        """計算統計資訊"""
        by_jlpt: dict[str, int] = {}
        by_category: dict[str, int] = {}
        by_difficulty: dict[str, int] = {}

        for q in questions:
            jlpt = q.source['jlpt']
            category = q.source['category']
            difficulty = q.metadata['difficulty']

            by_jlpt[jlpt] = by_jlpt.get(jlpt, 0) + 1
            by_category[category] = by_category.get(category, 0) + 1
            by_difficulty[difficulty] = by_difficulty.get(difficulty, 0) + 1

        return {
            'totalQuestions': len(questions),
            'byJlpt': dict(sorted(by_jlpt.items())),
            'byCategory': dict(sorted(by_category.items())),
            'byDifficulty': by_difficulty,
        }

    def generate(self, zettelkasten_dir: Path, output_path: Path) -> int:
        """產生題庫"""
        # 掃描卡片
        cards = self.scan_cards(zettelkasten_dir)

        # 產生題目
        questions = []
        for card in cards:
            question = self.process_card(card)
            if question:
                questions.append(question)
                self.log(f"✓ {question.id}: {question.text[:30]}...")

        # 組裝輸出
        output = {
            'version': '1.1.0',
            'generated': datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
            'questions': [
                {
                    'id': q.id,
                    'text': q.text,
                    'characters': q.characters,
                    'source': q.source,
                    'metadata': q.metadata,
                }
                for q in questions
            ],
            'stats': self.calculate_stats(questions),
        }

        # 輸出
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(output, f, ensure_ascii=False, separators=(',', ':'))

        # 輸出統計
        print(f"✅ 產生 {len(questions)} 題到 {output_path}")
        print(f"   按 JLPT: {output['stats']['byJlpt']}")
        print(f"   按分類: {len(output['stats']['byCategory'])} 類")

        if self.warnings:
            print(f"\n⚠️  {len(self.warnings)} 個警告")

        return len(questions)


def main():
    parser = argparse.ArgumentParser(description='產生日文輸入練習題庫')
    parser.add_argument(
        '--output', '-o',
        default='static/data/questions.json',
        help='輸出檔案路徑（預設：static/data/questions.json）'
    )
    parser.add_argument(
        '--zettelkasten', '-z',
        default='zettelkasten',
        help='Zettelkasten 目錄路徑（預設：zettelkasten）'
    )
    parser.add_argument(
        '--verbose', '-v',
        action='store_true',
        help='顯示詳細輸出'
    )
    args = parser.parse_args()

    generator = QuestionGenerator(verbose=args.verbose)
    generator.generate(
        zettelkasten_dir=Path(args.zettelkasten),
        output_path=Path(args.output),
    )


if __name__ == '__main__':
    main()
