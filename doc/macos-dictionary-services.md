# macOS DictionaryServices 技術文檔

> 本文檔整理 macOS 內建字典服務的 API 調用細節，供未來整合日文字典查詢功能時參考。

---

## 1. 概述

### 1.1 macOS 字典服務簡介

macOS 內建 `DictionaryServices.framework`，這是一個系統層級的 API，讓應用程式可以查詢本地字典。日文輸入法在顯示候選字時，會自動調用此服務來顯示定義。

**核心優勢**：

| 特點 | 說明 |
|------|------|
| 離線運作 | 字典資料儲存在本地，不需要網路連線 |
| 系統整合 | 與日文輸入法無縫整合 |
| 高品質內容 | 使用知名出版社的正版字典 |
| 免費使用 | 隨 macOS 預裝，無額外費用 |

### 1.2 內建日文字典清單

macOS 預裝以下日文相關字典（可在「字典」應用程式的偏好設定中啟用）：

| 字典名稱 | 出版社 | 類型 | 卡片用途 |
|----------|--------|------|----------|
| **スーパー大辞林** | 三省堂 | 日→日 | 讀音、詞性、日文定義 |
| **ウィズダム和英辞典** | 三省堂 | 日→英 | **英文翻譯**（直接使用） |
| ウィズダム英和辞典 | 三省堂 | 英→日 | 輔助參考 |
| Apple 辞書 | Apple | 系統字典 | 基本詞彙定義 |

### 1.3 字典歷史沿革

- **Mac OS X 10.5**：首次加入日文辭典，使用小学館的『大辞泉』『プログレッシブ英和・和英中辞典』
- **OS X 10.8 (Mountain Lion)**：日文辭典更換為三省堂的『スーパー大辞林』『ウィズダム英和・和英辞典』
- **現行版本**：繼續使用三省堂字典

### 1.4 卡片系統整合策略

```
┌─────────────────────────────────────────┐
│           字典資料（權威來源）            │
├─────────────────────────────────────────┤
│ スーパー大辞林 → 讀音、詞性、日文定義    │
│ ウィズダム和英 → 英文翻譯               │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│           AI 增值（創意內容）            │
├─────────────────────────────────────────┤
│ • 中文翻譯（macOS 無日中字典）           │
│ • 擴充日文解釋（使用情境、文化背景）     │
│ • 例句設計（3-5 個自然例句）            │
│ • 學習要點、常見錯誤                    │
└─────────────────────────────────────────┘
```

### 1.5 管理字典

**開啟字典偏好設定**：

```bash
open -a Dictionary
# 然後按 Cmd+, 開啟偏好設定
```

在偏好設定中可以：
- 啟用/停用特定字典
- 調整字典優先順序（影響查詢結果）
- 下載額外的語言字典

---

## 2. 技術架構

### 2.1 Framework 說明

```
DictionaryServices.framework
├── DCSCopyTextDefinition()    # 主要查詢函數
├── DCSGetTermRangeInString()  # 取得詞彙範圍
└── DCSDictionaryRef           # 字典參照（可選）
```

**Framework 路徑**：
```
/System/Library/Frameworks/CoreServices.framework/Frameworks/DictionaryServices.framework
```

### 2.2 核心 API 函數

#### DCSCopyTextDefinition

```c
CFStringRef DCSCopyTextDefinition(
    DCSDictionaryRef dictionary,  // NULL = 使用所有啟用的字典
    CFStringRef textString,       // 要查詢的文字
    CFRange range                 // 查詢範圍 (location, length)
);
```

**參數說明**：

| 參數 | 類型 | 說明 |
|------|------|------|
| `dictionary` | DCSDictionaryRef | 指定字典，傳入 `NULL` 使用所有啟用的字典 |
| `textString` | CFStringRef | 包含要查詢詞彙的字串 |
| `range` | CFRange | 詞彙在字串中的位置和長度 |

**返回值**：
- 成功：包含定義的 CFStringRef
- 失敗：`NULL`（找不到定義）

#### DCSGetTermRangeInString

```c
CFRange DCSGetTermRangeInString(
    DCSDictionaryRef dictionary,  // NULL = 使用所有啟用的字典
    CFStringRef textString,       // 包含詞彙的字串
    CFIndex offset                // 游標位置
);
```

此函數可自動識別游標位置的詞彙邊界，適合處理句子中的詞彙查詢。

### 2.3 資料流程

