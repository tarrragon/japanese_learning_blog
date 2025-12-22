# src/domain

## 設計意義

領域驅動設計（DDD）的核心層，封裝打字練習的業務邏輯，不依賴任何外部框架或 UI。

## 索引

| 檔案 | 說明 |
|------|------|
| `Character.js` | 字元 Value Object，封裝單一假名的屬性和羅馬字對應 |
| `Question.js` | 題目 Entity，管理題目文字和字元序列 |
| `InputBuffer.js` | 輸入緩衝區，處理使用者的按鍵輸入和匹配邏輯 |
| `TypingSession.js` | Session Aggregate Root，協調整個打字練習的生命週期 |
| `EventTypes.js` | 領域事件類型常數定義 |
| `RomajiMap.js` | 羅馬字對應表，定義假名和輸入方式的映射關係 |

## 參考

- [狀態管理](../store/README.md)
- [測試](../../tests/README.md)
