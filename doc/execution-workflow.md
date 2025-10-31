# 版本循環執行指南

本文檔說明如何執行四階段版本循環，包括 todo 管理和代理人使用方式。

---

## 核心原則

### ✅ 必須做

1. **每張卡片 = 一個 Todo**
   - 40 張卡片 → 建立 40 個 todo
   - 每個 todo 只處理一張卡片

2. **平行處理**
   - 使用 Task 工具同時啟動多個代理人
   - 一次發送多個 Task 呼叫（建議 5-10 個）

3. **所有卡片同等重要**
   - 不區分優先級
   - 全部完成，不拖延任何卡片

### ❌ 不可做

1. 一個 todo 包含多張卡片
2. 分批處理（如「第一批 5 張」）
3. 按優先級區分處理順序
4. 使用腳本批次處理卡片內容
5. 評估工時或延後處理

---

## 前置步驟：版本規劃（Draft 開始前）

### 核心原則

**每個新版本開始前，必須先完成版本規劃**：
1. 檢視前一版本的延伸需求報告
2. 篩選和整合卡片需求
3. 建立本版本的工作清單

**重要**：這是版本循環的核心流程，不可跳過。

### 執行步驟

**步驟 1：檢視前一版本報告**

使用 Read 工具讀取兩份報告：
- `doc/worklog/extension-cards-{prev}.md` - Extension-Review 階段產出
- `doc/worklog/linking-cards-{prev}.md` - Linking 階段產出

```bash
# 檢查報告是否存在
ls doc/worklog/extension-cards-{prev}.md
ls doc/worklog/linking-cards-{prev}.md
```

**步驟 2：整合卡片需求**

從兩份報告中識別：
- **Critical 優先級卡片**（必須處理）
- **High 優先級卡片**（優先處理）
- **已建立的草稿卡片**（需完成）
- **JLPT N5-N4 卡片**（優先學習者需求）

**步驟 3：建立工作清單**

在 `doc/worklog/worklog-{version}.md` 中建立表格，包含：
- 卡片路徑、日文/中文
- JLPT 等級、優先級
- 來源版本
- Stage（初始 pending）

**範例參考**：
- `doc/worklog/worklog-1.0.4.md` - 完整的卡片來源說明
- `doc/worklog/worklog-1.0.6.md` - 包含來源標註

**步驟 4：確認數量合理**

建議範圍：20-40 張卡片
- 太少：版本循環過於頻繁
- 太多：難以管理和追蹤

**完成標準**：
- ✅ 兩份前版本報告已檢視
- ✅ 卡片清單已建立在 worklog 中
- ✅ 數量在合理範圍
- ✅ 優先級和來源已標註

---

## CSV 工作清單管理（v1.0.6+）

從 v1.0.6 開始，工作清單採用 CSV + Markdown 混合方案，提供專用腳本管理卡片進度。

### 可用腳本

| 腳本 | 用途 | 使用者 |
|------|------|--------|
| `get_pending_cards.py` | 讀取待辦卡片清單（建立 Todo） | 主線程 |
| `add_pending_cards.py` | 新增待辦卡片（Extension/Linking） | 代理人 |
| `update_card_progress.py` | 更新卡片進度（完成建立） | 代理人 |
| `manage_worklog_cards.py` | 查詢統計與驗證 | 人工查詢 |

### 常用操作

```bash
# 1. 讀取待辦卡片（文字格式）
uv run scripts/get_pending_cards.py --stage pending --priority Critical --limit 10

# 2. 讀取待辦卡片（JSON 格式，供 TodoWrite）
uv run scripts/get_pending_cards.py --stage pending --format json

# 3. 更新卡片狀態（代理人完成後）
uv run scripts/update_card_progress.py --id 59 --stage completed --quiet

# 4. 新增待辦卡片（Extension-Review/Linking 產出）
uv run scripts/add_pending_cards.py batch --from-json extension-cards.json

# 5. 查看統計
uv run scripts/manage_worklog_cards.py stats
```

詳細說明：`doc/worklog/README-CSV.md`

---

## 階段 1：Draft（建立卡片）

### 使用代理人

