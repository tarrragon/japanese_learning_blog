# 日文學習 Zettelkasten 系統

## 專案概述

這是一個結合 AI 輔助和 Zettelkasten（卡片盒筆記）方法的日文學習系統。透過將日文文章拆解為原子化的知識卡片，建立一個相互連結的知識網絡，幫助學習者在不同領域和情境下掌握日文的使用方法。

本專案使用 Claude 代理人協助建立、延伸和維護卡片系統，實現智能化的卡片管理與連結建立。

### 核心功能

1. **詞彙卡片系統** - 動詞、名詞、形容詞等基礎詞彙卡片
2. **延伸卡片系統** - 文法、語用、文化等概念卡片
3. **雙重連結系統**：
   - 標準 Wikilink 連結 `[[card]]` - 用於相關卡片列表
   - 腳註標註 `[^note]` - 用於文內概念說明
4. **代理人** - 自動檢測遺漏卡片並建立草稿

## 版本管理

當前版本：**1.0.0**

### 語義化版本規範

版本格式：`MAJOR.MINOR.PATCH`

- **MAJOR（大版本）**：專案結構或核心功能有重大變動
  - 例：卡片格式重新設計、資料夾結構改變、核心代理人邏輯大幅修改

- **MINOR（中版本）**：新增或修改 slash command 或代理人
  - 例：新增 `/create-grammar-card` 指令
  - 例：修改 `build-card-links` 代理人邏輯
  - 例：新增 `create-cultural-cards` 代理人

- **PATCH（小版本）**：卡片內容的新增、修改或修復
  - 例：新增 10 張動詞卡片
  - 例：補充現有卡片的腳註和連結
  - 例：修正卡片格式錯誤

### 版本更新流程

1. 確認變更類型（大版本/中版本/小版本）
2. 更新 `CHANGELOG.md` 記錄變更
3. 更新版本號
4. 提交並建立 PR

## 工作流程循環

本專案採用**四階段迭代循環**開發卡片系統。每個小版本（PATCH）對應一個完整的工作流程循環。

### 卡片四個階段

每張卡片在生命週期中會經歷以下階段：

1. **draft** - 草稿階段
   - 卡片剛建立，包含基本資訊
   - YAML 包含 `draft: true`, `auto_generated: true`, `needs_review: true`
   - 需要補充完整內容

2. **extension-review** - 延伸卡片檢查階段
   - 基礎內容已完成
   - 等待延伸卡片代理人檢查是否需要建立相關延伸卡片
   - 可能會產生新的草稿卡片

3. **linking** - 建立連結與腳註階段
   - 延伸卡片已檢查完成
   - 等待連結建立代理人補充：
     - 標準連結（Related Links）
     - 腳註標註（Footnotes）
   - 可能會產生新的草稿卡片

4. **completed** - 完成階段
   - 所有連結和腳註已補充
   - 卡片內容完整
   - 可以進入下一個循環進行優化

### 循環流程

#### 循環 N（版本 1.0.N）：

**階段 1：草稿完善**
```bash
# 執行：找出所有 stage: draft 的卡片
# 代理人：人工審查 + 內容補充
# 輸出：將卡片更新為 stage: extension-review
```

**階段 2：延伸卡片檢查**
```bash
# 執行延伸卡片代理人
/create-extension-cards

# 輸入：所有 stage: extension-review 的卡片
# 輸出：
#   - 識別需要的延伸卡片（文法、語用、文化等）
#   - 建立新的延伸卡片草稿（stage: draft）
#   - 將處理完的卡片更新為 stage: linking
```

**階段 3：連結與腳註建立**
```bash
# 執行連結建立代理人（對每張卡片）
# 使用 build-card-links subagent

# 輸入：所有 stage: linking 的卡片
# 輸出：
#   - 補充標準連結（Related Links 區塊）
#   - 補充腳註標註（Footnotes）
#   - 識別遺漏的卡片並建立草稿（stage: draft）
#   - 將處理完的卡片更新為 stage: completed
```

**階段 4：完成與記錄**
```bash
# 將 stage: completed 的卡片記錄到工作流程文檔
# 更新 CHANGELOG.md
# 提交版本 1.0.N
```

#### 循環 N+1（版本 1.0.N+1）：

回到階段 1，處理：
- 上一循環產生的 `stage: draft` 卡片
- 任何新建立的詞彙卡片

### 工作流程文檔

每個小版本一個工作流程文檔，放在 `doc/worklog/worklog-{version}.md`

**格式範例**：`doc/worklog/worklog-1.0.0.md`

工作流程文檔必須記錄：
- **各階段卡片清單** - 哪些卡片在哪個階段
- **循環開始日期**
- **循環完成日期**
- **本循環新增的卡片數量**
- **本循環完成的卡片數量**
- **發現的問題與改進**

範例格式參考 `doc/worklog/worklog-1.0.0.md`。

## 核心理念

### Zettelkasten 原則
1. **原子化**：每張卡片只包含一個概念、詞彙或文法點
2. **連結性**：卡片之間透過連結形成知識網絡
3. **漸進式成長**：知識網絡隨著學習自然擴展
4. **驚喜發現**：透過連結產生新的理解和洞察

### 多語言學習法
- **三語對照**：日文、英文、中文繁體
- **例句導向**：以日文為思考核心，提供實際使用情境
- **情境分類**：根據使用場景和領域組織知識

## 系統架構

### 目錄結構

