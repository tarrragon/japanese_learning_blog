# Claude Code Hook 最佳實踐

## 📖 文件資訊

- **版本**: v1.0
- **建立日期**: 2025-10-09
- **基於**: IndyDevDan "Hooked on Claude Code Hooks" 影片見解
- **目的**: 提供 Hook 開發的進階技巧和設計原則

---

## 🌟 IndyDevDan 的 Hook 哲學

> "Observability is everything. How well you can observe, iterate, and improve your agentic system is going to be a massive differentiating factor for engineers."
>
> — IndyDevDan, Hooked on Claude Code Hooks

### 核心見解

1. **可觀察性至上** - 你無法改善你無法衡量的東西
2. **Hook 作為新工程原語** - Claude Code 是第一個可程式化的 AI 編碼工具
3. **單檔隔離原則** - UV 單檔腳本確保依賴隔離和可移植性
4. **語音回饋提升 UX** - TTS 通知讓長時間任務更友善
5. **並行子任務追蹤** - SubagentStop Hook 解鎖強大的並行工作流程

---

## 🎯 核心設計原則

### 1. 單一職責原則 (Single Responsibility)

每個 Hook 只做一件事，做好一件事。

#### ❌ 錯誤範例 - 多重職責

```python
#!/usr/bin/env python3
# 這個 Hook 做太多事了
import json
import sys

def main():
    input_data = json.load(sys.stdin)

    # 職責 1: 權限檢查
    if check_permission():
        pass

    # 職責 2: 格式化程式碼
    format_code()

    # 職責 3: 執行測試
    run_tests()

    # 職責 4: 更新文件
    update_docs()

if __name__ == "__main__":
    main()
```

#### ✅ 正確範例 - 單一職責

```python
#!/usr/bin/env python3
# 專注於一件事：權限檢查
import json
import sys

def main():
    input_data = json.load(sys.stdin)
    tool_name = input_data.get("tool_name")
    tool_input = input_data.get("tool_input", {})

    # 只做權限檢查
    if tool_name == "Write":
        file_path = tool_input.get("file_path", "")

        if file_path.endswith(".env"):
            output = {
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "permissionDecision": "deny",
                    "permissionDecisionReason": "無法寫入 .env 檔案"
                }
            }
            print(json.dumps(output))
            sys.exit(2)

    sys.exit(0)

if __name__ == "__main__":
    main()
```

**原則**：將不同職責分解為多個獨立的 Hook

---

### 2. 快速執行原則 (Fast Execution)

Hook 應該盡快執行，避免阻塞工作流程。

#### 效能指標

- ⚡ **理想**: < 100ms
- ✅ **良好**: 100ms - 500ms
- ⚠️ **可接受**: 500ms - 2s
- ❌ **過慢**: > 2s（需要優化或背景執行）

#### 優化策略

**策略 1: 快取機制**

```python
import json
import os
from pathlib import Path

CACHE_FILE = Path(os.environ["CLAUDE_PROJECT_DIR"]) / ".claude/cache/hook-cache.json"

def load_cache():
    if CACHE_FILE.exists():
        with open(CACHE_FILE) as f:
            return json.load(f)
    return {}

def save_cache(data):
    CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(CACHE_FILE, "w") as f:
        json.dump(data, f)
```

**策略 2: 延遲載入**

```python
# ❌ 錯誤：在模組層級載入大型依賴
import anthropic  # 啟動時就載入

# ✅ 正確：只在需要時載入
def use_anthropic_api():
    import anthropic  # 只在呼叫時載入
    client = anthropic.Client()
    return client
```

**策略 3: 背景任務**

```python
import subprocess

# 啟動背景任務，不等待結果
subprocess.Popen(
    ["python3", "long-running-task.py"],
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL
)
```

---

### 3. 詳細日誌原則 (Detailed Logging)

記錄所有關鍵資訊，建立完整的可觀察性。

#### 日誌層級

