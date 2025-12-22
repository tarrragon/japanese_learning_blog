# 術語表

## 設計意義

統一專案文檔的術語使用，確保溝通一致性，避免混淆。

---

## 核心概念

| 術語 | 英文 | 定義 | 說明 |
|------|------|------|------|
| **階段（Phase）** | Phase | 工作流程的步驟 | 四個階段：Content Creation, Extension Review, Link Building, Final Verification |
| **狀態（Stage）** | Stage | CSV 中的標記 | 五個狀態：pending, draft, extension-review, linking, completed |
| **狀態轉換** | Stage Transition | 從一個狀態到另一個狀態 | 必須遵守轉換規則，不可跳過中間狀態 |

---

## 階段與狀態對應

| 階段名稱 | 起始狀態 | 結束狀態 | 說明 |
|---------|---------|---------|------|
| 階段 1: Content Creation | `pending` | `draft` | 建立卡片內容（三語解釋、例句） |
| 階段 2: Extension Review | `draft` | `extension-review` | 檢查並記錄延伸需求 |
| 階段 3: Link Building | `extension-review` | `linking` | 建立標準連結和腳註 |
| 階段 4: Final Verification | `linking` | `completed` | 驗證並發布 |

---

## 五個狀態的含義

| 狀態 | 中文 | 含義 |
|------|------|------|
| `pending` | 待處理 | 卡片需求已識別，尚未開始建立內容 |
| `draft` | 草稿 | 卡片內容已建立，等待審查延伸需求 |
| `extension-review` | 延伸審查 | 延伸需求已審查，等待建立連結 |
| `linking` | 連結中 | 連結已建立，等待最終驗證 |
| `completed` | 已完成 | 卡片已完成所有階段，可發布 |

---

## 文件與報告

| 術語 | 標準名稱 | 文件路徑格式 | 說明 |
|------|---------|------------|------|
| Extension-Review 報告 | 延伸需求報告 | `doc/worklog/extension-cards-{version}.md` | Extension Review 階段產出，記錄從 draft 卡片識別的延伸需求 |
| Linking 報告 | 連結階段需求報告 | `doc/worklog/linking-cards-{version}.md` | Link Building 階段產出，記錄建立連結時發現的缺口和草稿卡片 |
| 工作日誌 | 版本工作日誌 | `doc/worklog/worklog-{version}.md` | 記錄整個版本的進度、卡片清單、階段狀態 |
| 版本依賴 | 版本間依賴關係 | - | v{X} 的延伸需求報告 → v{X+1} 的輸入來源 |
| 版本規劃 | Content Creation 前置步驟 | - | 階段 1 前的準備工作，檢視前版本報告並建立工作清單 |
| 代理人 | Agent | `.claude/agents/*.md` | 專門處理特定任務的自動化工作流程 |

---

## 使用原則

1. 文檔中應使用標準名稱，避免混用同義詞
2. **階段（Phase）** 與 **狀態（Stage）** 是不同層次的概念，不可混淆
3. 完成「階段 1: Content Creation」後，狀態變為 `draft`（不是 `extension-review`）
4. 文件路徑必須使用標準格式，確保版本號一致性
5. 版本號格式：`{version}` 表示當前版本，`{prev}` 表示前一版本

---

## 參考

- [四階段工作流程](../CLAUDE.md#四階段工作流程)
- [狀態轉換流程圖](../CLAUDE.md#階段轉換流程圖)