```
japanese_learning_blog/
├── .claude.md                          # 本專案說明文件
├── README.md                           # 使用者說明文件
├── .claude/
│   └── commands/                       # Slash Commands
│       ├── analyze-article.md          # 分析文章
│       ├── extract-vocab.md            # 提取詞彙
│       ├── explain-grammar.md          # 解釋文法
│       ├── generate-exercises.md       # 生成練習題
│       └── create-zettel.md           # 建立 Zettelkasten 卡片（新）
├── articles/                           # 原始文章庫
│   ├── README.md
│   └── [文章檔案]
└── zettelkasten/                       # 卡片盒系統
    ├── index.md                        # 主索引
    ├── _meta/                          # 元資訊系統（新）
    │   ├── index.md                    # Meta 系統說明
    │   ├── tags/                       # Tag 定義卡片
    │   │   ├── index.md
    │   │   ├── context/                # 使用情境標籤
    │   │   │   ├── index.md
    │   │   │   ├── 001_business.md
    │   │   │   ├── 002_casual.md
    │   │   │   └── ...（共 6 個）
    │   │   ├── domain/                 # 領域標籤
    │   │   │   ├── index.md
    │   │   │   ├── 001_economics.md
    │   │   │   └── ...（共 3 個）
    │   │   └── jlpt/                   # JLPT 等級標籤
    │   │       ├── index.md
    │   │       ├── 001_n5.md
    │   │       └── ...（共 6 個）
    │   └── categories/                 # Category 定義卡片
    │       ├── index.md
    │       ├── 001_noun.md
    │       └── ...（共 23 個）
    ├── noun/                           # 名詞卡片
    │   ├── index.md
    │   └── 001_xxx.md
    ├── verb-ru/                        # る動詞（一段動詞）
    │   ├── index.md
    │   └── 001_xxx.md
    ├── verb-u/                         # う動詞（五段動詞）
    ├── verb-irr/                       # 不規則動詞
    ├── adj-i/                          # い形容詞
    ├── adj-na/                         # な形容詞
    ├── adverb/                         # 副詞
    ├── particle/                       # 助詞
    ├── auxiliary/                      # 助動詞
    ├── conjunction/                    # 接續詞
    ├── counter/                        # 量詞/助數詞
    ├── rentaishi/                      # 連體詞
    ├── prefix/                         # 接頭詞
    ├── suffix/                         # 接尾詞
    ├── idiom/                          # 慣用語
    ├── proverb/                        # 諺語
    ├── onomatopoeia/                   # 擬聲擬態詞
    ├── phrase/                         # 常用短語
    ├── honorific/                      # 敬語表現
    ├── grammar/                        # 文法卡片
    ├── concept/                        # 概念卡片
    ├── contrast/                       # 對比卡片
    └── context/                        # 情境卡片
```

## 卡片系統

### 卡片分類

#### 詞彙類
- `noun` - 名詞
- `verb-ru` - る動詞（一段動詞）
- `verb-u` - う動詞（五段動詞）
- `verb-irr` - 不規則動詞（する、くる）
- `adj-i` - い形容詞
- `adj-na` - な形容詞（形容動詞）
- `adverb` - 副詞

#### 文法功能詞
- `particle` - 助詞（は、が、を、に等）
- `auxiliary` - 助動詞（れる、られる、せる等）
- `conjunction` - 接續詞（そして、しかし等）

#### 特殊詞類
- `counter` - 量詞/助數詞（枚、本、人等）
- `rentaishi` - 連體詞（この、その、ある等）
- `prefix` - 接頭詞（お、ご、不等）
- `suffix` - 接尾詞（的、性、化等）

#### 表達類
- `idiom` - 慣用語/成語（油を売る等）
- `proverb` - 諺語/格言
- `onomatopoeia` - 擬聲詞/擬態詞（わくわく、ざあざあ等）
- `phrase` - 常用短語/句型
- `honorific` - 敬語表達

#### 概念與知識
- `concept` - 概念卡片（抽象概念、文化概念等）
- `grammar` - 文法卡片（文法規則、句型等）
- `contrast` - 對比卡片（相似詞彙辨析）
- `context` - 情境卡片（特定場景用語）

### 卡片格式

每張卡片都是一個 Markdown 檔案，結構如下：

```yaml
---
title: [卡片標題]
description: [簡短描述]
type: [卡片類型]
jlpt: [等級]
stage: [卡片階段]          # draft | extension-review | linking | completed
tags:
  - context/[使用情境]
  - domain/[領域]
  - jlpt/[等級]
date: YYYY-MM-DD
updated: YYYY-MM-DD        # 最後更新日期
links:
  連結詞彙1: 相對路徑1
  連結詞彙2: 相對路徑2
---

## 日文
[日文原文及假名]

**羅馬拼音**：[romaji]

[根據詞性添加相關資訊，如動詞變化、形容詞變化等]

## 日文解釋
[用日文解釋這個概念/詞彙，如同日日辭典的解釋]

## 英文解釋
[用英文解釋這個概念/詞彙]

## 中文解釋
[用繁體中文解釋]

## 例句

**例句1**
```
[日文例句]
[英文翻譯]
[中文翻譯]
```

**例句2**
```
[日文例句]
[英文翻譯]
[中文翻譯]
```
```

## YAML Frontmatter 結構化系統

### 設計原則

**核心理念**：將所有關鍵資訊集中在 YAML frontmatter 中，實現高效搜尋和判斷，無需讀取完整卡片內容。

**優勢**：
1. **搜尋效率**：只需讀取前 20-30 行即可判斷關聯性（提升 10-100 倍速度）
2. **結構化資料**：所有元數據都是結構化的，容易解析和比對
3. **可擴展性**：隨系統成長，YAML 可以輕鬆新增欄位
4. **一致性**：強制所有卡片使用統一格式

