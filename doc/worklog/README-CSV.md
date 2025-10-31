# Worklog CSV 管理系統使用指南

## 📋 概述

從 v1.0.6 開始，我們採用 **CSV + Markdown 混合方案**來管理待建立卡片清單，以提升效率和節省 token。

## 🎯 方案優勢

### Token 節省

| 項目 | 原方案（純 Markdown）| 新方案（CSV + Markdown）| 節省比例 |
|------|-------------------|---------------------|----------|
| worklog 檔案大小 | 52,300 字節 | 8,081 字節 | **-84.5%** |
| worklog 行數 | 893 行 | 268 行 | **-70.0%** |
| Token 消耗（估算）| ~16,000 tokens | ~2,500 tokens | **-84.4%** |

### 效率提升

- ✅ **查詢速度**：pandas 查詢比解析 Markdown 快 10-50 倍
- ✅ **批量處理**：易於篩選、排序、分組
- ✅ **狀態追蹤**：即時更新 stage 欄位
- ✅ **自動化友好**：腳本輔助，減少人為錯誤

---

## 📂 檔案結構

```
doc/worklog/
├── worklog-1.0.6.md              # 簡化版 Markdown（統計 + 說明）
├── cards-1.0.6.csv                # 完整卡片清單（264 張）
├── worklog-1.0.6-full-backup.md   # 原完整版備份
└── README-CSV.md                  # 本說明文件

scripts/
├── manage_worklog_cards.py         # 卡片管理腳本
└── extract_cards_to_csv.py         # 從 Markdown 提取 CSV
```

---

## 📊 CSV 格式說明

### 欄位定義

| 欄位 | 型別 | 說明 | 範例 |
|------|------|------|------|
| **id** | int | 卡片編號（1-264）| 133 |
| **category** | string | 分類 | noun, verb-ru, grammar |
| **number** | string | 分類內編號（3位數）| 018 |
| **path** | string | 卡片路徑 | noun/018_tango.md |
| **japanese** | string | 日文詞彙/概念 | 単語 |
| **chinese** | string | 中文翻譯 | 單詞 |
| **jlpt** | string | JLPT 等級 | n5, n4, n3, n2, concept |
| **source** | string | 來源簡稱 | v1.0.4, v1.0.5, misc-tags |
| **priority** | string | 優先級 | Critical, High, Medium, Low |
| **stage** | string | 當前階段 | pending, draft, extension-review, linking, completed |
| **note** | string | 備註 | 與 goi 對比, 已存在 031 |
| **created** | date | 建立日期 | 2025-10-31 |
| **updated** | date | 更新日期 | 2025-10-31 |
| **batch** | int | 執行批次 | 1, 2, 3... |

### Stage 階段說明

- **pending**：尚未開始建立（初始狀態）
- **draft**：正在建立中（Phase 1 - Draft）
- **extension-review**：延伸需求審查中（Phase 2）
- **linking**：連結建立中（Phase 3）
- **completed**：已完成（Phase 4）

---

## 🛠️ 管理腳本使用

### 腳本概覽

本專案提供四個 CSV 管理腳本，各司其職：

| 腳本 | 用途 | 主要使用者 |
|------|------|-----------|
| **get_pending_cards.py** | 讀取待辦卡片清單（建立 Todo） | 主線程、代理人 |
| **add_pending_cards.py** | 新增待辦卡片 | Extension-Review 代理人 |
| **update_card_progress.py** | 更新卡片進度 | create-card 代理人 |
| **manage_worklog_cards.py** | 查詢統計與驗證 | 人工查詢 |

### 安裝

腳本使用專案的 Python 環境，通過 `uv run` 執行：

```bash
# 無需額外安裝，直接使用
uv run scripts/get_pending_cards.py --help
uv run scripts/add_pending_cards.py --help
uv run scripts/update_card_progress.py --help
uv run scripts/manage_worklog_cards.py --help
```

---

## 📖 腳本使用指南

### 1. 讀取待辦卡片清單（get_pending_cards.py）

**用途**：查詢待辦卡片清單，用於主線程建立 TodoWrite 任務

#### 基本用法

```bash
# 文字格式（預設，人類可讀）
uv run scripts/get_pending_cards.py --stage pending --priority Critical --limit 10

# JSON 格式（供程式解析，包含 TodoWrite 所需欄位）
uv run scripts/get_pending_cards.py --stage pending --format json
```

#### 篩選選項

