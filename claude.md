# 日文學習 Zettelkasten 系統

## 語言規範

**本專案嚴格限制使用以下三種語言**：

1. **日文（Japanese）** - 卡片內容、例句、日文解釋
2. **英文（English）** - 英文解釋、國際化支援
3. **繁體中文（Traditional Chinese）** - 中文解釋、文檔、註解、commit 訊息

❌ **嚴格禁止使用簡體中文（zh-CN）**

---

## 專案概述

結合 AI 輔助和 Zettelkasten 方法的日文學習系統。透過原子化的知識卡片，建立相互連結的知識網絡。

### 核心功能

1. **詞彙卡片系統** - 動詞、名詞、形容詞等基礎詞彙
2. **延伸卡片系統** - 文法、語用、文化等概念
3. **標準連結系統** - Markdown `[text](path)` 格式
4. **AI 代理人** - 自動化卡片管理

### 版本管理

版本格式：`MAJOR.MINOR.PATCH`
- **MAJOR**：專案結構或核心功能重大變動
- **MINOR**：新增或修改 slash command 或代理人
- **PATCH**：卡片內容的新增、修改或修復

---

## 四階段工作流程

每個 PATCH 版本對應一個完整的四階段循環：

### 階段 1：Draft（建立卡片）

**前置條件（必須完成）**：
1. 檢視前一版本的延伸需求報告：
   - `doc/worklog/extension-cards-{prev}.md`（Extension-Review 階段產出）
   - `doc/worklog/linking-cards-{prev}.md`（Linking 階段產出）
2. 從延伸需求中篩選 Critical/High 優先級卡片
3. 建立本版本工作清單：`doc/worklog/worklog-{version}.md`

**執行內容**：
- 建立卡片內容（三語解釋、例句）
- 使用代理人：`create-card`（`.claude/agents/create-card.md`）
- 更新為 `stage: extension-review`

### 階段 2：Extension-Review（檢查延伸需求）
- 識別需要延伸的新卡片
- 記錄到 `extension-cards-{version}.md`
- 更新為 `stage: linking`

### 階段 3：Linking（建立連結）
- 補充標準連結和腳註
- 使用代理人：`build-card-links`
- 更新為 `stage: completed`

### 階段 4：Completed（完成驗證）
- 執行系統驗證腳本
- 更新 CHANGELOG.md
- 合併到 main

---

## 版本循環依賴關係

每個版本的 Draft 階段必須從前一版本的延伸需求報告開始，形成連續的版本循環：

```
┌─────────────────────────────────────────────────┐
│ v1.0.4                                          │
├─────────────────────────────────────────────────┤
│ Draft（36 張卡片）                               │
│   ↓                                             │
│ Extension-Review                                │
│   └→ 產出：extension-cards-1.0.4.md（120 張）   │
│   ↓                                             │
│ Linking                                         │
│   └→ 產出：linking-cards-1.0.4.md（15 張）      │
│   ↓                                             │
│ Completed                                       │
└─────────────────────────────────────────────────┘
            ↓（版本依賴）
┌─────────────────────────────────────────────────┐
│ v1.0.6                                          │
├─────────────────────────────────────────────────┤
│ **階段 1 前置：版本規劃**                        │
│   ├→ 讀取 extension-cards-1.0.4.md              │
│   ├→ 讀取 linking-cards-1.0.4.md                │
│   ├→ 篩選 Critical/High（60 張）                │
│   └→ 建立 worklog-1.0.6.md                      │
│   ↓                                             │
│ Draft（60 張卡片）                               │
│   ↓                                             │
│ Extension-Review                                │
│   └→ 產出：extension-cards-1.0.6.md（新需求）   │
│   ↓                                             │
│ Linking                                         │
│   └→ 產出：linking-cards-1.0.6.md（新需求）     │
│   ↓                                             │
│ Completed                                       │
└─────────────────────────────────────────────────┘
            ↓（繼續循環）
         v1.0.7...
```

**關鍵規則**：
- 每個版本的 Draft 階段必須從前一版本的延伸需求報告開始
- Extension-Review 和 Linking 產出的報告是版本間的橋樑
- 不可跳過版本依賴檢查，這是版本循環的核心流程

---

## 執行方式核心原則

### ✅ 必須做

1. **每張卡片 = 一個 Todo**
   - 40 張卡片 → 建立 40 個 todo
   - 每個 todo 只處理一張卡片

2. **平行處理**
   - 使用 Task 工具同時啟動多個代理人
   - 一次發送多個 Task 呼叫

3. **所有卡片同等重要**
   - 不區分優先級
   - 全部完成，不拖延

### ❌ 不可做

1. 一個 todo 包含多張卡片
2. 分批處理或按優先級處理
3. 使用腳本批次處理卡片內容
4. 評估工時或延後處理

### 詳細執行指南

參考：`doc/execution-workflow.md`

---

## 目錄結構

```
japanese_learning_blog/
├── CLAUDE.md                      # 專案說明（本文件）
├── .claude/
│   ├── agents/create-card.md     # 建立卡片代理人
│   └── commands/create-zettel.md # 從文章拆解代理人
├── doc/
│   ├── worklog/worklog-{v}.md    # 工作日誌
│   └── execution-workflow.md      # 執行流程指南
├── scripts/                       # 維護工具
└── zettelkasten/                  # 卡片系統
    ├── _meta/                     # Meta 系統
    ├── noun/                      # 名詞
    ├── verb-ru/                   # る動詞
    ├── verb-u/                    # う動詞
    ├── grammar/                   # 文法
    └── [其他 20+ 分類]
```