```python
import logging
from datetime import datetime

LOG_DIR = Path(os.environ["CLAUDE_PROJECT_DIR"]) / ".claude/hook-logs"
LOG_FILE = LOG_DIR / f"my-hook-{datetime.now():%Y%m%d}.log"

logging.basicConfig(
    filename=LOG_FILE,
    level=logging.DEBUG,
    format='%(asctime)s [%(levelname)s] %(message)s'
)

# DEBUG: 詳細除錯資訊
logging.debug(f"Received input: {input_data}")

# INFO: 一般操作記錄
logging.info(f"Processing tool: {tool_name}")

# WARNING: 潛在問題
logging.warning(f"File path contains spaces: {file_path}")

# ERROR: 錯誤狀況
logging.error(f"Permission denied: {file_path}")
```

#### 結構化日誌

```python
import json

def log_structured(event_type, data):
    """記錄結構化日誌，方便後續分析"""
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "event_type": event_type,
        "data": data
    }

    log_file = LOG_DIR / "structured-log.jsonl"
    with open(log_file, "a") as f:
        f.write(json.dumps(log_entry) + "\n")

# 使用範例
log_structured("permission_denied", {
    "tool": "Write",
    "file_path": "/path/to/.env",
    "reason": "sensitive_file"
})
```

---

### 4. 友善錯誤訊息原則 (Friendly Error Messages)

錯誤訊息應該清晰、具體、可操作。

#### ❌ 錯誤範例 - 模糊訊息

```python
print("Error", file=sys.stderr)
sys.exit(2)
```

#### ✅ 正確範例 - 詳細訊息

```python
error_message = f"""
❌ 任務分派準備度檢查失敗

缺少以下必要參考文件:
  • UseCase 參考（格式：UC-XX）
  • 流程圖 Event 參考
  • Clean Architecture 層級引用

修復建議:
  1. 查看 docs/app-use-cases.md 找到對應 UseCase
  2. 參考 docs/event-driven-architecture-design.md 的流程圖
  3. 明確說明呼叫的 Repository/Service/Entity

範例格式:
  根據 UC-02（新增書籍），實作 LibraryDomain.addBook()。
  流程圖 Event: UserClickedAddBook → ValidateBookData → SaveToRepository
  呼叫層級: Presentation → Domain Service → Repository
"""

print(error_message, file=sys.stderr)
sys.exit(2)
```

**關鍵要素**:
- 🎯 明確說明問題
- 📋 列出具體缺失
- 💡 提供修復建議
- 📖 給出範例格式

---

### 5. 修復模式機制 (Repair Mode)

當檢測到問題時，進入修復模式而非直接阻止。

#### 修復模式流程

```text
1. 檢測問題 → 記錄到追蹤檔案
2. 提供詳細修復指引
3. 允許使用者修正
4. 重新檢查
5. 問題解決後繼續
```

#### 實作範例

```python
def enter_repair_mode(issue_type, details):
    """進入修復模式"""
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    repair_file = LOG_DIR / f"repair-mode-{timestamp}.md"

    repair_content = f"""# 修復模式: {issue_type}

## 問題描述

{details["description"]}

## 修復步驟

{chr(10).join(f"{i+1}. {step}" for i, step in enumerate(details["steps"]))}

## 驗證方法

{details["verification"]}

## 完成後

執行以下指令標記修復完成:
```bash
$CLAUDE_PROJECT_DIR/.claude/scripts/repair-mode-complete.sh {timestamp}
```
"""

    repair_file.write_text(repair_content)

    # 同時記錄到問題追蹤
    issues_file = LOG_DIR / "issues-to-track.md"
    with open(issues_file, "a") as f:
        f.write(f"\n## {issue_type} - {timestamp}\n\n")
        f.write(details["description"] + "\n")
```python

---

### 6. 上下文分析原則 (Context Awareness)

Hook 應該理解上下文，區分計畫性行為和逃避行為。

#### 範例：逃避檢測

```python
def detect_avoidance_behavior(prompt):
    """檢測逃避行為"""

    # 可接受的計畫性表達
    acceptable_patterns = [
        r"v\d+\.\d+\.\d+ 階段",
        r"規劃於後續版本",
        r"列入下一個迭代",
        r"TDD Phase \d+ 實作",
        r"重構階段優化"
    ]

    # 不可容忍的逃避表達
    avoidance_patterns = [
        r"先將就",
        r"症狀緩解",
        r"不想處理",
        r"暫時跳過",
        r"簡化測試",
        r"降低.*標準"
    ]

    # 檢查上下文
    for pattern in acceptable_patterns:
        if re.search(pattern, prompt):
            return False  # 計畫性行為，允許

    for pattern in avoidance_patterns:
        if re.search(pattern, prompt):
            return True  # 逃避行為，阻止

    return False
```

