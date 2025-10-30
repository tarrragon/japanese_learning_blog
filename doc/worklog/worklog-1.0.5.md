# 工作日誌 - Version 1.0.5

**版本號**：1.0.5 (PATCH)
**開始日期**：待定
**目標**：Meta 系統維護 - Tag 定義卡片建立

---

## 版本概述

本版本專注於 **Meta 系統的 Tag 定義完善**，不涉及一般內容卡片的新增。這是一個維護性版本，目的是確保 `_meta` 系統的完整性和一致性。

### 版本類型

- **PATCH 版本**：雖然是建立新卡片，但這些是 Meta 系統卡片，不是學習內容卡片
- **維護性質**：完善專案基礎設施，提升系統一致性

---

## 工作範圍

### 核心任務

建立 **132 個 Tag Meta 定義卡片**，所有卡片應放置在：

```
zettelkasten/_meta/tags/
├── context/          # 使用情境標籤
├── domain/          # 領域標籤
├── grammar/         # 文法相關標籤
├── jlpt/           # JLPT 等級標籤
└── (其他子分類)
```

**重要說明**：
- ⚠️ **這些是 Tag Meta 卡片，不是一般的內容卡片**
- ⚠️ **不應該被歸類到 noun、verb、grammar 等一般分類**
- ⚠️ **應該放在 `_meta/tags/` 及其子目錄下**
- ⚠️ **這些卡片用於定義和追蹤 tag 的使用，不是學習內容**

---

## 待建立的 132 個 Tag Meta 卡片清單

根據 `verify-meta.py` 的檢測結果，以下 tags 在系統中被使用但尚未在 `_meta/tags/` 中定義。

### 📂 建議的分類結構

建議按照以下子目錄組織這些 Tag Meta 卡片：

#### 1. `_meta/tags/grammar/` - 文法相關標籤 (32 個)

- [ ] aspect
- [ ] auxiliary_verb
- [ ] causative
- [ ] conditional
- [ ] conjugation
- [ ] dictionary
- [ ] dictionary-form
- [ ] grammar
- [ ] grammar/aspect
- [ ] grammar/verb-classification
- [ ] grammar_pattern
- [ ] irregular
- [ ] irregular_verb
- [ ] modal
- [ ] nai-form
- [ ] negation
- [ ] negative
- [ ] negative-action
- [ ] passive
- [ ] past
- [ ] past-experience
- [ ] past_tense
- [ ] pattern
- [ ] potential
- [ ] progressive
- [ ] state
- [ ] ta-form
- [ ] tai-form
- [ ] te-form
- [ ] verb
- [ ] verb_conjugation
- [ ] verb_type

#### 2. `_meta/tags/context/` - 情境相關標籤 (10 個)

- [ ] casual
- [ ] context
- [ ] context/daily_life
- [ ] daily_life
- [ ] family
- [ ] formal
- [ ] invitation
- [ ] question
- [ ] shopping
- [ ] social

#### 3. `_meta/tags/domain/` - 領域相關標籤 (4 個)

- [ ] commerce
- [ ] domain/linguistics
- [ ] learning
- [ ] transaction

#### 4. `_meta/tags/pragmatics/` - 語用學相關標籤 (12 個)

- [ ] agreement
- [ ] confirmation
- [ ] contrast
- [ ] focus
- [ ] hypothesis
- [ ] information_flow
- [ ] information_structure
- [ ] nuance
- [ ] opinion
- [ ] pragmatics
- [ ] topic
- [ ] topic_marking

#### 5. `_meta/tags/semantic/` - 語義相關標籤 (20 個)

- [ ] ability
- [ ] acceptance
- [ ] action
- [ ] animate
- [ ] capacity
- [ ] choice
- [ ] decision
- [ ] desire
- [ ] existence
- [ ] experience
- [ ] feeling
- [ ] necessity
- [ ] obligation
- [ ] optional
- [ ] permission
- [ ] prohibition
- [ ] reason
- [ ] request
- [ ] suggestion
- [ ] volitional

#### 6. `_meta/tags/verb-type/` - 動詞類型標籤 (14 個)

