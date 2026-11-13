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

### v1.5.0 架構更新

**YAML 驅動模式**：卡片 YAML frontmatter 成為進度追蹤的單一事實來源。

**新增 YAML 欄位**：
```yaml
version_history:       # 版本歷史追蹤
content_verification:  # 內容完整性驗證
link_status:           # 連結統計
```

**腳本更新**：
- `update_card_progress.py`：同步更新 CSV 和 YAML
- `get_pending_cards.py`：支援 `--from-yaml` 掃描
- `add_pending_cards.py`：同時建立卡片檔案

**新增工具**：
- `detect_pending_links.py`：檢測待建立連結
- `verify_content.py`：驗證內容完整性
- `migrate_cards.py`：遷移卡片到 v1.5.0 格式
- `stage_dashboard.py`：⭐ **階段管理看板**（進度追蹤的單一入口）

---

## 標準化任務分配流程

**每次分配任務前，必須執行以下步驟**：

```bash
# 1. 查看當前階段總覽
uv run scripts/stage_dashboard.py

# 2. 查看下一步行動建議
uv run scripts/stage_dashboard.py --next-action

# 3. 取得特定階段的待處理卡片（供代理人使用）
uv run scripts/stage_dashboard.py --stage {stage} --limit 50 --format json
```

**腳本輸出作為任務分配的事實依據**，不要手動查詢或猜測狀態。

---

## 四階段工作流程

每個 PATCH 版本對應一個完整的四階段循環。**每個階段有明確的代理人責任、腳本命令和狀態轉換**。

### 階段 1：Content Creation（內容建立）

**前置條件（必須完成）**：
1. 檢視前一版本的延伸需求報告：
   - `doc/worklog/extension-cards-{prev}.md`（Extension-Review 階段產出）
   - `doc/worklog/linking-cards-{prev}.md`（Linking 階段產出）
2. 從延伸需求中篩選 Critical/High 優先級卡片
3. 建立本版本工作清單：`doc/worklog/worklog-{version}.md`

**結構代理人**：`card-structure-handler`（`.claude/agents/card-structure-handler.md`）
**內容代理人**：`build-card-content`（`.claude/agents/build-card-content.md`）

**執行內容**：
- card-structure-handler 建立卡片檔案結構（YAML、檔名、基本區塊）
- build-card-content 填充卡片內容（三語解釋、例句、用法）
- 使用 `update-index.py {category}` 更新索引

**狀態轉換**：`pending` → `draft`

**階段完成命令**：
```bash
uv run scripts/update_card_progress.py --id {card_id} --stage draft --quiet
```

**重要**：
- ✅ 執行 `--stage draft`（正確的狀態轉換）
- ❌ 不要執行 `--stage extension-review`（會跳過 draft 狀態，報錯）
- ❌ 不要執行 `--stage completed`（階段跳躍，報錯）

**並發執行支援（v1.0.6+）**：
- ✅ `get-next-number.py` 已支援並發（檔案鎖 + 保留紀錄，取號即保留）
- ✅ 推薦使用 `allocate_card_numbers.py` 預先分配編號
- ✅ 代理人優先使用 `allocated_number` 欄位
- ✅ 支援平行執行多個 card-structure-handler 和 build-card-content 代理人

---

### 階段 2：Extension Review（延伸需求審查）

**代理人**：`create-extension-cards`（`.claude/agents/create-extension-cards.md`）

**執行內容**：
- 檢查 draft 狀態的卡片
- 識別需要延伸的新卡片（相關概念、對比項、前置知識）
- 記錄到 `doc/worklog/extension-cards-{version}.md`

**狀態轉換**：`draft` → `extension-review`

**階段完成命令**：
```bash
uv run scripts/update_card_progress.py --id {card_id} --stage extension-review --quiet
```

**產出**：
- 延伸需求報告：`doc/worklog/extension-cards-{version}.md`
- 新卡片需求（供下一版本使用）

---

### 階段 3：Link Building（連結建立）

**代理人**：`build-card-links`（`.claude/agents/build-card-links.md`）

**執行內容**：
- 檢查 extension-review 狀態的卡片
- 補充標準連結（將「待建立」標記替換為實際路徑）
- 添加腳註說明
- 建立雙向連結

**連結替換命令**（批次處理待建立標記）：
```bash
# 一站式處理：替換連結 + 新增缺口到 CSV + 生成報告
uv run scripts/replace_pending_links.py --fix --add-to-csv --report

# 僅預覽變更
uv run scripts/replace_pending_links.py --dry-run

# 生成 JSON 格式缺口清單
uv run scripts/replace_pending_links.py --fix --json > gaps.json
```

**狀態轉換**：`extension-review` → `linking`

