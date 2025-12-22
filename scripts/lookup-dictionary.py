#!/usr/bin/env python3
# /// script
# dependencies = ["pyobjc-framework-DictionaryServices"]
# requires-python = ">=3.10"
# ///

"""
macOS 字典查詢腳本（支援多字典）

用途：查詢日文詞彙的字典定義，從 スーパー大辞林 和 ウィズダム和英辞典 獲取資訊
執行：uv run scripts/lookup-dictionary.py <word> [選項]

參數：
  word                要查詢的日文詞彙

選項：
  --json              輸出 JSON 格式（預設）
  --raw               輸出原始字典文字
  --quiet             靜默模式，只輸出結果

範例：
  uv run scripts/lookup-dictionary.py 食べる
  uv run scripts/lookup-dictionary.py 朝ごはん --json
  uv run scripts/lookup-dictionary.py 勉強 --raw

輸出格式（JSON）：
{
  "query": "食べる",
  "found": true,
  "sources": {
    "daijirin": true,
    "waei": true
  },
  "data": {
    "reading": "たべる",
    "kanji": "食べる",
    "pos": "動詞",
    "pos_details": "一段動詞",
    "definition_ja": "食物を口に入れて...",
    "definition_en": "to eat; to have a meal"
  }
}

注意：此腳本僅在 macOS 上可用（依賴 DictionaryServices.framework）
"""

import json
import sys
import re
import platform
from typing import Optional


def check_platform() -> bool:
    """檢查是否在 macOS 上執行"""
    return platform.system() == "Darwin"


def get_dictionary_result(word: str) -> Optional[str]:
    """
    查詢 macOS 字典

    Args:
        word: 要查詢的詞彙

    Returns:
        字典返回的原始文字，或 None
    """
    try:
        from DictionaryServices import DCSCopyTextDefinition
        word_range = (0, len(word))
        result = DCSCopyTextDefinition(None, word, word_range)
        return result
    except ImportError:
        return None
    except Exception:
        return None


def parse_daijirin(raw: str) -> dict:
    """
    解析スーパー大辞林格式

    實際格式範例：
    た・べる 2【食べる】（動バ下一）《文バ下二 た・ぶ》〔本来は...〕① 食物を...
    """
    result = {
        "reading": None,
        "kanji": None,
        "pos": None,
        "pos_details": None,
        "definition": None
    }

    if not raw:
        return result

    # 提取讀音（開頭的假名，可能包含 ・ 分隔符）
    # 格式：た・べる 或 じしょ
    reading_match = re.match(r'^([ぁ-んァ-ンー・]+)', raw)
    if reading_match:
        # 移除分隔符號和空格
        reading = reading_match.group(1).replace("・", "").replace(" ", "")
        result["reading"] = reading

    # 提取漢字（【】內）
    kanji_match = re.search(r'【(.+?)】', raw)
    if kanji_match:
        result["kanji"] = kanji_match.group(1)

    # 提取詞性（全形括號或特殊括號）
    # 格式：（動バ下一） 或 〘名〙
    pos_patterns = [
        r'（([動名形副助接代感連枕].*?)）',  # 全形括號
        r'\(([動名形副助接代感連枕].*?)\)',   # 半形括號
        r'〘(.+?)〙',                         # 特殊括號
    ]

    for pattern in pos_patterns:
        pos_match = re.search(pattern, raw)
        if pos_match:
            pos_text = pos_match.group(1)
            result["pos_details"] = pos_text

            # 簡化詞性
            if "動" in pos_text:
                result["pos"] = "動詞"
                if "下一" in pos_text:
                    result["pos_details"] = "一段動詞（下一段）"
                elif "上一" in pos_text:
                    result["pos_details"] = "一段動詞（上一段）"
                elif "五" in pos_text:
                    result["pos_details"] = "五段動詞"
                elif "サ変" in pos_text or "サ行変格" in pos_text:
                    result["pos_details"] = "サ行變格動詞"
                elif "カ変" in pos_text or "カ行変格" in pos_text:
                    result["pos_details"] = "カ行變格動詞"
            elif "名" in pos_text:
                result["pos"] = "名詞"
            elif "形動" in pos_text:
                result["pos"] = "形容動詞"
            elif "形" in pos_text:
                result["pos"] = "形容詞"
            elif "副" in pos_text:
                result["pos"] = "副詞"
            break

    # 提取定義（① 或 數字標記後的內容）
    # 尋找第一個定義
    def_patterns = [
        r'[①②③④⑤]\s*(.+?)(?=[①②③④⑤]|$)',  # 圓圈數字
        r'〔[^〕]+〕\s*(.+?)(?=[①②③④⑤]|$)',    # 〔〕後的定義
    ]

    for pattern in def_patterns:
        def_match = re.search(pattern, raw, re.DOTALL)
        if def_match:
            definition = def_match.group(1).strip()
            # 清理定義文字
            definition = re.sub(r'「.+?」', '', definition)  # 移除例句
            definition = definition.split("。")[0] + "。" if "。" in definition else definition
            result["definition"] = definition[:200]  # 限制長度
            break

    # 如果沒有找到數字標記的定義，嘗試提取整體說明
    if not result["definition"]:
        # 尋找〔〕內的說明
        bracket_match = re.search(r'〔([^〕]+)〕', raw)
        if bracket_match:
            result["definition"] = bracket_match.group(1)[:200]

    return result


