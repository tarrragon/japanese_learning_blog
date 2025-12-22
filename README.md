# 日文學習 AI 助手系統

使用 AI 來分析日文文章，拆解成原子化的學習卡片。

## 專案簡介

這個專案提供一套完整的 AI 工具，分析日文文章、提取詞彙、解釋文法。

## 功能特色

### 🔍 文章分析
- JLPT 等級評估
- 難度分析和適用對象
- 主題分類和內容摘要
- 語言特點和文體分析

### 📚 詞彙提取
- 提取關鍵詞彙（20-40個）
- 詳細的詞彙解釋和例句
- JLPT 等級標注
- 按重要性分類整理

### 🗂️ Zettelkasten 卡片盒系統
- 原子化知識卡片
- 智能連結網絡
- 三語對照（日文、英文、中文繁體）
- 23 種卡片分類
- Tag 系統（情境、領域、JLPT 等級）
- 漸進式知識累積

### 📖 macOS 字典整合（v1.0.10+）
- 整合 macOS 內建字典 API（DictionaryServices）
- 自動查詢スーパー大辞林（讀音、詞性、日文定義）
- 自動查詢ウィズダム和英辞典（英文翻譯）
- 字典資料作為權威來源，減少 AI 幻覺
- 僅限 macOS 環境使用

## 安裝使用

### 系統要求
- 基於 Claude Code CLI ，其他 AI 輔助的 IDE 或者 CLI 也可以沿著這方法套用
- Git

### 快速開始

1. **Clone 專案**
```bash
git clone <your-repo-url>
cd japanese_learning_blog
```

2. **查看可用命令**
專案已經包含以下 Slash Commands：

**文章分析系列**
- `/analyze-article` - 分析文章
- `/extract-vocab` - 提取詞彙
- `/explain-grammar` - 解釋文法
- `/generate-exercises` - 生成練習題

**Zettelkasten 系列** ⭐ 新功能
- `/create-zettel` - 從文章建立卡片盒卡片（智能代理人）

3. **開始使用**
```bash
# 在 Claude Code 中，直接使用命令
/analyze-article

# 然後複製貼上你想分析的日文文章
```

## 使用範例

### 基本工作流程

```
1. 收集文章
   → 將日文文章保存到 articles/ 目錄

2. 分析文章
   → 使用 /analyze-article 了解文章難度和重點

3. 學習詞彙
   → 使用 /extract-vocab 提取關鍵詞彙

4. 研究文法
   → 使用 /explain-grammar 深入理解文法結構

5. 練習測試
   → 使用 /generate-exercises 生成練習題

```

### 範例文章

專案已包含一篇範例文章，你可以立即測試：

```bash
# 查看範例文章
cat articles/example_01_daily_life.md

# 在 Claude Code 中使用
/analyze-article
# 然後複製 example_01_daily_life.md 的內容
```

## 專案結構

```
japanese_learning_blog/
├── README.md                 # 專案說明（本文件）
├── CLAUDE.md                 # AI 代理人指南
├── CHANGELOG.md              # 版本變更紀錄
│
├── .claude/                  # Claude Code 配置
│   ├── agents/               # 自動化代理人（建卡、連結、審查）
│   ├── commands/             # Slash Commands（/create-zettel 等）
│   ├── templates/            # 卡片模板
│   └── *.md                  # 格式規範、檢查清單
│
├── doc/                      # 專案文檔
│   ├── worklog/              # 版本工作日誌、CSV 進度追蹤
│   ├── specs/                # 版本規格（v1.0.7+ 開發規劃）
│   └── hooks/                # 開發工具文檔
│
├── scripts/                  # Python 維護工具（編號、索引、驗證）
│
├── src/                      # 日文輸入練習原始碼（v2.1 模組化架構）
│   ├── domain/               # Domain 層（核心邏輯）
│   ├── store/                # 狀態管理（Store, Actions, Reducer）
│   │   └── middleware/       # 中介層（副作用處理）
│   ├── adapters/             # 橋接器（Session → Store）
│   ├── modes/                # 練習模式（題庫、假名、可擴展）
│   ├── input/                # 輸入處理（鍵盤、手機）
│   ├── renderers/            # 渲染器（文字、結果）
│   ├── effects/              # 視覺效果
│   ├── services/             # 應用服務
│   ├── i18n/                 # 國際化（zh-TW, en, ja）
│   ├── ui/                   # UI 控制器
│   ├── App.js                # 應用主控制器
│   └── main.js               # 入口點
│
├── tests/                    # 測試檔案（469 個測試）
│   ├── domain/               # Domain 層測試
│   ├── integration/          # 整合測試（Session-Store 流程）
│   ├── adapters/             # Adapter 測試
│   ├── store/                # Store 測試
│   │   └── middleware/       # Middleware 測試
│   ├── modes/                # Modes 測試
│   ├── input/                # Input 測試
│   ├── i18n/                 # i18n 測試
│   └── renderers/            # Renderers 測試
│
├── static/practice/          # 日文輸入練習靜態頁面
│   ├── index.html            # 練習頁面
│   └── js/practice.js        # 打包後的 JS
│
├── zettelkasten/             # 知識卡片系統（433+ 張卡片）
│   ├── _meta/                # Meta 系統（標籤、分類定義）
│   ├── noun/                 # 名詞（73 張）
│   ├── verb-ru/              # る動詞（25 張）
│   ├── verb-u/               # う動詞（30 張）
│   ├── grammar/              # 文法（136 張）
│   ├── concept/              # 概念（52 張）
│   └── [其他 20+ 分類]       # 共 27 種卡片分類
│
└── articles/                 # 學習文章存放
```

