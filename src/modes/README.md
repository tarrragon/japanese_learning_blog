# src/modes

## 設計意義

練習模式抽象層，定義不同練習方式的共同介面，支援擴展新的練習模式。

## 索引

| 檔案 | 說明 |
|------|------|
| `PracticeMode.js` | 抽象基類，定義練習模式的共同介面 |
| `QuestionMode.js` | 題庫模式，從題庫載入題目進行練習 |
| `KanaMode.js` | 假名模式，隨機生成假名進行練習 |
| `GojuonMode.js` | 五十音表模式，照順序或亂序輸入，每格完成即變色（平／片假名切換） |
| `GojuonAdvancedMode.js` | 五十音進階模式，依 46 列字典表順序輸入範例單字 |
| `HandwritingMode.js` | 五十音手寫模式，依筆順手寫（描紅／提示／默寫三個等級） |
| `ModeRegistry.js` | 模式註冊表，管理可用的練習模式 |

## 參考

- [輸入處理](../input/README.md)
- [題庫載入](../services/README.md)