```
┌─────────────────────────────────────────────────────────────┐
│                        查詢流程                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Python 程式                                                │
│      │                                                      │
│      ▼                                                      │
│  PyObjC Bridge                                              │
│      │                                                      │
│      ▼                                                      │
│  DictionaryServices.framework                               │
│      │                                                      │
│      ▼                                                      │
│  本地字典檔案 (~/.../Dictionaries/)                          │
│      │                                                      │
│      ▼                                                      │
│  返回純文字定義                                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Python 整合

### 3.1 安裝依賴

使用 `uv` 安裝 PyObjC 框架：

```bash
# 推薦：同時安裝兩個套件以確保相容性
uv add pyobjc-framework-CoreServices
uv add pyobjc-framework-DictionaryServices
```

**套件資訊**：

| 套件 | 版本 | Python 要求 |
|------|------|-------------|
| pyobjc-framework-DictionaryServices | 11.0+ | >= 3.9 |
| pyobjc-framework-CoreServices | 11.0+ | >= 3.9 |

> **注意**：DictionaryServices wrappers 已被標記為 deprecated，建議同時安裝 CoreServices 以確保未來相容性。

### 3.2 基本查詢範例

```python
#!/usr/bin/env python3
"""macOS 字典查詢基本範例"""

from DictionaryServices import DCSCopyTextDefinition

def lookup_word(word: str) -> str | None:
    """
    查詢單字定義

    Args:
        word: 要查詢的單字

    Returns:
        定義文字，或 None（找不到時）
    """
    # 設定查詢範圍：從位置 0 開始，長度為整個字串
    word_range = (0, len(word))

    # 查詢（第一個參數為 None 表示使用所有啟用的字典）
    result = DCSCopyTextDefinition(None, word, word_range)

    return result


if __name__ == "__main__":
    # 英文測試
    print(lookup_word("dictionary"))

    # 日文測試
    print(lookup_word("辞書"))
```

### 3.3 日文詞彙查詢範例

```python
#!/usr/bin/env python3
"""日文詞彙字典查詢工具"""

from DictionaryServices import DCSCopyTextDefinition, DCSGetTermRangeInString


def lookup_japanese(word: str) -> dict:
    """
    查詢日文詞彙，返回結構化結果

    Args:
        word: 日文詞彙（漢字或假名）

    Returns:
        包含查詢結果的字典
    """
    word_range = (0, len(word))
    result = DCSCopyTextDefinition(None, word, word_range)

    return {
        "query": word,
        "found": result is not None,
        "definition": result if result else "（找不到定義）"
    }


def lookup_in_sentence(sentence: str, cursor_position: int) -> dict:
    """
    從句子中查詢游標位置的詞彙

    Args:
        sentence: 完整句子
        cursor_position: 游標位置（0-indexed）

    Returns:
        包含識別詞彙和定義的字典
    """
    # 自動識別詞彙邊界
    term_range = DCSGetTermRangeInString(None, sentence, cursor_position)

    if term_range.location == -1:  # kCFNotFound
        return {"found": False, "term": None, "definition": None}

    # 提取詞彙
    term = sentence[term_range.location:term_range.location + term_range.length]

    # 查詢定義
    definition = DCSCopyTextDefinition(None, sentence, term_range)

    return {
        "found": definition is not None,
        "term": term,
        "range": (term_range.location, term_range.length),
        "definition": definition
    }


# 使用範例
if __name__ == "__main__":
    # 單字查詢
    words = ["食べる", "美しい", "本", "勉強"]

    for word in words:
        result = lookup_japanese(word)
        print(f"\n【{word}】")
        if result["found"]:
            # 只顯示前 200 字元
            preview = result["definition"][:200] + "..." \
                if len(result["definition"]) > 200 else result["definition"]
            print(preview)
        else:
            print("找不到定義")

    # 句子中查詢
    sentence = "今日は天気がいいですね"
    result = lookup_in_sentence(sentence, 3)  # 游標在「天」
    print(f"\n句子查詢：{result}")
```

### 3.4 返回值格式解析

字典返回的是**純文字**，格式因字典而異。以下是典型的返回格式：

**スーパー大辞林 範例**（查詢「辞書」）：

```
じしょ【辞書】
〘名〙
語句を一定の基準によって配列し、その読み・意味・用法などを記した書物。
辞典。字引き。
```

**解析要點**：

| 部分 | 格式 | 範例 |
|------|------|------|
| 讀音 | 平假名在最前面 | `じしょ` |
| 漢字 | 【】包圍 | `【辞書】` |
| 詞性 | 〘〙包圍 | `〘名〙` |
| 定義 | 純文字 | 語句を一定の... |
| 同義詞 | 句末列出 | 辞典。字引き。 |

**程式化解析範例**：

```python
import re

