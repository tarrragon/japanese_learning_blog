# v1.0.9 工作日誌 - 輸入練習 JS 邏輯

**建立日期**：2025-12-18
**狀態**：進行中

---

## 已完成

### Domain Layer（TDD 完成）

- [x] RomajiMap.js - 羅馬字對應表
- [x] Character.js - 字元 Value Object
- [x] Question.js - 題目 Entity（含拗音解析）
- [x] InputBuffer.js - 輸入緩衝區
- [x] TypingSession.js - Aggregate Root（事件驅動）
- [x] SpeechService.js - Web Speech API 封裝

### UI Layer

- [x] PracticeController.js - DOM 連接、事件處理
- [x] KeyboardRenderer.js - 鍵盤高亮效果
- [x] main.js - 入口文件
- [x] index.html - 更新載入 JS
- [x] style.css - 新增互動樣式

### 測試

- [x] 78 個 BDD 測試全部通過
- [x] 瀏覽器基本功能測試通過

### Bug 修復

- [x] 修復「ん」後面跟 n 開頭假名時的輸入問題
  - 問題：「こんにちは」中按 `n` 被誤判為錯誤
  - 原因：`n` 同時是「ん」和「に」(ni) 的前綴
  - 解決：當「ん」後面跟著 n 開頭假名時，強制使用 `nn`

---

## 待解決問題（v1.0.10 研究）

### 日文輸入邊界情況分析

需要進行全面研究，一次性處理所有日文輸入的常見問題：

#### 1. 促音「っ」處理

**問題描述**：
- 標準輸入：「かった」= `katta`（っ 透過重複下一個輔音輸入）
- 目前實現：「っ」= `xtu` / `ltu`（獨立輸入，不符合習慣）

**需要支援的情況**：
```
かった → katta (不是 kaxtu + ta)
ちょっと → chotto
いっしょ → issho / issyo
まって → matte
```

#### 2. 其他潛在問題

需要研究的情況：

| 類型 | 範例 | 說明 |
|------|------|------|
| 促音 + 各種子音 | っか、っさ、った | 重複子音規則 |
| ん + 母音 | こんや → konnya? | n 後接 y 的處理 |
| 長音 ー | カー | 長音符號輸入 |
| 特殊假名 | ゐ、ゑ | 古典假名 |
| 外來語特殊音 | ファ、ティ、ウィ | 片假名擴展 |

#### 3. 研究方向

1. 參考主流日文輸入法（Google 日本語入力、ATOK、macOS 日文輸入）
2. 整理完整的羅馬字輸入規則
3. 設計更智能的輸入匹配邏輯
4. 補充 BDD 測試案例

---

## 檔案變更清單

### 新增
- `src/domain/RomajiMap.js`
- `src/domain/Character.js`
- `src/domain/Question.js`
- `src/domain/InputBuffer.js`
- `src/domain/TypingSession.js`
- `src/services/SpeechService.js`
- `src/ui/PracticeController.js`
- `src/ui/KeyboardRenderer.js`
- `src/main.js`
- `tests/domain/*.test.js`
- `tests/integration/TypingFlow.test.js`
- `static/practice/js/practice.js`（打包輸出）
- `static/practice/README.md`
- `bunfig.toml`

### 修改
- `static/practice/index.html`
- `static/practice/style.css`

---

## 下一步

1. **v1.0.10**：日文輸入邊界情況全面研究與修復
   - 使用計畫模式進行分析
   - 一次性處理所有已知問題
   - 補充完整測試案例

2. **v1.1.0**：題目載入系統
   - 從卡片系統載入練習題目
   - 難度分級
   - 進度追蹤

---

**最後更新**：2025-12-18
