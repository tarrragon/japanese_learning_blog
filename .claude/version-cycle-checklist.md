# 版本循環檢查清單

本文檔定義每個版本（PATCH 版本）的標準工作流程和必須產出的文檔。

---

## 版本循環概述

每個版本循環包含四個階段，產出三份核心文檔：

1. **工作日誌** - `doc/worklog/worklog-{version}.md`
2. **延伸卡片記錄** - `doc/worklog/extension-cards-{version}.md`
3. **連結階段新卡片記錄** - `doc/worklog/linking-cards-{version}.md`

---

## 延伸卡片的處理時間線

```
版本 v1.0.4:
├─ Draft → Extension-Review → Linking → Completed
└─ 產出: extension-cards-1.0.4.md (記錄 80 張延伸需求)

版本 v1.0.5:
├─ 來源: extension-cards-1.0.4.md (選擇 30 張 Critical/High)
├─ Draft → Extension-Review → Linking → Completed
└─ 產出: extension-cards-1.0.5.md (記錄新的延伸需求)
```

**說明**：
- 每個版本的 Extension-Review 階段產出的延伸需求，是**下一個版本**的卡片來源
- 不需要（也不建議）立即建立所有延伸卡片
- 可以根據優先級分批在後續版本中建立
- Linking 階段識別的 Critical 遺漏卡片例外，可以立即建立草稿

---

## ⚠️ 版本開始前：強制檢查清單

**重要**：以下檢查項目**必須全部完成**，才能開始 Draft 階段的工作。

### ✅ 必須完成的檢查（不可跳過）

1. **[ ] 讀取並確認工作日誌**
   - 文件路徑：`doc/worklog/worklog-{version}.md`
   - 確認「版本目標聲明」清晰明確
   - 確認「Phase 1 卡片清單」已完整列出（表格形式）

2. **[ ] 檢視並整合前一版本的延伸需求**（必須完成）

   **步驟 2.1：讀取 Extension-Review 報告**
   - 文件路徑：`doc/worklog/extension-cards-{prev}.md`
   - 確認版本號為 `{prev}`（上一版本），不是 `{current}`
   - 識別 Critical 和 High 優先級卡片
   - 記錄需求數量和主要分類

   **步驟 2.2：讀取 Linking 報告**
   - 文件路徑：`doc/worklog/linking-cards-{prev}.md`
   - 確認版本號為 `{prev}`（上一版本）
   - 識別已建立的草稿卡片（需完成）
   - 識別待建立的 Critical 卡片

   **步驟 2.3：整合卡片來源**
   - 合併兩份報告的需求
   - 按優先級和 JLPT 等級排序
   - 確定本版本處理數量（建議 20-40 張）

   **重要**：每個版本都必須檢視前一版本的報告，這是版本循環的核心流程
   - v1.0.X 的產出文檔 → v1.0.(X+1) 的輸入來源
   - 不可跳過此步驟

3. **[ ] 建立本版本的工作清單**（必須完成）

   在 `doc/worklog/worklog-{version}.md` 中建立詳細的卡片清單表格：

   **必須包含的欄位**：
   - 編號
   - 卡片路徑
   - 日文
   - 中文
   - JLPT 等級
   - Stage（初始為 pending）

   **參考範例**：
   - `doc/worklog/worklog-1.0.4.md`（完整的卡片來源說明）
   - `doc/worklog/worklog-1.0.6.md`（包含來源標註）

4. **[ ] 確認 Draft 階段的卡片數量合理**
   - 建議範圍：20-40 張內容卡片
   - 如果超過 50 張，考慮分批次處理
   - Tag Meta 卡片可以另計

5. **[ ] 確認沒有遺漏上一版本的草稿卡片**
   - 執行：`grep -r "stage: draft" zettelkasten/*/`
   - 確認所有草稿卡片都已列入本版本的工作清單

6. **[ ] 確認版本分支已建立**
   - 執行：`git checkout -b feature/v{version}` 或 `git checkout feature/v{version}`

### 📋 檢查完成後再開始 Draft 階段