def parse_japanese_definition(raw_definition: str) -> dict:
    """
    解析日文字典定義（スーパー大辞林格式）

    注意：此為簡化版本，實際格式可能更複雜
    """
    result = {
        "reading": None,
        "kanji": None,
        "pos": None,  # part of speech
        "definition": None,
        "raw": raw_definition
    }

    if not raw_definition:
        return result

    lines = raw_definition.strip().split("\n")

    # 第一行通常包含讀音和漢字
    first_line = lines[0] if lines else ""

    # 提取讀音（開頭的平假名）
    reading_match = re.match(r'^([ぁ-んー]+)', first_line)
    if reading_match:
        result["reading"] = reading_match.group(1)

    # 提取漢字（【】內）
    kanji_match = re.search(r'【(.+?)】', first_line)
    if kanji_match:
        result["kanji"] = kanji_match.group(1)

    # 提取詞性（〘〙內）
    pos_match = re.search(r'〘(.+?)〙', raw_definition)
    if pos_match:
        result["pos"] = pos_match.group(1)

    # 定義為剩餘內容
    # 移除第一行和詞性標記後的文字
    definition_text = "\n".join(lines[1:]) if len(lines) > 1 else ""
    definition_text = re.sub(r'〘.+?〙', '', definition_text).strip()
    result["definition"] = definition_text

    return result
```

### 3.5 和英字典（ウィズダム和英辞典）格式

和英字典返回的是日文→英文翻譯，格式與日日字典不同：

**ウィズダム和英辞典 範例**（查詢「食べる」）：

```
たべる【食べる】
〔他下一〕
eat; have 《a meal》
▸ パンを食べる eat [have] bread
▸ 朝食を食べる have [eat] breakfast
```

**解析要點**：

| 部分 | 格式 | 範例 |
|------|------|------|
| 讀音 | 開頭平假名 | `たべる` |
| 漢字 | 【】包圍 | `【食べる】` |
| 詞性 | 〔〕包圍 | `〔他下一〕` |
| 英文翻譯 | 主要翻譯在第三行 | `eat; have 《a meal》` |
| 例句 | ▸ 開頭 | `▸ パンを食べる eat [have] bread` |

**程式化解析範例**：

```python
import re

def parse_waei_definition(raw_definition: str) -> dict:
    """
    解析和英字典定義（ウィズダム和英辞典格式）
    """
    result = {
        "reading": None,
        "kanji": None,
        "pos": None,
        "english": None,
        "examples": [],
        "raw": raw_definition
    }

    if not raw_definition:
        return result

    lines = raw_definition.strip().split("\n")

    # 第一行：讀音和漢字
    if lines:
        first_line = lines[0]
        reading_match = re.match(r'^([ぁ-んー]+)', first_line)
        if reading_match:
            result["reading"] = reading_match.group(1)
        kanji_match = re.search(r'【(.+?)】', first_line)
        if kanji_match:
            result["kanji"] = kanji_match.group(1)

    # 第二行：詞性（〔〕格式）
    if len(lines) > 1:
        pos_match = re.search(r'〔(.+?)〕', lines[1])
        if pos_match:
            result["pos"] = pos_match.group(1)

    # 第三行開始：英文翻譯
    for i, line in enumerate(lines[2:], start=2):
        if line.startswith("▸"):
            # 例句
            result["examples"].append(line[1:].strip())
        elif not result["english"] and not line.startswith("〔"):
            # 主要英文翻譯（第一個非例句行）
            result["english"] = line.strip()

    return result
```

### 3.6 多字典查詢策略

為獲取完整資訊，需要同時查詢多本字典：

```python
def lookup_multi_dictionary(word: str) -> dict:
    """
    多字典查詢：同時查詢日日字典和和英字典
    """
    # 基本查詢（返回所有啟用字典的結果）
    raw_result = DCSCopyTextDefinition(None, word, (0, len(word)))

    if not raw_result:
        return {"found": False, "sources": {}}

    # 根據返回格式判斷來源
    result = {
        "found": True,
        "query": word,
        "sources": {
            "daijirin": False,
            "waei": False
        },
        "data": {}
    }

    # 檢查是否包含日日字典格式（〘〙詞性標記）
    if "〘" in raw_result:
        result["sources"]["daijirin"] = True
        parsed = parse_japanese_definition(raw_result)
        result["data"]["reading"] = parsed["reading"]
        result["data"]["kanji"] = parsed["kanji"]
        result["data"]["pos"] = parsed["pos"]
        result["data"]["definition_ja"] = parsed["definition"]

    # 檢查是否包含和英字典格式（〔〕詞性或英文）
    if "〔" in raw_result or re.search(r'[a-zA-Z]', raw_result):
        result["sources"]["waei"] = True
        parsed = parse_waei_definition(raw_result)
        if parsed["english"]:
            result["data"]["definition_en"] = parsed["english"]
        if parsed["examples"]:
            result["data"]["examples_waei"] = parsed["examples"]

    return result