### 目錄功能索引

| 目錄 | 用途 | 說明 |
|------|------|------|
| `.claude/agents/` | 自動化流程 | 卡片建立、連結建立、延伸審查代理人 |
| `.claude/commands/` | 使用者指令 | `/create-zettel`, `/analyze-article` 等 |
| `doc/worklog/` | 版本管理 | 工作日誌、卡片清單 CSV、階段報告 |
| `doc/specs/` | 開發規格 | v1.0.7-v1.1.0 功能規格文檔 |
| `doc/macos-dictionary-services.md` | 字典技術文檔 | macOS DictionaryServices API 整合指南 |
| `scripts/` | 維護腳本 | 編號分配、索引更新、格式驗證、字典查詢 |
| `src/` | 練習功能原始碼 | v2.1 模組化架構（Store、Modes、Input、Renderers、Adapters） |
| `src/store/` | 狀態管理 | Flux 風格 Store、Actions、Reducer、Middleware |
| `src/adapters/` | 橋接器 | Session 事件到 Store 的轉發器 |
| `src/modes/` | 練習模式 | 題庫模式、假名模式、可擴展設計 |
| `src/input/` | 輸入處理 | 鍵盤輸入、手機輸入、工廠模式 |
| `src/i18n/` | 國際化 | 多語系支援（zh-TW, en, ja） |
| `tests/` | 測試檔案 | 469 個測試（Domain、Store、Modes、Input、Renderers、Adapters） |
| `static/practice/` | 練習靜態頁面 | HTML、CSS、打包後的 JS |
| `zettelkasten/` | 卡片內容 | 三語解釋、例句、相關連結 |

## 命令詳解

### `/analyze-article` - 文章分析

提供全面的文章分析，包括：
- **基本資訊**：長度、閱讀時間
- **難度評估**：JLPT 等級、適合對象
- **主題內容**：分類、摘要、關鍵概念
- **語言特點**：文體、句型、敬語使用
- **文法結構**：主要文法點、複雜句式
- **學習建議**：重點、順序、資源推薦

**使用方式**：
```
/analyze-article
```
然後貼上你的日文文章。

### `/extract-vocab` - 詞彙提取

從文章中提取 20-40 個關鍵詞彙，每個詞彙包含：
- 假名標注
- 詞性和意思
- JLPT 等級
- 重要度評級
- 文章中的實際用法
- 相關詞彙
- 補充例句

詞彙按重要性分為：
- ★★★★★ 核心詞彙（必學）
- ★★★★☆ 重要詞彙（建議學習）
- ★★★☆☆ 補充詞彙（擴充學習）

**使用方式**：
```
/extract-vocab
```
然後貼上你的日文文章。

### `/explain-grammar` - 文法解釋

深入解析文章的文法結構：
- **文法概覽**：等級分布、類型、複雜度
- **核心文法詳解**：每個文法點的詳細說明
- **句子結構分析**：複雜句子逐層剖析
- **特殊語法現象**：省略、倒裝、敬語等
- **文法統計**：JLPT 分布、常用 TOP 5
- **學習建議**：學習順序、關聯學習

**使用方式**：
```
/explain-grammar
```
然後貼上你的日文文章。

### `/generate-exercises` - 生成練習題