`create-card`（`.claude/agents/create-card.md`）

### 執行步驟

**步驟 1：讀取工作清單並建立 Todo**

使用 `get_pending_cards.py` 讀取待辦卡片：

```bash
# 讀取 Critical 優先級卡片（JSON 格式）
uv run scripts/get_pending_cards.py --stage pending --priority Critical --format json > /tmp/cards.json
```

從 JSON 為每張卡片建立一個 todo：

範例：40 張卡片 → 建立 40 個 todo

**步驟 2：啟動平行代理人**

使用 Task 工具一次啟動 5-10 個 create-card 代理人。

**重要**：傳遞卡片 ID 給代理人，以便完成後更新 CSV。

**步驟 3：代理人自動更新 CSV**

每個代理人完成卡片建立後，會自動執行：

```bash
uv run scripts/update_card_progress.py --id {card_id} --stage completed --quiet
```

**步驟 4：更新 Todo**

標記對應的 todo 為 `completed`。

**步驟 5：繼續處理**

當第一批完成後，繼續啟動下一批代理人，直到所有 40 個 todo 完成。

### 代理人輸入格式

```
卡片規格：
- 類型：conjunction
- 標題：だから
- 描述：所以、因此
- JLPT：n5
- 標籤：casual, connector, reason
```

### 完成標準

- ✅ 所有 todo 標記為 `completed`
- ✅ 所有卡片 `stage: draft`
- ✅ 每張卡片包含完整的三語解釋和 3-5 個例句
- ✅ 更新 worklog 進度

---

## 階段 2：Extension-Review（檢查延伸需求）

### 使用代理人

`create-extension-cards`（`.claude/agents/create-extension-cards.md`）

### 執行步驟

**步驟 1：更新所有卡片為 extension-review 階段**

```bash
# 批次更新所有 draft 卡片為 extension-review
uv run scripts/get_pending_cards.py --stage draft --format json | \
  jq -r '.[].id' | \
  xargs -I {} uv run scripts/update_card_progress.py --id {} --stage extension-review
```

**步驟 2：建立 Todo List**

```bash
# 讀取所有 extension-review 階段卡片
uv run scripts/get_pending_cards.py --stage extension-review --format json > /tmp/review-cards.json
```

為每張卡片建立一個檢查 todo（40 張卡片 → 40 個檢查 todo）。

**步驟 3：啟動平行代理人**

一次啟動多個代理人檢查卡片。

**步驟 4：代理人整理延伸需求為 JSON**

每個代理人識別延伸需求後，整理成 JSON 格式：

```json
[
  {
    "category": "verb-ru",
    "number": "001_001",
    "japanese": "食べる（敬語）",
    "chinese": "吃（敬語用法）",
    "jlpt": "n4",
    "priority": "High",
    "source": "v1.0.6-extension-review",
    "note": "從 001_taberu 識別"
  }
]
```

**步驟 5：批次新增延伸需求到 CSV**

```bash
# 從所有代理人產出的 JSON 新增到 CSV
uv run scripts/add_pending_cards.py batch --from-json /tmp/extension-cards-v1.0.6.json
```

**步驟 6：更新卡片 Stage**

檢查完成後，批次更新為 linking 階段：

```bash
uv run scripts/get_pending_cards.py --stage extension-review --format json | \
  jq -r '.[].id' | \
  xargs -I {} uv run scripts/update_card_progress.py --id {} --stage linking
```

### 完成標準

- ✅ 所有檢查 todo 完成
- ✅ 所有卡片 `stage: linking`
- ✅ 延伸需求已新增到 CSV（使用 `add_pending_cards.py`）
- ✅ 可使用 `manage_worklog_cards.py stats` 查看新增的卡片數

---

## 階段 3：Linking（建立連結）

### 使用代理人

`build-card-links`（`.claude/agents/build-card-links.md`）

### 執行步驟

**步驟 1：建立 Todo List**

```bash
# 讀取所有 linking 階段卡片
uv run scripts/get_pending_cards.py --stage linking --format json > /tmp/linking-cards.json
```

為每張卡片建立一個連結 todo（40 張卡片 → 40 個連結 todo）。