**只有完成以上檢查後，才能開始 Draft 階段的工作**。

---

## 版本開始前：規劃階段

### ✅ 規劃檢查清單

- [ ] 檢查上一版本是否有遺留的待建立卡片清單
- [ ] 檢查是否有新文章需要解析
- [ ] 決定本版本的卡片建立目標（數量、優先級、主題）
- [ ] 建立新版本分支：`feature/v{version}`

### 📝 產出文檔

**文檔 1：工作日誌** - `doc/worklog/worklog-{version}.md`

必須包含的章節：
```markdown
# 工作流程文檔 - 版本 {version}

**版本號**: {version}
**循環開始日期**: YYYY-MM-DD
**循環完成日期**: _進行中_
**狀態**: 🚧 進行中

## 📌 版本目標聲明

**核心目標**：[用一句話描述本版本的核心目標]

例如：「完成 v1.0.4 Extension-Review 階段識別的 28 張 Critical 卡片」

**版本類型**：
- [ ] 內容卡片版本（新增/修改學習內容）
- [ ] Meta 系統維護版本（完善 tags/categories 定義）
- [ ] 修復版本（修正錯誤、更新格式）

---

## 📋 卡片來源與優先級篩選

### 來源 1：上一版本的延伸需求

**文檔**：`doc/worklog/extension-review-{previous}.md`

**篩選標準**：
- [ ] 優先級：Critical / High / Medium
- [ ] 數量上限：建議 20-30 張
- [ ] JLPT 等級：N5-N4 優先

**選定卡片**（X 張）：
1. {category}/{name} - {title} (Priority: Critical, JLPT: N5)
2. {category}/{name} - {title} (Priority: High, JLPT: N4)
3. ...

### 來源 2：上一版本 Linking 階段識別的卡片

**文檔**：`doc/worklog/linking-cards-{previous}.md`

**已建立草稿**（Y 張）：
1. {category}/{name} - {title} (已有草稿，需完善)
2. ...

**待建立卡片**（Z 張）：
1. {category}/{name} - {title} (Priority: High, JLPT: N4)
2. ...

### 來源 3：新文章解析

[如有新文章，列出文章和識別的卡片需求]

### 來源 4：其他來源

[如：手動識別的缺口、學習者反饋等]

---

## ✅ Phase 1 卡片清單確認

**本版本 Draft 階段將處理以下卡片**（共 X 張）：

| 編號 | 卡片路徑 | 標題 | 優先級 | JLPT | 來源 | 狀態 |
|------|----------|------|--------|------|------|------|
| 1 | {category}/{number}_{name} | {title} | Critical | N5 | Extension-Review v{prev} | 待建立 |
| 2 | {category}/{number}_{name} | {title} | High | N4 | Linking v{prev} | 已有草稿 |
| ... | ... | ... | ... | ... | ... | ... |

**重要**：此清單必須詳細列出，作為 Draft 階段的執行依據。

## 工作進度追蹤

### 階段 1: Draft（草稿階段）
**目標**: 完成 X 張卡片的內容編寫
**進度**: 0 / X (0%)

### 階段 2: Extension-Review（延伸卡片檢查階段）
**目標**: 檢查所有完成的草稿卡片，識別需要的延伸卡片
**進度**: 未開始

### 階段 3: Linking（建立連結與腳註階段）
**目標**: 為所有檢查完成的卡片添加 wikilinks 和腳註
**進度**: 未開始

### 階段 4: Completed（完成階段）
**目標**: X 張卡片全部完成四階段流程
**進度**: 未開始
```

---

## 階段 1: Draft（草稿完善）

### 🎯 目標
完成工作日誌中列出的所有新卡片的內容編寫。

### ✅ 檢查清單

**開始前：**
- [ ] 確認工作日誌中的卡片清單已完整定義
- [ ] 確認每張卡片的優先級和 JLPT 等級
- [ ] 確認卡片編號已正確分配（使用 `get-next-number.py`）