### YAML 欄位規範

#### 必需欄位（所有卡片都要有）

```yaml
---
title: verb-ru/taberu              # 卡片標識（路徑格式）
description: 吃（食物）            # 簡短中文說明（一句話）
type: verb                         # 卡片類型
jlpt: n5                          # JLPT 等級
stage: completed                   # 卡片階段：draft | extension-review | linking | completed
created: 2025-10-28                # 建立日期
updated: 2025-10-28                # 最後更新日期
---
```

#### 詞彙卡片的標準欄位

```yaml
---
title: verb-ru/taberu              # 必需
description: 吃（食物）            # 必需
type: verb                         # 必需：noun, verb, adj-i, adj-na 等
subtype: ichidan                   # 推薦：細分類型（ichidan, godan, na, i 等）
jlpt: n5                          # 必需：n5, n4, n3, n2, n1, none
stage: completed                   # 必需：draft | extension-review | linking | completed
tags: [daily_life, casual, family] # 必需：至少一個 tag
synonyms: [meshiagaru, itadaku]    # 可選：同義詞列表（羅馬拼音）
antonyms: [nokosu]                 # 可選：反義詞列表
related_words: [asagohan, tabemono] # 可選：相關詞彙
created: 2025-10-28                # 必需
updated: 2025-10-28                # 必需
---
```

#### 延伸卡片的標準欄位

```yaml
---
title: verb-ru/taberu_001_keigo    # 必需：延伸卡片命名規則
description: 食べる的敬語用法      # 必需
type: extension_card               # 必需：extension_card
extension_type: keigo              # 必需：keigo, nuance, register 等
base_card: verb-ru/taberu          # 必需：指向基本卡片
jlpt: n4                          # 必需：延伸內容的等級
stage: completed                   # 必需：draft | extension-review | linking | completed
tags: [formal, business]           # 必需
related_extensions: [taberu_003_register] # 可選：同詞彙的其他延伸
created: 2025-10-28                # 必需
updated: 2025-10-28                # 必需
---
```

#### 語法卡片的標準欄位

```yaml
---
title: grammar/te_form             # 必需
description: 動詞て形              # 必需
type: grammar                      # 必需
grammar_type: verb_conjugation     # 推薦：語法類型
jlpt: n5                          # 必需
stage: completed                   # 必需：draft | extension-review | linking | completed
tags: [basic_grammar]              # 必需
applies_to: [verb]                 # 可選：適用的詞類
related_grammar: [ta_form, te_iru] # 可選：相關語法
created: 2025-10-28                # 必需
updated: 2025-10-28                # 必需
---
```

#### 概念卡片的標準欄位

```yaml
---
title: concept/bukka_joushou       # 必需
description: 物價上漲              # 必需
type: concept                      # 必需
domain: economics                  # 推薦：所屬領域
jlpt: n1                          # 必需
stage: completed                   # 必需：draft | extension-review | linking | completed
tags: [economics, formal]          # 必需
component_words: [bukka, joushou]  # 可選：組成詞彙
related_concepts: [infure, keizai_seichou] # 可選：相關概念
created: 2025-10-28                # 必需
updated: 2025-10-28                # 必需
---
```

### 檔名與 YAML 的對應關係

**重要原則**：檔名和 YAML 必須一致，這是高效搜尋的基礎。

```
檔案路徑：verb-ru/001_taberu.md

YAML：
---
title: verb-ru/taberu    # ✅ 對應檔名（去掉編號）
description: 吃（食物）
type: verb               # ✅ 對應目錄（verb-ru → verb）
subtype: ichidan         # ✅ 對應目錄（ru → ichidan）
---
```

**命名規則**：
- 檔名：`{編號}_{羅馬拼音}.md`
- title：`{category}/{羅馬拼音}`
- 編號僅用於排序，不出現在 title 中
- title 與檔名（去掉編號）必須一致

### 高效搜尋機制

#### 搜尋策略：Glob + YAML（不要用 Grep）

**為什麼不用 Grep？**
- Grep 需要讀取所有檔案的完整內容
- 隨著卡片增加，速度線性下降
- 處理大量文字，消耗資源

**為什麼用 Glob + YAML？**
- Glob 只搜尋檔名，速度極快
- YAML 只需讀取前 30 行
- 效率幾乎不受卡片總數影響

#### 實際範例

**任務**：為「食べる」找同義詞

```bash
# ❌ 舊方法（慢）
Grep: 搜尋所有卡片中的「食べる」或「meshiagaru」
→ 掃描 120 張卡片的完整內容
→ 處理大量文字
→ 耗時 5-10 秒

# ✅ 新方法（快）
步驟一：從基本卡片的 YAML 取得同義詞列表
Read: verb-ru/001_taberu.md (limit: 30)
→ synonyms: [meshiagaru, itadaku]

步驟二：用 Glob 搜尋檔名
Glob: **/*meshiagaru*.md → 找到 verb-u/003_meshiagaru.md
Glob: **/*itadaku*.md → 找到 verb-ru/004_itadaku.md

步驟三：讀取候選卡片的 YAML（僅前 30 行）
Read: verb-u/003_meshiagaru.md (limit: 30)
→ 確認：type: verb, base_word: taberu → ✅ 是同義詞

步驟四：建立連結
→ 耗時 0.1-0.5 秒（快 10-100 倍）
```

#### 搜尋模式範例