def parse_waei(raw: str) -> dict:
    """
    解析ウィズダム和英辞典格式

    格式範例：
    たべる【食べる】
    〔他下一〕
    eat; have 《a meal》
    ▸ パンを食べる eat [have] bread
    """
    result = {
        "reading": None,
        "kanji": None,
        "pos": None,
        "english": None,
        "examples": []
    }

    if not raw:
        return result

    lines = raw.strip().split("\n")
    if not lines:
        return result

    first_line = lines[0]

    # 提取讀音
    reading_match = re.match(r'^([ぁ-んァ-ンー]+)', first_line)
    if reading_match:
        result["reading"] = reading_match.group(1)

    # 提取漢字
    kanji_match = re.search(r'【(.+?)】', first_line)
    if kanji_match:
        result["kanji"] = kanji_match.group(1)

    # 提取詞性（〔〕格式）
    for line in lines:
        pos_match = re.search(r'〔(.+?)〕', line)
        if pos_match:
            result["pos"] = pos_match.group(1)
            break

    # 提取英文翻譯和例句
    for line in lines[1:]:
        line = line.strip()
        if not line:
            continue

        # 跳過詞性行
        if line.startswith("〔"):
            continue

        # 例句（▸ 開頭）
        if line.startswith("▸") or line.startswith("►"):
            result["examples"].append(line[1:].strip())
        # 英文翻譯（包含英文字母且不是例句）
        elif re.search(r'[a-zA-Z]', line) and not result["english"]:
            result["english"] = line

    return result


def lookup_dictionary(word: str) -> dict:
    """
    多字典查詢

    Args:
        word: 要查詢的日文詞彙

    Returns:
        結構化的查詢結果
    """
    # 平台檢查
    if not check_platform():
        return {
            "query": word,
            "found": False,
            "error": "platform_unsupported",
            "message": "DictionaryServices only available on macOS",
            "sources": {"daijirin": False, "waei": False},
            "data": {}
        }

    # 查詢字典
    raw_result = get_dictionary_result(word)

    if not raw_result:
        return {
            "query": word,
            "found": False,
            "error": "not_found",
            "message": f"No dictionary entry found for '{word}'",
            "sources": {"daijirin": False, "waei": False},
            "data": {}
        }

    # 解析結果
    result = {
        "query": word,
        "found": True,
        "sources": {
            "daijirin": False,
            "waei": False
        },
        "data": {},
        "raw": raw_result
    }

    # 檢測字典來源並解析
    # スーパー大辞林 使用全形括號 （） 或 〘〙 作為詞性標記
    # 特徵：包含 （動...） 或 〘名〙 等詞性標記，且有日文定義
    has_pos_marker = bool(re.search(r'（[動名形副助接代感連枕]', raw_result)) or "〘" in raw_result

    if has_pos_marker:
        result["sources"]["daijirin"] = True
        parsed = parse_daijirin(raw_result)
        if parsed["reading"]:
            result["data"]["reading"] = parsed["reading"]
        if parsed["kanji"]:
            result["data"]["kanji"] = parsed["kanji"]
        if parsed["pos"]:
            result["data"]["pos"] = parsed["pos"]
        if parsed["pos_details"]:
            result["data"]["pos_details"] = parsed["pos_details"]
        if parsed["definition"]:
            result["data"]["definition_ja"] = parsed["definition"]

    # ウィズダム和英辞典 使用 〔〕 作為詞性標記，且包含英文翻譯
    # 特徵：包含英文單字（2個以上連續英文字母）
    if re.search(r'[a-zA-Z]{2,}', raw_result):
        parsed = parse_waei(raw_result)
        if parsed["english"]:
            result["sources"]["waei"] = True
            result["data"]["definition_en"] = parsed["english"]
        if parsed["examples"]:
            result["data"]["examples_waei"] = parsed["examples"]

        # 如果日日字典沒有解析到，使用和英字典的資料
        if not result["data"].get("reading") and parsed["reading"]:
            result["data"]["reading"] = parsed["reading"]
        if not result["data"].get("kanji") and parsed["kanji"]:
            result["data"]["kanji"] = parsed["kanji"]

    return result


def main():
    """主程式入口"""
    import argparse

    parser = argparse.ArgumentParser(
        description="macOS 字典查詢腳本（支援多字典）"
    )
    parser.add_argument("word", help="要查詢的日文詞彙")
    parser.add_argument(
        "--json",
        action="store_true",
        default=True,
        help="輸出 JSON 格式（預設）"
    )
    parser.add_argument(
        "--raw",
        action="store_true",
        help="輸出原始字典文字"
    )
    parser.add_argument(
        "--quiet",
        action="store_true",
        help="靜默模式"
    )

    args = parser.parse_args()

    # 查詢字典
    result = lookup_dictionary(args.word)

    # 輸出結果
    if args.raw and result.get("raw"):
        print(result["raw"])
    else:
        # 移除 raw 欄位（太長）
        output = {k: v for k, v in result.items() if k != "raw"}
        print(json.dumps(output, ensure_ascii=False, indent=2))

    # 設定退出碼
    sys.exit(0 if result["found"] else 1)


if __name__ == "__main__":
    main()