- [ ] basic
- [ ] continuous
- [ ] doing
- [ ] entering
- [ ] frequency
- [ ] giving
- [ ] giving_casual
- [ ] giving_to_me
- [ ] habitual
- [ ] movement
- [ ] receiving
- [ ] removing
- [ ] returning
- [ ] running

#### 7. `_meta/tags/particle/` - 助詞相關標籤 (3 個)

- [ ] particle
- [ ] particle_to
- [ ] conjunction

#### 8. `_meta/tags/keigo/` - 敬語相關標籤 (7 個)

- [ ] honorific
- [ ] humble_form
- [ ] keigo
- [ ] kenjougo
- [ ] polite
- [ ] polite_form
- [ ] respect
- [ ] sonkeigo

#### 9. `_meta/tags/position/` - 位置/方向相關標籤 (6 個)

- [ ] destination
- [ ] direction
- [ ] endpoint
- [ ] location
- [ ] origin
- [ ] raising

#### 10. `_meta/tags/linguistic/` - 語言學理論標籤 (8 個)

- [ ] basic_form
- [ ] comparison
- [ ] concept
- [ ] idiom
- [ ] linguistic_theory
- [ ] phrase
- [ ] sentence_pattern
- [ ] sentence_structure

#### 11. `_meta/tags/misc/` - 其他標籤 (15 個)

- [ ] clothing
- [ ] critical
- [ ] koto
- [ ] mashou
- [ ] means
- [ ] method
- [ ] question_form
- [ ] quotation
- [ ] resignation
- [ ] role
- [ ] rules
- [ ] sequence
- [ ] speech
- [ ] thinking
- [ ] time
- [ ] visibility
- [ ] wearing

#### 12. `_meta/tags/special/` - 特殊標籤 (1 個)

- [ ] 授受表現

---

## Tag Meta 卡片格式規範

每個 Tag Meta 卡片應包含以下內容：

```yaml
---
title: tag_name
description: Tag 的簡短描述
type: tag
category: grammar|context|domain|pragmatics|semantic|etc.
created: YYYY-MM-DD
---

## Tag 資訊

**Tag 名稱**：`tag_name`
**分類**：grammar/context/domain/etc.
**建立日期**：YYYY-MM-DD

## 定義

[Tag 的詳細說明，包含使用目的和範圍]

## 使用場景

[說明何時應該使用這個 tag]

## 適用卡片類型

[列出哪些類型的卡片應該使用這個 tag]

## 範例

[提供 2-3 個使用此 tag 的卡片範例]

## 統計資訊

**使用次數**：X 張卡片（截至 YYYY-MM-DD）
**最後更新**：YYYY-MM-DD

## 相關 Tags

[列出相關或容易混淆的 tags]

---

**最後更新**：YYYY-MM-DD
**維護者**：AI Assistant
```

---

## 工作流程

由於 Tag Meta 卡片數量眾多（132 個），建議分階段處理：

### Phase 1: 規劃與分類 ✅

- [x] 分析現有 tags 使用情況
- [x] 設計子目錄結構
- [x] 分類整理 tags 清單
- [x] 建立工作日誌（本文件）

### Phase 2: 批次建立（建議分批進行）

**建議分批策略**：
1. **第一批**：grammar 相關 tags (32 個) - 最常用
2. **第二批**：keigo + pragmatics (19 個) - 高優先級
3. **第三批**：semantic + verb-type (34 個) - 中優先級
4. **第四批**：其他分類 (47 個) - 低優先級

每批處理步驟：
1. 使用 `list-tags.py` 確認 tag 使用情況
2. 為每個 tag 建立 Meta 定義卡片
3. 更新對應子目錄的 index.md
4. 執行 `verify-meta.py` 驗證

### Phase 3: 驗證與完成

- [ ] 執行完整的 `verify-meta.py --verbose`
- [ ] 確認所有 132 個 tags 都有定義
- [ ] 更新 `_meta/tags/index.md`
- [ ] 更新各子分類的 index.md

---

## 自動化建議

考慮到卡片數量龐大，可以考慮：

