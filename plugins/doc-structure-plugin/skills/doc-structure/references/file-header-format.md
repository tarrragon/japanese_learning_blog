# 檔案開頭註解標準

## 設計意義

檔案開頭註解說明這個檔案「為什麼存在」、「依賴什麼」、「提供什麼」和「做什麼」，幫助開發者快速理解檔案的定位。

## 必須包含（四欄位）

### 1. Position（功能定位）

說明這個檔案在系統架構中的位置和角色。

**要求**：
- 一句話說明檔案在系統/資料夾中的定位
- 包含所屬層級（如 Domain 層、UI 層、工具腳本等）
- 不隨程式修改而改變（除非重構）

### 2. Input（外部依賴）

說明這個檔案依賴什麼外部資源。

**要求**：
- 列出關鍵的外部模組、服務或資源
- 只列出直接依賴，不列傳遞依賴
- 無依賴時標註「無」或省略

### 3. Output（對外提供）

說明這個檔案對外提供什麼。

**要求**：
- 列出導出的類別、函數、常數或服務
- 包含發送的事件或產生的副作用
- 幫助其他開發者知道可以從這個檔案獲得什麼

### 4. 職責（Responsibility）

說明這個檔案做什麼。

**要求**：
- 列出主要職責（1-3 項）
- 說明「做什麼」而非「怎麼做」
- 幫助判斷某個功能是否應該放在這個檔案

---

## 禁止包含

| 禁止內容 | 原因 | 替代方案 |
|---------|------|---------|
| 作者、日期 | 由 git 管理 | `git blame` |
| 版本號 | 由 git 管理 | `git log` |
| 冗長的使用範例 | 會過時 | 單元測試 |
| 實作細節描述 | 程式碼本身就是描述 | 行內註解 |
| TODO/FIXME 清單 | 應該使用 issue tracker | GitHub Issues |

---

## JavaScript 格式

```javascript
/**
 * @file {檔案名稱}
 * @description
 *   Position: {在系統架構中的定位}
 *   Input:
 *     - {依賴 1}
 *     - {依賴 2}
 *   Output:
 *     - {輸出 1}
 *     - {輸出 2}
 *   職責：
 *     - {職責 1}
 *     - {職責 2}
 */
```

**範例**：
```javascript
/**
 * @file TypingSession.js
 * @description
 *   Position: Domain 層的 Aggregate Root，協調打字練習的完整生命週期
 *   Input:
 *     - EventEmitter（事件發送機制）
 *     - Question 實體（題目資料）
 *   Output:
 *     - TypingSession 類別
 *     - 領域事件（questionComplete, sessionComplete）
 *   職責：
 *     - 管理題目佇列和當前題目狀態
 *     - 處理使用者輸入並發送領域事件
 *     - 維護練習統計（正確率、完成數）
 */
```

---

## Python 格式

```python
"""
{檔案名稱}

Position: {在系統架構中的定位}

Input:
  - {依賴 1}
  - {依賴 2}

Output:
  - {輸出 1}
  - {輸出 2}

職責：
  - {職責 1}
  - {職責 2}
"""
```

**範例**：
```python
"""
update_card_progress.py

Position: scripts/ 目錄的狀態管理工具，追蹤卡片在四階段工作流程中的狀態轉換

Input:
  - csv_config 模組（CSV 路徑配置）
  - 命令列參數（argparse）

Output:
  - CLI 介面（--id, --stage, --quiet）
  - 標準輸出（狀態變更確認）

職責：
  - 驗證狀態轉換的合法性（不允許跳躍）
  - 更新 CSV 工作清單中的卡片狀態
  - 輸出狀態變更的確認訊息
"""
```

---

## 何時需要更新註解

| 情況 | 是否需要更新 | 說明 |
|------|-------------|------|
| 修復 bug | 否 | Position 和職責不變 |
| 新增功能（在原有職責範圍內） | 否 | 職責不變 |
| 新增功能（超出原有職責） | 是 | 需要更新職責 |
| 新增外部依賴 | 視情況 | 重要依賴需更新 Input |
| 新增導出介面 | 視情況 | 重要介面需更新 Output |
| 重構（拆分檔案） | 是 | 需要重新定義全部欄位 |
| 重構（合併檔案） | 是 | 需要重新定義全部欄位 |
| 改變檔案的核心用途 | 是 | 需要重新定義全部欄位 |

---

## 範例比較

**不好的註解**（太詳細、會過時）：
```javascript
/**
 * @file TypingSession.js
 * @author John Doe
 * @version 2.1.0
 * @created 2024-01-15
 * @description
 *   這個檔案實現了打字練習的核心邏輯。
 *   使用方式：
 *     const session = new TypingSession(questions);
 *     session.start();
 *     session.handleKey('a');
 *
 *   內部使用 EventEmitter 來發送事件...
 *
 *   TODO: 支援多語言
 *   FIXME: 效能優化
 */
```

**好的註解**（簡潔、穩定、結構化）：
```javascript
/**
 * @file TypingSession.js
 * @description
 *   Position: Domain 層的 Aggregate Root，協調打字練習的完整生命週期
 *   Input:
 *     - EventEmitter（事件發送機制）
 *     - Question 實體（題目資料）
 *   Output:
 *     - TypingSession 類別
 *     - 領域事件（questionComplete, sessionComplete）
 *   職責：
 *     - 管理題目佇列和當前題目狀態
 *     - 處理使用者輸入並發送領域事件
 *     - 維護練習統計
 */
```
