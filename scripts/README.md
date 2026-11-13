# Scripts 使用說明

本目錄包含用於維護 Zettelkasten 系統的實用腳本，使用 **UV 單檔模式** 開發。

## 📋 腳本清單

### 1. list-categories.py - 列出既有分類

**用途**：查看系統中所有分類及其統計資訊

**執行方式**：
```bash
# 顯示所有分類
uv run scripts/list-categories.py

# 顯示詳細統計（包含卡片數量）
uv run scripts/list-categories.py --count

# JSON 格式輸出
uv run scripts/list-categories.py --json

# 查詢特定分類
uv run scripts/list-categories.py verb-ru
```

**輸出範例**：
```
📂 既有卡片分類清單

================================================================================

【verb-ru】 - る動詞（一段動詞）
  路徑: zettelkasten/verb-ru/
  卡片數量: 10 張
  最後編號: 010

【noun】 - 名詞
  路徑: zettelkasten/noun/
  卡片數量: 5 張
  最後編號: 005

================================================================================

總計: 23 個分類，56 張卡片
```

---

### 2. list-tags.py - 列出既有 Tags

**用途**：查看系統中所有 tags 及其使用情況

**執行方式**：
```bash
# 顯示所有 tags
uv run scripts/list-tags.py

# 顯示使用次數
uv run scripts/list-tags.py --count

# 只顯示特定類型的 tags
uv run scripts/list-tags.py --type context
uv run scripts/list-tags.py --type domain
uv run scripts/list-tags.py --type jlpt

# JSON 格式輸出
uv run scripts/list-tags.py --json

# 查詢特定 tag
uv run scripts/list-tags.py business
uv run scripts/list-tags.py context/business
```

**輸出範例**：
```
🏷️  既有 Tags 清單

================================================================================

【使用情境】(6 個)
--------------------------------------------------------------------------------

  context/business
    說明: 商務場合使用
    使用次數: 15 次

  context/casual
    說明: 日常、朋友間使用
    使用次數: 32 次

【領域】(3 個)
--------------------------------------------------------------------------------

  domain/economics
    說明: 經濟學領域
    使用次數: 8 次

================================================================================

總計: 15 個 tags，總使用次數: 120 次
```

---

### 2.5 list-domains.py - 列出專業領域

**用途**：列出可用的專業領域（domains）與子主題，以及各自的卡片數。
領域不使用 `domain/*` tag，而是寫在卡片 frontmatter：

```yaml
domains:
  - economics
domain_topics:
  - economics/finance
```

領域定義（名稱、子主題、舊 tag 對應表、詞性顯示名稱）集中在 `data/domains.toml`，
網站的 `/domains/` 頁面與腳本共用。

```bash
uv run scripts/list-domains.py          # 文字輸出
uv run scripts/list-domains.py --json   # JSON 輸出
```

**遷移舊 tag**：`migrate_domain_tags.py` 依 `data/domains.toml` 的 `[aliases]`
把 `domain/*` tag 轉成 `domains` / `domain_topics`。

```bash
uv run scripts/migrate_domain_tags.py --dry-run   # 預覽
uv run scripts/migrate_domain_tags.py             # 執行
uv run scripts/migrate_domain_tags.py --check     # 檢查是否還有殘留（有則回傳 1）
```

---

### 3. get-next-number.py - 取得並保留下一個編號

**用途**：在新增卡片時取得下一個可用編號。取得的編號會寫入保留紀錄
（`.locks/{category}.reserved.json`），之後的呼叫不會再拿到同一個編號，
卡片檔案建立後保留紀錄自動清除。核心邏輯在 `card_numbering.py`。

**執行方式**：
```bash
# 取得並保留下一個編號（輸出一律為三位數）
uv run scripts/get-next-number.py verb-ru --label verb-ru/011_taberu.md
# 輸出: 011

# 只查詢不保留（不可用來建立檔案）
uv run scripts/get-next-number.py verb-ru --peek

# 保留 5 個連續編號
uv run scripts/get-next-number.py verb-ru --batch 5

# 卡片最後沒建立時，歸還編號
uv run scripts/get-next-number.py verb-ru --release 011

# 列出保留中的編號
uv run scripts/get-next-number.py verb-ru --reservations

# 取得延伸卡片編號
uv run scripts/get-next-number.py verb-ru --extension 001
# 輸出: 001_001

# JSON 格式輸出
uv run scripts/get-next-number.py verb-ru --json
```

