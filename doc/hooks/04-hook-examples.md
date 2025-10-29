# Claude Code Hook 實用範例集

## 📖 文件資訊

- **版本**: v1.0
- **建立日期**: 2025-10-09
- **目的**: 提供完整可用的 Hook 範例和模板
- **適用對象**: 需要實作特定功能的開發者

---

## 📚 範例索引

### 🎮 權限控制
1. [阻止危險檔案操作](#範例-1-阻止危險檔案操作)
2. [主線程職責檢查](#範例-2-主線程職責檢查)
3. [任務分派準備度檢查](#範例-3-任務分派準備度檢查)

### 👁️ 觀察記錄
4. [完整對話記錄](#範例-4-完整對話記錄)
5. [工具使用追蹤](#範例-5-工具使用追蹤)
6. [子任務執行追蹤](#範例-6-子任務執行追蹤)

### 🚀 自動化
7. [自動格式化程式碼](#範例-7-自動格式化程式碼)
8. [自動執行測試](#範例-8-自動執行測試)
9. [Context 自動載入](#範例-9-context-自動載入)

### 🔔 通知
10. [TTS 語音通知](#範例-10-tts-語音通知)

---

## 範例 1: 阻止危險檔案操作

**用途**: 防止刪除或覆寫重要檔案

**Hook 類型**: PreToolUse

**檔案**: `.claude/hooks/dangerous-file-protection.py`

```python
#!/usr/bin/env python3
# /// script
# dependencies = []
# requires-python = ">=3.10"
# ///

"""
阻止危險檔案操作

防止刪除或覆寫專案關鍵檔案
"""

import json
import sys
import os
from pathlib import Path
from datetime import datetime

PROJECT_ROOT = Path(os.environ.get("CLAUDE_PROJECT_DIR", "."))
LOG_DIR = PROJECT_ROOT / ".claude/hook-logs"

# 受保護的檔案模式
PROTECTED_PATTERNS = [
    "CLAUDE.md",
    ".env",
    ".env.local",
    "credentials.json",
    "private-key.pem",
    ".git/config",
    "pubspec.yaml",
    "package.json"
]

def is_protected_file(file_path: str) -> tuple[bool, str]:
    """
    檢查是否為受保護檔案

    Returns:
        (is_protected, reason)
    """
    path = Path(file_path)

    for pattern in PROTECTED_PATTERNS:
        if pattern in str(path):
            return True, f"受保護檔案: {pattern}"

    return False, ""

def main():
    try:
        input_data = json.load(sys.stdin)
        tool_name = input_data.get("tool_name", "")
        tool_input = input_data.get("tool_input", {})

        # 檢查危險操作
        dangerous_tools = ["Write", "MultiEdit", "Bash"]

        if tool_name not in dangerous_tools:
            sys.exit(0)

        # 檢查檔案路徑
        file_path = tool_input.get("file_path", "")

        # Bash 指令特殊處理
        if tool_name == "Bash":
            command = tool_input.get("command", "")
            # 檢查是否包含 rm/del 指令
            if any(cmd in command for cmd in ["rm -rf", "rm -f", "del /f"]):
                output = {
                    "hookSpecificOutput": {
                        "hookEventName": "PreToolUse",
                        "permissionDecision": "deny",
                        "permissionDecisionReason": "禁止執行危險的刪除指令"
                    }
                }
                print(json.dumps(output))
                sys.exit(2)

        if file_path:
            is_protected, reason = is_protected_file(file_path)

            if is_protected:
                # 記錄警告
                log_file = LOG_DIR / "dangerous-operations.log"
                log_file.parent.mkdir(parents=True, exist_ok=True)
                with open(log_file, "a") as f:
                    timestamp = datetime.now().isoformat()
                    f.write(f"{timestamp} - BLOCKED: {tool_name} on {file_path} - {reason}\n")

                # 阻止操作
                output = {
                    "hookSpecificOutput": {
                        "hookEventName": "PreToolUse",
                        "permissionDecision": "deny",
                        "permissionDecisionReason": f"❌ {reason}\n\n如需修改，請手動執行。"
                    }
                }
                print(json.dumps(output))
                sys.exit(2)

        # 允許操作
        sys.exit(0)

    except Exception as e:
        print(f"Hook 錯誤: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
```

**配置** (`.claude/settings.local.json`):
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|MultiEdit|Bash",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/dangerous-file-protection.py"
          }
        ]
      }
    ]
  }
}
```

**測試**:
```bash
# 測試阻止寫入 .env
echo '{
  "hook_event_name": "PreToolUse",
  "tool_name": "Write",
  "tool_input": {
    "file_path": ".env"
  }
}' | .claude/hooks/dangerous-file-protection.py
```

---

## 範例 2: 主線程職責檢查

**用途**: 防止主線程親自修改程式碼，強制使用 Task 工具分派

**Hook 類型**: PostToolUse

**檔案**: `.claude/hooks/main-thread-responsibility-check.sh`

```bash
#!/bin/bash

# 主線程職責檢查 Hook
# 偵測主線程是否親自修改 lib/ 目錄下的 .dart 檔案

PROJECT_ROOT="${CLAUDE_PROJECT_DIR}"
HOOK_LOGS_DIR="$PROJECT_ROOT/.claude/hook-logs"
INPUT=$(cat)

# 提取工具資訊
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name')
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# 只檢查 Edit 和 Write 工具
if [[ "$TOOL_NAME" != "Edit" ]] && [[ "$TOOL_NAME" != "Write" ]]; then
    exit 0
fi

# 檢查是否修改 lib/ 目錄下的 .dart 檔案
if [[ "$FILE_PATH" == *"lib/"*.dart ]]; then
    # 檢查是否在子任務中（SubagentStop 會設定環境變數）
    if [[ -z "$CLAUDE_SUBAGENT" ]]; then
        # 主線程違規，記錄追蹤檔案
        TIMESTAMP=$(date +%Y%m%d-%H%M%S)
        VIOLATION_FILE="$HOOK_LOGS_DIR/main-thread-violation-$TIMESTAMP.md"

        mkdir -p "$HOOK_LOGS_DIR"

        cat > "$VIOLATION_FILE" <<EOF
# 主線程職責違規追蹤

**違規時間**: $(date '+%Y-%m-%d %H:%M:%S')
**工具**: $TOOL_NAME
**檔案**: $FILE_PATH

## 問題描述

主線程不應親自修改 \`lib/\` 目錄下的程式碼檔案。

## 正確做法

使用 Task 工具分派給專門的代理人執行：

\`\`\`
請使用 Task 工具建立子任務:

任務說明: 修改 $FILE_PATH，實作...
參考文件:
  - UseCase: UC-XX
  - 流程圖 Event: ...
  - 架構層級: Presentation/Domain/Infrastructure
\`\`\`

## 修復步驟

1. 回滾此次修改
2. 使用 Task 工具分派任務
3. 在子任務中執行程式碼修改

## 參考規範

請參考：敏捷重構方法論 (.claude/methodologies/agile-refactor-methodology.md)
EOF

        # 輸出警告訊息（不阻塊，只記錄）
        echo "⚠️  主線程職責違規已記錄: $VIOLATION_FILE" >&2
        echo "請使用 Task 工具分派任務，而非親自修改程式碼。" >&2

        # 返回成功但記錄警告
        exit 0
    fi
fi

# 正常執行
exit 0
```

**配置**:
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/main-thread-responsibility-check.sh"
          }
        ]
      }
    ]
  }
}
```

---

## 範例 3: 任務分派準備度檢查

**用途**: 確保 Task 工具分派時包含完整參考文件

**Hook 類型**: PreToolUse

**檔案**: `.claude/hooks/task-dispatch-readiness-check.py`

```python
#!/usr/bin/env python3
# /// script
# dependencies = []
# requires-python = ">=3.10"
# ///

