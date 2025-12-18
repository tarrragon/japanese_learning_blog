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

在 Hugo 網站建置過程中，發現卡片存在多種格式不一致的問題。以下是完整的問題清單和已修復/待修復狀態：

#### 問題 1：檔名格式不一致 ✅ 已修復

**標準格式**：`###_name.md`（三位數編號 + 底線 + 小寫英文名稱）

| 錯誤格式 | 正確格式 | 問題描述 |
|---------|---------|---------|
| `005_conditional-comparison.md` | `005_conditional_comparison.md` | 使用連字號 `-` 而非底線 `_` |
| `019_差し上げる.md` | `019_sashiageru.md` | 使用日文字元而非羅馬拼音 |
| `023_待つ.md` | `023_matsu.md` | 使用日文字元而非羅馬拼音 |
| `tonari.md` | `040_tonari.md` | 缺少三位數編號前綴 |

**已修復**：27 個檔案（`fa97d44`）

#### 問題 2：YAML Frontmatter 格式錯誤 ✅ 已修復

**問題類型**：

| 類型 | 問題描述 | 數量 |
|------|---------|------|
| 缺少 frontmatter | 檔案不以 `---` 開頭 | 11 個 |
| frontmatter 前有多餘內容 | `# 標題` 在 `---` 之前 | 24 個 |
| frontmatter 內容為空 | 兩個 `---` 之間沒有有效 YAML | 10 個 |

**已修復**：35 個檔案（`9305806`）

#### 問題 3：索引檔案格式錯誤 ✅ 已修復

**問題**：`update-index.py` 腳本輸出 `index.md`，但 Hugo 使用 `_index.md` 作為 section 頁面

**結果**：
- 存在 25 個 `index.md` 檔案（腳本生成，內容正確）
- 存在 `_index.md` 檔案（Hugo 讀取，內容過時）
- 索引頁面顯示錯誤的舊內容（重複編號、空描述、錯誤路徑）

**已修復**：
- 修改腳本輸出為 `_index.md`
- 刪除 25 個舊的 `index.md` 檔案
- 重新生成所有 `_index.md`（`b968f5c`）

#### 問題 4：title 欄位格式錯誤 ❌ 待修復

**問題**：351 張卡片的 `title` 欄位使用路徑格式而非日文標題

| 目前格式（錯誤） | 正確格式 |
|-----------------|---------|
| `title: noun/tonari` | `title: "隣（となり）"` |
| `title: verb-ru/taberu` | `title: "食べる（たべる）"` |
| `title: comparison/ga_vs_wa` | `title: "が vs は"` |
| `title: grammar/te_form` | `title: "〜て形"` |
| `title: concept/keigo` | `title: "敬語体系"` |

**影響**：搜尋結果顯示路徑而非可讀的日文標題

#### 問題 5：Hugo Summary 生成錯誤 ✅ 已修復

**問題**：部分卡片缺少解釋段落，導致 Hugo 生成 Summary 時發生 `slice bounds out of range` 錯誤

**解決方案**：在缺少解釋的卡片中加入 `<!--more-->` 標記和摘要文字

**已修復**：4 個檔案（`dd18064`）

---

### 格式規範總結（新代理人必須遵守）

#### 檔名格式

```
標準格式：###_name.md

✅ 正確範例：
- 001_asagohan.md
- 025_conditional_comparison.md
- 019_sashiageru.md

❌ 錯誤範例：
- asagohan.md（缺少編號）
- 001-asagohan.md（使用連字號）
- 001_朝ごはん.md（使用日文）
- 1_asagohan.md（編號不足三位）
```

#### YAML Frontmatter 格式

```yaml
---
title: "日文標題（讀音）"      # 必須是日文，不是路徑
description: "簡短中文說明"
type: noun                     # 主類型
jlpt: n5                       # JLPT 等級
tags: [tag1, tag2]             # 標籤陣列
stage: draft                   # 階段狀態
draft: true
date: 2024-12-18
---

摘要文字（至少一行）

<!--more-->

## 正文內容
```

#### title 欄位格式

| 卡片類型 | 格式 | 範例 |
|---------|------|------|
| 名詞 | 日文（讀音） | `隣（となり）` |
| 動詞 | 日文（讀音） | `食べる（たべる）` |
| 形容詞 | 日文（讀音） | `新しい（あたらしい）` |
| 文法 | 文法句型 | `〜てあげる` |
| 比較 | A vs B | `が vs は` |
| 對比 | A vs B | `学習 vs 勉強` |
| 概念 | 概念名稱 | `敬語体系` |

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

#### 2. 重命名 create-card 代理人為 build-card-content

**修改檔案**：`.claude/agents/create-card.md` → `.claude/agents/build-card-content.md`

**新職責**：
- 接收已有 YAML frontmatter 的卡片（由 card-structure-handler 建立）
- 專注於填充內容（三語解釋、例句、使用規則等）
- 不再負責建立檔案和 YAML frontmatter
- 保留現有的 title、description、tags（不修改）

#### 3. 修復 378 張卡片的 title

**方法**：使用 `card-structure-handler` 代理人平行修復（漸進式策略）

**策略**：
1. 少量測試（5-10 張）→ 驗證代理人正確性
2. 小批量驗證（30-50 張）→ 確認並發無問題
3. 大規模平行修復（剩餘 ~320 張）

**標題來源**：
- 詞彙卡（noun, verb-ru, verb-u 等）：從 `## 日文` 後的內容提取日文和讀音
- 比較卡（comparison）：從內容提取比較項目（如 `いる vs ある`）
- 概念卡（concept）：從 `## 日文` 或描述中提取概念名稱

---

## 待執行任務清單

### 立即任務

- [x] 建立此工作日誌：`doc/worklog/worklog-1.0.7.md`
- [x] 建立卡片結構代理人：`.claude/agents/card-structure-handler.md`
- [x] 重命名 create-card → build-card-content 並更新職責
- [x] 更新 CLAUDE.md 和相關文檔
- [ ] 漸進式修復 378 張卡片的 title 欄位
- [ ] 驗證 Hugo 建置和搜尋功能

### 後續任務

- [ ] 更新 `.claude/card-format-guidelines.md`（title 格式規範）

---

## 相關檔案

| 檔案路徑 | 說明 |
|---------|------|
| `doc/specs/v1.0.7-hugo-setup.md` | 版本規格文檔 |
| `.claude/agents/card-structure-handler.md` | 卡片結構處理代理人（新增） |
| `.claude/agents/build-card-content.md` | 卡片內容填充代理人（原 create-card） |
| `scripts/update-index.py` | 索引更新腳本（已修正） |
| `scripts/fix-numbering.py` | 編號修復腳本（已優化） |

---

**建立日期**：2024-12-18
**分支**：`feature/v1.0.7-hugo-setup`