**執行中：**
- [ ] 使用 `card-structure-handler` 建立卡片結構，`build-card-content` 填充內容
- [ ] 確保卡片 YAML 包含：
  - `stage: draft`
  - `auto_generated: true`（如由代理人建立）
  - `needs_review: true`
  - `created: YYYY-MM-DD`
- [ ] 確保卡片內容包含：
  - 三語解釋（日文、英文、中文）
  - 至少 10-15 個例句
  - 相關文法點說明（如適用）
- [ ] 使用 `update-index.py` 更新各分類的索引

**完成後：**
- [ ] 所有卡片的 `stage` 從 `draft` 更新為 `extension-review`
- [ ] 更新工作日誌的「階段 1」進度為 100%
- [ ] 提交 git commit
- [ ] 推送到遠端分支

### 📝 更新文檔

更新 `doc/worklog/worklog-{version}.md`：
```markdown
### 階段 1: Draft（草稿階段）

**目標**: 完成 X 張卡片的內容編寫

**進度**: X / X (100%) ✅ **已完成**

**完成日期**: YYYY-MM-DD

| 類別 | 已完成 | 卡片清單 |
|------|--------|---------|
| 助詞 | X | particle/XXX, ... |
| 動詞 | X | verb-ru/XXX, ... |
| 文法 | X | grammar/XXX, ... |
| **總計** | **X** | - |
```

---

## 階段 2: Extension-Review（延伸卡片檢查）

### 🎯 目標
分析 Draft 階段建立的卡片，識別可以延伸的新卡片需求。

**⚠️ 重要提醒**：
- Extension-Review 階段**僅識別和記錄**延伸需求
- **不建立**新卡片（除非是 Linking 階段的 Critical 遺漏卡片）
- 延伸需求將成為下一版本（或後續版本）的卡片來源

### ✅ 檢查清單

**開始前：**
- [ ] 確認所有卡片的 `stage` 為 `extension-review`
- [ ] 建立延伸卡片記錄文檔（見下方）

**執行中：**
- [ ] 逐張卡片進行延伸檢查（使用 todo list 追蹤）
- [ ] 識別以下類型的延伸需求：
  - 文法延伸（如：動詞 → 動詞變化文法）
  - 對比卡片（如：は vs が）
  - 語用延伸（如：敬語用法）
  - 文化延伸（如：文化背景說明）
  - 相關詞彙（如：同義詞、反義詞）
- [ ] 將識別的延伸需求記錄到延伸卡片文檔
- [ ] 為每個延伸需求標註：
  - 優先級（Critical, High, Medium, Low）
  - JLPT 等級
  - 來源卡片
  - 簡短說明

**完成後：**
- [ ] 所有卡片的 `stage` 從 `extension-review` 更新為 `linking`
- [ ] 延伸卡片記錄文檔已完成
- [ ] 更新工作日誌的「階段 2」進度為 100%
- [ ] 提交 git commit
- [ ] 推送到遠端分支

### 📝 產出文檔

**文檔 2：延伸卡片記錄** - `doc/worklog/extension-cards-{version}.md`

格式範本：
```markdown
# 延伸卡片記錄 - 版本 {version}

> ⚠️ **適用版本**：本文檔記錄的延伸需求將作為 **v{next}** 或後續版本的卡片來源。
>
> **產出版本**：v{version}（Extension-Review 階段完成）
> **使用版本**：v{next}+（Draft 階段使用）

**版本號**: {version}
**Extension-Review 完成日期**: YYYY-MM-DD
**識別延伸卡片總數**: X 張

---

## 統計摘要

| 優先級 | 數量 | 百分比 |
|--------|------|--------|
| Critical | X | X% |
| High | X | X% |
| Medium | X | X% |
| Low | X | X% |
| **總計** | **X** | **100%** |

---

## Critical 優先級（X 張）

### 1. {category}/{number}_{name}.md - {標題}

**來源**: {來源卡片路徑}
**JLPT**: N5/N4/N3/N2/N1
**優先級**: Critical
**類型**: comparison/grammar/usage/cultural
**建議版本**: v{next} ← 新增：標註此卡片建議在哪個版本建立

**說明**:
[簡短說明為什麼需要這張延伸卡片]

**建議內容**:
- [內容要點 1]
- [內容要點 2]
- [內容要點 3]

---

## High 優先級（X 張）

[同上格式]

---

## Medium 優先級（X 張）

[同上格式]

---

## Low 優先級（X 張）

[同上格式]

---

## 按類型分類

### 對比卡片（X 張）
- [列表]

### 文法延伸（X 張）
- [列表]

### 語用延伸（X 張）
- [列表]

### 文化延伸（X 張）
- [列表]

### 相關詞彙（X 張）
- [列表]

---

## 建議優先處理順序

1. **下一版本（v{next}）建議處理**:
   - Critical: 全部 X 張
   - High: 優先 Y 張

2. **後續版本處理**:
   - High: 剩餘 Z 張
   - Medium: 分批處理

3. **長期規劃**:
   - Low: 根據學習者需求決定
```