**1. 搜尋同義詞**
```bash
# YAML 中有：synonyms: [meshiagaru, itadaku, kuu]
Glob: **/*meshiagaru*.md
Glob: **/*itadaku*.md
Glob: **/*kuu*.md
```

**2. 搜尋相同主題**
```bash
# 找「飲食」主題
Glob: **/*tabe*.md    # 食べる、食べ物
Glob: **/*nomi*.md    # 飲む、飲み物
Glob: **/*shoku*.md   # 食事、食品
```

**3. 搜尋同詞性**
```bash
# 找所有一段動詞
Glob: verb-ru/*.md
```

**4. 搜尋延伸卡片**
```bash
# 找某個詞的所有延伸卡片
Glob: **/001_taberu_*.md
→ 001_taberu_001_keigo.md
→ 001_taberu_003_register.md
```

**5. 搜尋特定 JLPT 等級**
```bash
# 方法一：搜尋目錄（如果按等級分類）
Glob: */n5/*.md

# 方法二：用 Grep 搜尋 YAML
Grep: "jlpt: n5" --files-with-matches
→ 只搜尋 YAML 區塊（前 30 行）
```

#### YAML 判斷標準

讀取候選卡片的 YAML 後，根據以下標準判斷關聯性：

| YAML 欄位 | 判斷邏輯 | 連結類型 | 優先級 |
|----------|---------|---------|--------|
| `synonyms` 包含目標詞 | 明確同義關係 | synonym | 高 |
| `antonyms` 包含目標詞 | 明確反義關係 | antonym | 高 |
| `base_card` 相同 | 同詞彙的延伸卡片 | sibling_extension | 高 |
| `related_words` 包含目標詞 | 明確相關 | related | 高 |
| `tags` 有 2+ 個相同 | 主題相關 | topic_related | 中 |
| `type` 和 `subtype` 相同 | 同類型 | same_type | 低 |
| `jlpt` 相同 | 同等級 | same_level | 低 |

### 代理人工作流程

#### 延伸卡片建立代理人

```
1. 讀取基本卡片的 YAML (limit: 30)
   ↓
2. 提取關鍵資訊（type, subtype, synonyms 等）
   ↓
3. 判斷是否需要建立延伸卡片
   - 有同義詞？→ 檢查是否已收錄
   - 是動詞？→ 可能需要敬語卡片
   - 有特殊語域？→ 可能需要 register 卡片
   ↓
4. 如需建立，用 Glob 搜尋相關卡片
   Glob: **/*{synonym}*.md
   ↓
5. 讀取候選卡片的 YAML (limit: 30)
   ↓
6. 建立延伸卡片
```

#### 卡片連結建立代理人

```
1. 讀取新卡片的 YAML (limit: 30)
   ↓
2. 提取搜尋關鍵字
   - synonyms: [word1, word2]
   - related_words: [word3, word4]
   - type, subtype, tags
   ↓
3. 用 Glob 搜尋候選卡片
   Glob: **/*word1*.md
   Glob: **/*word2*.md
   Glob: {type}-{subtype}/*.md
   ↓
4. 讀取每個候選卡片的 YAML (limit: 30)
   ↓
5. 根據判斷標準決定是否建立連結
   ↓
6. 只在確定建立連結後，才讀取完整內容撰寫連結描述
```

### 效率對比

**場景**：系統有 500 張卡片，為新卡片建立 10 個連結

| 方法 | 讀取檔案數 | 讀取內容量 | 耗時 |
|------|-----------|-----------|------|
| Grep 全文搜尋 | 500 張完整內容 | ~500KB | 10-20 秒 |
| Glob + YAML | 1 張完整 + 15 張 YAML | ~15KB | 0.5-1 秒 |
| **效率提升** | **97% 減少** | **97% 減少** | **10-40 倍** |

### 最佳實踐

#### 建立卡片時

1. **務必填寫完整 YAML**
   - 所有必需欄位都要填寫
   - 盡量填寫推薦欄位（synonyms, related_words 等）
   - 這些資訊是高效搜尋的基礎

2. **保持檔名與 title 一致**
   - 檔名：`001_taberu.md`
   - title：`verb-ru/taberu`
   - 方便 Glob 搜尋

3. **使用羅馬拼音**
   - synonyms 和 related_words 用羅馬拼音
   - 與檔名系統一致
   - 便於搜尋

#### 搜尋卡片時

1. **優先使用 Glob**
   - 90% 的搜尋用 Glob 即可
   - 只在特殊情況用 Grep（如搜尋 tags）

2. **只讀 YAML**
   - 80% 的判斷只需要 YAML
   - Read 時用 `limit: 30`

3. **批次處理**
   - 一次 Glob 多個模式
   - 減少工具調用次數

4. **確定後才讀完整內容**
   - 只在確定要建立連結時
   - 才讀取完整卡片內容撰寫描述

### 範例：完整的卡片 YAML

```yaml
---
# 基本資訊（必需）
title: verb-ru/taberu
description: 吃（食物）
type: verb
subtype: ichidan
jlpt: n5
stage: completed                   # 卡片階段
created: 2025-10-28
updated: 2025-10-28

# 標籤（必需）
tags: [daily_life, casual, family]

# 關聯詞彙（強烈推薦）
synonyms: [meshiagaru, itadaku, kuu]
antonyms: [nokosu, hakidasu]
related_words: [asagohan, tabemono, nomu, shokuji]

# 延伸卡片資訊（如適用）
has_extensions: true
extension_cards:
  - taberu_001_keigo
  - taberu_003_register
  - taberu_006_comparison

# 草稿卡片生成記錄（如適用）
generated_cards:
  - ../particle/002_wo
  - ../grammar/003_ichidan_verb
generated_date: 2025-10-28
---
```

