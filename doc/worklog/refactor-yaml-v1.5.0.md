# 重構計劃：方案 A - 卡片自帶狀態模型

**建立日期**：2025-12-26
**狀態**：待執行（下一對話開始）
**預計版本**：v1.5.0

## 決策摘要

- **選擇方案**：方案 A（卡片自帶狀態）
- **待建立標記**：在版本循環的 Link Building 階段處理
- **執行時機**：下一對話開始（暫停 v1.4.0 卡片建立）
- **實施週期**：2 週
- **設計優先級**：單一事實來源（YAML 為主）

---

## 第一週：基礎建設

### Day 1-2：新增腳本

#### 1. `scripts/detect_pending_links.py`
```bash
uv run scripts/detect_pending_links.py --scan      # 掃描所有卡片
uv run scripts/detect_pending_links.py --report    # 生成報告
```

#### 2. `scripts/verify_content.py`
```bash
uv run scripts/verify_content.py --scan            # 驗證內容完整性
uv run scripts/verify_content.py --incomplete-only # 只顯示不完整
```

#### 3. `scripts/migrate_cards.py`
```bash
uv run scripts/migrate_cards.py --dry-run          # 預覽遷移
uv run scripts/migrate_cards.py --execute          # 執行遷移
```

### Day 3：分析現狀

```bash
uv run scripts/detect_pending_links.py --report > pending_links_report.md
uv run scripts/verify_content.py --scan --format json > content_report.json
```

### Day 4-5：執行遷移

按分類批次遷移，從小到大：
1. counter, proverb (3-6 張)
2. adj-i, adj-na, adverb (10-15 張)
3. noun, grammar, concept (100-300 張)

---

## 第二週：整合更新

### Day 6-7：更新現有腳本

| 腳本 | 修改內容 |
|------|---------|
| `update_card_progress.py` | 新增 YAML frontmatter 更新 |
| `get_pending_cards.py` | 新增 YAML 回退機制 |
| `add_pending_cards.py` | 同時建立卡片檔案 |

### Day 8-9：更新代理人文件

| 代理人 | 修改內容 |
|--------|---------|
| `build-card-content.md` | 更新 YAML `stage`、`content_verification` |
| `card-structure-handler.md` | 建立完整 YAML 結構 |
| `build-card-links.md` | 更新 `pending_links`、`link_status` |
| `create-extension-cards.md` | 從 YAML 查詢 `stage: draft` |

### Day 10：驗證和文件

1. 驗證遷移結果
2. 更新 CLAUDE.md
3. 更新 doc/worklog/README-CSV.md

---

## YAML Frontmatter 新結構

```yaml
---
title: 食べる（たべる）
description: 吃、食用
type: verb-ru
jlpt: n5
tags: [context/casual, domain/daily_life]

# 生命週期
stage: completed                    # pending | draft | extension-review | linking | completed
created: 2025-10-28
updated: 2025-12-26

# 版本歷史（新增）
version_history:
  - version: "1.0.6"
    stage: "completed"
    date: 2025-10-31

# 內容驗證（新增）
content_verification:
  japanese: true
  english: true
  chinese: true
  examples_count: 3
  pending_links: []                 # ["[待建立: 飲む]()"]

# 連結狀態（新增）
link_status:
  incoming: 5
  outgoing: 8
  pending: 0
  verified_date: 2025-12-25
---
```

---

## 設計理由：為什麼放棄 CSV 即時更新？

**問題**：當前系統在兩處追蹤同一資訊
- CSV：`stage: pending → draft → ...`
- 卡片 YAML：`stage: completed`

**風險**：不一致、維護負擔、代理人繞過流程

**選擇 YAML 的原因**：
1. 卡片已經有 `stage` 欄位（事實）
2. 卡片是最終產出，CSV 是中間產物
3. Git diff 可追蹤 YAML 變更歷史
4. 代理人直接改卡片，減少同步依賴

**即時查詢的替代方案**：
```bash
# 查詢所有 draft 卡片（掃描 YAML）
grep -r "stage: draft" zettelkasten/ --include="*.md"

# 或使用新腳本
uv run scripts/query_cards.py --stage draft
```

---

## CSV 角色重新定義

### 舊角色 → 新角色

| 方面 | 舊 | 新 |
|------|-----|-----|
| 用途 | 即時進度追蹤 | 版本規劃快照 |
| 更新頻率 | 每次操作 | 版本開始時 |
| 事實來源 | CSV | YAML frontmatter |
| 欄位數 | 14 | **7** |

### 新 CSV 結構（7 欄位）

```csv
id,category,number,japanese,chinese,jlpt,priority
1,noun,025,語彙,詞彙,n4,High
```

**移除的欄位**（現在在 YAML）：
- `path`、`source`、`stage`、`note`、`created`、`updated`、`batch`

---

## 要修改的檔案

### 新增腳本
- `scripts/detect_pending_links.py`
- `scripts/verify_content.py`
- `scripts/migrate_cards.py`
- `scripts/sync_yaml_csv.py`

### 修改腳本
- `scripts/update_card_progress.py`
- `scripts/get_pending_cards.py`
- `scripts/add_pending_cards.py`
- `scripts/csv_config.py`

### 更新文件
- `.claude/agents/build-card-content.md`
- `.claude/agents/card-structure-handler.md`
- `.claude/agents/build-card-links.md`
- `.claude/agents/create-extension-cards.md`
- `CLAUDE.md`
- `doc/worklog/README-CSV.md`

---

## 風險緩解

| 風險 | 緩解策略 |
|------|---------|
| 資料遺失 | Git 分支隔離、dry-run 模式、CSV 備份 |
| 工作流中斷 | YAML 回退機制、2 週重疊期 |
| 效能問題 | YAML 快取、glob 限制掃描範圍 |
| Schema 演進 | 新增 `schema_version` 欄位 |

---

## 驗收標準

1. ✅ 所有卡片有完整 YAML frontmatter
2. ✅ `stage` 欄位正確反映狀態
3. ✅ `content_verification` 區塊準確
4. ✅ 代理人使用 YAML 而非 CSV 追蹤進度
5. ✅ CSV 僅用於版本規劃快照