---

## 兩種卡片建立場景

### 場景 A：從文章拆解
- **代理人**：`/create-zettel`（Slash Command）
- **觸發**：使用者提供日文文章
- **流程**：分析 → 識別 → 批次建立 5-15 張
- **適用**：學習新文章、拓展新領域

### 場景 B：系統需求補充
- **代理人**：`create-card`（`.claude/agents/create-card.md`）
- **觸發**：前一版本的 Extension-Review 和 Linking 階段識別缺口
- **流程**：
  1. 檢視 `doc/worklog/extension-cards-{prev}.md` 和 `linking-cards-{prev}.md`
  2. 篩選 Critical/High 優先級卡片
  3. 建立本版本工作清單（`worklog-{version}.md`）
  4. 逐張建立卡片 → 四階段循環
- **適用**：版本循環 Draft 階段

---

## 維護工具

### 卡片系統工具

```bash
# 1. 列出分類
uv run scripts/list-categories.py --count

# 2. 列出可用 tags
uv run scripts/list-tags.py

# 3. 取得下一個編號（必須使用）
uv run scripts/get-next-number.py {category}

# 4. 更新索引（必須使用）
uv run scripts/update-index.py {category}

# 5. 驗證 Meta 系統
uv run scripts/verify-meta.py --verbose

# 6. 檢查編號連續性
uv run scripts/fix-numbering.py --check

# 7. 檢查 Wikilink 格式
uv run scripts/fix-wikilinks.py --check
```

### CSV 工作清單管理工具（v1.0.6+）

```bash
# 1. 讀取待辦卡片清單（建立 Todo）
uv run scripts/get_pending_cards.py --stage pending --priority Critical --limit 10
uv run scripts/get_pending_cards.py --stage pending --format json  # JSON 格式

# 2. 新增待辦卡片（Extension-Review 代理人使用）
uv run scripts/add_pending_cards.py add --category noun --number 025 \
    --japanese 語彙 --chinese 詞彙 --jlpt n4 --priority High

uv run scripts/add_pending_cards.py batch --from-json cards.json  # 批次新增

# 3. 更新卡片進度（create-card 代理人使用）
uv run scripts/update_card_progress.py --id 59 --stage completed --quiet

# 4. 查詢統計與驗證
uv run scripts/manage_worklog_cards.py stats
uv run scripts/manage_worklog_cards.py list --stage pending --priority Critical
uv run scripts/manage_worklog_cards.py validate
```

**腳本用途說明**：

| 腳本 | 用途 | 主要使用者 |
|------|------|-----------|
| `get_pending_cards.py` | 讀取待辦卡片清單 | 主線程、代理人 |
| `add_pending_cards.py` | 新增待辦卡片 | Extension-Review 代理人 |
| `update_card_progress.py` | 更新卡片進度 | create-card 代理人 |
| `manage_worklog_cards.py` | 查詢統計與驗證 | 人工查詢 |

詳細使用說明請參考：`doc/worklog/README-CSV.md`

---

## 連結格式規範

**唯一正確格式**：`[text](path.md)`

**絕對禁止**：`[[wikilink]]` 或 `[[path|text]]`

---

## 重要文檔

### 規範文檔
- `.claude/card-format-guidelines.md` - 卡片格式規範
- `.claude/version-cycle-checklist.md` - 版本循環檢查清單

### 執行文檔
- `doc/execution-workflow.md` - 執行流程詳細指南
- `doc/worklog/worklog-{version}.md` - 各版本工作日誌

### 工具文檔
- `doc/hooks/03-uv-single-file-pattern.md` - 維護工具開發指南

---

## Slash Commands

**文章分析系列**：
- `/analyze-article` - 全面分析文章
- `/extract-vocab` - 提取關鍵詞彙
- `/explain-grammar` - 深入解析文法
- `/generate-exercises` - 生成練習題

**Zettelkasten 系列**：
- `/create-zettel` - 從文章建立卡片

---

## 術語表

為確保文檔一致性，以下是本專案的標準術語：

| 術語 | 標準名稱 | 文件路徑格式 | 說明 |
|------|---------|------------|------|
| Extension-Review 報告 | 延伸需求報告 | `doc/worklog/extension-cards-{version}.md` | Extension-Review 階段產出，記錄從 Draft 卡片識別的延伸需求 |
| Linking 報告 | 連結階段需求報告 | `doc/worklog/linking-cards-{version}.md` | Linking 階段產出，記錄建立連結時發現的缺口和草稿卡片 |
| 工作日誌 | 版本工作日誌 | `doc/worklog/worklog-{version}.md` | 記錄整個版本的進度、卡片清單、階段狀態 |
| 版本依賴 | 版本間依賴關係 | - | v{X} 的延伸需求報告 → v{X+1} 的輸入來源 |
| 版本規劃 | Draft 前置步驟 | - | Draft 階段前的準備工作，檢視前版本報告並建立工作清單 |
| 代理人 | Agent | `.claude/agents/*.md` | 專門處理特定任務的自動化工作流程（如 create-card） |

**使用原則**：
- 文檔中應使用標準名稱，避免混用同義詞
- 文件路徑必須使用標準格式，確保版本號一致性
- 版本號格式：`{version}` 表示當前版本，`{prev}` 表示前一版本

---

**最後更新：2025-10-31**
