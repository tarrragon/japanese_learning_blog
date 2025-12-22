# src/input

## 設計意義

輸入處理抽象層，支援不同的輸入方式（鍵盤羅馬字、手機日文 IME），透過工廠模式建立對應的處理器。

## 索引

| 檔案 | 說明 |
|------|------|
| `InputHandler.js` | 抽象基類，定義輸入處理的共同介面 |
| `RomajiInputHandler.js` | 羅馬字輸入處理（鍵盤） |
| `DirectInputHandler.js` | 直接輸入處理（日文 IME） |
| `InputHandlerFactory.js` | 工廠模式，根據設定建立對應的處理器 |

## 參考

- [練習模式](../modes/README.md)
- [領域層](../domain/README.md)
