# 日文學習 Zettelkasten 系統

## 語言規範（Language Policy）

**本專案嚴格限制使用以下三種語言**：

1. **日文（Japanese）** - `ja`
   - 用於：卡片內容、例句、日文解釋

2. **英文（English）** - `en-US`
   - 用於：英文解釋、國際化支援

3. **繁體中文（Traditional Chinese）** - `zh-TW`
   - 用於：中文解釋、文檔、註解、commit 訊息

### 適用範圍

此規範適用於專案的所有內容：
- ✅ 卡片內容（日文、英文、繁體中文）
- ✅ 文檔和說明檔案（繁體中文或英文）
- ✅ Git commit 訊息（繁體中文或英文）
- ✅ 程式碼註解（繁體中文或英文）
- ✅ 變數命名和函數說明（英文）
- ❌ **嚴格禁止使用簡體中文（zh-CN）**

### 原因

1. **一致性**：確保整個專案使用統一的語言規範
2. **避免混淆**：防止繁體中文和簡體中文混用
3. **可維護性**：未來協作者能清楚了解語言使用規則
4. **學習目標**：本專案為繁體中文使用者學習日文設計

---

## 專案概述

這是一個結合 AI 輔助和 Zettelkasten（卡片盒筆記）方法的日文學習系統。透過將日文文章拆解為原子化的知識卡片，建立一個相互連結的知識網絡，幫助學習者在不同領域和情境下掌握日文的使用方法。

本專案使用 Claude 代理人協助建立、延伸和維護卡片系統，實現智能化的卡片管理與連結建立。

### 核心功能

1. **詞彙卡片系統** - 動詞、名詞、形容詞等基礎詞彙卡片
2. **延伸卡片系統** - 文法、語用、文化等概念卡片
3. **標準連結系統** - 使用 Markdown `[text](path)` 格式連結相關卡片
4. **腳註標註系統** - 使用 `[^note]` 格式標註文內概念
5. **AI 代理人** - 自動檢測遺漏卡片並建立草稿

## 版本管理

當前版本：**1.0.3**

### 語義化版本規範

版本格式：`MAJOR.MINOR.PATCH`

- **MAJOR（大版本）**：專案結構或核心功能有重大變動
- **MINOR（中版本）**：新增或修改 slash command 或代理人
- **PATCH（小版本）**：卡片內容的新增、修改或修復

## 核心理念

### Zettelkasten 原則
1. **原子化**：每張卡片只包含一個概念、詞彙或文法點
2. **連結性**：卡片之間透過連結形成知識網絡
3. **漸進式成長**：知識網絡隨著學習自然擴展
4. **驚喜發現**：透過連結產生新的理解和洞察

### 多語言學習法
- **三語對照**：日文、英文、中文繁體
- **例句導向**：以日文為思考核心，提供實際使用情境
- **情境分類**：根據使用場景和領域組織知識

## 工作流程循環

本專案採用**四階段迭代循環**開發卡片系統。每個小版本（PATCH）對應一個完整的工作流程循環。

### 重要文檔參考

- `.claude/version-cycle-checklist.md` - 每個階段的詳細檢查清單和文檔範本
- `.claude/card-format-guidelines.md` - 卡片格式規範和連結格式指南

### 卡片四個階段

1. **draft** - 草稿階段：卡片剛建立，需要補充完整內容
2. **extension-review** - 延伸卡片檢查階段：檢查是否需要建立相關延伸卡片
3. **linking** - 建立連結與腳註階段：補充標準連結和腳註標註
4. **completed** - 完成階段：所有連結和腳註已補充，卡片內容完整

### 版本循環流程

#### 階段 1：草稿完善（Draft）

找出所有 `stage: draft` 的卡片，補充完整內容（三語解釋、例句），更新為 `stage: extension-review`。

#### 階段 2：延伸卡片檢查（Extension-Review）

**處理原則**：一次處理一張卡片，每張卡片是一個獨立的 todo 任務。

處理流程：
1. 讀取單張卡片內容
2. 識別需要的延伸卡片（文法、語用、文化等）
3. 記錄到延伸需求文檔
4. 標記該卡片為 `stage: linking`

**必須產出**：`doc/worklog/extension-cards-{version}.md`

#### 階段 3：連結與腳註建立（Linking）

處理流程：
1. 使用 `build-card-links` 子代理人處理每張卡片
2. 補充標準連結（Related Links 區塊）
3. 補充腳註標註（Footnotes）
4. 識別遺漏的卡片（Critical 立即建立草稿）
5. 標記該卡片為 `stage: completed`

