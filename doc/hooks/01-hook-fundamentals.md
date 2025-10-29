# Claude Code Hook 基礎概念

## 📖 文件資訊

- **版本**: v1.0
- **建立日期**: 2025-10-09
- **目的**: 完整介紹 Claude Code Hook 系統的基礎概念
- **適用對象**: 所有想使用 Hook 系統的開發者

---

## 🎯 什麼是 Hook

Hook 是 Claude Code 提供的**生命週期鉤子**，讓你在特定時機執行自定義邏輯，實現更精細的控制和自動化。

> "Claude Code is a new engineering primitive... It's the first programmable agentic coding tool."
>
> — IndyDevDan, Hooked on Claude Code Hooks

### Hook 的本質

Hook 本質上是一個**事件觸發機制**：

```text
Claude Code 事件 → 觸發 Hook → 執行自定義腳本 → 影響 Claude 行為
```

---

## 🌟 為什麼使用 Hook

Hook 系統提供 4 大核心能力：

### 1. 🎮 控制 (Control)

阻止不安全或不符合規範的操作：

- 禁止刪除重要檔案
- 阻止不當的程式碼修改
- 強制執行開發流程

**範例**：阻止主線程親自修改程式碼，強制使用 Task 工具分派

### 2. 👁️ 觀察 (Observe)

記錄所有活動，建立完整的可觀察性：

- 追蹤所有工具使用
- 記錄完整對話歷史
- 統計任務執行資訊

**範例**：自動記錄所有 Edit/Write 操作到日誌

### 3. 🔔 通知 (Notify)

在關鍵時刻提醒使用者：

- 長時間任務完成通知
- 子任務並行完成提醒
- 錯誤警報

**範例**：使用 TTS 語音提示任務完成

### 4. 🚀 自動化 (Automate)

自動執行重複任務：

- 自動格式化程式碼
- 自動執行測試
- 自動更新文件

**範例**：PostToolUse 自動執行 `flutter format`

---

## 🔧 9 種 Hook 類型

Claude Code 提供 9 種 Hook 事件，涵蓋 Session 生命週期的所有關鍵時刻。

### 1️⃣ SessionStart - Session 啟動時

**觸發時機**: Claude Code Session 啟動時（每次對話開始）

**主要用途**:
- 載入初始 context（專案規範、需求文件）
- 檢查環境狀態
- 初始化日誌記錄

**是否有 Matcher**: ❌ 否（所有 Session 啟動都會觸發）

**JSON 輸入範例**:
```json
{
  "session_id": "abc123",
  "transcript_path": "~/.claude/projects/.../transcript.jsonl",
  "hook_event_name": "SessionStart",
  "source": "startup"
}
```

**輸出格式**:
```json
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "載入到 context 的內容"
  }
}
```

### 2️⃣ SessionEnd - Session 結束時

**觸發時機**: Session 正常結束或使用者退出時

**主要用途**:
- 清理臨時檔案
- 儲存 Session 統計資訊
- 產生 Session 摘要報告

**是否有 Matcher**: ❌ 否

### 3️⃣ UserPromptSubmit - 使用者提交 Prompt

**觸發時機**: 使用者提交 prompt（Enter/Send）前

**主要用途**:
- 注入額外 context（自動載入規格文件）
- Prompt 合規性檢查
- 5W1H 決策框架驗證

**是否有 Matcher**: ❌ 否

**JSON 輸入範例**:
```json
{
  "session_id": "abc123",
  "transcript_path": "/Users/.../transcript.jsonl",
  "cwd": "/Users/...",
  "hook_event_name": "UserPromptSubmit",
  "prompt": "Write a function to calculate factorial"
}
```

**控制 Prompt 處理**:
```json
{
  "decision": "block",  // 阻止 prompt 處理
  "reason": "Prompt 不符合 5W1H 決策框架",
  "hookSpecificOutput": {
    "hookEventName": "UserPromptSubmit",
    "additionalContext": "如果不阻止，加入的額外 context"
  }
}
```

**重要**: `decision: "block"` 會阻止 prompt 並清除輸入