```bash
# 按階段篩選
uv run scripts/get_pending_cards.py --stage pending

# 按優先級篩選
uv run scripts/get_pending_cards.py --priority Critical

# 按分類篩選
uv run scripts/get_pending_cards.py --category noun

# 按 JLPT 等級篩選
uv run scripts/get_pending_cards.py --jlpt n5

# 複合篩選
uv run scripts/get_pending_cards.py --stage pending --priority Critical --category noun --limit 5
```

#### JSON 輸出格式

JSON 輸出包含 TodoWrite 所需的所有欄位：

```json
[
  {
    "id": 59,
    "category": "noun",
    "path": "noun/018_tango.md",
    "japanese": "単語",
    "chinese": "單詞",
    "priority": "Critical",
    "stage": "pending",
    "jlpt": "n5",
    "content": "建立 noun/018_tango.md",
    "activeForm": "建立 単語（單詞）卡片"
  }
]
```

---

### 2. 新增待辦卡片（add_pending_cards.py）

**用途**：新增待辦卡片到 CSV（供 Extension-Review 代理人使用）

#### 單張新增

```bash
uv run scripts/add_pending_cards.py add \
    --category noun \
    --number 025 \
    --japanese 語彙 \
    --chinese 詞彙 \
    --jlpt n4 \
    --source v1.0.6 \
    --priority High
```

#### 批次新增（從 JSON 檔案）

```bash
# 從檔案讀取
uv run scripts/add_pending_cards.py batch --from-json extension-cards.json

# 從 stdin 讀取
cat cards.json | uv run scripts/add_pending_cards.py batch --from-json -
```

#### JSON 格式範例

```json
[
  {
    "category": "noun",
    "number": "025",
    "japanese": "語彙",
    "chinese": "詞彙",
    "jlpt": "n4",
    "priority": "High",
    "source": "v1.0.6",
    "note": "從 Extension-Review 識別"
  }
]
```

---

### 3. 更新卡片進度（update_card_progress.py）

**用途**：更新卡片階段和批次（供 create-card 代理人使用）

#### 基本用法

```bash
# 更新單張卡片階段
uv run scripts/update_card_progress.py --id 59 --stage draft

# 更新階段並設定批次
uv run scripts/update_card_progress.py --id 59 --stage completed --batch 1

# 批次更新
uv run scripts/update_card_progress.py --ids 59-68 --stage completed --batch 1
```

#### 安靜模式（減少代理人輸出干擾）

```bash
uv run scripts/update_card_progress.py --id 59 --stage draft --quiet
```

#### 階段轉換規則

腳本會自動驗證階段轉換是否合法：

```
pending → draft
draft → extension-review (或回退到 pending)
extension-review → linking (或回退到 draft)
linking → completed (或回退到 extension-review)
completed → (無法轉換)
```

---

### 4. 查詢統計與驗證（manage_worklog_cards.py）

**用途**：人工查詢、統計和驗證（僅供查詢使用）

#### 常用指令

```bash
# 查看統計資訊
uv run scripts/manage_worklog_cards.py stats

# 列出卡片
uv run scripts/manage_worklog_cards.py list --stage pending --priority Critical --limit 10

# 驗證 CSV 資料
uv run scripts/manage_worklog_cards.py validate
```

**注意**：此腳本已移除 update 和 batch-update 功能，請使用 `update_card_progress.py` 更新卡片進度。

---

## 🔄 工作流程整合

### 情境 1：主線程建立 Todo 任務

```bash
# 步驟 1：查詢待辦卡片（JSON 格式）
uv run scripts/get_pending_cards.py --stage pending --priority Critical --limit 10 --format json > /tmp/cards.json

# 步驟 2：在主線程中使用 JSON 建立 TodoWrite 任務
# （代理人或主線程讀取 /tmp/cards.json 並建立對應的 todo）
```

### 情境 2：Extension-Review 代理人新增待辦卡片

```bash
# Extension-Review 代理人產出 JSON 格式的延伸需求
# 範例：extension-cards-new.json

# 批次新增到 CSV
uv run scripts/add_pending_cards.py batch --from-json extension-cards-new.json

# 查看更新後的統計
uv run scripts/manage_worklog_cards.py stats
```

### 情境 3：create-card 代理人完成卡片建立

```bash
# create-card 代理人在完成卡片建立後，呼叫更新腳本
uv run scripts/update_card_progress.py --id 59 --stage completed --batch 1 --quiet
```


---

## 🔄 從 Markdown 更新 CSV

如果手動編輯了 worklog Markdown 並需要重新生成 CSV：