**階段完成命令**：
```bash
uv run scripts/update_card_progress.py --id {card_id} --stage linking --quiet
```

**產出**：
- 連結階段報告：`doc/worklog/linking-cards-{version}.md`
- 缺口報告：`doc/worklog/gap-report-{date}.md`
- 缺口卡片自動新增到 Active CSV

---

### 階段 4：Final Verification（最終驗證）

**代理人**：`diagram-designer`（`.claude/agents/diagram-designer.md`）- 可選

**執行內容**：
- 執行系統驗證腳本
- 檢查編號連續性
- 檢查連結格式
- **圖表審查**（可選，由代理人判斷）
- 更新 CHANGELOG.md

**狀態轉換**：`linking` → `completed`

**驗證與修復命令**：

```bash
# 第 1 步：檢查問題
uv run scripts/card_numbering.py duplicates
uv run scripts/fix-numbering.py --check
uv run scripts/migrate_domain_tags.py --check
uv run scripts/list-domains.py
uv run scripts/fix-wikilinks.py --check
uv run scripts/verify-meta.py --verbose

# 第 2 步：自動修復（如有問題）
uv run scripts/fix-numbering.py --fix
uv run scripts/fix-wikilinks.py --fix

# 第 3 步：驗證修復結果
uv run scripts/fix-numbering.py --check
uv run scripts/fix-wikilinks.py --verify

# 第 4 步：查看完成統計
uv run scripts/manage_worklog_cards.py stats
```

**階段完成命令**：
```bash
uv run scripts/update_card_progress.py --id {card_id} --stage completed --quiet
```

**完成條件**：
- ✅ 所有卡片狀態為 `completed`
- ✅ 編號連續無衝突（自動修復後驗證）
- ✅ 連結格式正確（自動修復後驗證）
- ⚪ Meta 系統驗證（僅檢查，缺口記錄到下一版本）
- ⚪ 圖表審查完成（可選）

**最後動作**：
- 更新 CHANGELOG.md
- 合併到 main 分支

---

## 階段轉換流程圖

每張卡片的完整生命週期包含**五個狀態**和**四個工作階段**：