**步驟 2：啟動平行代理人**

一次啟動多個代理人處理連結。

**步驟 3：補充連結和腳註**

每個代理人為卡片添加：
- 標準 Markdown 連結（Related Links 區塊）
- 腳註標註（Footnotes）

**步驟 4：識別遺漏卡片並建立草稿**

如果發現缺口，代理人會：
1. 建立草稿卡片（基本 YAML frontmatter）
2. 整理成 JSON 格式

```json
[
  {
    "category": "verb-u",
    "number": "017",
    "japanese": "いただく",
    "chinese": "吃／收到（謙讓語）",
    "jlpt": "n4",
    "priority": "High",
    "source": "v1.0.6-linking",
    "note": "從 001_taberu 連結時建立草稿",
    "stage": "draft"
  }
]
```

**步驟 5：批次新增缺口卡片到 CSV**

```bash
# 新增草稿卡片和待建立卡片
uv run scripts/add_pending_cards.py batch --from-json /tmp/linking-gap-cards.json
```

**步驟 6：更新卡片 Stage**

連結完成後，批次更新為 completed：

```bash
uv run scripts/get_pending_cards.py --stage linking --format json | \
  jq -r '.[].id' | \
  xargs -I {} uv run scripts/update_card_progress.py --id {} --stage completed
```

### 完成標準

- ✅ 所有連結 todo 完成
- ✅ 所有卡片 `stage: completed`
- ✅ 所有卡片包含連結和腳註
- ✅ 缺口卡片已新增到 CSV（使用 `add_pending_cards.py`）
- ✅ 可使用 `get_pending_cards.py --stage draft` 查看草稿卡片

---

## 階段 4：Completed（完成驗證）

### 執行步驟

**步驟 1：執行系統驗證**

```bash
# 檢查分類索引
uv run scripts/list-categories.py --count

# 驗證 Meta 系統
uv run scripts/verify-meta.py --verbose

# 檢查編號連續性
uv run scripts/fix-numbering.py --check

# 檢查 Wikilink 格式
uv run scripts/fix-wikilinks.py --check
```

**步驟 2：修復問題（如有）**

```bash
uv run scripts/fix-numbering.py --fix
uv run scripts/fix-wikilinks.py --fix
```

**步驟 3：更新 CHANGELOG.md**

記錄本版本的變更。

**步驟 4：提交並推送**

```bash
git add .
git commit -m "release: v{version} - {簡短描述}"
git push origin main
```

### 完成標準

- ✅ 所有系統驗證通過
- ✅ CHANGELOG.md 已更新
- ✅ 已提交並推送到 main

---

## Todo 管理原則

### 正確：每張卡片一個 Todo

```
建立 40 個獨立的 todo：

1. [pending] 建立 conjunction/001_dakara.md
2. [pending] 建立 conjunction/002_demo.md
3. [pending] 建立 conjunction/003_sorede.md
...
40. [pending] 建立 phrase/040_invitation_expressions.md
```

### 錯誤：批次處理

```
❌ 錯誤範例：

1. [pending] 建立 conjunction 分類的 5 張卡片
2. [pending] 建立 noun 分類的 10 張卡片
```

---

## 工作日誌更新

### 更新進度

每完成一個 todo，更新 worklog 中的 Stage 欄位：

```
| # | 路徑 | Stage |
|---|------|-------|
| 1 | conjunction/001_dakara.md | completed |
| 2 | conjunction/002_demo.md | draft |
| 3 | conjunction/003_sorede.md | pending |
```

同時更新頂部的進度統計：

```
**進度**：1 / 40
```

---

## 常見問題

### Q: 為什麼要平行處理？

A: 提高效率，避免逐張處理的時間成本。

### Q: 一次應該啟動多少個代理人？

A: 建議 5-10 個，避免過載。

### Q: 可以跳過低優先級的卡片嗎？

A: 不可以。所有卡片同等重要，必須全部完成。

### Q: Extension-Review 階段要建立延伸卡片嗎？

A: 不。只記錄需求到文檔中，延伸卡片在下一版本建立。

---

**最後更新**：2025-10-31