**下一個編號的計算**：
`max(實際檔案最大編號, index.md 最後編號, 已保留最大編號) + 1`。
檔名為兩位數（如 `39_xxx.md`）也會被計入。

**衝突檢查**（`card_numbering.py`）：
```bash
# 建立卡片後檢查同分類是否已有相同基本編號（有衝突回傳 1）
uv run scripts/card_numbering.py check verb-ru 011_taberu.md

# 列出所有分類的重複編號
uv run scripts/card_numbering.py duplicates
```

**測試**：`python3 -m unittest discover -s scripts/tests -v`

**JSON 輸出範例**：
```json
{
  "category": "verb-ru",
  "index_last_number": 10,
  "files_max_number": 10,
  "batch_size": 1,
  "reserved": true,
  "next_number": 11
}
```

**延伸卡片編號**：
```bash
# 如果 001_taberu.md 已有延伸卡片：
# - 001_taberu_001_keigo.md
# - 001_taberu_002_nuance.md

uv run scripts/get-next-number.py verb-ru --extension 001
# 輸出: 001_003
```

---

### 4. update-index.py - 更新索引檔案

**用途**：自動更新分類的 index.md，保持索引同步

**執行方式**：
```bash
# 更新分類索引
uv run scripts/update-index.py verb-ru

# 預覽變更（不實際寫入）
uv run scripts/update-index.py verb-ru --dry-run

# 強制重建索引
uv run scripts/update-index.py verb-ru --force

# 添加特定卡片到索引
uv run scripts/update-index.py verb-ru --card 011_taberu.md
```

**功能**：
- ✅ 自動掃描資料夾中的所有卡片
- ✅ 更新「最後編號」和「總卡片數」
- ✅ 生成完整的卡片列表
- ✅ 保留索引檔的其他內容

**輸出範例**：
```
✅ 已更新 verb-ru/index.md
   最後編號: 011
   總卡片數: 11
```

---

### 5. verify-meta.py - 驗證 Meta 一致性

**用途**：檢查 `_meta/` 資料夾的定義是否與實際系統一致

**執行方式**：
```bash
# 完整驗證
uv run scripts/verify-meta.py

# 只檢查分類
uv run scripts/verify-meta.py --categories

# 只檢查 tags
uv run scripts/verify-meta.py --tags

# 顯示詳細資訊
uv run scripts/verify-meta.py --verbose

# JSON 格式輸出
uv run scripts/verify-meta.py --json
```

**輸出範例**：
```
🔍 _meta 一致性驗證報告

================================================================================

【分類 (Categories)】
  實際分類數量: 23
  Meta 定義數量: 23
  ✅ 狀態: 一致

--------------------------------------------------------------------------------

【Tags】
  實際使用 tags: 15
  Meta 定義 tags: 15
  ✅ 狀態: 一致

================================================================================

✅ 總體狀態: _meta 與實際系統完全一致
```

**錯誤範例**：
```
【分類 (Categories)】
  實際分類數量: 24
  Meta 定義數量: 23
  ❌ 狀態: 錯誤

  ❌ 缺少 _meta 定義的分類:
     - verb-irregular

  💡 建議: 在 _meta/categories/ 中為這些分類建立定義卡片
```

---

### 6. stage_dashboard.py - 階段管理看板 ⭐

**用途**：統一的進度追蹤工具，從 YAML frontmatter 掃描卡片狀態，作為分配任務的事實依據

**核心原則**：
- YAML frontmatter 是進度追蹤的**單一事實來源**
- 每次分配任務前執行此腳本查詢狀態
- 腳本輸出作為代理人任務分配的依據