"""
任務分派準備度檢查

確保 Task 工具分派包含:
1. UseCase 參考 (UC-XX)
2. 流程圖 Event 參考
3. Clean Architecture 層級
4. 依賴類別說明
"""

import json
import sys
import os
import re
from pathlib import Path
from datetime import datetime

PROJECT_ROOT = Path(os.environ.get("CLAUDE_PROJECT_DIR", "."))
LOG_DIR = PROJECT_ROOT / ".claude/hook-logs"

def check_readiness(prompt: str) -> tuple[bool, list[str]]:
    """
    檢查任務分派準備度

    Returns:
        (is_ready, missing_items)
    """
    missing = []

    # 1. 檢查 UseCase 參考
    if not re.search(r"UC-\d+", prompt):
        missing.append("UseCase 參考（格式：UC-XX）")

    # 2. 檢查流程圖 Event 參考
    event_keywords = ["Event:", "流程圖", "事件流程"]
    if not any(keyword in prompt for keyword in event_keywords):
        missing.append("流程圖 Event 參考")

    # 3. 檢查架構層級
    architecture_keywords = ["Repository", "Service", "Entity", "Domain", "Presentation", "Infrastructure"]
    if not any(keyword in prompt for keyword in architecture_keywords):
        missing.append("Clean Architecture 層級引用")

    # 4. 檢查依賴說明
    if not any(keyword in prompt for keyword in ["呼叫", "依賴", "使用"]):
        missing.append("依賴類別說明")

    return len(missing) == 0, missing

