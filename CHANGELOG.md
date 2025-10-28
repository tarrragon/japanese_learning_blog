# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2025-10-28

### Added

#### 專案結構與文檔
- 建立版本更新記錄 `CHANGELOG.md`
- 建立工作流程文檔目錄 `doc/`
- 定義四階段工作流程循環系統
- 定義語義化版本管理規則

#### 卡片系統
- 實現 Zettelkasten 卡片盒筆記系統
- 支援多種卡片類型：
  - 動詞（る動詞、う動詞）
  - 名詞
  - 形容詞（い形容詞、な形容詞）
  - 助詞
  - 文法
  - 敬語
  - 語用
  - 文化

#### 連結系統
- 實現雙重連結系統：
  - 標準 Wikilink 連結 `[[card]]` - 用於相關卡片列表
  - 腳註標註 `[^note]` - 用於文內概念說明
- 支援語義化腳註標籤（如 `[^ichidan]`）
- 建立卡片格式完整指南 `.claude/card-format-guidelines.md`

#### 代理人
- **延伸卡片建立代理人** (`.claude/subagents/create-extension-cards.md`)
  - 分析詞彙卡片識別需要的延伸卡片
  - 自動建立文法、語用、文化等延伸卡片
  - 支援完整腳註標註

- **連結建立代理人** (`.claude/subagents/build-card-links.md`)
  - 為卡片補充標準連結和腳註
  - 自動檢測遺漏的卡片
  - 建立草稿卡片（`draft: true`）

#### Slash Commands
- `/analyze-article` - 分析日文文章（難度、主題、文法、學習重點）
- `/explain-grammar` - 詳細解釋文法結構和句型
- `/extract-vocab` - 提取關鍵詞彙並提供解釋
- `/generate-exercises` - 生成練習題
- `/create-zettel` - 從文章建立 Zettelkasten 卡片

#### 卡片 YAML 格式
- 新增 `stage` 欄位追蹤卡片進度：
  - `draft` - 草稿階段
  - `extension-review` - 延伸卡片檢查階段
  - `linking` - 建立連結與腳註階段
  - `completed` - 完成階段
- 新增草稿卡片標記：`draft`, `auto_generated`, `needs_review`
- 新增 `generated_cards` 欄位追蹤自動生成的卡片

### Testing

#### 腳註功能測試
- 測試 4 種卡片類型（動詞、延伸卡片、名詞、形容詞）
- 總計測試 37 個腳註標註
- 建立 5 張草稿卡片作為測試
- 創建測試報告 `.claude/footnotes-review-report.md`

**測試結果**：
- ✅ 設計完整度：90%（生產環境就緒）
- ✅ 驗證 6 大腳註類型分類
- ✅ 識別 3 個需要補充的次分類
- ✅ 高頻類型：文法概念 (15次)、文法點標註 (12次)

### Documentation

- 卡片格式完整指南 (13,966 bytes)
- 腳註功能評估報告 (13,042 bytes)
- 專案主指南文檔 (本次新增)
- 版本更新記錄 (本檔案)

---

## 版本類型說明

- **MAJOR（大版本）** - 專案結構或核心功能重大變動
- **MINOR（中版本）** - 新增或修改 slash command 或代理人
- **PATCH（小版本）** - 卡片內容新增、修改或修復

## 連結

- [項目指南](.claude/claude.md)
- [卡片格式指南](.claude/card-format-guidelines.md)
- [腳註評估報告](.claude/footnotes-review-report.md)
- [工作流程文檔](doc/)

---

**維護者**: Claude Code
**最後更新**: 2025-10-28
