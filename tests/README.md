# 測試架構說明

## 目錄結構

```
tests/
├── helpers/          # 環境模擬工具
├── unit/             # 單元測試（純邏輯，無環境依賴）
├── integration/      # 整合測試（模組間互動）
├── environment/      # 環境適應測試（瀏覽器/Node）
├── app/              # App 層整合測試
├── ui/               # UI 元件測試
├── renderers/        # 渲染器測試
└── i18n/             # 國際化測試
```

## 測試分層

### 1. helpers/ - 環境模擬工具

提供可重用的測試工具：

```javascript
import {
  setupBrowserEnv,      // 設置瀏覽器環境
  clearBrowserEnv,      // 清除瀏覽器環境
  createMockElement,    // 建立 DOM 元素
  createMockStorage,    // 建立 localStorage mock
} from './helpers/index.js';
```

### 2. unit/ - 單元測試

純邏輯測試，不依賴瀏覽器環境：

- `domain/` - Character, Question, TypingSession 等核心類別
- `services/` - SpeechService, PersistenceService（使用 mock 注入）
- `store/` - Store, reducer, middleware
- `modes/` - PracticeMode 相關測試
- `input/` - InputHandler 相關測試

### 3. integration/ - 整合測試

模組間互動測試：

- `typing/` - 完整打字流程（TypingFlow, DirectInputFlow）
- `store/` - Session → Store 資料流
- `adapters/` - SessionStoreAdapter 橋接器

### 4. environment/ - 環境適應測試

測試服務在不同環境下的行為：

```gherkin
Feature: SpeechService 環境適應
  Scenario: 瀏覽器環境預設建構
    Given 在瀏覽器環境中
    When 建立 SpeechService() 不帶參數
    Then 應自動使用 window.speechSynthesis

  Scenario: Node 環境優雅降級
    Given 在 Node 環境中
    When 建立 SpeechService() 不帶參數
    Then isSupported() 應返回 false
```

### 5. app/ - App 層整合測試

驗證 App.js 的完整初始化流程。

## 執行測試

```bash
bun test                      # 執行所有測試
bun test tests/unit           # 單元測試
bun test tests/integration    # 整合測試
bun test tests/environment    # 環境適應測試
bun test tests/app            # App 層測試
```

## 撰寫新測試的規範

### 新增服務時

必須同時建立：
1. **單元測試**（`unit/services/`）- 使用 mock 注入
2. **環境測試**（`environment/services/`）- 測試預設建構行為

### 環境依賴檢查清單

- [ ] 這個服務依賴哪些瀏覽器 API？
- [ ] 無參數建構時，預設行為是什麼？
- [ ] Node 環境下的降級行為是什麼？
- [ ] 有測試「預設建構 + 瀏覽器環境」嗎？
- [ ] 有測試「預設建構 + Node 環境」嗎？

## 統計

- 總測試數：536 個
- 測試檔案：28 個
- 執行時間：~100ms
