# src/adapters

## 設計意義

橋接不同系統之間的事件和資料流，將 Domain 層的領域事件轉換為 Store 的 actions。

## 索引

| 檔案 | 說明 |
|------|------|
| `SessionStoreAdapter.js` | 將 TypingSession 的領域事件轉發為 Store actions |
| `index.js` | 模組索引 |

## 參考

- [領域層](../domain/README.md)
- [狀態管理](../store/README.md)
