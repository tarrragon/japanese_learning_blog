---
name: doc-structure
description: 專案文檔結構管理工具。用於建立、維護和驗證專案的層級聚攏文檔結構。觸發條件：(1) 建立新的 README.md 文件 (2) 為檔案添加標準化開頭註解 (3) 重構或更新專案文檔結構。
---

# 文檔結構管理 Skill

## 設計意義

標準化專案文檔結構，確保所有 README 和檔案註解格式一致，避免資訊重複和認知負擔。

## 核心理念：層級聚攏結構

```
CLAUDE.md（根）─ 專案規範 + 頂層目錄索引
    │
    ├── {dir}/README.md（上層）─ 設計意義 + 索引 + 參考
    │       │
    │       └── {subdir}/README.md（下層）─ 設計意義 + 索引 + 參考
    │               │
    │               └── {file}.js ─ 檔案頂部註解（設計目的 + 職責）
```

**三個原則**：
1. **上層索引下層**：每個 README 只負責索引直接下層內容
2. **設計意義穩定**：說明「為什麼」，不隨程式修改而變
3. **重構才重寫**：只有架構變動時才更新設計意義

## 使用流程

### 建立新 README

1. 確定目錄層級（頂層 or 子目錄）
2. 讀取對應模板：
   - 頂層：[templates/readme-top.md](templates/readme-top.md)
   - 子目錄：[templates/readme-sub.md](templates/readme-sub.md)
3. 填入三個必要欄位：設計意義、索引、參考
4. 確認不包含禁止內容

### 添加檔案註解

1. 確定檔案類型（JS or Python）
2. 讀取對應模板：
   - JavaScript：[templates/header-js.txt](templates/header-js.txt)
   - Python：[templates/header-py.txt](templates/header-py.txt)
3. 填入兩個必要欄位：設計目的、職責

## 參考文檔

- [README 格式標準](references/readme-format.md)
- [檔案註解標準](references/file-header-format.md)