### 4️⃣ PreToolUse - 工具執行前

**觸發時機**: Claude 嘗試執行任何工具（Read/Write/Edit/Bash/Task）前

**主要用途**:
- **權限控制** - 阻止危險操作
- **參數驗證** - 檢查工具參數是否合理
- **準備度檢查** - 確保執行條件完備

**是否有 Matcher**: ✅ 是（可針對特定工具）

**JSON 輸入範例**:
```json
{
  "session_id": "abc123",
  "transcript_path": "/Users/.../transcript.jsonl",
  "cwd": "/Users/...",
  "hook_event_name": "PreToolUse",
  "tool_name": "Write",
  "tool_input": {
    "file_path": "/path/to/file.txt",
    "content": "file content"
  }
}
```

**權限決策格式**:
```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",  // "allow" | "deny" | "ask"
    "permissionDecisionReason": "無法寫入 .env 檔案"
  }
}
```

**3 種決策類型**:
- **allow**: 直接允許，繞過權限檢查
- **deny**: 完全阻止執行
- **ask**: 要求使用者確認

### 5️⃣ PostToolUse - 工具執行後

**觸發時機**: 工具執行完成後（無論成功或失敗）

**主要用途**:
- 日誌記錄（追蹤所有工具使用）
- 後處理（自動格式化程式碼）
- 結果驗證（檢查執行結果）

**是否有 Matcher**: ✅ 是

**JSON 輸入範例**:
```json
{
  "session_id": "abc123",
  "transcript_path": "/Users/.../transcript.jsonl",
  "cwd": "/Users/...",
  "hook_event_name": "PostToolUse",
  "tool_name": "Write",
  "tool_input": {
    "file_path": "/path/to/file.txt",
    "content": "file content"
  },
  "tool_response": {
    "filePath": "/path/to/file.txt",
    "success": true
  }
}
```

**回饋控制**:
```json
{
  "decision": "block",  // 通知錯誤（工具已執行）
  "reason": "格式化失敗",
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse",
    "additionalContext": "給 Claude 的額外資訊"
  }
}
```

**重要**: PostToolUse 的 `decision: "block"` 不會回滾已執行的工具，只是回饋 stderr 給 Claude

### 6️⃣ Stop - Claude 嘗試停止時

**觸發時機**: Claude 認為任務完成，準備停止響應時

**主要用途**:
- 防止過早停止（任務未完成）
- 對話記錄（儲存完整對話）
- 完成通知（語音提示）

**是否有 Matcher**: ❌ 否

**控制停止行為**:
```json
{
  "decision": "block",  // 阻止停止，繼續執行
  "reason": "測試尚未通過，請修正錯誤"
}
```

### 7️⃣ SubagentStop - Subagent 停止時

**觸發時機**: Task 工具建立的子任務完成時

**主要用途**:
- 子任務追蹤
- 並行任務管理
- 子任務完成通知

**是否有 Matcher**: ❌ 否

**控制子任務完成**:
```json
{
  "decision": "block",  // 要求子任務繼續
  "reason": "請更新文件後再完成"
}
```

### 8️⃣ PreCompact - Context 壓縮前

**觸發時機**: Context 即將被壓縮（超過 token 限制）前

**主要用途**:
- 備份完整 context
- 標記重要資訊（防止被壓縮）
- Context 使用統計

**是否有 Matcher**: ❌ 否

### 9️⃣ Notification - 通知事件

**觸發時機**: 需要使用者輸入或權限確認時

**主要用途**:
- 權限請求處理
- 自動批准特定操作
- 記錄權限請求

**是否有 Matcher**: ❌ 否

---

## 📊 Hook 類型對照表

