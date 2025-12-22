# src/store

## 設計意義

輕量級 Flux 風格狀態管理，集中管理應用程式狀態，透過單向資料流確保狀態變更可預測。

## 索引

| 檔案 | 說明 |
|------|------|
| `Store.js` | 狀態容器，管理訂閱和分發 |
| `AppState.js` | 應用程式狀態結構定義 |
| `actions.js` | Action Types 和 Action Creators |
| `reducer.js` | 狀態更新邏輯（純函數） |
| `index.js` | 模組索引 |
| `middleware/` | 中介層（副作用處理） |

## 參考

- [橋接器](../adapters/README.md)
- [領域層](../domain/README.md)
