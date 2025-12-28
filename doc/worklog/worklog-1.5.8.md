# 工作日誌：v1.5.8 標準化階段管理流程

**日期**：2025-12-28
**版本**：v1.5.8
**前置版本**：v1.5.6

---

## 版本目標

1. **建立標準化的階段管理流程**：統一任務分配的查詢方式
2. **新增 stage_dashboard.py 腳本**：作為進度追蹤的單一入口
3. **更新文檔**：將新工具納入標準流程

---

## 問題背景

### 現況問題

1. **進度追蹤分散**：CSV 和 YAML 兩套系統，查詢方式不一致
2. **任務分配無標準流程**：每次都要手動拼湊不同的命令
3. **代理人依賴不明確**：不清楚各階段應該使用哪個代理人

### 需求

- 統一的進度查詢入口
- 標準化的任務分配流程
- 明確的代理人映射

---

## 解決方案

### 1. 新增 `stage_dashboard.py` 腳本

**設計原則**：
- YAML frontmatter = 單一事實來源
- 腳本輸出 = 任務分配依據

**核心功能**：

| 命令 | 功能 |
|------|------|
| `stage_dashboard.py` | 顯示總覽 |
| `stage_dashboard.py --next-action` | 下一步行動建議 |
| `stage_dashboard.py --stage {stage}` | 特定階段卡片 |
| `stage_dashboard.py --by-category` | 按分類分組 |
| `stage_dashboard.py --format json` | JSON 輸出（供代理人） |

### 2. 階段與代理人映射

| 階段 | 代理人 |
|------|--------|
| pending | card-structure-handler + build-card-content |
| draft | create-extension-cards |
| extension-review | build-card-links |
| linking | 最終驗證（人工 + diagram-designer） |
| completed | （已完成） |

### 3. 標準化流程

每次分配任務前執行：
```bash
# 1. 查看當前狀態
uv run scripts/stage_dashboard.py

# 2. 查看下一步行動
uv run scripts/stage_dashboard.py --next-action

# 3. 取得待處理卡片（JSON 供代理人）
uv run scripts/stage_dashboard.py --stage {stage} --limit 50 --format json
```

---

## 執行記錄

### 1. 腳本開發 ✅

- [x] 建立 `scripts/stage_dashboard.py`
- [x] 實現 YAML 掃描功能
- [x] 實現總覽、行動建議、階段列表功能
- [x] 實現 JSON 輸出格式

### 2. 文檔更新 ✅

- [x] 更新 `scripts/README.md` - 加入詳細使用說明
- [x] 更新 `CLAUDE.md` - 加入標準化任務分配流程
- [x] 更新維護工具清單 - 標記為最重要的工具

---

## 當前系統狀態

執行 `stage_dashboard.py` 顯示：

| 階段 | 數量 | 百分比 |
|------|------|--------|
| pending | 745 | 44.3% |
| draft | 677 | 40.2% |
| extension-review | 6 | 0.4% |
| linking | 7 | 0.4% |
| completed | 247 | 14.7% |

**總卡片數**：1682
**完成率**：14.7%

**下一步行動**：處理 draft 階段（677 張），使用 create-extension-cards 代理人

---

## 相關文件

- [scripts/stage_dashboard.py](../../scripts/stage_dashboard.py)
- [scripts/README.md](../../scripts/README.md)
- [CLAUDE.md](../../CLAUDE.md)