---

### 7. 技術描述識別原則 (Technical Context)

區分程式碼片段中的技術術語和實際逃避行為。

```python
def is_technical_context(text, line_context):
    """判斷是否在技術上下文中"""

    # 技術上下文標記
    technical_markers = [
        "```",  # 程式碼區塊
        "eslint-disable",
        "TODO:",
        "FIXME:",
        "註解:",
        "// ",
        "# ",
        "範例:",
        "錯誤範例",
        "正確範例"
    ]

    for marker in technical_markers:
        if marker in line_context:
            return True

    return False
```

---

## 🛠 實用模式和技巧

### 模式 1: 階層式驗證

複雜驗證分階層執行，提早發現問題。

```python
def validate_task_dispatch(prompt):
    """階層式驗證任務分派"""

    # 第一層：基本格式檢查
    if not prompt or len(prompt) < 20:
        return False, "Prompt 太短，無法分派任務"

    # 第二層：必要元素檢查
    has_usecase = re.search(r"UC-\d+", prompt)
    has_architecture = any(term in prompt for term in ["Repository", "Service", "Entity"])

    if not has_usecase:
        return False, "缺少 UseCase 參考"

    if not has_architecture:
        return False, "缺少架構層級說明"

    # 第三層：語意分析
    if detect_avoidance_behavior(prompt):
        return False, "檢測到逃避行為"

    # 通過所有驗證
    return True, "驗證通過"
```

### 模式 2: 統計追蹤

追蹤 Hook 執行統計，建立可觀察性。

```python
def update_statistics(hook_name, result):
    """更新 Hook 統計資訊"""
    stats_file = LOG_DIR / "hook-statistics.json"

    # 載入現有統計
    if stats_file.exists():
        with open(stats_file) as f:
            stats = json.load(f)
    else:
        stats = {}

    # 初始化 Hook 統計
    if hook_name not in stats:
        stats[hook_name] = {
            "total_executions": 0,
            "allowed": 0,
            "denied": 0,
            "errors": 0
        }

    # 更新統計
    stats[hook_name]["total_executions"] += 1
    stats[hook_name][result] += 1

    # 儲存統計
    with open(stats_file, "w") as f:
        json.dump(stats, f, indent=2)
```

### 模式 3: 智慧快取失效

快取機制需要智慧失效策略。

```python
def is_cache_valid(cache_entry, dependency_files):
    """檢查快取是否有效"""
    cache_time = cache_entry.get("timestamp")

    # 檢查依賴檔案是否修改
    for dep_file in dependency_files:
        if not Path(dep_file).exists():
            return False

        file_mtime = Path(dep_file).stat().st_mtime
        if file_mtime > cache_time:
            return False  # 檔案已修改，快取失效

    return True
```

---

## 🎨 Hook 組合模式

### 組合 1: PreToolUse + PostToolUse

權限控制 + 結果驗證。

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/permission-check.py"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/format-and-validate.sh"
          }
        ]
      }
    ]
  }
}
```

### 組合 2: UserPromptSubmit + Stop

Context 注入 + 完成驗證。

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
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/completion-check.py"
          }
        ]
      }
    ]
  }
}
```

### 組合 3: SessionStart + SessionEnd

初始化 + 清理。

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/session-init.sh"
          }
        ]
      }
    ],
    "SessionEnd": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/session-cleanup.sh"
          }
        ]
      }
    ]
  }
}
```

---

## 🚨 常見陷阱和解決方案

### 陷阱 1: Hook 執行時間過長

**問題**: Hook 執行超過 timeout，導致失敗

**解決方案**:
```json
{
  "type": "command",
  "command": "long-running-task.sh",
  "timeout": 120000  // 增加到 2 分鐘
}
```

或使用背景執行：
```python
subprocess.Popen(["python3", "slow-task.py"])
sys.exit(0)  # 立即返回
```

### 陷阱 2: JSON 解析失敗

**問題**: Hook 無法正確解析 JSON 輸入

**解決方案**:
```python
import json
import sys

try:
    input_data = json.load(sys.stdin)
except json.JSONDecodeError as e:
    logging.error(f"JSON 解析失敗: {e}")
    print(f"錯誤: 無效的 JSON 輸入", file=sys.stderr)
    sys.exit(1)  # 非阻塊錯誤
```

