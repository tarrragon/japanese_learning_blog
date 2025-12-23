# README 格式標準

## 設計意義

README 是目錄的「說明書」，負責解釋這個目錄為什麼存在，以及包含哪些內容。

## 必須包含（三欄位）

### 1. 設計意義（Design Purpose）

一句話說明「為什麼這個目錄存在」。

**要求**：
- 簡潔明確，不超過兩句話
- 說明「為什麼」而非「是什麼」
- 不隨程式修改而改變

**範例**：
```markdown
## 設計意義

提供日文輸入練習系統的領域核心邏輯，實現領域驅動設計（DDD）的 Domain 層。
```

### 2. 索引（Index）

列出直接下層的資料夾和檔案清單。

**要求**：
- 只列出直接下層（不遞迴）
- 每個項目附上一行說明
- 使用表格或清單格式

**範例（表格格式）**：
```markdown
## 索引

| 項目 | 說明 |
|------|------|
| `domain/` | 核心領域邏輯 |
| `store/` | 狀態管理 |
| `App.js` | 應用主控制器 |
```

**範例（清單格式）**：
```markdown
## 索引

- `Character.js` - 字元 Value Object
- `Question.js` - 題目 Entity
- `TypingSession.js` - Session Aggregate Root
```

### 3. 參考（References）

列出相關文檔連結。

**要求**：
- 只列出直接相關的文檔
- 使用相對路徑
- 避免重複上層已有的連結

**範例**：
```markdown
## 參考

- [測試說明](../tests/README.md)
- [開發流程](../doc/execution-workflow.md)
```

---

## 禁止包含

| 禁止內容 | 原因 | 應該放在哪裡 |
|---------|------|-------------|
| 重複上層已有的資訊 | 避免資訊重複 | 只在一處維護 |
| 具體的實作細節 | README 說明「為什麼」而非「怎麼做」 | 檔案開頭註解 |
| 使用範例和教學 | 會隨版本變動 | 獨立的文檔或 Wiki |
| 版本歷史 | 由 git 管理 | git log 或 CHANGELOG |
| 作者資訊 | 由 git 管理 | git blame |

---

## 完整範例

```markdown
# src/domain

## 設計意義

提供日文輸入練習系統的領域核心邏輯，實現領域驅動設計（DDD）的 Domain 層。

## 索引

| 檔案 | 說明 |
|------|------|
| `Character.js` | 字元 Value Object，封裝單一假名的屬性 |
| `Question.js` | 題目 Entity，管理題目的生命週期 |
| `InputBuffer.js` | 輸入緩衝區，處理使用者的按鍵輸入 |
| `TypingSession.js` | Session Aggregate Root，協調整個打字練習過程 |
| `EventTypes.js` | 事件類型常數定義 |
| `RomajiMap.js` | 羅馬字對應表 |

## 參考

- [狀態管理](../store/README.md)
- [測試說明](../../tests/README.md)
```