### 選項 A：手動建立（推薦用於重要 tags）
- 優點：內容詳細、準確
- 缺點：耗時
- 適用：grammar、keigo 等核心 tags

### 選項 B：半自動化（推薦用於大部分 tags）
- 使用腳本生成基本結構
- 人工審查和補充內容
- 適用：大部分 tags

### 選項 C：建立自動化工具
創建 `scripts/create-tag-meta.py` 工具：
```bash
# 用法範例
uv run scripts/create-tag-meta.py --tag "grammar" --category "grammar"
```

---

## 完成標準

### 必須達成

1. ✅ 所有 132 個 tags 都有 Meta 定義卡片
2. ✅ `verify-meta.py --verbose` 顯示 tags 完全一致
3. ✅ 每個 tag 卡片包含完整的 YAML frontmatter
4. ✅ 更新所有相關的 index.md

### 建議達成

1. 每個 tag 包含使用範例
2. 記錄每個 tag 的使用統計
3. 建立 tag 之間的交叉引用
4. 更新 CLAUDE.md 中關於 tag 系統的說明

---

## 預期成果

完成本版本後：

1. **Meta 系統完整性**：所有使用中的 tags 都有完整定義
2. **系統一致性**：`verify-meta.py` 驗證通過
3. **可維護性提升**：未來新增 tag 有明確的參考範例
4. **文檔完善**：Tag 系統的使用有完整的說明

---

## 注意事項

### ⚠️ 重要提醒

1. **這些是 Meta 卡片，不是內容卡片**
   - 放置位置：`zettelkasten/_meta/tags/`
   - 不要放在：`zettelkasten/noun/`, `zettelkasten/grammar/` 等

2. **保持 Tag 命名一致性**
   - 使用小寫和底線（如：`grammar_pattern`）
   - 斜線用於層級（如：`context/daily_life`）
   - 避免使用中文（除非是特殊標籤如「授受表現」）

3. **不要過度細分**
   - Tag 應該有合理的使用頻率
   - 太細的 tag 可能導致系統複雜化

4. **維護現有 tags**
   - 同時檢查「未使用的 tags」：
     - `context/social`
     - `domain/finance`
     - `jlpt/none`
   - 考慮是否保留或移除

---

## 與其他版本的關係

### 前置版本

- **v1.0.4**：完成 36 張內容卡片的連結階段
  - Category Meta 系統修復完成
  - 識別出 Tag Meta 系統的不完整

### 後續版本

- **v1.0.6+**：回歸內容卡片的新增和更新
  - 從 Extension-Review 文檔中選擇高優先級卡片
  - 繼續擴展知識網絡

---

## 資源與參考

### 相關文檔

- `.claude/card-format-guidelines.md` - 卡片格式規範
- `CLAUDE.md` - 專案說明（Tag 系統章節）
- `doc/worklog/linking-cards-1.0.4.md` - v1.0.4 連結階段記錄

### 相關工具

- `scripts/verify-meta.py` - Meta 系統驗證
- `scripts/list-tags.py` - Tag 使用情況查詢
- `scripts/clean-tags.py` - Tag 清理工具

### 檢查腳本

```bash
# 檢查 tag 使用情況
uv run scripts/list-tags.py

# 驗證 Meta 系統
uv run scripts/verify-meta.py --verbose

# 只檢查 tags
uv run scripts/verify-meta.py --tags
```

---

## 時間估算

根據工作量估算：

- **快速模式**（使用自動化工具）：2-4 小時
- **詳細模式**（手動建立核心 tags）：8-12 小時
- **完整模式**（所有 tags 詳細撰寫）：20-30 小時

建議採用**混合模式**：
- 核心 tags（50 個）：手動詳細撰寫（6-8 小時）
- 其他 tags（82 個）：半自動化生成（2-4 小時）
- 總計：8-12 小時

---

## 版本狀態

**當前狀態**：規劃階段 (Phase 1 完成)
**下一步驟**：開始 Phase 2 - 批次建立 Tag Meta 卡片
**完成進度**：0/132 (0%)

---

**文檔建立日期**：2025-10-30
**最後更新**：2025-10-30
**維護者**：AI Assistant
**版本**：1.0.5 (規劃中)