```
┌─────────────────────────────────────────────────────────────────┐
│ 卡片生命週期：五個狀態 × 四個階段                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ① pending（待處理）                                             │
│     ↓                                                           │
│     │ 【階段 1: Content Creation】                              │
│     │ [card-structure-handler + build-card-content 代理人]      │
│     ↓                                                           │
│  ② draft（內容已建立）                                           │
│     ↓                                                           │
│     │ 【階段 2: Extension Review】                              │
│     │ [create-extension-cards 代理人檢查延伸需求]               │
│     ↓                                                           │
│  ③ extension-review（延伸需求已審查）                            │
│     ↓                                                           │
│     │ 【階段 3: Link Building】                                 │
│     │ [build-card-links 代理人建立連結]                         │
│     ↓                                                           │
│  ④ linking（連結已建立）                                         │
│     ↓                                                           │
│     │ 【階段 4: Final Verification】                            │
│     │ [人工驗證 + diagram-designer 代理人（可選）]              │
│     ↓                                                           │
│  ⑤ completed（已完成）                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**禁止的狀態跳躍**（會導致 Exit code 1）：
- ❌ `pending → extension-review`（跳過 draft）
- ❌ `pending → linking`（跳過 draft 和 extension-review）
- ❌ `pending → completed`（跳過所有中間狀態）
- ❌ `draft → linking`（跳過 extension-review）
- ❌ `draft → completed`（跳過 extension-review 和 linking）
- ❌ `extension-review → completed`（跳過 linking）

**允許的狀態轉換**（嚴格遵守）：
- ✅ `pending → draft`（階段 1 完成）
- ✅ `draft → extension-review`（階段 2 完成）
- ✅ `extension-review → linking`（階段 3 完成）
- ✅ `linking → completed`（階段 4 完成）

**回退轉換**（允許但不推薦）：
- 🔄 `draft → pending`（重新開始）
- 🔄 `extension-review → draft`（回到上一階段）
- 🔄 `linking → extension-review`（回到上一階段）

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
│ Extension-Review → Linking → Completed          │
└─────────────────────────────────────────────────┘
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

### 代理人回報規範

**靜默成功原則**：
- ✅ 成功：**完全不輸出任何文字**
- ❌ 失敗：只輸出錯誤格式：`❌ {id} {path} 失敗\n原因：{說明}`
- 進度追蹤完全依賴 CSV 和驗證腳本

**詳細執行指南**：[doc/execution-workflow.md](doc/execution-workflow.md)

---

## 頂層目錄索引

| 目錄 | 設計意義 | 詳細說明 |
|------|---------|---------|
| `src/` | 日文輸入練習系統原始碼 | [src/README.md](src/README.md) |
| `scripts/` | Python 維護工具 | [scripts/README.md](scripts/README.md) |
| `.claude/` | Claude Code 配置 | [.claude/README.md](.claude/README.md) |
| `zettelkasten/` | 知識卡片系統 | [zettelkasten/README.md](zettelkasten/README.md) |
| `doc/` | 專案文檔 | [doc/README.md](doc/README.md) |
| `tests/` | 測試架構 | [tests/README.md](tests/README.md) |
| `static/practice/` | 靜態網頁 | [static/practice/README.md](static/practice/README.md) |
| `articles/` | 學習文章存放 | [articles/README.md](articles/README.md) |

---

## 兩種卡片建立場景

### 場景 A：從文章拆解
- **代理人**：`/create-zettel`（Slash Command）
- **觸發**：使用者提供日文文章
- **流程**：分析 → 識別 → 批次建立 5-15 張
- **適用**：學習新文章、拓展新領域

### 場景 B：系統需求補充
- **結構代理人**：`card-structure-handler`
- **內容代理人**：`build-card-content`
- **觸發**：前一版本的 Extension-Review 和 Linking 階段識別缺口
- **流程**：
  1. 檢視 `doc/worklog/extension-cards-{prev}.md` 和 `linking-cards-{prev}.md`
  2. 篩選 Critical/High 優先級卡片
  3. 建立本版本工作清單（`worklog-{version}.md`）
  4. card-structure-handler 建立卡片結構 → build-card-content 填充內容 → 四階段循環
- **適用**：版本循環 Draft 階段

---

## 維護工具清單

| 工具 | 功能 |
|------|------|
| ⭐ `stage_dashboard.py` | **階段管理看板**（進度追蹤單一入口） |
| `list-categories.py` | 列出所有分類 |
| `list-tags.py` | 列出可用 tags |
| `list-domains.py` | 列出專業領域與子主題（定義於 `data/domains.toml`） |
| `migrate_domain_tags.py` | 將舊 `domain/*` tag 遷移為 `domains` 欄位；`--check` 檢查殘留 |
| `get-next-number.py` | 取得並保留下一編號（支援並發，輸出三位數） |
| `card_numbering.py` | 編號核心模組；`check` 檢查衝突、`duplicates` 列出重複編號 |
| `allocate_card_numbers.py` | 預先分配編號 |
| `update-index.py` | 更新分類索引 |
| `verify-meta.py` | 驗證 Meta 系統 |
| `fix-numbering.py` | 檢查/修復編號連續性 |
| `fix-wikilinks.py` | 檢查/修復連結格式 |
| `replace_pending_links.py` | 替換待建立連結並新增缺口到 CSV |
| `detect_pending_links.py` | 檢測待建立標記 |
| `lookup-dictionary.py` | 查詢 macOS 字典 |
| `get_pending_cards.py` | 讀取待辦卡片清單 |
| `add_pending_cards.py` | 新增待辦卡片 |
| `update_card_progress.py` | 更新卡片進度 |
| `manage_worklog_cards.py` | 查詢統計與驗證 |
| `set_active_csv.py` | 設定/查看 Active CSV |

**詳細使用說明**：[scripts/README.md](scripts/README.md)
**CSV 工具說明**：[doc/worklog/README-CSV.md](doc/worklog/README-CSV.md)

### Active CSV 機制

系統使用 Active CSV 機制統一管理當前工作的 CSV 檔案，確保代理人使用正確的 CSV。

```bash
# 設定當前工作的 CSV
uv run scripts/set_active_csv.py cards-pending-links-1.4.0.csv

# 查看當前設定
uv run scripts/set_active_csv.py --show

# 列出所有可用 CSV
uv run scripts/set_active_csv.py --list

# 清除設定（回到自動偵測）
uv run scripts/set_active_csv.py --clear
```

設定後，`update_card_progress.py` 等腳本自動使用正確的 CSV，代理人無需手動指定。

**禁止操作**：
- ❌ 不使用 `sed` 直接修改 CSV
- ❌ 所有 CSV 操作必須透過標準腳本

---

## 連結格式規範

**唯一正確格式**：`[text](path.md)`

**絕對禁止**：`[[wikilink]]` 或 `[[path|text]]`

---

## 術語表

詳細術語定義請參考：[doc/terminology.md](doc/terminology.md)

核心概念速查：
- **階段（Phase）**：工作流程的步驟（Content Creation → Extension Review → Link Building → Final Verification）
- **狀態（Stage）**：CSV 中的標記（pending → draft → extension-review → linking → completed）

---

**最後更新：2025-12-23**