**必須產出**：`doc/worklog/linking-cards-{version}.md`

#### 階段 4：完成與記錄（Completed）

1. 確認所有卡片 `stage: completed`
2. 執行版本完成檢查腳本（見下方）
3. 更新 CHANGELOG.md
4. 合併到 main 分支

### 版本完成檢查腳本

**在四階段完成後，下一版本開始前執行**：

```bash
# 1. 檢查所有分類的索引狀態
uv run scripts/list-categories.py --count

# 2. 驗證 Meta 系統一致性
uv run scripts/verify-meta.py --verbose

# 3. 檢查編號連續性
uv run scripts/fix-numbering.py --check

# 4. 檢查是否有遺留的 Wikilink 格式
uv run scripts/check-wikilinks.py

# 5. 如有問題，預覽修復
uv run scripts/fix-numbering.py --dry-run
uv run scripts/fix-wikilinks.py --check

# 6. 執行修復（如需要）
uv run scripts/fix-numbering.py --fix
uv run scripts/fix-wikilinks.py --fix
```

## 連結格式規範（重要！）

### 嚴格使用標準 Markdown 格式

**唯一正確格式**：`[text](path.md)`

**絕對禁止**：`[[wikilink]]` 或 `[[path|text]]`

**原因**：
1. Wikilink 無法在 GitHub、GitLab、VS Code 等標準渲染器中工作
2. 違反專案統一性和可維護性原則

詳細規範參考：`.claude/card-format-guidelines.md`

## 系統架構

### 目錄結構

```
japanese_learning_blog/
├── CLAUDE.md                           # 專案說明文件（本文件）
├── README.md                           # 使用者說明文件
├── .claude/
│   ├── card-format-guidelines.md      # 卡片格式詳細規範
│   ├── version-cycle-checklist.md     # 版本循環檢查清單
│   └── commands/                      # Slash Commands
├── scripts/                           # 維護工具腳本
├── articles/                          # 原始文章庫
└── zettelkasten/                      # 卡片盒系統
    ├── _meta/                         # 元資訊系統（tags 和 categories 定義）
    ├── noun/                          # 名詞卡片
    ├── verb-ru/                       # る動詞（一段動詞）
    ├── verb-u/                        # う動詞（五段動詞）
    ├── verb-irr/                      # 不規則動詞
    ├── adj-i/                         # い形容詞
    ├── adj-na/                        # な形容詞
    ├── particle/                      # 助詞
    ├── grammar/                       # 文法卡片
    └── [其他分類...]                  # 共 23 個分類
```

完整目錄結構參考：`.claude/version-cycle-checklist.md`

## 卡片系統

### 卡片分類體系

**詞彙類**（8個）：noun, verb-ru, verb-u, verb-irr, adj-i, adj-na, adverb 等
**文法功能詞**（3個）：particle, auxiliary, conjunction
**特殊詞類**（4個）：counter, rentaishi, prefix, suffix
**表達類**（5個）：idiom, proverb, onomatopoeia, phrase, honorific
**概念與知識**（4個）：concept, grammar, contrast, context

### 卡片格式

每張卡片包含：
- YAML frontmatter（必需欄位：title, description, type, jlpt, stage, tags, created, updated）
- 三語解釋（日文、英文、中文）
- 例句（2-3 個）
- 相關連結

詳細格式參考：`.claude/card-format-guidelines.md`

### YAML Frontmatter 結構化系統

**核心理念**：將所有關鍵資訊集中在 YAML frontmatter 中，實現高效搜尋和判斷（只需讀取前 20-30 行）。

**必需欄位**：
- title, description, type, jlpt, stage, created, updated, tags

**推薦欄位**：
- synonyms, antonyms, related_words（用於高效搜尋）

**命名規則**：
- 檔名：`{編號}_{羅馬拼音}.md`
- title：`{category}/{羅馬拼音}`

詳細 YAML 規範參考：`.claude/card-format-guidelines.md`

## 高效搜尋機制

### 搜尋策略：Glob + YAML（不要用 Grep）

**原則**：
1. 使用 Glob 搜尋檔名（速度極快）
2. 只讀取 YAML（前 30 行）判斷關聯性
3. 確定要建立連結後，才讀取完整內容

**效率提升**：比 Grep 全文搜尋快 10-100 倍

詳細搜尋範例參考：`.claude/card-format-guidelines.md`

