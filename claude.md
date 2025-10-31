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
- **觸發**：Extension-Review 識別缺口
- **流程**：讀取清單 → 逐張建立 → 四階段循環
- **適用**：版本循環 Draft 階段

---

## 維護工具

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

**最後更新：2025-10-31**
