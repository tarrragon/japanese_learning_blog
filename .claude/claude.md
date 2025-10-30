# Claude Code 工作流程規範

## Extension-Review 階段規範

### 處理原則
**一次處理一張卡片** - Extension-Review 分析應該逐張卡片進行，每張卡片是一個獨立的 todo 任務。

### 為什麼這樣做？
1. **避免 token 過載**：一次讀取所有卡片會消耗大量 token
2. **追蹤進度**：每張卡片獨立任務，容易追蹤完成狀態
3. **逐步處理**：可以隨時中斷和恢復工作
4. **清晰管理**：每個任務有明確的輸入和輸出

### Extension-Review 流程
每張卡片的處理步驟：

1. **讀取卡片** - 讀取單張卡片內容
2. **分析延伸需求** - 識別卡片中提到但未建立的概念
   - 檢查 wikilinks 中標記「待建立」的卡片
   - 檢查文中提及但未連結的重要概念
   - 檢查對比說明中提到的相關卡片
3. **記錄延伸需求** - 記錄到統一的延伸需求文檔
4. **標記完成** - 在 todo list 中標記該卡片已完成分析

### Todo List 組織方式
```
✅ Extension-Review: particle/006_wa.md
✅ Extension-Review: particle/007_ni.md
🔄 Extension-Review: verb-irr/001_suru.md
⏳ Extension-Review: verb-irr/002_kuru.md
⏳ Extension-Review: verb-irr/003_iru.md
...
```

### 輸出文檔
所有分析結果統一記錄到：
- `doc/extension-review-1.0.2.md` - Extension-Review 階段的總結文檔
- 包含所有識別的延伸卡片需求
- 按優先級分類（Critical, High, Medium, Low）
- 標註 JLPT 級別和預估工作量

---

## 其他階段規範

### Draft 階段
- 每張卡片獨立創建
- 使用 Task tool 批次創建時，每個 Task 對應一張卡片

### Linking 階段
- 可以批次處理（使用 agents）
- 但建議按類別分批（如：所有助詞、所有文法等）

### Completed 階段
- 批次更新 YAML frontmatter
- 統一標記 completed 狀態

---

## 連結格式規範（重要！）

### ⚠️ 嚴格禁止使用 Wikilink 格式

**絕對不可使用以下格式**：

```markdown
❌ [[particle/007_ni|に]]
❌ [[verb-ru/001_taberu|食べる]]
❌ [[grammar/001_te_form]]
❌ related_to: [[particle/003_wo]]
```

### ✅ 必須使用標準 Markdown 格式

**唯一正確的連結格式**：

```markdown
✅ [に](../particle/008_ni.md)
✅ [食べる](001_taberu.md)
✅ [て形文法](../grammar/001_te_form.md)
```

### 代理人建立連結檢查清單

每次建立連結時，**必須確認**：

1. ✅ 使用 `[text](path)` 格式，**不是** `[[text]]` 或 `[[path|text]]`
2. ✅ 路徑包含 `.md` 副檔名
3. ✅ 使用正確的相對路徑
   - 同目錄：`[食べる](001_taberu.md)`
   - 跨目錄：`[が](../particle/001_ga.md)`
4. ✅ 檔案確實存在
5. ❌ 絕對不使用 Wikilink `[[...]]` 格式

### 為什麼禁止 Wikilink？

1. **無法正常工作**：在 GitHub、GitLab、VS Code 等標準 Markdown 渲染器中無法形成可點擊連結
2. **違反規範**：CLAUDE.md 明確規定使用標準 Markdown
3. **維護困難**：需要額外的轉換腳本修正

### 如何處理遺留的 Wikilink

如果發現卡片中有 Wikilink 格式：

```bash
# 檢查是否還有 Wikilink
uv run scripts/fix-wikilinks.py --check

# 修正所有 Wikilink
uv run scripts/fix-wikilinks.py --fix
```
