# Japanese Learning Blog - Claude 指南

這是一個使用 Zettelkasten 方法建立的日文學習卡片系統。本文檔說明專案結構、工作流程和版本管理規則。

## 專案概述

本專案使用卡片盒筆記法（Zettelkasten）建立互相連結的日文學習卡片，透過 Claude 代理人協助建立、延伸和維護卡片系統。

### 核心功能

1. **詞彙卡片系統** - 動詞、名詞、形容詞等基礎詞彙卡片
2. **延伸卡片系統** - 文法、語用、文化等概念卡片
3. **雙重連結系統**：
   - 標準 Wikilink 連結 `[[card]]` - 用於相關卡片列表
   - 腳註標註 `[^note]` - 用於文內概念說明
4. **智能代理人** - 自動檢測遺漏卡片並建立草稿

## 版本管理規則

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

每個小版本一個工作流程文檔，放在 `doc/workflow-{version}.md`

**格式範例**：`doc/workflow-1.0.0.md`

工作流程文檔必須記錄：
- **各階段卡片清單** - 哪些卡片在哪個階段
- **循環開始日期**
- **循環完成日期**
- **本循環新增的卡片數量**
- **本循環完成的卡片數量**
- **發現的問題與改進**

範例格式參考 `doc/workflow-1.0.0.md`。

## 卡片 YAML Frontmatter 格式

所有卡片必須在 YAML frontmatter 包含 `stage` 欄位：

### 基礎卡片格式

```yaml
---
type: verb-ru           # 卡片類型
jlpt: n5               # JLPT 等級
stage: draft           # 卡片階段：draft | extension-review | linking | completed
created: 2025-10-28    # 建立日期
updated: 2025-10-28    # 最後更新日期
---
```

### 草稿卡片格式

```yaml
---
type: particle
jlpt: n5
stage: draft           # 草稿階段
draft: true            # 標記為草稿
auto_generated: true   # 自動生成
needs_review: true     # 需要審查
created: 2025-10-28
related_to: [[verb-ru/001_taberu]]  # 觸發建立此草稿的來源卡片
---
```

### 已生成卡片記錄

當代理人建立草稿卡片時，會在來源卡片記錄：

```yaml
---
type: verb-ru
stage: linking
generated_cards:       # 本卡片觸發建立的草稿卡片
  - ../particle/002_wo
  - ../grammar/003_ichidan_verb
generated_date: 2025-10-28
---
```

## 專案結構

```
japanese_learning_blog/
├── .claude/
│   ├── claude.md                    # 本文檔
│   ├── card-format-guidelines.md    # 卡片格式完整指南
│   ├── footnotes-review-report.md   # 腳註功能評估報告
│   ├── commands/                    # Slash commands
│   │   ├── analyze-article.md
│   │   ├── create-zettel.md
│   │   ├── explain-grammar.md
│   │   ├── extract-vocab.md
│   │   └── generate-exercises.md
│   └── subagents/                   # 智能代理人
│       ├── create-extension-cards.md
│       └── build-card-links.md
├── doc/
│   └── workflow-{version}.md        # 各版本工作流程文檔
├── zettelkasten/                    # 卡片資料夾
│   ├── verb-ru/                     # る動詞
│   ├── verb-u/                      # う動詞
│   ├── noun/                        # 名詞
│   ├── adj-i/                       # い形容詞
│   ├── adj-na/                      # な形容詞
│   ├── particle/                    # 助詞
│   ├── grammar/                     # 文法
│   ├── honorific/                   # 敬語
│   ├── pragmatics/                  # 語用
│   └── cultural/                    # 文化
├── CHANGELOG.md                     # 版本更新記錄
└── README.md                        # 專案說明
```

## 代理人使用指南

### 1. 建立延伸卡片代理人

**用途**：分析詞彙卡片，識別需要的延伸卡片（文法、語用、文化等）

**位置**：`.claude/subagents/create-extension-cards.md`

**使用**：
```bash
# 在 Claude Code 中呼叫
使用 create-extension-cards subagent 分析 [卡片路徑]
```

**輸入**：詞彙卡片（動詞、名詞、形容詞等）

**輸出**：
- 識別需要的延伸卡片
- 建立延伸卡片（包含完整內容和腳註）
- 更新來源卡片的 `stage`

### 2. 連結建立代理人

**用途**：為卡片補充標準連結和腳註標註，識別遺漏的卡片

**位置**：`.claude/subagents/build-card-links.md`

**使用**：
```bash
# 在 Claude Code 中呼叫
使用 build-card-links subagent 處理 [卡片路徑]
```

**輸入**：任何階段為 `linking` 的卡片

**輸出**：
- 補充 Related Links 區塊
- 補充腳註標註
- 建立遺漏卡片的草稿
- 更新卡片 `stage` 為 `completed`

## Slash Commands

專案提供以下 slash commands：

- `/analyze-article` - 分析日文文章的難度等級、主題、文法結構和學習重點
- `/explain-grammar` - 詳細解釋日文文章中的文法結構、句型和語法現象
- `/extract-vocab` - 從日文文章中提取關鍵詞彙，並提供詳細解釋和例句
- `/generate-exercises` - 根據日文文章生成多種類型的練習題，幫助鞏固學習
- `/create-zettel` - 從日文文章建立 Zettelkasten 卡片盒卡片（智能代理人）

## 開發建議

### 新增卡片時

1. 建立基礎詞彙卡片，設定 `stage: draft`
2. 補充內容後，更新為 `stage: extension-review`
3. 記錄到當前版本的工作流程文檔
4. 執行工作流程循環

### 修改代理人時

1. 更新 `.claude/subagents/` 中的代理人定義
2. 更新 CHANGELOG.md（MINOR 版本）
3. 測試代理人功能
4. 提交 PR

### 重構專案結構時

1. 規劃變更範圍
2. 更新 CHANGELOG.md（MAJOR 版本）
3. 更新所有相關文檔
4. 審慎測試後提交 PR

## 參考文檔

- [卡片格式完整指南](.claude/card-format-guidelines.md) - 卡片格式、連結和腳註使用規範
- [腳註功能評估報告](.claude/footnotes-review-report.md) - 腳註功能的測試與分析
- [工作流程文檔](../doc/) - 各版本的開發循環記錄

---

**版本**: 1.0.0
**最後更新**: 2025-10-28