**執行方式**：
```bash
# 顯示總覽
uv run scripts/stage_dashboard.py

# 顯示下一步行動建議
uv run scripts/stage_dashboard.py --next-action

# 列出特定階段卡片
uv run scripts/stage_dashboard.py --stage draft

# 按分類分組顯示
uv run scripts/stage_dashboard.py --stage draft --by-category

# JSON 格式輸出（供代理人使用）
uv run scripts/stage_dashboard.py --stage draft --limit 50 --format json
```

**總覽輸出範例**：
```
======================================================================
📊 卡片階段總覽（YAML 事實來源）
======================================================================

總卡片數: 1682

【階段分佈】
----------------------------------------------------------------------
  pending                745 ( 44.3%) ██████████████████████░░░░░░░░░░
                       → 代理人: card-structure-handler + build-card-content
  draft                  677 ( 40.2%) ████████████████████░░░░░░░░░░░░
                       → 代理人: create-extension-cards
  extension-review         6 (  0.4%) ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
                       → 代理人: build-card-links
  linking                  7 (  0.4%) ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
                       → 代理人: 最終驗證（人工 + diagram-designer）
  completed              247 ( 14.7%) ███████░░░░░░░░░░░░░░░░░░░░░░░░░
```

**下一步行動建議**：
```
======================================================================
🎯 下一步行動建議
======================================================================

【優先處理】draft 階段 (677 張)
----------------------------------------------------------------------
  描述: 待延伸需求審查
  代理人: create-extension-cards

  按分類分佈:
    concept          329 張
    grammar          190 張
    noun             111 張
    ...

  建議命令:
    uv run scripts/stage_dashboard.py --stage draft --by-category
    uv run scripts/stage_dashboard.py --stage draft --limit 50 --format json
```

**標準工作流程**：
```bash
# 1. 查看當前狀態
uv run scripts/stage_dashboard.py

# 2. 查看下一步行動
uv run scripts/stage_dashboard.py --next-action

# 3. 取得待處理卡片（JSON 供代理人）
uv run scripts/stage_dashboard.py --stage draft --limit 50 --format json

# 4. 啟動代理人處理
# （根據階段啟動對應代理人）
```

---

### 7. set_active_csv.py - Active CSV 管理

**用途**：設定、查看或清除當前工作的 CSV 檔案，統一代理人操作流程

**執行方式**：
```bash
# 設定當前工作的 CSV
uv run scripts/set_active_csv.py cards-pending-links-1.4.0.csv

# 查看當前設定
uv run scripts/set_active_csv.py --show

# 列出所有可用 CSV 檔案
uv run scripts/set_active_csv.py --list

# 清除設定（回到自動偵測）
uv run scripts/set_active_csv.py --clear
```

**輸出範例**：
```
📋 可用的 CSV 檔案：

  * cards-pending-links-1.4.0.csv [ACTIVE]
      總計: 396, 待處理: 146, 草稿: 249, 完成: 1

    cards-1.1.1.csv
      總計: 62, 待處理: 0, 草稿: 0, 完成: 62
```

**工作原理**：
- 設定後建立 `doc/worklog/.active-csv` 標記檔案
- `update_card_progress.py` 等腳本優先使用 Active CSV
- 代理人無需手動指定 `--csv` 參數

**注意事項**：
- ❌ 禁止使用 `sed` 直接修改 CSV
- ❌ 所有 CSV 操作必須透過標準腳本

---

## 🔧 技術細節

### UV 單檔模式

所有腳本使用 **Astral UV** 的單檔模式開發，基於 **PEP 723** 標準。

**優勢**：
- ✅ 自動依賴管理
- ✅ 完全隔離的虛擬環境
- ✅ 高可移植性
- ✅ 快速啟動

**腳本結構**：
```python
#!/usr/bin/env python3
# /// script
# dependencies = []
# requires-python = ">=3.10"
# ///

# 腳本內容
```

### 安裝 UV

如果尚未安裝 UV：

**macOS/Linux**：
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows**：
```powershell
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

**驗證安裝**：
```bash
uv --version
```

---

## 📖 使用場景

### 場景 1：新增卡片

```bash
# 1. 查看既有分類
uv run scripts/list-categories.py