| Hook 事件 | 觸發時機 | Matcher | 主要用途 | 可阻止 |
|----------|---------|---------|---------|--------|
| **SessionStart** | Session 啟動 | ❌ | Context 載入 | ❌ |
| **SessionEnd** | Session 結束 | ❌ | 清理、摘要 | ❌ |
| **UserPromptSubmit** | Prompt 提交 | ❌ | Context 注入、合規檢查 | ✅ |
| **PreToolUse** | 工具執行前 | ✅ | 權限控制、驗證 | ✅ |
| **PostToolUse** | 工具執行後 | ✅ | 日誌、後處理 | ❌* |
| **Stop** | Claude 停止前 | ❌ | 防止過早停止 | ✅ |
| **SubagentStop** | 子任務停止前 | ❌ | 子任務追蹤 | ✅ |
| **PreCompact** | Context 壓縮前 | ❌ | Context 備份 | ❌ |
| **Notification** | 權限請求 | ❌ | 權限自動處理 | ❌ |

**註**: PostToolUse 的 `decision: "block"` 不會回滾工具，只回饋錯誤給 Claude

---

## 📤 Hook 輸出格式

Hook 腳本有兩種方式影響 Claude 行為：**Exit Code** 或 **JSON 輸出**

### 方式 1: Exit Code（簡單方式）

最簡單的控制方式，適合大多數情況。

| Exit Code | 行為 | stdout | stderr | 適用場景 |
|----------|------|--------|--------|---------|
| **0** | 成功 | 顯示給用戶/Claude | - | 正常執行，可選輸出 |
| **2** | 阻塊錯誤 | - | 回饋給 Claude 處理 | 阻止操作並讓 Claude 處理 |
| **其他** | 非阻塊錯誤 | - | 顯示給用戶 | 記錄錯誤但繼續執行 |

**Exit Code 2 的行為（依 Hook 類型而異）**:

- **PreToolUse**: 完全阻止工具執行，stderr 回饋給 Claude
- **PostToolUse**: 工具已執行，只回饋 stderr 給 Claude
- **UserPromptSubmit**: 阻止 prompt 處理，清除使用者輸入
- **Stop/SubagentStop**: 防止停止，stderr 作為繼續的指引

**範例 - 使用 Exit Code 阻止操作**:

```bash
#!/bin/bash

# 阻止刪除重要檔案
if [[ "$FILE_PATH" == "CLAUDE.md" ]]; then
    echo "錯誤: 無法刪除 CLAUDE.md" >&2
    exit 2  # 阻塊
fi

# 正常允許
exit 0
```

### 方式 2: JSON 輸出（進階方式）

更精細的控制，支援 Hook 特定的決策格式。

#### PreToolUse 權限決策

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "無法寫入 .env 檔案"
  }
}
```

**permissionDecision 選項**:
- `"allow"` - 直接允許，繞過權限檢查
- `"deny"` - 完全阻止執行
- `"ask"` - 要求使用者確認

#### PostToolUse 回饋控制

```json
{
  "decision": "block",  // 可選，通知錯誤
  "reason": "格式化失敗",
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse",
    "additionalContext": "格式化輸出:\n..."
  }
}
```

#### UserPromptSubmit Context 注入

```json
{
  "decision": "block",  // 可選，阻止 prompt
  "reason": "不符合 5W1H 框架",
  "hookSpecificOutput": {
    "hookEventName": "UserPromptSubmit",
    "additionalContext": "自動載入的規格文件內容..."
  }
}
```

#### SessionStart Context 載入

```json
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "專案規範:\n- 使用 TDD 流程\n- 遵循 Clean Architecture"
  }
}
```

**重要**: 多個 Hook 的 `additionalContext` 會串接

#### Stop/SubagentStop 停止控制

```json
{
  "decision": "block",  // 防止停止
  "reason": "測試未通過，請修正以下錯誤:\n- ..."
}
```

**重要**: `reason` 是必填的，告訴 Claude 如何繼續

### 通用欄位（所有 Hook）

```json
{
  "continue": true,              // 是否繼續（預設 true）
  "stopReason": "string",        // continue=false 時的原因
  "suppressOutput": true,        // 隱藏 stdout（transcript mode）
  "systemMessage": "string"      // 可選的警告訊息
}
```

---

## 🎯 Matcher 語法

Matcher 用於 **PreToolUse** 和 **PostToolUse**，指定 Hook 只針對特定工具觸發。

### 單一工具

```json
"matcher": "Write"
```

只匹配 `Write` 工具。

### 多個工具（OR）

```json
"matcher": "Write|Edit|MultiEdit"
```

匹配 `Write`、`Edit` 或 `MultiEdit` 任一工具。

### Bash 指令模式

```json
"matcher": "Bash"
```

匹配所有 `Bash` 工具呼叫。

**進階 Bash 匹配**:
```json
"matcher": "Bash.*git commit"
```

只匹配執行 `git commit` 的 Bash 指令。

### MCP 工具模式

```json
"matcher": "mcp__memory__.*"
```

匹配所有 `mcp__memory__` 開頭的 MCP 工具。

```json
"matcher": "mcp__.*__write.*"
```

匹配所有包含 `write` 的 MCP 工具。

### Regex 模式

Matcher 支援 Regex（正規表示式）:

```json
"matcher": "(Read|Write|Edit)"
```

等同於 `"Read|Write|Edit"`。

---

## ⚙️ Hook 配置標準

所有 Hook 配置都在 `.claude/settings.local.json` 檔案中。

### 標準配置格式

```json
{
  "hooks": {
    "EventName": [
      {
        "matcher": "ToolPattern",  // 可選，只用於 Tool 相關事件
        "hooks": [
          {
            "type": "command",
            "command": "your-command-here",
            "timeout": 60000  // 可選，預設 60 秒
          }
        ]
      }
    ]
  }
}
```

### 範例 1: PreToolUse 權限控制

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Task",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/task-readiness-check.py"
          }
        ]
      }
    ]
  }
}
```

