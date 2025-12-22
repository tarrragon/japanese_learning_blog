# src/modes

## 設計意義

練習模式抽象層，定義不同練習方式的共同介面，支援擴展新的練習模式。

## 索引

| 檔案 | 說明 |
|------|------|
| `PracticeMode.js` | 抽象基類，定義練習模式的共同介面 |
| `QuestionMode.js` | 題庫模式，從題庫載入題目進行練習 |
| `KanaMode.js` | 假名模式，隨機生成假名進行練習 |
| `ModeRegistry.js` | 模式註冊表，管理可用的練習模式 |

## 參考

- [輸入處理](../input/README.md)
- [題庫載入](../services/README.md)
