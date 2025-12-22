# src

## 設計意義

日文輸入練習系統的原始碼，採用模組化架構和領域驅動設計（DDD），支援擴展新的練習模式和輸入方式。

## 索引

| 項目 | 說明 |
|------|------|
| `domain/` | 核心領域邏輯（DDD Domain 層） |
| `store/` | 狀態管理（Flux 風格） |
| `adapters/` | 事件系統橋接器 |
| `modes/` | 練習模式抽象（題庫模式、假名模式） |
| `input/` | 輸入處理抽象（羅馬字、日文 IME） |
| `renderers/` | UI 渲染器 |
| `effects/` | 視覺效果（閃爍等） |
| `services/` | 應用服務（語音、題庫載入、持久化） |
| `i18n/` | 國際化支援 |
| `ui/` | UI 控制器（虛擬鍵盤） |
| `App.js` | 應用主控制器，整合所有模組 |
| `main.js` | 入口點，初始化應用 |

## 架構圖

```
使用者輸入 → InputHandler → TypingSession → SessionStoreAdapter → Store
                                                                    ↓
                                              ┌─────────────────────────────┐
                                              │        Subscribers          │
                                              │  ├─ App.js（UI 更新）        │
                                              │  └─ effectMiddleware（閃爍） │
                                              └─────────────────────────────┘
```

## 開發流程

```bash
# 執行測試
bun test

# 打包（修改 src/ 後必須執行）
bun build src/main.js --outfile static/practice/js/practice.js --minify --format=iife

# 啟動本地開發環境
hugo server
```

## 參考

- [測試架構](../tests/README.md)
- [靜態網頁](../static/practice/README.md)
- [打包格式說明](../CLAUDE.md#打包格式技術選型)