根據文章生成 7 種類型的練習題（共約 40 題）：
1. **詞彙測驗**（10 題）- 填空、詞義選擇
2. **文法練習**（10 題）- 文法填空、句型重組
3. **閱讀理解**（5 題）- 內容理解、推理判斷
4. **句子改寫**（5 題）- 同義句轉換
5. **翻譯練習**（5 題）- 日翻中、中翻日
6. **聽寫練習**（5 題）- 關鍵句子聽寫
7. **綜合應用**（3 題）- 作文、口語練習

**使用方式**：
```
/generate-exercises
```
然後貼上你的日文文章。

### 日文輸入練習 ⭐ 新功能

互動式羅馬字輸入練習系統，支援：
- 平假名、片假名完整對應
- 拗音、促音正確處理
- 多種輸入方式（如 `si`/`shi` 皆可輸入「し」）
- 即時視覺回饋與語音朗讀
- 虛擬鍵盤提示

**使用方式**：
```bash
# 啟動本地伺服器後
hugo server

# 開啟瀏覽器
http://localhost:1313/practice/
```

---

### `/create-zettel` - Zettelkasten 卡片建立 ⭐

從文章建立原子化的知識卡片：

**命令功能**：
- 分析文章，識別值得建卡的內容
- 檢查既有卡片，避免重複
- 自動建立適當的 Tag（情境、領域、JLPT）
- 建立卡片間的連結
- 生成多張卡片（可跨不同分類）
- 更新索引文件

**卡片特色**：
- 三語並列（日文、英文解釋、中文解釋）
- 基於日文思考的例句
- 原子化
- 互連性

**23 種卡片分類**：
- 詞彙類：名詞、動詞、形容詞、副詞等
- 文法類：助詞、助動詞、接續詞等
- 特殊類：量詞、連體詞、接頭詞等
- 表達類：慣用語、諺語、擬聲詞等
- 概念類：概念、文法、對比、情境

**使用方式**：
```
/create-zettel
```
然後貼上你的日文文章，AI 會自動：
1. 分析文章內容
2. 決定建立哪些卡片
3. 分配適當的 Tag
4. 建立卡片間的連結
5. 生成卡片檔案
6. 更新索引


## Zettelkasten 系統詳解

### 什麼是 Zettelkasten？

Zettelkasten（德文：卡片盒）是一種高效的知識管理方法，由社會學家 Niklas Luhmann 發展。核心理念：

1. **原子化**：每張卡片只包含一個概念
2. **連結性**：卡片之間透過連結形成知識網絡
3. **漸進式成長**：知識網絡隨學習自然擴展
4. **驚喜發現**：透過連結產生新的理解

### 如何使用

#### 基本工作流程
```
收集文章 → 使用 /create-zettel → 獲得卡片 → 複習連結 → 發現新知
```

#### 瀏覽方式
1. **從主索引開始**：`zettelkasten/index.md`
2. **按分類瀏覽**：進入感興趣的資料夾（如 noun/、grammar/）
3. **點擊連結探索**：隨意點擊卡片中的連結
4. **發現關聯**：透過連結發現意外的知識關聯

#### Tag 系統
每張卡片都有 Tag 幫助分類：
- **context/** - 使用情境（business、casual、formal等）
- **domain/** - 專業領域（economics、technology、culture等）
- **jlpt/** - JLPT 等級（n5-n1）

#### 卡片格式
```yaml
---
title: 朝ごはん（あさごはん）
description: 早餐，一天中的第一餐
tags:
  - context/family
  - domain/daily_life
  - jlpt/n5
date: 2025-10-27
links:
  - [食べる](../verb-ru/001_taberu.md)
  - [健康](002_kenkou.md)
---

## 日文
朝ごはん（あさごはん）

## 英文解釋
[用英文解釋這個詞彙...]

## 中文解釋
[用中文解釋...]

## 例句
[三語並列的實際例句...]
```

### 學習建議

1. **循序漸進**：不要一次建立太多卡片，5-15張/文章即可
2. **重視連結**：新卡片要思考與既有知識的關聯
3. **定期複習**：利用連結隨機遊走複習
4. **主題平衡**：收集不同領域的文章，建立多元知識網絡

### 與其他系統整合

Zettelkasten 卡片可以輕鬆匯出或整合到：
- **Obsidian**：直接作為 Obsidian vault
- **Anki**：轉換為單字卡
- **Notion**：複製到 Notion 資料庫

## 貢獻

歡迎提出建議和改進！

## 授權

本專案僅供個人學習使用。收集的文章請注意版權問題。

## 聯繫與支持

因為內容是AI生成，如有問題或建議，歡迎開 Issue 討論。