# 2. 取得下一個編號
NEXT_NUM=$(uv run scripts/get-next-number.py verb-ru)
echo "下一個編號: $NEXT_NUM"

# 3. 建立卡片檔案（檔名使用三位數編號，如 ${NEXT_NUM}_taberu.md）
# （手動建立或使用其他工具）

# 3.5 確認沒有編號衝突
uv run scripts/card_numbering.py check verb-ru ${NEXT_NUM}_taberu.md

# 4. 更新索引
uv run scripts/update-index.py verb-ru
```

### 場景 2：檢查 Tags

```bash
# 1. 查看既有 tags
uv run scripts/list-tags.py --count

# 2. 決定要使用的 tags
# （根據輸出選擇）

# 3. 建立卡片時使用既有 tags
```

### 場景 3：系統維護

```bash
# 1. 驗證 meta 一致性
uv run scripts/verify-meta.py

# 2. 如果有問題，檢查詳細資訊
uv run scripts/verify-meta.py --verbose

# 3. 手動修正不一致之處

# 4. 再次驗證
uv run scripts/verify-meta.py
```

### 場景 4：建立延伸卡片

```bash
# 1. 確認基礎卡片編號
uv run scripts/list-categories.py verb-ru

# 2. 取得延伸卡片編號
EXT_NUM=$(uv run scripts/get-next-number.py verb-ru --extension 001)
echo "延伸卡片編號: $EXT_NUM"
# 輸出: 001_001

# 3. 建立延伸卡片
# 檔名: 001_taberu_001_keigo.md

# 4. 更新索引
uv run scripts/update-index.py verb-ru
```

---

## 🎯 最佳實踐

### 1. 新增卡片前先檢查

**總是先使用腳本檢查**，避免手動查找：
```bash
# ❌ 錯誤：手動查看資料夾
cd zettelkasten/verb-ru && ls

# ✅ 正確：使用腳本
uv run scripts/get-next-number.py verb-ru
```

### 2. 新增卡片後立即更新索引

**不要累積**，每次新增卡片後立即更新：
```bash
# 新增卡片後
uv run scripts/update-index.py verb-ru
```

### 3. 定期驗證 Meta

**建議每週執行一次**：
```bash
# 每週執行
uv run scripts/verify-meta.py --verbose
```

### 4. 使用 JSON 輸出整合到其他工具

所有腳本都支援 `--json` 輸出：
```bash
# 取得 JSON 格式
uv run scripts/list-categories.py --json > categories.json

# 在其他腳本中使用
python my_tool.py --categories categories.json
```

---

## 🐛 故障排除

### 問題：腳本無法執行

**錯誤訊息**：`command not found: uv`

**解決方案**：
```bash
# 安裝 UV
curl -LsSf https://astral.sh/uv/install.sh | sh

# 重新載入 shell
source ~/.bashrc  # 或 source ~/.zshrc
```

### 問題：編碼錯誤

**錯誤訊息**：`UnicodeDecodeError`

**解決方案**：
確保所有 Markdown 檔案使用 UTF-8 編碼。

### 問題：index.md 與實際不一致

**警告訊息**：`⚠️  index.md 記錄 (010) 與實際檔案 (011) 不一致`

**解決方案**：
```bash
# 強制重建索引
uv run scripts/update-index.py verb-ru --force
```

### 問題：Meta 驗證失敗

**錯誤訊息**：`❌ 缺少 _meta 定義的分類`

**解決方案**：
在 `_meta/categories/` 或 `_meta/tags/` 中建立對應的定義卡片。

---

## 🔗 相關文件

- **[CLAUDE.md](../CLAUDE.md)** - 專案整體說明
- **[UV 單檔腳本模式](../doc/hooks/03-uv-single-file-pattern.md)** - UV 技術細節
- **[PEP 723](https://peps.python.org/pep-0723/)** - Inline Script Metadata 標準

---

## 📝 維護記錄

- **2025-10-29** - 初版建立，包含 5 個核心腳本
- 使用 UV 單檔模式
- Python 3.10+ 支援
- 零外部依賴（標準庫即可）

---

**維護者**: Claude Code & User
**版本**: 1.0.0