### 命名規範

- 檔案名稱：`{編號}_{識別名稱}.md`
- 編號：三位數字，從 001 開始（如：001, 002, 003）
- 識別名稱：英文或羅馬拼音，小寫，用底線分隔

範例：
- `noun/001_gdp.md`
- `verb-ru/023_taberu.md`
- `grammar/005_noni.md`
- `contrast/001_wa_vs_ga.md`

### 編號系統

每個資料夾維護獨立的編號序列，記錄在該資料夾的 `index.md` 中。

**index.md 格式範例：**
```markdown
# [分類名稱] 索引

最後編號：003
總卡片數：3

## 卡片列表

### 依編號
- [001 - GDP（国内総生産）](001_gdp.md) #economics #business
- [002 - インフレーション](002_inflation.md) #economics
- [003 - 投資（とうし）](003_investment.md) #finance #business

### 依主題
#### 經濟學
- [001 - GDP](001_gdp.md)
- [002 - インフレーション](002_inflation.md)

#### 金融
- [003 - 投資](003_investment.md)
```

## Tag 系統

### Tag 類型

#### 1. 使用情境標籤（context/）
定義這個詞彙或文法在什麼社交情境下使用。

```
context/business     # 商務場合
context/casual       # 日常、朋友間
context/family       # 家庭
context/formal       # 正式場合
context/academic     # 學術環境
context/social       # 社交場合
```

#### 2. 領域標籤（domain/）
定義這個詞彙或概念屬於什麼專業領域。

```
domain/economics     # 經濟學
domain/finance       # 財經金融
domain/technology    # 科技
domain/philosophy    # 哲學
domain/history       # 歷史
domain/culture       # 文化
domain/medical       # 醫療
domain/legal         # 法律
domain/art           # 藝術
domain/science       # 科學
domain/politics      # 政治
domain/education     # 教育
```

#### 3. 常用度標籤（jlpt/）
基於 JLPT（日本語能力試驗）等級標示常用度。

```
jlpt/n5              # 最基礎
jlpt/n4
jlpt/n3
jlpt/n2
jlpt/n1              # 最高級
jlpt/none            # 不在 JLPT 範圍（專業術語等）
```

### Tag 擴充原則

- Tag 可以隨時新增，沒有固定限制
- 新增 Tag 時應考慮是否有助於組織和檢索
- 盡量使用既有 Tag，避免過度分散
- Tag 使用小寫英文，用底線分隔多個單字

## 連結系統

### 連結類型

#### 1. 同領域連結
同一專業領域的相關概念。
```markdown
經濟學相關：
- [GDP](001_gdp.md)
- [經濟成長](../concept/005_economic_growth.md)
```

#### 2. 跨領域連結
不同領域但概念相關。
```markdown
- [投資](../noun/003_investment.md) - 經濟學概念
- [リスク管理](../concept/012_risk_management.md) - 管理學概念
```

#### 3. 詞彙-文法連結
詞彙卡片連結到相關文法卡片。
```markdown
- [動詞て形](../grammar/023_te_form.md)
```

#### 4. 對比連結
連結到對比卡片或相似/相反概念。
```markdown
對比：
- [は vs が](../contrast/001_wa_vs_ga.md)
相反概念：
- [インフレ](002_inflation.md) ↔ [デフレ](004_deflation.md)
```

#### 5. 層級連結

上位概念與下位概念之間的連結。

```markdown
上位概念：
- [経済指標](../concept/001_economic_indicators.md)

下位概念：
- [GDP](001_gdp.md)
- [失業率](005_unemployment_rate.md)
```

### 連結格式

**重要原則**：本專案使用標準 Markdown 連結格式，**嚴格禁止使用 Wikilink 格式**。

#### ✅ 正確格式：標準 Markdown

```markdown
[顯示文字](相對路徑)
```

範例：

```markdown
# 在 noun/001_gdp.md 中
links:
  - [経済成長](../concept/005_economic_growth.md)
  - [インフレーション](002_inflation.md)
  - [は（助詞）](../particle/001_wa.md)
```

#### ❌ 錯誤格式：Wikilink（禁止使用）

以下格式**不得使用**：

```markdown
# ❌ 禁止：Wikilink / Obsidian 格式
[[particle/007_ni|に]]
[[verb-ru/001_taberu|食べる]]
[[grammar/001_te_form]]

# ❌ 禁止：在 YAML 中使用 Wikilink
related_to: [[particle/003_wo]], [[verb-ru/001_taberu]]
```

**原因**：
1. Wikilink 格式無法在標準 Markdown 渲染器（GitHub、GitLab、VS Code）中正確顯示
2. 無法形成可點擊的連結
3. 違反專案的統一性和可維護性原則

#### 連結建立注意事項

1. **使用相對路徑**
   - 同資料夾：`[食べる](001_taberu.md)`
   - 不同資料夾：`[が](../particle/001_ga.md)`

2. **必須包含 .md 副檔名**
   - ✅ `[て形](../grammar/001_te_form.md)`
   - ❌ `[[grammar/001_te_form]]`

3. **顯示文字應該清楚易懂**
   - 日文：`[食べる](001_taberu.md)` 或 `[食べる（吃）](001_taberu.md)`
   - 中文：`[動詞て形](../grammar/001_te_form.md)`
   - 英文：`[て-form grammar](../grammar/001_te_form.md)`