```

**注意事項**：

- `DCSCopyTextDefinition(None, ...)` 會返回**所有啟用字典**的合併結果
- 返回格式可能包含多個字典的內容混合在一起
- 需要根據格式特徵（〘〙 vs 〔〕）來區分來源
- 建議在「字典」偏好設定中調整字典順序，確保日日字典優先

---

## 4. 與專案整合可能性

### 4.1 驗證卡片定義

可建立驗證腳本，比對 AI 生成的卡片內容與字典定義：

```python
# scripts/verify-with-dictionary.py（概念範例）

def verify_card(card_path: str) -> dict:
    """
    驗證卡片內容與字典定義的一致性
    """
    # 1. 讀取卡片 YAML
    card = load_card(card_path)

    # 2. 查詢字典
    dict_result = lookup_japanese(card["japanese"])

    # 3. 比對
    return {
        "card_reading": card.get("reading"),
        "dict_reading": parse_reading(dict_result),
        "reading_match": card.get("reading") == parse_reading(dict_result),
        # ... 其他比對項目
    }
```

### 4.2 補充例句和讀音

字典定義通常包含：
- 準確的讀音標註
- 標準例句
- 詞性分類
- 同義詞/反義詞

這些可用於：
- 驗證卡片的假名標註
- 補充 `## 例句` 區塊
- 確認詞性分類是否正確

### 4.3 整合到代理人流程的建議

**選項 A：驗證工具**

```bash
# 批次驗證所有 draft 狀態的卡片
uv run scripts/verify-with-dictionary.py --stage draft
```

**選項 B：build-card-content 輔助**

在代理人建立卡片時，可選擇性查詢字典作為參考：

```markdown
## 代理人指示（更新版）

1. 建立卡片內容
2. （可選）呼叫字典查詢工具驗證
3. 如有差異，標註供人工審查
```

**選項 C：Slash Command**

建立 `/lookup` 命令供互動查詢：

```bash
/lookup 食べる
# 返回字典定義，可複製到卡片中
```

---

## 5. 限制與注意事項

### 5.1 平台限制

| 限制 | 說明 | 解決方案 |
|------|------|----------|
| 僅限 macOS | DictionaryServices 是 Apple 專有 API | 在非 macOS 環境跳過此功能 |
| 需要 Python 3.9+ | PyObjC 最新版本要求 | 確保開發環境符合要求 |

### 5.2 字典可用性

- 用戶必須在「字典」偏好設定中啟用日文字典
- 不同 macOS 版本的預裝字典可能不同
- 部分字典需要手動下載

**檢查字典可用性**：

```python
def check_dictionary_available() -> bool:
    """檢查日文字典是否可用"""
    test_result = lookup_japanese("日本")
    return test_result["found"]
```

### 5.3 返回格式非結構化

- 字典返回純文字，非 JSON 或其他結構化格式
- 不同字典的格式可能不同
- 解析需要針對特定字典調整正則表達式

### 5.4 查詢限制

- 無法指定只查詢特定字典（除非透過 DCSDictionaryRef）
- 複合詞可能查不到（需拆解）
- 部分專有名詞或新詞可能不收錄

---

## 6. 參考資源

### 6.1 官方文檔

- [Apple DictionaryServices Reference](https://developer.apple.com/documentation/coreservices/dictionary_services)（已歸檔）

### 6.2 PyObjC 資源

- [pyobjc-framework-DictionaryServices · PyPI](https://pypi.org/project/pyobjc-framework-DictionaryServices/)
- [PyObjC DictionaryServices API Notes](https://pyobjc.readthedocs.io/en/latest/apinotes/DictionaryServices.html)
- [pyobjc-framework-CoreServices · PyPI](https://pypi.org/project/pyobjc-framework-CoreServices/)

### 6.3 社群範例

- [Access osx dictionary in python · GitHub Gist](https://gist.github.com/lambdamusic/bdd56b25a5f547599f7f)
- [Python Tips: Mac の辞書アプリを Python から利用したい](https://www.lifewithpython.com/2016/07/python-use-mac-dictionary-app.html)

### 6.4 相關專案文檔

- `doc/hooks/03-uv-single-file-pattern.md` - 維護工具開發模式
- `.claude/agents/build-card-content.md` - 卡片內容建立代理人

---

**文檔建立日期**：2025-12-22
**最後更新**：2025-12-22（補充和英字典格式與多字典查詢策略）