```bash
# 重新從 Markdown 提取（會覆蓋現有 CSV）
uv run scripts/extract_cards_to_csv.py
```

**⚠️ 注意**：這會**覆蓋**現有的 `cards-1.0.6.csv`，包括所有的 stage 更新。建議在執行前備份：

```bash
cp doc/worklog/cards-1.0.6.csv doc/worklog/cards-1.0.6.csv.backup
uv run scripts/extract_cards_to_csv.py
```

---

## 📈 與 Excel/Google Sheets 整合

CSV 檔案可直接在 Excel 或 Google Sheets 中開啟和編輯：

### 在 Excel 中開啟

1. 開啟 Excel
2. 檔案 → 開啟 → 選擇 `cards-1.0.6.csv`
3. 確保編碼設定為 **UTF-8**

### 在 Google Sheets 中開啟

1. 開啟 Google Sheets
2. 檔案 → 匯入 → 上傳 `cards-1.0.6.csv`
3. 匯入設定：分隔符號選擇「逗號」，編碼選擇「UTF-8」

### 編輯後匯出

編輯完成後：
1. 檔案 → 下載 → 逗號分隔值 (.csv)
2. 確保檔名為 `cards-1.0.6.csv`
3. 替換原檔案

---

## ⚠️ 注意事項

### 1. CSV 編輯規則

- ✅ **可以修改**：stage, priority, note, batch 欄位
- ⚠️ **謹慎修改**：japanese, chinese, jlpt（會影響卡片內容）
- ❌ **不要修改**：id, category, number, path（會破壞系統一致性）

### 2. Git 衝突處理

CSV 檔案在 Git 合併時可能產生衝突。建議：

- 在修改前先 pull 最新版本
- 使用 `git diff` 檢查變更
- 衝突時優先保留 stage 和 batch 更新

### 3. 備份策略

重要操作前建議備份：

```bash
# 備份 CSV
cp doc/worklog/cards-1.0.6.csv doc/worklog/cards-1.0.6.csv.$(date +%Y%m%d_%H%M%S)

# 備份整個 worklog 目錄
tar -czf worklog-backup-$(date +%Y%m%d).tar.gz doc/worklog/
```

---

## 🐛 故障排除

### 問題 1：腳本無法執行

```bash
# 確認 Python 環境
uv run python --version

# 重新安裝依賴（如有需要）
uv sync
```

### 問題 2：CSV 格式錯誤

```bash
# 使用驗證功能檢查
uv run scripts/manage_worklog_cards.py validate

# 如果損壞，從備份恢復
cp doc/worklog/worklog-1.0.6-full-backup.md doc/worklog/worklog-1.0.6.md
uv run scripts/extract_cards_to_csv.py
```

### 問題 3：統計數字不對

```bash
# 檢查 CSV 行數
wc -l doc/worklog/cards-1.0.6.csv

# 重新統計
uv run scripts/manage_worklog_cards.py stats
```

---

## 📚 相關文檔與腳本

### 文檔
- **簡化版 Worklog**：`doc/worklog/worklog-1.0.6.md`
- **完整版備份**：`doc/worklog/worklog-1.0.6-full-backup.md`
- **CSV 檔案**：`doc/worklog/cards-1.0.6.csv`

### 腳本
- **讀取清單**：`scripts/get_pending_cards.py` - 查詢待辦卡片清單（建立 Todo）
- **新增卡片**：`scripts/add_pending_cards.py` - 新增待辦卡片（Extension-Review）
- **更新進度**：`scripts/update_card_progress.py` - 更新卡片階段（create-card）
- **查詢統計**：`scripts/manage_worklog_cards.py` - 統計與驗證（人工查詢）
- **提取工具**：`scripts/extract_cards_to_csv.py` - 從 Markdown 提取 CSV（維護用）

---

## 💡 未來改進方向

1. ~~**自動化**：create-card 代理人完成後自動更新 CSV~~ ✅ **已完成**（update_card_progress.py）
2. **報告生成**：自動生成進度報告 Markdown
3. **視覺化**：生成進度圖表
4. ~~**Extension-Review 整合**：直接產出 CSV 格式~~ ✅ **已完成**（add_pending_cards.py）
5. **Web UI**：簡單的網頁介面管理卡片
6. ~~**Todo 整合**：提供 JSON 格式供 TodoWrite 使用~~ ✅ **已完成**（get_pending_cards.py）

---

**文檔版本**：v1.1
**建立日期**：2025-10-31
**更新日期**：2025-10-31（新增三個 CSV 管理腳本）
**適用版本**：v1.0.6+
