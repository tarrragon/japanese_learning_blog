# v1.0.7 工作日誌：Hugo 靜態網站與卡片結構修復

## 版本目標

建立 Hugo 靜態網站框架，將現有 Markdown 卡片轉換為可瀏覽的部落格網頁，並修復卡片格式問題。

## 版本規格

參考：`doc/specs/v1.0.7-hugo-setup.md`

---

## Phase 1: Hugo 靜態網站設置 ✅

### 已完成提交

| 提交 Hash | 說明 |
|-----------|------|
| `d857954` | 建立 Hugo 靜態網站基礎架構（hugo.toml、PaperMod 主題、GitHub Actions） |
| `6f488bb` | 修復卡片編號和檔名格式問題（20 個檔案重命名） |
| `fa97d44` | 優化維護腳本（fix-numbering.py、update-index.py）並統一檔名格式 |
| `9305806` | 修復 35 個卡片的 YAML frontmatter 格式 |
| `dd18064` | 修復 4 個檔案的 Hugo Summary 錯誤 |
| `b968f5c` | 修正索引生成腳本以支援 Hugo section 頁面（index.md → _index.md） |

### 主要成果

1. **Hugo 配置完成**
   - `hugo.toml` 配置檔
   - PaperMod 主題（git submodule）
   - GitHub Actions 自動部署 (`.github/workflows/hugo.yml`)

2. **自訂模板**
   - `layouts/index.html`：首頁顯示 23 個分類（5 個區塊）
   - `layouts/_default/list.html`：索引/卡片雙模式切換
   - `assets/css/extended/custom.css`：自訂樣式

3. **腳本修正**
   - `scripts/update-index.py`：輸出改為 `_index.md`
   - `scripts/fix-numbering.py`：新增 `--check-format` 選項

4. **格式修復**
   - 修復 35 個卡片的 YAML frontmatter
   - 統一 27 個檔案的檔名格式（`-` → `_`）
   - 刪除 25 個舊的 `index.md` 檔案

---

## Phase 2: 卡片結構修復（進行中）

### 問題說明

發現 **351 張卡片** 的 `title` 欄位使用路徑格式而非日文標題：

| 目前格式（錯誤） | 正確格式 |
|-----------------|---------|
| `title: noun/tonari` | `title: "隣（となり）"` |
| `title: verb-ru/taberu` | `title: "食べる（たべる）"` |
| `title: comparison/ga_vs_wa` | `title: "が vs は"` |

### 解決方案

#### 1. 建立卡片結構代理人

**新增檔案**：`.claude/agents/init-card-structure.md`

**職責**：
- 建立卡片檔案（正確檔名格式 `###_name.md`）
- 填寫 YAML frontmatter：
  - `title`：日文標題格式（如 `隣（となり）`）
  - `description`：簡短中文說明
  - `type`、`jlpt`、`tags`、`stage` 等
- 更新分類索引

**不負責**：
- 卡片內容（三語解釋、例句、使用規則）

#### 2. 更新 create-card 代理人

**修改檔案**：`.claude/agents/create-card.md`

**新職責**：
- 接收已有 YAML frontmatter 的卡片
- 專注於填充內容（三語解釋、例句、使用規則等）
- 不再負責建立檔案和 YAML frontmatter

#### 3. 修復 351 張卡片的 title

**方法**：使用腳本批次提取正確標題

**標題來源**：
- 詞彙卡（noun, verb-ru, verb-u 等）：從 `## 日文` 後的內容提取
- 比較卡（comparison）：從 `description` 欄位提取（如 `が vs は`）
- 概念卡（concept）：從 `## 日文` 或標題內容提取

**修復腳本**：`scripts/fix-card-titles.py`

---

## 待執行任務清單

### 立即任務

- [x] 建立此工作日誌：`doc/worklog/worklog-1.0.7.md`
- [ ] 建立修復腳本：`scripts/fix-card-titles.py`
- [ ] 執行腳本修復 351 張卡片的 title 欄位
- [ ] 驗證 Hugo 建置和搜尋功能

### 後續任務

- [ ] 建立卡片結構代理人：`.claude/agents/init-card-structure.md`
- [ ] 更新 create-card 代理人職責
- [ ] 更新 CLAUDE.md 文檔（兩步驟卡片建立流程）
- [ ] 更新 `.claude/card-format-guidelines.md`（title 格式規範）

---

## title 欄位正確格式規範

| 卡片類型 | 正確格式 | 範例 |
|---------|---------|------|
| 名詞 | 日文（讀音） | `隣（となり）` |
| 動詞 | 日文（讀音） | `食べる（たべる）` |
| 形容詞 | 日文（讀音） | `新しい（あたらしい）` |
| 文法 | 文法句型 | `〜てあげる` |
| 比較 | A vs B | `が vs は` |
| 對比 | A vs B | `学習 vs 勉強` |
| 概念 | 概念名稱 | `敬語体系` |

---

## 相關檔案

| 檔案路徑 | 說明 |
|---------|------|
| `doc/specs/v1.0.7-hugo-setup.md` | 版本規格文檔 |
| `.claude/agents/create-card.md` | 現有卡片建立代理人 |
| `scripts/update-index.py` | 索引更新腳本（已修正） |
| `scripts/fix-numbering.py` | 編號修復腳本（已優化） |

---

**建立日期**：2024-12-18
**分支**：`feature/v1.0.7-hugo-setup`