4. **代理人建立連結時的檢查清單**
   - ✅ 使用標準 Markdown `[text](path)` 格式
   - ✅ 路徑包含 `.md` 副檔名
   - ✅ 相對路徑正確（使用 `../` 跨目錄）
   - ✅ 目標檔案確實存在
   - ❌ 絕對不使用 `[[...]]` 格式

## 工作流程

### 標準學習流程

```markdown
1. 收集文章
   ↓
   將日文文章保存到 articles/ 目錄

2. 初步分析
   ↓
   使用 /analyze-article 了解文章結構和難度

3. 深入分析（可選）
   ↓
   /extract-vocab      - 提取詞彙
   /explain-grammar    - 理解文法
   /generate-exercises - 練習測試

4. 建立卡片
   ↓
   使用 /create-zettel 將文章內容拆解為卡片

5. 建立連結
   ↓
   在新卡片中建立與既有卡片的連結

6. 複習與擴展
   ↓
   定期回顧卡片，發現新的連結和理解
```

### 卡片建立流程

使用 `/create-zettel` 命令時，AI 代理人會：

1. **分析文章內容**
   - 識別值得建卡的詞彙、文法、概念
   - 判斷應建立哪些類型的卡片

2. **檢查既有卡片**
   - 讀取各資料夾的 index.md
   - 避免重複建卡
   - 識別可能的連結點

3. **決定 Tag**
   - 根據文章主題和使用情境分配 Tag
   - 必要時建議新的 Tag

4. **建立連結**
   - 與相關卡片建立連結
   - 可能跨越不同資料夾

5. **生成卡片**
   - 建立多張卡片（可能跨不同資料夾）
   - 三語並列解釋
   - 提供基於日文思考的例句

6. **更新索引**
   - 更新各資料夾的 index.md
   - 記錄新的編號

### 卡片處理原則

**⚠️ 極度重要：禁止使用腳本批次處理卡片**

卡片的建立和修改涉及語言的細微差異、用詞的精準度、以及概念的深刻理解。因此：

1. **絕對禁止使用腳本**
   - 不得使用任何形式的腳本批次處理卡片
   - 不得使用循環、批次編輯等自動化方式
   - 每張卡片必須單獨、仔細地處理

2. **每張卡片獨立思考**
   - 每張卡片都需要深入思考其含義
   - 日文解釋需要精心撰寫，如同編寫日日辭典
   - 例句需要反映真實、自然的日文用法
   - 標籤和連結需要根據該卡片的特性個別判斷

3. **Todo 管理原則**
   - 在 todo list 中，每張卡片必須是獨立的 todo 項目
   - 這樣可以避免產生「批次處理」的誘惑
   - 確保對每張卡片投入應有的關注

4. **為什麼不能使用腳本？**
   - 語言學習需要思考和理解，不是機械性工作
   - 每個詞彙、文法在不同情境下有細微差異
   - 精準的用詞是語言學習的核心

## 例句原則

### 核心原則

- **以日文為思考核心**：先想日文怎麼說，再提供英文和中文對應
- **實用性**：例句要反映真實使用情境
- **漸進性**：從簡單到複雜
- **情境多樣**：涵蓋不同使用場景

### 例句格式

```
**例句1**
```
日文原句（包含假名標注如有需要）
English translation
中文翻譯
```
```

### 例句數量

- 每張卡片：2-3 個例句

## 使用指南

### 可用命令

#### 文章分析系列

- `/analyze-article` - 全面分析文章（難度、主題、文法）
- `/extract-vocab` - 提取關鍵詞彙
- `/explain-grammar` - 深入解析文法
- `/generate-exercises` - 生成練習題

#### Zettelkasten 系列

- `/create-zettel` - 從文章建立卡片盒卡片（指令）

### 最佳實踐

1. **循序漸進**
   - 從簡單文章開始
   - 逐步建立卡片網絡
   - 不急於一次建立大量卡片

2. **重視連結**
   - 新卡片建立時思考與既有知識的關聯
   - 定期回顧，發現新的連結可能

3. **Tag 管理**
   - 保持 Tag 系統的一致性
   - 定期檢視和整理 Tag

4. **主題平衡**
   - 收集不同領域的文章
   - 建立多元的知識網絡

5. **定期複習**
   - 利用連結隨機遊走複習
   - 追蹤學習進度

## 技術細節

### 檔案編碼

- 所有檔案使用 UTF-8 編碼
- Markdown 格式
- YAML frontmatter

### 相對路徑規則

```
當前位置：noun/001_gdp.md

同資料夾：002_inflation.md
上層資料夾：../concept/005_growth.md
主索引：../index.md
```

### 編號規則

- 三位數字：001-999
- 每個資料夾獨立編號
- 編號不重複使用（即使刪除卡片）

## Meta 資訊系統

### 系統目的

`_meta/` 資料夾包含系統的元資訊（metadata），用於記錄和追蹤系統中使用的 tags 和 categories 的定義。

**核心價值**：

1. **明確定義**：為每個 tag 和 category 提供清晰、詳細的定義
2. **使用追蹤**：記錄何時新增、當前使用情況、統計資訊
3. **一致性維護**：確保 tags 和 categories 使用的一致性
4. **索引功能**：方便查詢、管理和學習規劃
5. **知識管理**：幫助理解系統架構和學習路徑

### Meta 系統結構

#### 1. Tags（標籤）定義

**路徑**：`_meta/tags/`
**總數**：15 個 tag 定義卡片

**Context Tags**（使用情境）