### 📝 更新文檔

更新 `doc/worklog/worklog-{version}.md`：
```markdown
### 階段 2: Extension-Review（延伸卡片檢查階段）

**目標**: 檢查所有完成的草稿卡片，識別需要的延伸卡片

**進度**: X / X (100%) ✅ **已完成**

**完成日期**: YYYY-MM-DD

**延伸卡片識別數量**: X 張

| 優先級 | 數量 |
|--------|------|
| Critical | X |
| High | X |
| Medium | X |
| Low | X |
| **總計** | **X** |

**詳細記錄**: 見 `doc/worklog/extension-cards-{version}.md`
```

---

## 階段 3: Linking（建立連結與腳註）

### 🎯 目標
為 Draft 階段建立的卡片添加 wikilinks 和腳註，同時識別在連結過程中發現的新卡片需求。

### ✅ 檢查清單

**開始前：**
- [ ] 確認所有卡片的 `stage` 為 `linking`
- [ ] 建立連結階段新卡片記錄文檔（見下方）

**執行中：**
- [ ] 使用 `build-card-links` 代理人逐張處理卡片
- [ ] 為每張卡片添加：
  - Wikilinks（使用 `[[path|text]]` 格式）
  - 腳註（使用 `[^semantic-name]` 格式）
- [ ] 識別遺漏的卡片：
  - 在建立連結時發現引用但不存在的卡片
  - 概念說明需要但缺少的卡片
  - 對比需要但未建立的卡片
- [ ] 將識別的新卡片需求記錄到連結階段記錄文檔
- [ ] 決定是否立即建立草稿卡片：
  - Critical 卡片：立即建立 `stage: draft`
  - 其他：記錄到文檔，留待後續處理

**完成後：**
- [ ] 所有卡片的 `stage` 從 `linking` 更新為 `completed`
- [ ] 更新 `needs_review: false`
- [ ] 添加 `completed: YYYY-MM-DD`
- [ ] 連結階段新卡片記錄文檔已完成
- [ ] 更新工作日誌的「階段 3」進度為 100%
- [ ] 提交 git commit
- [ ] 推送到遠端分支

### 📝 產出文檔

**文檔 3：連結階段新卡片記錄** - `doc/worklog/linking-cards-{version}.md`

