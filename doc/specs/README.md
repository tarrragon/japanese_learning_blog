# 規格文檔索引

本目錄包含 v1.0.7 至 v1.1.0 的技術規格文檔。

## 版本規劃總覽

| 版本 | 文檔 | 目標 | 狀態 |
|------|------|------|------|
| v1.0.7 | [hugo-setup](v1.0.7-hugo-setup.md) | Hugo 靜態網站基礎建設 | 待開發 |
| v1.0.8 | [practice-ui](v1.0.8-practice-ui.md) | 日文輸入練習頁面 UI | 待開發 |
| v1.0.9 | [typing-logic](v1.0.9-typing-logic.md) | 輸入練習 JS 邏輯（DDD + BDD） | 待開發 |
| v1.1.0 | [question-loader](v1.1.0-question-loader.md) | 卡片題目載入系統整合 | 待開發 |

## 專案背景

本專案已建立完整的日文 Zettelkasten 卡片系統（433+ 張卡片），現在進入應用層開發階段。目標是將知識庫轉化為互動式學習工具。

### 兩大功能方向

1. **Hugo 靜態網站**：將 Markdown 卡片轉換為可瀏覽的部落格網頁
2. **日文輸入練習**：羅馬字鍵盤輸入練習系統，搭配視覺提示和語音朗讀

## 技術決策摘要

| 項目 | 決策 |
|------|------|
| 輸入模式 | 羅馬字輸入（按 'a' 輸入「あ」） |
| Hugo 主題 | PaperMod |
| 朗讀觸發 | 每次按鍵都朗讀 |
| 部署方式 | 同 repo 的 gh-pages 分支 |
| 架構模式 | 事件驅動 + DDD |
| 測試風格 | BDD（Given-When-Then） |

## 開發流程

### 分支策略

```
main
  ├── feature/v1.0.7-hugo-setup
  ├── feature/v1.0.8-practice-ui
  ├── feature/v1.0.9-typing-logic
  └── feature/v1.1.0-question-loader
```

### 每版本完成後

1. 更新 CHANGELOG.md
2. 合併到 main
3. 打版本 tag（git tag vX.X.X）
4. 確認 GitHub Pages 部署成功

## 文檔結構

每個規格文檔包含：

- **目標與範圍**：版本要達成的具體目標
- **技術決策**：關鍵技術選擇和理由
- **驗收條件**：可勾選的完成標準
- **實作步驟**：具體的開發步驟
- **預計檔案**：新增和修改的檔案清單
- **測試重點**：需要驗證的項目

---

**建立日期**：2024-12-17
