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

### 安裝

腳本使用專案的 Python 環境，通過 `uv run` 執行：

```bash
# 無需額外安裝，直接使用
uv run scripts/manage_worklog_cards.py --help
```

### 常用指令

#### 1. 查看統計資訊

```bash
uv run scripts/manage_worklog_cards.py stats
```

輸出範例：
```
📊 統計資訊
============================================================
總卡片數: 264

按階段統計:
  completed              58 ( 22.0%)
  pending               206 ( 78.0%)

按優先級統計:
  Critical               66 ( 25.0%)
  High                  152 ( 57.6%)
  Medium                 35 ( 13.3%)
  Low                     4 (  1.5%)
```

#### 2. 列出卡片

```bash
# 列出所有待建立卡片
uv run scripts/manage_worklog_cards.py list --stage pending

# 列出 Critical 優先級（前 10 張）
uv run scripts/manage_worklog_cards.py list --priority Critical --stage pending --limit 10

# 列出特定分類
uv run scripts/manage_worklog_cards.py list --category noun --stage pending

# 列出特定批次
uv run scripts/manage_worklog_cards.py list --batch 1

# 複合篩選
uv run scripts/manage_worklog_cards.py list --category noun --priority Critical --stage pending
```

#### 3. 更新卡片狀態

```bash
# 開始建立卡片（標記為 draft）
uv run scripts/manage_worklog_cards.py update --id 59 --stage draft --batch 1

# 完成卡片（標記為 completed）
uv run scripts/manage_worklog_cards.py update --id 59 --stage completed --batch 1

# 只更新批次號碼
uv run scripts/manage_worklog_cards.py update --id 59 --batch 1
```

#### 4. 批次更新

```bash
# 批次標記為 draft（開始執行）
uv run scripts/manage_worklog_cards.py batch-update --ids 59-68 --stage draft --batch 1

# 批次標記為 completed（完成）
uv run scripts/manage_worklog_cards.py batch-update --ids 59-68 --stage completed --batch 1
```

#### 5. 驗證資料

```bash
# 驗證 CSV 格式和內容
uv run scripts/manage_worklog_cards.py validate
```

---

## 📋 工作流程範例

### 情境：開始建立第一批 Critical 卡片

#### 步驟 1：查看待建立的 Critical 卡片

```bash
uv run scripts/manage_worklog_cards.py list --priority Critical --stage pending --limit 10
```

輸出：
```
📋 找到 10 張卡片
ID:  59 | noun | noun/018_tango.md | 単語 | 單詞 | JLPT: n5 | Critical | pending
ID:  60 | noun | noun/019_kanji.md | 漢字 | 漢字 | JLPT: n5 | Critical | pending
...
```

#### 步驟 2：標記這批卡片開始執行

```bash
uv run scripts/manage_worklog_cards.py batch-update --ids 59-68 --stage draft --batch 1
```

#### 步驟 3：使用 create-card 代理人建立卡片

```bash
# 逐張使用代理人建立
# （此處使用 create-card 代理人的具體流程）
```

#### 步驟 4：完成後更新狀態

```bash
# 單張完成
uv run scripts/manage_worklog_cards.py update --id 59 --stage completed

# 或批次完成
uv run scripts/manage_worklog_cards.py batch-update --ids 59-68 --stage completed --batch 1
```

#### 步驟 5：查看進度

```bash
uv run scripts/manage_worklog_cards.py stats
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

## 📚 相關文檔

- **簡化版 Worklog**：`doc/worklog/worklog-1.0.6.md`
- **完整版備份**：`doc/worklog/worklog-1.0.6-full-backup.md`
- **CSV 檔案**：`doc/worklog/cards-1.0.6.csv`
- **管理腳本**：`scripts/manage_worklog_cards.py`
- **提取腳本**：`scripts/extract_cards_to_csv.py`

---

## 💡 未來改進方向

1. **自動化**：create-card 代理人完成後自動更新 CSV
2. **報告生成**：自動生成進度報告 Markdown
3. **視覺化**：生成進度圖表
4. **Extension-Review 整合**：直接產出 CSV 格式
5. **Web UI**：簡單的網頁介面管理卡片

---

**文檔版本**：v1.0
**建立日期**：2025-10-31
**適用版本**：v1.0.6+