### 陷阱 3: 環境變數未設定

**問題**: `$CLAUDE_PROJECT_DIR` 不存在

**解決方案**:
```python
import os
from pathlib import Path

# 優先使用官方環境變數
PROJECT_ROOT = os.environ.get("CLAUDE_PROJECT_DIR")

# Fallback: 手動定位
if not PROJECT_ROOT:
    current = Path(__file__).resolve()
    while current != current.parent:
        if (current / "CLAUDE.md").exists():
            PROJECT_ROOT = str(current)
            break
        current = current.parent

if not PROJECT_ROOT:
    print("錯誤: 無法定位專案根目錄", file=sys.stderr)
    sys.exit(1)
```

### 陷阱 4: 重複執行問題

**問題**: Hook 被多次觸發

**解決方案**:
```python
import hashlib

def generate_execution_id(input_data):
    """產生執行 ID，防止重複處理"""
    key = f"{input_data['tool_name']}:{input_data['tool_input']}"
    return hashlib.md5(key.encode()).hexdigest()

execution_id = generate_execution_id(input_data)
lock_file = LOG_DIR / f"lock-{execution_id}"

if lock_file.exists():
    # 已經在處理中，跳過
    sys.exit(0)

# 建立鎖定檔案
lock_file.touch()

try:
    # 執行 Hook 邏輯
    process_hook(input_data)
finally:
    # 清理鎖定檔案
    lock_file.unlink()
```

---

## 📊 效能最佳化

### 技巧 1: 延遲匯入

```python
# ❌ 慢：模組層級匯入
import anthropic
import openai
from rich import print

# ✅ 快：只在需要時匯入
def use_api():
    import anthropic
    return anthropic.Client()
```

### 技巧 2: 平行處理

```python
from concurrent.futures import ThreadPoolExecutor

def validate_multiple_files(files):
    """平行驗證多個檔案"""
    with ThreadPoolExecutor(max_workers=4) as executor:
        results = list(executor.map(validate_file, files))
    return all(results)
```

### 技巧 3: 記憶體管理

```python
# ❌ 慢：載入整個檔案
with open(large_file) as f:
    content = f.read()

# ✅ 快：逐行處理
with open(large_file) as f:
    for line in f:
        process_line(line)
```

---

## 🎯 Hook 品質檢查清單

開發 Hook 時，確保：

- [ ] ✅ 單一職責 - Hook 只做一件事
- [ ] ✅ 快速執行 - 執行時間 < 2 秒
- [ ] ✅ 詳細日誌 - 記錄所有關鍵操作
- [ ] ✅ 友善錯誤 - 提供清晰的錯誤訊息和修復建議
- [ ] ✅ 錯誤處理 - 妥善處理所有例外情況
- [ ] ✅ 使用官方環境變數 - `$CLAUDE_PROJECT_DIR`
- [ ] ✅ 正確的決策格式 - `hookSpecificOutput` 和 `permissionDecision`
- [ ] ✅ 合理的 timeout - 根據實際需求設定
- [ ] ✅ 統計追蹤 - 記錄執行統計資訊
- [ ] ✅ 測試驗證 - 建立測試案例驗證行為

---

## 📚 延伸閱讀

- **[Hook 基礎概念](./01-hook-fundamentals.md)** - Hook 系統基本原理
- **[UV 單檔腳本模式](./03-uv-single-file-pattern.md)** - Python Hook 開發指南
- **[Hook 範例集](./04-hook-examples.md)** - 實用 Hook 範例
- **[Hook 開發檢查清單](./06-development-checklist.md)** - 完整開發流程

---

## 🔗 參考資料

- [IndyDevDan: Hooked on Claude Code Hooks](https://www.youtube.com/watch?v=example)
- [Claude Code Hooks Mastery GitHub](https://github.com/disler/claude-code-hooks-mastery)
- [官方規範總結]($CLAUDE_PROJECT_DIR/.claude/hook-specs/claude-code-hooks-official-standards.md)

---

**文件版本**: v1.0
**建立日期**: 2025-10-09
**維護者**: rosemary-project-manager
**基於**: IndyDevDan "Hooked on Claude Code Hooks" 影片