## Tag 系統

### Tag 類型

1. **使用情境標籤（context/）**：business, casual, family, formal, academic, social
2. **領域標籤（domain/）**：economics, finance, daily_life, technology 等
3. **常用度標籤（jlpt/）**：n5, n4, n3, n2, n1, none

### Tag 管理

- Tag 定義儲存在 `zettelkasten/_meta/tags/`
- 新增 Tag 必須先在 Meta 系統中定義
- 使用 `uv run scripts/list-tags.py` 查看可用 tags

## Meta 資訊系統

`zettelkasten/_meta/` 目錄包含系統的元資訊：

1. **Tags 定義**（`_meta/tags/`）：15 個 tag 定義卡片
2. **Categories 定義**（`_meta/categories/`）：23 個 category 定義卡片

**核心價值**：
- 明確定義所有 tags 和 categories
- 追蹤使用情況和統計資訊
- 確保系統一致性

## 維護工具系統

本專案提供 7 個 Python 維護腳本（`scripts/`），使用 UV 單檔模式，零外部依賴。

### 核心工具

1. **list-categories.py** - 列出所有分類及統計
2. **list-tags.py** - 列出所有 tags 及使用情況
3. **get-next-number.py** - 自動取得下一個編號
4. **update-index.py** - 更新分類索引
5. **verify-meta.py** - 驗證 Meta 一致性
6. **clean-tags.py** - 清理和標準化 tags
7. **fix-numbering.py** - 檢查和修復編號

### 代理人使用原則

**`/create-zettel` 代理人必須**：
1. 使用 `list-categories.py` 確認分類存在
2. 使用 `list-tags.py` 查詢可用 tags
3. 使用 `get-next-number.py` 取得編號
4. 建立卡片後執行 `update-index.py`

**`build-card-links` 子代理人建議**：
1. 使用 `list-tags.py` 查找相關主題
2. 優先使用 Glob + YAML 搜尋
3. 建立新卡片後更新索引

詳細工具使用指南參考：`doc/hooks/03-uv-single-file-pattern.md`

## 卡片處理原則

### 極度重要：禁止批次處理

**原則**：
1. 每張卡片必須單獨、仔細地處理
2. 禁止使用腳本批次處理卡片內容
3. 每張卡片在 todo list 中是獨立任務

**原因**：
- 語言學習需要思考和理解
- 每個詞彙在不同情境下有細微差異
- 精準的用詞是語言學習的核心

### Extension-Review 階段規範

**一次處理一張卡片**：
- 避免 token 過載
- 追蹤進度清晰
- 可以隨時中斷和恢復

詳細規範參考：`.claude/version-cycle-checklist.md`

## 使用指南

### 可用命令

**文章分析系列**：
- `/analyze-article` - 全面分析文章
- `/extract-vocab` - 提取關鍵詞彙
- `/explain-grammar` - 深入解析文法
- `/generate-exercises` - 生成練習題

**Zettelkasten 系列**：
- `/create-zettel` - 從文章建立卡片

### 最佳實踐

1. **循序漸進**：從簡單文章開始，逐步建立卡片網絡
2. **重視連結**：新卡片建立時思考與既有知識的關聯
3. **Tag 管理**：保持 Tag 系統的一致性
4. **定期維護**：執行維護腳本檢查系統狀態

## 維護與擴展

### 定期維護檢查清單

1. 執行版本完成檢查腳本（見「版本完成檢查腳本」章節）
2. 檢查損壞的連結
3. 更新 Meta 系統的統計資訊
4. 確認索引與實際卡片一致

### 系統擴展

- 新增卡片分類：建立資料夾 + Meta 卡片
- 新增 Tag：在 Meta 系統中定義
- 自定義命令：新增 slash command
- 所有擴展都應使用 `verify-meta.py` 驗證

## 開發者筆記

### 代理人設計原則

`/create-zettel` 代理人應該：
- 具備深厚的日文語言學知識
- 能夠識別詞彙、文法、概念的細微差異
- 理解不同領域的專業術語
- 能夠建立有意義的連結
- 保持卡片的原子化（一卡一概念）

### 工具開發指南

所有腳本使用 **UV 單檔模式**（基於 PEP 723）：

```python
#!/usr/bin/env python3
# /// script
# dependencies = []
# requires-python = ">=3.10"
# ///
```

詳細開發指南參考：`doc/hooks/03-uv-single-file-pattern.md`

---

**最後更新：2025-10-30**