### 範例 2: PostToolUse 自動格式化

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/auto-format.sh",
            "timeout": 30000
          }
        ]
      }
    ]
  }
}
```

### 範例 3: UserPromptSubmit Context 注入

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/load-context.py"
          }
        ]
      }
    ]
  }
}
```

**注意**: UserPromptSubmit 沒有 matcher

### 環境變數使用

**重要**: 官方提供 `$CLAUDE_PROJECT_DIR` 環境變數指向專案根目錄

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/check-style.sh"
          }
        ]
      }
    ]
  }
}
```

**優點**:
- ✅ 不需要硬編碼路徑
- ✅ 腳本可跨專案重用
- ✅ 符合官方最佳實踐

---

## 🔧 Hook 腳本實作基礎

### Python 範例

```python
#!/usr/bin/env python3
import json
import sys

# 1. 從 stdin 讀取 JSON 輸入
try:
    input_data = json.load(sys.stdin)
except json.JSONDecodeError as e:
    print(f"Error: Invalid JSON input: {e}", file=sys.stderr)
    sys.exit(1)

# 2. 提取必要資訊
tool_name = input_data.get("tool_name", "")
tool_input = input_data.get("tool_input", {})

# 3. 執行檢查邏輯
if tool_name == "Write":
    file_path = tool_input.get("file_path", "")

    # 4a. 簡單方式：使用 exit code
    if file_path.endswith(".env"):
        print("Blocked: Cannot write to .env file", file=sys.stderr)
        sys.exit(2)  # 阻塊

    # 4b. 進階方式：使用 JSON 輸出
    if file_path.endswith((".md", ".txt")):
        output = {
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "allow",
                "permissionDecisionReason": "Documentation file auto-approved"
            },
            "suppressOutput": True
        }
        print(json.dumps(output))
        sys.exit(0)

# 5. 預設允許
sys.exit(0)
```

### Bash 範例

```bash
#!/bin/bash

# 1. 從 stdin 讀取 JSON 輸入（使用 jq）
INPUT=$(cat)

# 2. 提取資訊
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name')
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# 3. 執行檢查
if [[ "$TOOL_NAME" == "Write" ]] && [[ "$FILE_PATH" == *.dart ]]; then
    # 4. 執行格式化
    flutter format "$FILE_PATH" 2>&1

    if [ $? -eq 0 ]; then
        echo "✅ Formatted $FILE_PATH"
        exit 0
    else
        echo "❌ Format failed for $FILE_PATH" >&2
        exit 1  # 非阻塊錯誤
    fi
