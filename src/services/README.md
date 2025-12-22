# src/services

## 設計意義

應用服務層，提供跨領域的基礎設施服務，處理外部資源存取和系統功能。

## 索引

| 檔案 | 說明 |
|------|------|
| `QuestionLoader.js` | 題庫載入服務，從 JSON 檔案載入練習題目 |
| `SpeechService.js` | 語音合成服務，提供日文發音功能 |
| `PersistenceService.js` | 持久化服務，使用 localStorage 儲存使用者設定 |

## 參考

- [練習模式](../modes/README.md)
- [國際化](../i18n/README.md)