格式範本：
```markdown
# 連結階段新卡片記錄 - 版本 {version}

**版本號**: {version}
**Linking 階段完成日期**: YYYY-MM-DD
**識別新卡片總數**: X 張
**已立即建立草稿**: Y 張

---

## 統計摘要

| 優先級 | 識別數量 | 已建立草稿 | 待後續處理 |
|--------|---------|-----------|-----------|
| Critical | X | X | 0 |
| High | X | Y | Z |
| Medium | X | 0 | X |
| Low | X | 0 | X |
| **總計** | **X** | **Y** | **Z** |

---

## 已建立草稿卡片（Y 張）

### 1. {category}/{number}_{name}.md - {標題}

**來源**: {在哪張卡片的連結過程中發現}
**發現原因**: [為什麼需要這張卡片]
**JLPT**: N5/N4/N3/N2/N1
**優先級**: Critical/High
**狀態**: ✅ 已建立草稿（stage: draft）

**卡片路徑**: `zettelkasten/{category}/{number}_{name}.md`

---

## 待後續處理（Z 張）

### Critical 優先級（0 張）
[Critical 應該都已建立，這裡通常為空]

### High 優先級（X 張）

#### 1. {category}/{number}_{name}.md - {標題}

**來源**: {在哪張卡片的連結過程中發現}
**發現原因**: [為什麼需要這張卡片]
**JLPT**: N5/N4/N3/N2/N1
**優先級**: High
**狀態**: ⏳ 待建立

**建議內容**:
- [內容要點 1]
- [內容要點 2]

---

### Medium 優先級（X 張）

[同上格式]

---

### Low 優先級（X 張）

[同上格式]

---

## 按類型分類

### 遺漏的基礎卡片（X 張）
[在連結時發現應該存在但缺少的基礎詞彙或文法]
- {列表}

### 對比卡片（X 張）
[在說明差異時發現需要專門的對比卡片]
- {列表}

### 概念解釋卡片（X 張）
[在腳註說明時發現需要獨立的概念卡片]
- {列表}

### 延伸文法（X 張）
[在說明用法時發現需要的進階文法]
- {列表}

---

## 建議處理順序

1. **下一版本優先處理**:
   - 已建立的 Y 張草稿卡片（完成 Draft → Extension-Review → Linking）
   - High 優先級：前 Z 張

2. **後續版本**:
   - High 優先級：剩餘卡片
   - Medium 優先級：分批處理

---

## 連結統計

**本階段添加的 Wikilinks**: ~X 個
**本階段添加的腳註**: ~Y 個
**連結密度**: 平均 Z 個連結/卡片
```

### 📝 更新文檔

更新 `doc/worklog/worklog-{version}.md`：
```markdown
### 階段 3: Linking（建立連結與腳註階段）

**目標**: 為所有檢查完成的卡片添加 wikilinks 和腳註

**進度**: X / X (100%) ✅ **已完成**

**完成日期**: YYYY-MM-DD

#### Linking 階段成果

**Wikilinks 添加數**: ~X 個
**腳註添加數**: ~Y 個
**新卡片識別數**: Z 張
  - 已建立草稿: A 張
  - 待後續處理: B 張

**詳細記錄**: 見 `doc/worklog/linking-cards-{version}.md`
```

---

## 階段 4: Completed（完成標記）

### 🎯 目標
確認所有卡片已完成並更新版本文檔。

### ✅ 檢查清單

**執行：**
- [ ] 確認所有 Draft 階段的卡片 `stage: completed`
- [ ] 確認所有卡片 `needs_review: false`
- [ ] 確認所有卡片有 `completed: YYYY-MM-DD`
- [ ] 更新 CHANGELOG.md，新增本版本條目
- [ ] 建立完成總結文檔（可選）
- [ ] 更新工作日誌的「階段 4」和整體狀態

**完成後：**
- [ ] 提交 git commit（feat: v{version} 完成）
- [ ] 推送到遠端分支
- [ ] 建立 Pull Request 或直接合併到 main
- [ ] 刪除本地 feature 分支（合併後）

### 📝 更新文檔

更新 `doc/worklog/worklog-{version}.md`：
```markdown
### 階段 4: Completed（完成階段）

**目標**: X 張卡片全部完成四階段流程

**進度**: X / X (100%) ✅ **已完成**

**完成日期**: YYYY-MM-DD

所有 X 張卡片已成功完成以下四個階段：
1. ✅ Draft - 草稿內容完善
2. ✅ Extension-Review - 延伸卡片檢查
3. ✅ Linking - 連結與腳註添加
4. ✅ Completed - 標記完成狀態

---

## 版本完成統計

**循環開始日期**: YYYY-MM-DD
**循環完成日期**: YYYY-MM-DD
**狀態**: ✅ 已完成

### 本版本產出

**完成卡片**: X 張
**總字數**: ~Y 字
**例句數**: ~Z 句
**Wikilinks**: ~A 個
**腳註**: ~B 個

### 延伸識別

**Extension-Review 階段**: C 張延伸卡片
**Linking 階段**: D 張新卡片
**已建立草稿**: E 張
**待下一版本處理**: F 張

### 產出文檔

1. `doc/worklog/worklog-{version}.md` - 工作日誌（本文檔）
2. `doc/worklog/extension-cards-{version}.md` - 延伸卡片記錄
3. `doc/worklog/linking-cards-{version}.md` - 連結階段新卡片記錄
4. `CHANGELOG.md` - 版本更新記錄

---

**版本狀態**: ✅ 已完成
**下一版本**: v{next}
```