fi

# 5. 預設成功
exit 0
```

---

## 🚨 常見錯誤和最佳實踐

### ❌ 常見錯誤

1. **沒有 PostEdit Hook**
   - ❌ 錯誤: 尋找 `PostEdit` Hook
   - ✅ 正確: 使用 `PostToolUse` with matcher `Edit|Write|MultiEdit`

2. **手動定位專案根目錄**
   - ❌ 錯誤: `PROJECT_ROOT=$(cd "$(dirname "$0")/.." && pwd)`
   - ✅ 正確: `PROJECT_ROOT="$CLAUDE_PROJECT_DIR"`

3. **不處理 JSON 輸入**
   - ❌ 錯誤: 直接執行邏輯，不讀取 stdin
   - ✅ 正確: `input_data = json.load(sys.stdin)`

4. **錯誤的決策欄位**
   - ❌ 錯誤: PreToolUse 使用 `"decision": "block"`
   - ✅ 正確: 使用 `"permissionDecision": "deny"`

### ✅ 最佳實踐

1. **使用 `$CLAUDE_PROJECT_DIR`**
   ```bash
   PROJECT_ROOT="$CLAUDE_PROJECT_DIR"
   ```

2. **處理 JSON 輸入**
   ```python
   input_data = json.load(sys.stdin)
   ```

3. **使用正確的決策格式**
   ```json
   {
     "hookSpecificOutput": {
       "hookEventName": "PreToolUse",
       "permissionDecision": "deny"
     }
   }
   ```

4. **設定合理的 timeout**
   ```json
   {
     "type": "command",
     "command": "long-running-script.sh",
     "timeout": 120000  // 2 分鐘
   }
   ```

5. **使用 Exit Code 2 阻塊**
   ```bash
   if [ condition ]; then
       echo "Error message" >&2
       exit 2  # 阻塊並回饋給 Claude
   fi
   ```

6. **記錄所有操作**
   ```python
   with open(f"{PROJECT_ROOT}/.claude/hook-logs/my-hook.log", "a") as f:
       f.write(f"{timestamp}: {action}\n")
   ```

---

## 🔍 除錯方法

### 啟用 Debug 模式

```bash
claude --debug
```

啟用後，所有 Hook 執行細節都會記錄到 debug log。

### 檢查 Debug Log

```bash
tail -f ~/.claude/debug.log
```

實時監控 Hook 執行狀況。

### Debug 輸出範例

```bash
[DEBUG] Executing hooks for PostToolUse:Write
[DEBUG] Getting matching hook commands for PostToolUse with query: Write
[DEBUG] Found 1 hook matchers in settings
[DEBUG] Matched 1 hooks for query "Write"
[DEBUG] Found 1 hook commands to execute
[DEBUG] Executing hook command: <Your command> with timeout 60000ms
[DEBUG] Hook command completed with status 0: <Your stdout>
```

### 手動測試 Hook

```bash
# 建立測試輸入
echo '{
  "hook_event_name": "PreToolUse",
  "tool_name": "Write",
  "tool_input": {
    "file_path": "test.txt"
  }
}' | .claude/hooks/my-hook.py

# 檢查 exit code
echo $?
```

---

## 📚 下一步

- **[Hook 最佳實踐](./02-hook-best-practices.md)** - 進階技巧和設計原則
- **[UV 單檔腳本模式](./03-uv-single-file-pattern.md)** - Python Hook 開發指南
- **[Hook 範例集](./04-hook-examples.md)** - 實用 Hook 範例
- **[Hook 開發檢查清單](./06-development-checklist.md)** - 完整開發流程

---

## 🔗 參考資料

- [Claude Code 官方 Hook 文件](https://docs.claude.com/en/docs/claude-code/hooks)
- [官方規範總結]($CLAUDE_PROJECT_DIR/.claude/hook-specs/claude-code-hooks-official-standards.md)
- [專案 Hook 實作總結](./project-hooks-summary.md)

---

**文件版本**: v1.0
**建立日期**: 2025-10-09
**維護者**: rosemary-project-manager
