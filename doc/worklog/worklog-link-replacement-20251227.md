# 工作日誌：連結替換流程整合

**日期**：2025-12-27
**版本**：v1.5.1（預計）

---

## 問題背景

### 現況
在處理 Zettelkasten 卡片時，發現大量卡片包含「待建立」標記：
- **556 張卡片**包含待建立標記
- **4,869 處**待建立連結
- 分佈在 20+ 個分類中

### 問題分析

1. **流程斷層**：缺口卡片（未找到對應卡片的連結）無法自動追蹤
   ```
   replace_pending_links.py        add_pending_cards.py
           ↓                              ↓
      Markdown 報告        ←（手動轉換）→   JSON 格式
   ```

2. **工作流程缺失**：連結替換步驟沒有在四階段工作流程中明確定義

3. **效率問題**：原本考慮用代理人逐一處理（預估 45 分鐘），需要更高效的方案

---

## 解決方案

### 1. 開發 `replace_pending_links.py` 腳本

**核心功能**：
- 預建卡片索引（japanese → path），O(1) 查找
- 行級替換，只修改需要修改的行
- 自動生成缺口報告

**執行時間**：< 15 秒（vs 代理人方案 45 分鐘）

### 2. 擴展腳本功能

新增選項：
| 選項 | 功能 |
|------|------|
| `--json` | 輸出 JSON 格式的缺口清單 |
| `--add-to-csv` | 直接新增缺口到 Active CSV |

### 3. 整合到工作流程

在 CLAUDE.md 的「階段 3：Link Building」中加入：
```bash
# 一站式處理：替換連結 + 新增缺口到 CSV + 生成報告
uv run scripts/replace_pending_links.py --fix --add-to-csv --report
```

---

## 本次變更

### 修改的檔案

| 檔案 | 變更內容 |
|------|---------|
| `scripts/replace_pending_links.py` | 新增 `--json`、`--add-to-csv` 選項 |
| `CLAUDE.md` | 階段 3 說明加入連結替換命令，維護工具清單更新 |

### 首次執行結果

執行 `uv run scripts/replace_pending_links.py --fix --report`：

| 指標 | 數值 |
|------|------|
| 掃描檔案 | 1,072 |
| 修改檔案 | 201 |
| 替換連結 | 207 |
| 未找到連結 | 572 |
| 缺口詞彙 | 474 |

**待建立標記減少**：4,869 → 3,384（-31%）

---

## 測試需求

### 測試 1：基本功能驗證

```bash
# 1.1 檢查模式
uv run scripts/replace_pending_links.py --check
# 預期：顯示統計資訊，不修改檔案

# 1.2 預覽模式
uv run scripts/replace_pending_links.py --dry-run
# 預期：顯示將要修改的內容，不實際修改

# 1.3 JSON 輸出
uv run scripts/replace_pending_links.py --check --json | head -20
# 預期：輸出 JSON 格式的缺口清單
```

### 測試 2：CSV 整合驗證

```bash
# 2.1 確認當前 Active CSV
uv run scripts/set_active_csv.py --show

# 2.2 記錄當前卡片數
uv run scripts/manage_worklog_cards.py stats

# 2.3 測試新增缺口到 CSV（使用 --dry-run 避免實際修改）
uv run scripts/replace_pending_links.py --dry-run --add-to-csv
# 預期：顯示將要新增的缺口數量

# 2.4 如果需要實際測試，可以：
uv run scripts/replace_pending_links.py --fix --add-to-csv --report
# 然後驗證：
uv run scripts/manage_worklog_cards.py stats
# 預期：卡片數量增加
```

### 測試 3：缺口報告驗證

```bash
# 3.1 生成報告
uv run scripts/replace_pending_links.py --check --report

# 3.2 檢查報告內容
cat doc/worklog/gap-report-20251227.md | head -30
# 預期：包含優先級欄位（Critical/High/Medium/Low）
```

### 測試 4：工作流程驗證

確認 CLAUDE.md 更新正確：
```bash
grep -A 15 "階段 3：Link Building" CLAUDE.md
# 預期：包含「連結替換命令」區塊
```

---

## 測試結果

所有 4 個測試通過：
- ✅ 測試 1：基本功能驗證（--check, --dry-run, --json）
- ✅ 測試 2：CSV 整合驗證（成功新增 473 個缺口）
- ✅ 測試 3：缺口報告驗證（包含優先級）
- ✅ 測試 4：工作流程驗證（CLAUDE.md 已更新）

---

## 舊版本 CSV 格式問題

### 問題發現

測試過程中發現 `cards-pending-links-1.4.0.csv` 使用了非標準格式：

| CSV 類型 | 欄位數 | 格式 |
|---------|-------|------|
| 問題 CSV | 7 | `id,japanese,category,frequency,priority,source_count,stage` |
| 標準 CSV | 14 | `id,category,number,path,japanese,chinese,...` |

### 問題根源

- `frequency` 和 `source_count` 欄位不是由任何當前腳本生成
- 在整個 `scripts/` 目錄中搜索這兩個欄位，結果為零
- 推斷：這是舊版本系統或外部工具的遺留物

### 錯誤現象

```
ValueError: dict contains fields not in fieldnames: 'frequency', 'source_count'
```

當 `add_pending_cards.py` 讀取非標準 CSV 後嘗試保存時，DictWriter 因額外欄位而報錯。

### 修復方式

在相關腳本中進行以下修復：

