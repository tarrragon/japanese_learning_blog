# 靜默成功 Task Prompt 模板

本模板用於啟動代理人時，確保遵循靜默成功原則。

---

## 卡片建立任務（完整版）

```
建立日文學習卡片（結構+內容一次完成）：

**卡片資訊**：
- ID: {id}
- 路徑: zettelkasten/{category}/{number}_{name}.md
- 日文: {japanese}
- 中文: {chinese}
- 類型: {type}
- JLPT: {jlpt}

**任務**：
1. 建立卡片檔案（Write 工具）
2. 填充完整內容（三語解釋、例句、相關連結）
3. 更新進度: `uv run scripts/update_card_progress.py --id {id} --stage draft --quiet`

**⚠️ CRITICAL 輸出規範**：
- ✅ 成功：**完全不輸出任何文字**，直接結束
- ❌ 失敗：只輸出「❌ {id} 失敗：{原因}」

你的回應必須是空的（成功時）或只有錯誤訊息（失敗時）。
任何「完成」「成功」「已建立」等訊息都是違規的。
```

---

## 卡片建立任務（簡化版）

```
建立日文學習卡片：
- ID: {id}, 路徑: zettelkasten/{path}
- 日文: {japanese}, 中文: {chinese}, JLPT: {jlpt}

任務：Write 建立檔案 → 填充內容 → `uv run scripts/update_card_progress.py --id {id} --stage draft --quiet`

**⚠️ CRITICAL**：成功不輸出任何文字，失敗只輸出「❌ {id} 失敗：{原因}」
```

---

## 內容填充任務（已有卡片結構）

```
填充日文學習卡片內容：

**卡片資訊**：
- ID: {id}
- 檔案路徑: zettelkasten/{path}
- 日文: {japanese}
- 中文: {chinese}

**任務**：
1. 讀取卡片檔案（Read 工具）
2. 使用 Edit 工具填充內容（三語解釋、例句、使用規則）
3. 更新進度: `uv run scripts/update_card_progress.py --id {id} --stage draft --quiet`

**⚠️ CRITICAL 輸出規範**：
- ✅ 成功：**完全不輸出任何文字**，直接結束
- ❌ 失敗：只輸出「❌ {id} 失敗：{原因}」
```

---

## 使用說明

1. 根據任務類型選擇對應模板
2. 替換 `{placeholder}` 為實際值
3. 使用 Task 工具啟動代理人

**重要**：CRITICAL 輸出規範必須保留，這是確保靜默成功的關鍵。
