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

## 後續工作

1. **測試通過後**：提交變更
2. **缺口處理**：
   - 474 個缺口詞彙已記錄在 `doc/worklog/gap-report-20251227.md`
   - 按優先級處理（Critical: 2, High: 多個）
3. **下一版本**：
   - 使用 `--add-to-csv` 將缺口自動加入工作清單
   - 進入下一個版本循環

---

## 相關文件

- [replace_pending_links.py](../../scripts/replace_pending_links.py) - 連結替換腳本
- [gap-report-20251227.md](gap-report-20251227.md) - 缺口報告
- [CLAUDE.md](../../CLAUDE.md) - 工作流程說明