更新 CHANGELOG.md：
```markdown
## [{version}] - YYYY-MM-DD

### Added

#### 完成卡片（X 張）

[列出所有完成的卡片]

### Statistics

- **完成卡片**: X 張
- **總字數**: ~Y 字
- **例句數**: ~Z 句
- **Wikilinks**: ~A 個
- **腳註**: ~B 個
- **識別延伸**: C 張（待後續版本處理）

### Highlights

1. [本版本的重要成就 1]
2. [本版本的重要成就 2]
3. [本版本的重要成就 3]
```

---

## 版本循環完成：準備下一版本

### ✅ 檢查清單

- [ ] 本版本已合併到 main 分支
- [ ] 三份核心文檔都已完成：
  - [ ] `worklog-{version}.md`
  - [ ] `extension-cards-{version}.md`
  - [ ] `linking-cards-{version}.md`
- [ ] CHANGELOG.md 已更新
- [ ] 統計待處理卡片總數：
  - Extension-Review 階段識別：X 張
  - Linking 階段識別：Y 張
  - 總計：Z 張
- [ ] 為下一版本準備卡片清單（從上述兩個來源整合）

### 📋 下一版本規劃

在開始下一版本前，整合以下來源：

1. **來自本版本的待建立卡片**:
   - `doc/worklog/extension-cards-{current}.md`（按優先級篩選）
   - `doc/worklog/linking-cards-{current}.md`（已建立草稿 + 待處理）

2. **來自新文章解析**（如有）:
   - 使用 `/extract-vocab` 或 `/create-zettel` 識別新卡片

3. **手動識別的缺口**:
   - 學習者反饋
   - 系統性缺口（如：缺少某個 JLPT 等級的覆蓋）

將以上整合到下一版本的工作日誌 `doc/worklog/worklog-{next}.md`。

---

## 快速參考：三份核心文檔

| 文檔 | 檔名 | 產出階段 | 用途 |
|------|------|---------|------|
| 工作日誌 | `worklog-{version}.md` | 版本開始前 | 記錄整個版本的進度和統計 |
| 延伸卡片記錄 | `extension-cards-{version}.md` | Extension-Review 階段 | 記錄從 Draft 卡片識別的延伸需求 |
| 連結階段新卡片記錄 | `linking-cards-{version}.md` | Linking 階段 | 記錄在建立連結時發現的新卡片需求 |

---

## 常見問題

### Q: 如果 Extension-Review 沒有識別到延伸卡片怎麼辦？

A: 仍然要建立 `extension-cards-{version}.md`，標註「本版本未識別延伸需求」或「識別 0 張延伸卡片」。這保持了版本文檔的完整性。

### Q: Linking 階段建立的草稿卡片要在本版本完成嗎？

A: **不需要**。Linking 階段建立的草稿卡片會記錄在 `linking-cards-{version}.md`，並在**下一版本**的 Draft 階段一起處理。

### Q: 如何決定 Linking 階段哪些卡片要立即建立草稿？

A: **Critical 優先級的卡片**應該立即建立草稿（`stage: draft`），因為它們對系統完整性至關重要。High 及以下優先級可以只記錄，不立即建立。

### Q: 如果某個階段發現流程有問題怎麼辦？

A: 記錄在工作日誌的「問題與改進」章節，並在下一版本的規劃中調整流程。檢查清單也應該相應更新。

---

**檢查清單版本**: 1.0
**最後更新**: 2025-10-30
**維護者**: Claude Code