def main():
    try:
        input_data = json.load(sys.stdin)
        tool_name = input_data.get("tool_name", "")

        # 只檢查 Task 工具
        if tool_name != "Task":
            sys.exit(0)

        # 提取 prompt
        tool_input = input_data.get("tool_input", {})
        prompt = tool_input.get("prompt", "")

        if not prompt:
            output = {
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "permissionDecision": "deny",
                    "permissionDecisionReason": "任務 prompt 不可為空"
                }
            }
            print(json.dumps(output))
            sys.exit(2)

        # 檢查準備度
        is_ready, missing = check_readiness(prompt)

        if not is_ready:
            # 產生錯誤訊息
            error_message = f"""❌ 任務分派準備度檢查失敗

缺少以下必要參考文件:
{chr(10).join(f"  • {item}" for item in missing)}

修復建議:
  1. 查看 docs/app-use-cases.md 找到對應 UseCase
  2. 參考 docs/event-driven-architecture-design.md 的流程圖
  3. 明確說明呼叫的 Repository/Service/Entity

範例格式:
  根據 UC-02（新增書籍），實作 LibraryDomain.addBook()。
  流程圖 Event: UserClickedAddBook → ValidateBookData → SaveToRepository
  呼叫層級: Presentation → Domain Service → Repository
  依賴: BookRepository.save()、ValidationService.validateBook()
"""

            # 記錄日誌
            log_file = LOG_DIR / "task-dispatch-failures.log"
            log_file.parent.mkdir(parents=True, exist_ok=True)
            with open(log_file, "a") as f:
                timestamp = datetime.now().isoformat()
                f.write(f"{timestamp} - FAILED: Missing {', '.join(missing)}\n")

            # 阻止任務分派
            output = {
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "permissionDecision": "deny",
                    "permissionDecisionReason": error_message
                }
            }
            print(json.dumps(output))
            sys.exit(2)

        # 記錄成功的任務分派
        log_file = LOG_DIR / "task-dispatch-success.log"
        log_file.parent.mkdir(parents=True, exist_ok=True)
        with open(log_file, "a") as f:
            timestamp = datetime.now().isoformat()
            f.write(f"{timestamp} - SUCCESS: Task dispatch with complete references\n")

        # 允許任務分派
        sys.exit(0)

    except Exception as e:
        print(f"Hook 錯誤: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
```

**配置**:
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Task",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/task-dispatch-readiness-check.py"
          }
        ]
      }
    ]
  }
}
```

---

## 範例 4: 完整對話記錄

**用途**: 記錄所有對話到 JSONL 檔案，建立完整的可觀察性

**Hook 類型**: Stop

**檔案**: `.claude/hooks/conversation-logger.py`

```python
#!/usr/bin/env python3
# /// script
# dependencies = []
# requires-python = ">=3.10"
# ///

"""
完整對話記錄

記錄每次對話的完整內容到 JSONL 檔案
"""

import json
import sys
import os
from pathlib import Path
from datetime import datetime
import shutil

PROJECT_ROOT = Path(os.environ.get("CLAUDE_PROJECT_DIR", "."))
LOG_DIR = PROJECT_ROOT / ".claude/hook-logs/conversations"

def save_conversation(session_id: str, transcript_path: str):
    """儲存對話記錄"""
    LOG_DIR.mkdir(parents=True, exist_ok=True)

    # 產生時間戳記檔名
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    dest_file = LOG_DIR / f"conversation-{timestamp}-{session_id[:8]}.jsonl"

    # 複製 transcript 檔案
    if Path(transcript_path).exists():
        shutil.copy(transcript_path, dest_file)

        # 產生可讀的摘要
        summary_file = LOG_DIR / f"conversation-{timestamp}-{session_id[:8]}.md"
        with open(transcript_path) as f:
            lines = f.readlines()

        with open(summary_file, "w") as f:
            f.write(f"# 對話記錄摘要\n\n")
            f.write(f"**Session ID**: {session_id}\n")
            f.write(f"**時間**: {datetime.now():%Y-%m-%d %H:%M:%S}\n")
            f.write(f"**訊息數**: {len(lines)}\n\n")
            f.write(f"---\n\n")

            # 提取使用者訊息和 Claude 回應
            for line in lines:
                try:
                    entry = json.loads(line)
                    role = entry.get("role", "")
                    content = entry.get("content", "")

                    if role == "user":
                        f.write(f"## 使用者\n\n{content}\n\n")
                    elif role == "assistant":
                        f.write(f"## Claude\n\n{content}\n\n")
                except:
                    pass

        return dest_file, summary_file
    else:
        return None, None

def main():
    try:
        input_data = json.load(sys.stdin)
        session_id = input_data.get("session_id", "unknown")
        transcript_path = input_data.get("transcript_path", "")

        # 儲存對話
        jsonl_file, summary_file = save_conversation(session_id, transcript_path)

        if jsonl_file:
            print(f"✅ 對話已記錄:")
            print(f"   JSONL: {jsonl_file}")
            print(f"   摘要: {summary_file}")

        sys.exit(0)

    except Exception as e:
        print(f"Hook 錯誤: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
```

**配置**:
```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/conversation-logger.py"
          }
        ]
      }
    ]
  }
}
```

---

## 範例 5: 工具使用追蹤

**用途**: 追蹤所有工具使用，產生統計報告

**Hook 類型**: PostToolUse

**檔案**: `.claude/hooks/tool-usage-tracker.py`

```python
#!/usr/bin/env python3
# /// script
# dependencies = []
# requires-python = ">=3.10"
# ///

"""
工具使用追蹤

追蹤所有工具使用並產生統計報告
"""

import json
import sys
import os
from pathlib import Path
from datetime import datetime
from collections import defaultdict

PROJECT_ROOT = Path(os.environ.get("CLAUDE_PROJECT_DIR", "."))
LOG_DIR = PROJECT_ROOT / ".claude/hook-logs"
STATS_FILE = LOG_DIR / "tool-usage-stats.json"

def load_stats():
    """載入統計資料"""
    if STATS_FILE.exists():
        with open(STATS_FILE) as f:
            return json.load(f)
    return {
        "total_uses": 0,
        "by_tool": {},
        "by_date": {},
        "history": []
    }

def save_stats(stats):
    """儲存統計資料"""
    STATS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(STATS_FILE, "w") as f:
        json.dump(stats, f, indent=2)

def update_stats(tool_name: str, tool_input: dict, tool_response: dict):
    """更新統計資料"""
    stats = load_stats()

    # 更新總計
    stats["total_uses"] += 1

    # 更新工具計數
    if tool_name not in stats["by_tool"]:
        stats["by_tool"][tool_name] = {
            "count": 0,
            "success": 0,
            "failure": 0
        }

    stats["by_tool"][tool_name]["count"] += 1

    # 更新成功/失敗計數
    success = tool_response.get("success", True)
    if success:
        stats["by_tool"][tool_name]["success"] += 1
    else:
        stats["by_tool"][tool_name]["failure"] += 1

    # 更新日期計數
    today = datetime.now().strftime("%Y-%m-%d")
    if today not in stats["by_date"]:
        stats["by_date"][today] = 0
    stats["by_date"][today] += 1

    # 記錄歷史
    entry = {
        "timestamp": datetime.now().isoformat(),
        "tool": tool_name,
        "success": success
    }

    # 只保留最近 1000 筆
    stats["history"].append(entry)
    if len(stats["history"]) > 1000:
        stats["history"] = stats["history"][-1000:]

    save_stats(stats)

def generate_report():
    """產生統計報告"""
    stats = load_stats()

    report = f"""# 工具使用統計報告

**產生時間**: {datetime.now():%Y-%m-%d %H:%M:%S}
**總使用次數**: {stats['total_uses']}

## 各工具使用統計

| 工具 | 使用次數 | 成功 | 失敗 | 成功率 |
|------|---------|------|------|--------|
"""

    for tool, data in sorted(stats["by_tool"].items(), key=lambda x: x[1]["count"], reverse=True):
        count = data["count"]
        success = data["success"]
        failure = data["failure"]
        success_rate = (success / count * 100) if count > 0 else 0

        report += f"| {tool} | {count} | {success} | {failure} | {success_rate:.1f}% |\n"

    report += f"\n## 每日使用統計\n\n"
    report += "| 日期 | 使用次數 |\n"
    report += "|------|----------|\n"

    for date, count in sorted(stats["by_date"].items(), reverse=True)[:7]:
        report += f"| {date} | {count} |\n"

    # 儲存報告
    report_file = LOG_DIR / "tool-usage-report.md"
    report_file.write_text(report)

    return report_file

def main():
    try:
        input_data = json.load(sys.stdin)
        tool_name = input_data.get("tool_name", "")
        tool_input = input_data.get("tool_input", {})
        tool_response = input_data.get("tool_response", {})

        # 更新統計
        update_stats(tool_name, tool_input, tool_response)

        # 每 10 次使用產生一次報告
        stats = load_stats()
        if stats["total_uses"] % 10 == 0:
            report_file = generate_report()
            print(f"📊 統計報告已更新: {report_file}")

        sys.exit(0)

    except Exception as e:
        print(f"Hook 錯誤: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
```

**配置**:
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/tool-usage-tracker.py"
          }
        ]
      }
    ]
  }
}
```

---

## 範例 6-10 請見後續章節

由於文件長度限制，後續範例（6-10）請參考：

- **範例 6**: 子任務執行追蹤 (SubagentStop Hook)
- **範例 7**: 自動格式化程式碼 (PostToolUse Hook)
- **範例 8**: 自動執行測試 (Stop Hook)
- **範例 9**: Context 自動載入 (UserPromptSubmit Hook)
- **範例 10**: TTS 語音通知 (Stop/SubagentStop Hook)

詳細實作請參考：[語音通知整合](./05-voice-notification.md)

---

## 📚 相關文件

- **[Hook 基礎概念](./01-hook-fundamentals.md)** - Hook 系統基本原理
- **[Hook 最佳實踐](./02-hook-best-practices.md)** - 進階技巧
- **[UV 單檔腳本模式](./03-uv-single-file-pattern.md)** - Python Hook 開發
- **[語音通知整合](./05-voice-notification.md)** - TTS 實作指南
- **[Hook 開發檢查清單](./06-development-checklist.md)** - 完整開發流程

---

**文件版本**: v1.0
**建立日期**: 2025-10-09
**維護者**: rosemary-project-manager