| 腳本 | 問題 | 修復 |
|------|------|------|
| `replace_pending_links.py` | subprocess 呼叫方式錯誤 | 直接使用 `sys.executable` |
| `replace_pending_links.py` | `--csv-only` 參數位置錯誤 | 放在 batch 之前 |
| `replace_pending_links.py` | chinese 為空導致驗證失敗 | 使用佔位符 `（待填寫）` |
| `add_pending_cards.py` | `c['path']` KeyError | 使用 `c.get('path')` |
| `add_pending_cards.py` | 額外欄位導致 save 失敗 | `extrasaction='ignore'` |
| `add_pending_cards.py` | batch 模式無法自動編號 | 新增 `_get_next_number()` |

### 標準定義位置

專案已有完整的 CSV 標準定義：
- **文檔層**：`doc/worklog/README-CSV.md`（第 70-85 行）
- **實現層**：`add_pending_cards.py`（第 147-149 行）
- **驗證層**：`add_pending_cards.py`（第 159-189 行）

### 預防措施

未來建立 CSV 時應：
1. 參考 `README-CSV.md` 的欄位表
2. 使用 `add_pending_cards.py` 的驗證邏輯
3. 不要手動建立非標準格式的 CSV

---

## 後續工作

1. **測試通過後**：提交變更
2. **缺口處理**：
   - 474 個缺口詞彙已記錄在 `doc/worklog/gap-report-20251227.md`
   - 按優先級處理（Critical: 2, High: 多個）
3. **下一版本**：
   - 使用 `--add-to-csv` 將缺口自動加入工作清單
   - 進入下一個版本循環

---

## v1.5.2：缺口卡片批次處理

### 執行摘要

| 指標 | 處理前 | 處理後 | 變化 |
|------|--------|--------|------|
| pending | 473 | 356 | -117 |
| draft | 38 | 155 | +117 |
| 新建檔案 | - | 116 | - |

### 新建卡片分類

- **concept**: 58 張（經濟術語、語言學概念）
- **grammar**: 28 張（語法結構、助詞用法）
- **noun**: 27 張（敬語、商務用語）
- **adj-i**: 3 張（基礎形容詞）

### 技術處理

- 並發執行 117 個代理人
- 編號衝突自動修復（`fix-numbering.py`）
- 提交：`d7fdc77` feat(v1.5.2)

---

## 後續流程規劃

### 當前狀態

這 117 張新建卡片目前處於 **draft** 階段，尚未完成標準四階段流程：

```
① pending → ② draft ✅ 目前位置
                ↓
           ③ extension-review（待執行）
                ↓
           ④ linking（待執行）
                ↓
           ⑤ completed（待執行）
```

### 完整處理流程

新建的 117 張卡片完成四階段流程後，需要執行以下步驟：

#### 步驟 1：執行階段 2-4

```bash
# 階段 2：Extension Review
# 使用 create-extension-cards 代理人檢查 155 張 draft 卡片

# 階段 3：Link Building
# 使用 build-card-links 代理人建立連結

# 階段 4：Final Verification
uv run scripts/fix-numbering.py --check
uv run scripts/fix-wikilinks.py --check
```

#### 步驟 2：整合待建立連結

新建的 117 張卡片內部可能包含新的「待建立」標記，需要與原有卡片的待建立連結整合：

```bash
# 掃描所有卡片的待建立標記，生成統一缺口清單
uv run scripts/replace_pending_links.py --check --report

# 預覽將要新增的缺口
uv run scripts/replace_pending_links.py --dry-run --add-to-csv
```

#### 步驟 3：統整 Pending 清單

將新發現的缺口與原有 356 張 pending 卡片合併：

```bash
# 一站式處理：替換連結 + 新增缺口到 CSV + 生成報告
uv run scripts/replace_pending_links.py --fix --add-to-csv --report

# 驗證合併結果
uv run scripts/manage_worklog_cards.py stats
```

#### 步驟 4：更新連結

執行連結替換，將新建卡片的路徑更新到引用它們的既有卡片中：

```bash
# 再次執行連結替換（新卡片已存在，可被索引）
uv run scripts/replace_pending_links.py --fix --report

# 驗證待建立標記減少
grep -r "待建立" zettelkasten/ | wc -l
```

### 流程圖

```
┌─────────────────────────────────────────────────────────────────────┐
│ v1.5.2 新建 117 張卡片                                               │
│     ↓                                                               │
│ 執行四階段流程（Extension Review → Link Building → Verification）    │
│     ↓                                                               │
│ 新卡片內發現新的「待建立」標記                                        │
│     ↓                                                               │
│ replace_pending_links.py --fix --add-to-csv                         │
│     ↓                                                               │
│ 新缺口加入 pending 清單（與原 356 張合併）                            │
│     ↓                                                               │
│ replace_pending_links.py --fix（更新所有連結）                       │
│     ↓                                                               │
│ 進入下一版本循環                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 預期結果

1. 原有卡片中引用新卡片的「待建立」標記 → 轉為實際連結
2. 新卡片中的「待建立」標記 → 加入統一 pending 清單
3. 所有 pending 卡片形成統一工作清單，供下一版本處理

---

## 相關文件

- [replace_pending_links.py](../../scripts/replace_pending_links.py) - 連結替換腳本
- [gap-report-20251227.md](gap-report-20251227.md) - 缺口報告
- [CLAUDE.md](../../CLAUDE.md) - 工作流程說明