- business - 商務場合
- casual - 日常、朋友間
- family - 家庭
- formal - 正式場合
- academic - 學術環境
- social - 社交場合

**Domain Tags**（領域）

- economics - 經濟學
- daily_life - 日常生活
- finance - 財經金融
- （其他可擴展領域：technology, culture, medical, legal等）

**JLPT Tags**（等級）

- n5 - JLPT N5（最基礎）
- n4 - JLPT N4
- n3 - JLPT N3
- n2 - JLPT N2
- n1 - JLPT N1（最高級）
- none - 不在JLPT範圍的專業術語

#### 2. Categories（分類）定義

**路徑**：`_meta/categories/`
**總數**：23 個 category 定義卡片

涵蓋所有卡片類型：

- 基礎詞類（8個）：名詞、動詞、形容詞、副詞等
- 功能詞（5個）：助詞、助動詞、接續詞等
- 構詞（2個）：接頭詞、接尾詞
- 固定表達（3個）：慣用語、諺語、擬聲擬態詞
- 其他（5個）：文法、概念、對比、情境等

### Meta 卡片內容

每張 meta 卡片包含：

- **定義和說明**：清楚解釋 tag/category 的意義
- **使用場景**：何時使用此 tag/category
- **典型特徵**：該 tag/category 的典型內容
- **使用範例**：列出系統中已使用此 tag/category 的卡片
- **相關關係**：與其他 tags/categories 的關係
- **學習建議**：針對不同程度學習者的建議
- **統計資訊**：使用次數、最常見詞類等
- **維護記錄**：追蹤變更歷史

### 新增 Tag 或 Category 的流程

#### 新增 Tag

1. 確認是否真的需要新 tag（避免過度細分）
2. 決定 tag 的類型（context/domain/jlpt）
3. 在 `_meta/tags/{type}/` 建立新的定義卡片
4. 更新該資料夾的 index.md
5. 更新 `_meta/tags/index.md`
6. 在實際卡片中開始使用新 tag

#### 新增 Category

1. 確認新的卡片類型確實需要獨立分類
2. 在 `_meta/categories/` 建立定義卡片
3. 更新 `_meta/categories/index.md`
4. 在 `zettelkasten/` 主目錄建立對應資料夾
5. 在新資料夾建立 index.md
6. 更新 `.claude.md` 的目錄結構說明
7. 更新 `/create-zettel` 命令的說明

### Meta 系統的維護

**定期檢查**：

- 檢查 meta 卡片的統計資訊是否準確
- 更新使用範例列表
- 確認定義是否需要調整
- 檢查是否有新的使用模式

**保持同步**：

- 每次新增 tag 或 category 時，必須同時建立 meta 卡片
- Meta 資訊應反映系統的實際使用情況

**品質控制**：

- Meta 卡片的定義應該清晰、準確
- 避免過度複雜化
- 確保對學習者有實際幫助

## 維護工具系統

本專案提供 7 個 Python 維護腳本（位於 `scripts/`），使用 **UV 單檔模式**開發，零外部依賴。這些工具幫助維護系統一致性、檢查錯誤、自動化重複任務。

### 工具清單

#### 1. list-categories.py - 列出所有分類

**用途**：查看系統中所有分類及其統計資訊

```bash
# 顯示所有分類
uv run scripts/list-categories.py

# 顯示詳細統計（包含卡片數量）
uv run scripts/list-categories.py --count

# JSON 格式輸出
uv run scripts/list-categories.py --json
```

**使用時機**：

- 建立新卡片前，確認分類是否存在
- 檢查系統整體狀況
- 代理人在建立卡片前查詢可用分類

#### 2. list-tags.py - 列出所有 Tags

**用途**：查看系統中所有 tags 及其使用情況

```bash
# 顯示所有 tags
uv run scripts/list-tags.py

# 顯示使用次數
uv run scripts/list-tags.py --count

# 只顯示特定類型的 tags
uv run scripts/list-tags.py --type context
```

**使用時機**：

- 建立新卡片時選擇合適的 tags
- 檢查是否需要新增 tag 定義
- 代理人在標記卡片前查詢可用 tags

#### 3. get-next-number.py - 取得下一個編號

**用途**：自動取得分類的下一個可用編號

```bash
# 取得下一個編號
uv run scripts/get-next-number.py verb-ru

# 取得延伸卡片編號
uv run scripts/get-next-number.py verb-ru --extension 001

# JSON 格式輸出
uv run scripts/get-next-number.py verb-ru --json
```

**使用時機**：

- 建立新卡片時自動分配編號
- 避免手動查找和計算
- **代理人必須使用此工具**取得新卡片編號

#### 4. update-index.py - 更新索引檔案

**用途**：自動更新分類的 index.md，保持索引同步

```bash
# 更新分類索引
uv run scripts/update-index.py verb-ru

# 預覽變更（不實際寫入）
uv run scripts/update-index.py verb-ru --dry-run

# 強制重建索引
uv run scripts/update-index.py verb-ru --force
```

**使用時機**：

- 新增卡片後立即更新索引
- 修改卡片檔名後同步索引
- **代理人在建立卡片後必須執行**

#### 5. verify-meta.py - 驗證 Meta 一致性

**用途**：檢查 `_meta/` 資料夾的定義是否與實際系統一致

```bash
# 完整驗證
uv run scripts/verify-meta.py

# 只檢查 tags
uv run scripts/verify-meta.py --tags

# 顯示詳細資訊
uv run scripts/verify-meta.py --verbose
```

**使用時機**：

- 定期檢查系統一致性（建議每週）
- 新增分類或 tag 後驗證
- 確保所有 meta 定義都已建立

