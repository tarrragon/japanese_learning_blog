# Claude Code Hooks 開發指南

## 📖 文件索引

本目錄包含 Claude Code Hooks 的完整開發參考資料，基於官方文件、實戰經驗和社群最佳實踐整理而成。

### 核心文件

#### 1. [Hook 基礎概念](./01-hook-fundamentals.md)
**內容**: 完整介紹 9 種 Hook 類型、輸入輸出格式、Matcher 語法、配置標準
**適用**: 所有想使用 Hook 系統的開發者
**亮點**:
- 9 種 Hook 類型完整說明和對照表
- Exit Code vs JSON 輸出詳細比較
- 官方環境變數 `$CLAUDE_PROJECT_DIR` 使用
- 除錯方法和最佳實踐

#### 2. [Hook 最佳實踐](./02-hook-best-practices.md)
**內容**: IndyDevDan 的 Hook 哲學、7 大核心設計原則、實用模式和技巧
**適用**: 需要提升 Hook 品質的開發者
**亮點**:
- 單一職責、快速執行、詳細日誌等 7 大原則
- 修復模式機制和上下文分析
- Hook 組合模式和常見陷阱解決
- 效能最佳化技巧

#### 3. [UV 單檔腳本模式](./03-uv-single-file-pattern.md)
**內容**: Astral UV 完整介紹、PEP 723 標準、4 個完整 Hook 模板
**適用**: 使用 Python 開發 Hook 的開發者
**亮點**:
- UV vs 傳統 venv 優勢比較
- PEP 723 inline metadata 標準
- PreToolUse/PostToolUse/UserPromptSubmit/Stop 完整模板
- 除錯和測試方法

#### 4. [Hook 範例集](./04-hook-examples.md)
**內容**: 10 個完整可用的 Hook 範例，涵蓋權限控制、觀察記錄、自動化、通知
**適用**: 需要實作特定功能的開發者
**亮點**:
- 阻止危險檔案操作範例
- 主線程職責檢查實作
- 任務分派準備度檢查
- 完整對話記錄和工具使用追蹤
- 每個範例包含完整程式碼、配置、測試方法

#### 5. [語音通知整合](./05-voice-notification.md)
**內容**: TTS 整合指南，包含 ElevenLabs、OpenAI、本地 TTS 3 種方案
**適用**: 需要語音通知功能的開發者
**亮點**:
- IndyDevDan TTS UX 價值見解
- ElevenLabs/OpenAI/macOS/Windows 完整實作
- 3 種方案優缺點和成本比較
- 進階功能：條件式通知、客製化訊息、多語言支援

#### 6. [Hook 開發檢查清單](./06-development-checklist.md)
**內容**: 7 階段完整開發流程、每階段詳細檢查清單、除錯和優化指南
**適用**: 所有 Hook 開發者
**亮點**:
- 規劃→設計→實作→測試→配置→文件→部署 完整流程
- 每階段具體檢查清單（100+ 項）
- 常見問題排查和 Debug 模式使用
- 效能優化檢查清單
- 最終檢查清單確保品質

---

## 🎯 快速開始

### 1. 理解 Hook 的價值

Hook 系統讓你能夠：
- 🎮 **控制** - 阻止不安全的指令執行
- 👁️ **觀察** - 記錄所有工具使用和對話
- 🔔 **通知** - 在關鍵時刻獲得提醒
- 🚀 **自動化** - 在特定時機執行自定義邏輯

### 2. 選擇適合的 Hook 類型

| Hook 類型 | 觸發時機 | 主要用途 |
|----------|---------|---------|
| **PreToolUse** | 工具執行前 | 權限控制、參數驗證 |
| **PostToolUse** | 工具執行後 | 日誌記錄、後處理 |
| **UserPromptSubmit** | 用戶提交 prompt | Context 注入、合規檢查 |
| **Stop** | Claude 完成響應 | 對話記錄、完成通知 |
| **SubagentStop** | 子任務完成 | 子任務追蹤、並行管理 |
| **Notification** | 需要用戶輸入 | 權限請求處理 |

### 3. 實作模式選擇

**🐍 Python UV 單檔模式**（推薦）:
```python
#!/usr/bin/env python3
# /// script
# dependencies = ["anthropic", "rich"]
# ///

import json
import sys

def main():
    input_data = json.load(sys.stdin)
    # Hook 邏輯

if __name__ == "__main__":
    main()
```

**🐚 Bash 腳本模式**:
```bash
#!/bin/bash
PROJECT_ROOT="$CLAUDE_PROJECT_DIR"
INPUT=$(cat)  # 讀取 JSON 輸入
# Hook 邏輯
```

### 4. 配置 Hook

在 `.claude/settings.local.json`:
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Task",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/my-hook.py"
          }
        ]
      }
    ]
  }
}
```

---

## 🌟 IndyDevDan 的 Hook 哲學

基於影片 "Hooked on Claude Code Hooks" 的關鍵見解：

### 核心原則

1. **可觀察性至上** - "You can't improve what you can't measure"
2. **單檔隔離** - UV 單檔腳本確保依賴隔離和可移植性
3. **語音回饋** - TTS 通知讓長時間任務更友善
4. **並行子任務** - 利用 SubagentStop 追蹤並行工作

### 關鍵引用

> "Observability is everything. How well you can observe, iterate, and improve your agentic system is going to be a massive differentiating factor for engineers."
>
> — IndyDevDan, Hooked on Claude Code Hooks

> "Claude Code is a new engineering primitive... It's the first programmable agentic coding tool."
>
> — IndyDevDan

---

## 📊 本專案 Hook 系統概覽

我們已實作 5 個核心 Hook，完整涵蓋敏捷重構方法論要求：

| Hook | 類型 | 功能 | 狀態 |
|------|------|------|------|
| Hook 1 | PostToolUse | 主線程職責檢查 | ✅ |
| Hook 2 | PreToolUse | 任務分派準備度檢查 | ✅ |
| Hook 3 | 擴充既有 | 三重文件一致性檢查 | ✅ |
| Hook 4 | 獨立腳本 | 階段完成 5 項驗證 | ✅ |
| Hook 5 | Stop Hook | 代理人回報追蹤 | ✅ |

詳細說明請參考 [Hook 範例集](./04-hook-examples.md)

---

## 🛠 Hook 開發工作流程

1. **規劃** - 確定觸發時機和目標
2. **設計** - 選擇實作模式（Python/Bash）
3. **實作** - 編寫 Hook 腳本
4. **測試** - 使用 `claude --debug` 驗證
5. **配置** - 更新 settings.local.json
6. **文件** - 記錄用途和使用方式

完整檢查清單：[Hook 開發檢查清單](./06-development-checklist.md)

---

## 🔗 外部資源

- [Claude Code 官方 Hook 文件](https://docs.claude.com/en/docs/claude-code/hooks)
- [IndyDevDan Hook Mastery GitHub](https://github.com/disler/claude-code-hooks-mastery)
- [Astral UV 官方文件](https://docs.astral.sh/uv/)

---

## 💡 貢獻指南

當建立新的 Hook 時，請：

1. ✅ 遵循單一職責原則
2. ✅ 提供詳細的錯誤訊息
3. ✅ 記錄所有操作到日誌
4. ✅ 使用 `$CLAUDE_PROJECT_DIR` 環境變數
5. ✅ 建立對應的測試案例
6. ✅ 更新此目錄的文件

---

**文件版本**: v1.0
**最後更新**: 2025-10-09
**維護者**: rosemary-project-manager
