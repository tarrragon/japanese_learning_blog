# .claude

## 設計意義

Claude Code 的配置中心，包含代理人定義、Slash Commands、模板和技能，用於自動化卡片管理和文章分析工作流程。

## 索引

### 目錄

| 項目 | 說明 |
|------|------|
| `agents/` | 工作流程代理人定義（自動化卡片管理） |
| `commands/` | Slash Commands 定義（使用者指令） |
| `skills/` | 自訂技能（擴充 Claude 能力） |
| `templates/` | 提示模板（標準化代理人輸出） |

### 代理人（agents/）

| 代理人 | 用途 |
|--------|------|
| `card-structure-handler.md` | 建立卡片檔案結構（YAML、檔名、基本區塊） |
| `build-card-content.md` | 填充卡片內容（三語解釋、例句、用法） |
| `build-card-links.md` | 建立標準連結和腳註 |
| `create-extension-cards.md` | 審查延伸需求，識別需要的新卡片 |
| `diagram-designer.md` | 設計視覺化圖表（可選） |

### Slash Commands（commands/）

| 指令 | 用途 |
|------|------|
| `/analyze-article` | 全面分析日文文章 |
| `/create-zettel` | 從文章建立 Zettelkasten 卡片 |
| `/explain-grammar` | 深入解析文法結構 |
| `/extract-vocab` | 提取關鍵詞彙 |
| `/generate-exercises` | 生成練習題 |

### 技能（skills/）

| 技能 | 用途 |
|------|------|
| `macos-dictionary/` | 查詢 macOS 內建字典 |
| `doc-structure/` | 文檔結構管理（README 和檔案註解標準化） |
| `card-structure-validator/` | 卡片結構驗證 |
| `extension-assessment/` | 延伸需求評估 |

### 規範文件

| 檔案 | 說明 |
|------|------|
| `card-format-guidelines.md` | 卡片格式規範 |
| `diagram-guidelines.md` | 圖表設計原則 |
| `version-cycle-checklist.md` | 版本循環檢查清單 |

## 參考

- [專案主文檔](../CLAUDE.md)
- [執行流程詳細指南](../doc/execution-workflow.md)