#### 6. clean-tags.py - 清理和標準化 Tags

**用途**：移除重複的、非標準的 tags，並將其標準化

```bash
# 預覽清理結果
uv run scripts/clean-tags.py --dry-run

# 執行清理
uv run scripts/clean-tags.py

# 只處理特定分類
uv run scripts/clean-tags.py --category verb-ru
```

**使用時機**：

- 發現 tags 不一致時批次清理
- 系統標準化維護
- 通常由人工觸發，不建議代理人自動執行

#### 7. fix-numbering.py - 檢查和修復編號

**用途**：檢測編號缺口和跳號，並提供修復方案

```bash
# 檢查所有分類
uv run scripts/fix-numbering.py --check

# 預覽修復方案
uv run scripts/fix-numbering.py --dry-run

# 執行修復
uv run scripts/fix-numbering.py --fix
```

**使用時機**：

- 定期檢查編號連續性（建議每月）
- 發現編號異常時修復
- 通常由人工觸發，不建議代理人自動執行

### 代理人使用指南

#### `/create-zettel` 代理人

此代理人負責建立新的 Zettelkasten 卡片，**必須使用以下工具**：

**建立卡片流程**：

1. **使用 `list-categories.py`** 確認目標分類存在

   ```bash
   uv run scripts/list-categories.py
   ```

2. **使用 `list-tags.py`** 查詢可用的標準 tags

   ```bash
   uv run scripts/list-tags.py --count
   ```

3. **使用 `get-next-number.py`** 取得下一個編號

   ```bash
   uv run scripts/get-next-number.py <category>
   ```

4. 建立卡片檔案（使用取得的編號）

5. **使用 `update-index.py`** 更新索引

   ```bash
   uv run scripts/update-index.py <category>
   ```

**重要原則**：

- **必須**使用 `get-next-number.py` 取得編號，不可手動猜測
- **必須**在建立卡片後執行 `update-index.py`
- **必須**使用 `list-tags.py` 確認 tags 存在於 meta 中
- **不可**使用非標準格式的 tags
- **不可**跳過索引更新

#### `build-card-links` 子代理人

此子代理人負責為卡片建立連結和腳註，**建議使用以下工具**：

**建立連結流程**：

1. **使用 `list-tags.py`** 查找相關主題的 tags

   ```bash
   uv run scripts/list-tags.py --type domain
   ```

2. 使用 Glob 搜尋相關卡片（基於 YAML frontmatter）

3. 建立 wikilinks 和腳註

4. 如果發現遺漏的卡片：
   - **使用 `get-next-number.py`** 取得編號
   - 建立草稿卡片
   - **使用 `update-index.py`** 更新索引

**重要原則**：

- ✅ **建議**使用工具查詢 tags，提高效率
- ✅ **必須**在建立新卡片後更新索引
- ✅ 優先使用 Glob + YAML 搜尋，而非 Grep 全文搜尋
- ❌ **不可**建立不存在於 meta 的 tags

### 維護最佳實踐

#### 日常維護檢查清單

**每次建立版本推進後**：

```bash
# 1. 更新索引
uv run scripts/update-index.py <category>

# 2. 驗證（可選）
uv run scripts/verify-meta.py --check

# 3. 檢查 meta 一致性
uv run scripts/verify-meta.py --verbose

# 4. 檢查所有分類狀態
uv run scripts/list-categories.py --count

# 5. 檢查編號連續性
uv run scripts/fix-numbering.py --check

# 6. 如有問題，預覽修復
uv run scripts/fix-numbering.py --dry-run

# 7. 執行修復（如需要）
uv run scripts/fix-numbering.py --fix
```

#### 故障排除

**問題：索引與實際不一致**

```bash
# 檢查
uv run scripts/list-categories.py --count

# 修復
uv run scripts/update-index.py <category>
```

**問題：tags 不標準或重複**

```bash
# 檢查
uv run scripts/verify-meta.py --tags

# 預覽清理
uv run scripts/clean-tags.py --dry-run

# 執行清理
uv run scripts/clean-tags.py
```

**問題：編號不連續**

```bash
# 檢查
uv run scripts/fix-numbering.py --check

# 預覽修復
uv run scripts/fix-numbering.py --dry-run

# 執行修復
uv run scripts/fix-numbering.py --fix
```

### 工具開發指南

所有腳本使用 **UV 單檔模式**（基於 PEP 723）：

```python
#!/usr/bin/env python3
# /// script
# dependencies = []
# requires-python = ">=3.10"
# ///

# 腳本內容...
```

詳細開發指南參考：`doc/hooks/03-uv-single-file-pattern.md`

---

## 維護與擴展

### 定期維護

- 檢查損壞的連結
- 更新過時的資訊
- 合併重複的卡片
- **執行維護腳本檢查系統狀態**
- **更新 Meta 系統的統計資訊**

### 系統擴展

- 可新增卡片分類（新增資料夾 + Meta 卡片）
- 可新增 Tag 類型（在 Meta 系統中定義）
- 可自定義命令
- **所有擴展都應在 Meta 系統中記錄**
- **使用 `verify-meta.py` 驗證擴展結果**

---

## 開發者筆記

### 代理人設計原則

`/create-zettel` 代理人應該：

- 具備深厚的日文語言學知識
- 能夠識別詞彙、文法、概念的細微差異
- 理解不同領域的專業術語
- 能夠建立有意義的連結
- 保持卡片的原子化（一卡一概念）

---

**最後更新：2025-10-29**
