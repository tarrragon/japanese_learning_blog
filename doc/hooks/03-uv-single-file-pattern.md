# UV 單檔腳本模式 - Python Hook 開發指南

## 📖 文件資訊

- **版本**: v1.0
- **建立日期**: 2025-10-09
- **目的**: 介紹使用 Astral UV 建立獨立 Python Hook 腳本
- **適用對象**: 需要使用 Python 開發 Hook 的開發者

---

## 🌟 為什麼使用 UV 單檔模式

> "UV single-file patterns unlock true dependency isolation and portability for your hooks."
>
> — IndyDevDan, Hooked on Claude Code Hooks

### 傳統方式的問題

**❌ 傳統 Python 腳本**:
```python
#!/usr/bin/env python3
# 需要手動安裝依賴
import anthropic  # pip install anthropic
import rich      # pip install rich
```

**問題**:
- 😞 需要手動安裝依賴（`pip install`）
- 😞 依賴可能與其他專案衝突
- 😞 難以跨環境移植
- 😞 版本管理困難

### UV 單檔模式的優勢

**✅ UV 單檔腳本**:
```python
#!/usr/bin/env python3
# /// script
# dependencies = ["anthropic", "rich"]
# ///

import anthropic
import rich
```

**優點**:
- ✅ **自動依賴管理** - UV 自動安裝依賴
- ✅ **完全隔離** - 每個腳本獨立虛擬環境
- ✅ **高可移植性** - 單一檔案包含所有資訊
- ✅ **版本明確** - 可指定精確版本號
- ✅ **快速執行** - UV 啟動速度遠快於傳統 venv

---

## 🛠 UV 安裝和設定

### 安裝 UV

**macOS/Linux**:
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows**:
```bash
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

**驗證安裝**:
```bash
uv --version
# 輸出: uv 0.1.0 (example)
```

### UV 基本使用

```bash
# 執行單檔腳本（UV 自動管理依賴）
uv run my-hook.py

# 指定 Python 版本
uv run --python 3.11 my-hook.py

# 檢查腳本依賴
uv pip compile my-hook.py
```

---

## 📋 PEP 723 Inline Script Metadata

UV 單檔模式基於 **PEP 723** 標準，使用 inline metadata 定義依賴。

### 基本語法

```python
#!/usr/bin/env python3
# /// script
# dependencies = [
#     "anthropic>=0.20.0",
#     "rich>=13.0.0"
# ]
# requires-python = ">=3.10"
# ///

import anthropic
from rich import print
```

**關鍵要素**:
- 必須以 `# /// script` 開始
- 必須以 `# ///` 結束
- 每行開頭必須有 `#`
- 使用 TOML 格式定義 metadata

### Metadata 欄位

#### dependencies - 依賴套件

```python
# /// script
# dependencies = [
#     "anthropic",                    # 最新版本
#     "rich>=13.0.0",                 # 最低版本
#     "requests==2.31.0",             # 精確版本
#     "pydantic>=2.0.0,<3.0.0"       # 版本範圍
# ]
# ///
```

#### requires-python - Python 版本

```python
# /// script
# requires-python = ">=3.10"   # 最低 Python 版本
# ///
```

#### tool - 額外工具配置

```python
# /// script
# dependencies = ["ruff"]
# [tool.ruff]
# line-length = 100
# ///
```

---

## 🎯 Hook 腳本完整模板

### 模板 1: PreToolUse Hook

**用途**: 權限控制和參數驗證

```python
#!/usr/bin/env python3
# /// script
# dependencies = []
# requires-python = ">=3.10"
# ///

"""
PreToolUse Hook - 權限控制範例

用途: 阻止寫入敏感檔案
觸發: PreToolUse Hook (matcher: Write)
"""

import json
import sys
import os
from pathlib import Path
from datetime import datetime

# 專案根目錄
PROJECT_ROOT = Path(os.environ.get("CLAUDE_PROJECT_DIR", "."))
LOG_DIR = PROJECT_ROOT / ".claude/hook-logs"
LOG_FILE = LOG_DIR / f"permission-check-{datetime.now():%Y%m%d}.log"

def log_message(message: str):
    """記錄訊息到日誌"""
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    with open(LOG_FILE, "a") as f:
        timestamp = datetime.now().isoformat()
        f.write(f"{timestamp} - {message}\n")

def check_permission(file_path: str) -> tuple[bool, str]:
    """
    檢查檔案寫入權限

    Returns:
        (allowed, reason) - (是否允許, 原因說明)
    """
    # 敏感檔案列表
    sensitive_patterns = [
        ".env",
        ".env.local",
        "credentials.json",
        "private-key.pem"
    ]

    # 檢查檔案名稱
    filename = Path(file_path).name
    for pattern in sensitive_patterns:
        if pattern in filename:
            return False, f"無法寫入敏感檔案: {filename}"

    # 預設允許
    return True, "權限檢查通過"

def main():
    """主要邏輯"""
    try:
        # 1. 讀取 JSON 輸入
        input_data = json.load(sys.stdin)

        # 2. 提取工具資訊
        tool_name = input_data.get("tool_name", "")
        tool_input = input_data.get("tool_input", {})

        # 3. 只處理 Write 工具
        if tool_name != "Write":
            sys.exit(0)

        # 4. 檢查權限
        file_path = tool_input.get("file_path", "")
        allowed, reason = check_permission(file_path)

        # 5. 記錄日誌
        log_message(f"Permission check: {file_path} - {'ALLOWED' if allowed else 'DENIED'}")

        # 6. 輸出決策
        if not allowed:
            output = {
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "permissionDecision": "deny",
                    "permissionDecisionReason": reason
                }
            }
            print(json.dumps(output))
            sys.exit(2)  # 阻塊

        # 7. 允許執行
        sys.exit(0)

    except Exception as e:
        log_message(f"ERROR: {str(e)}")
        print(f"Hook 執行錯誤: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
```

### 模板 2: PostToolUse Hook

**用途**: 後處理和結果驗證

```python
#!/usr/bin/env python3
# /// script
# dependencies = []
# requires-python = ">=3.10"
# ///

"""
PostToolUse Hook - 自動格式化範例

用途: 自動格式化 Dart 檔案
觸發: PostToolUse Hook (matcher: Write|Edit)
"""

import json
import sys
import os
import subprocess
from pathlib import Path
from datetime import datetime

PROJECT_ROOT = Path(os.environ.get("CLAUDE_PROJECT_DIR", "."))
LOG_DIR = PROJECT_ROOT / ".claude/hook-logs"
LOG_FILE = LOG_DIR / f"auto-format-{datetime.now():%Y%m%d}.log"

def log_message(message: str):
    """記錄訊息到日誌"""
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    with open(LOG_FILE, "a") as f:
        timestamp = datetime.now().isoformat()
        f.write(f"{timestamp} - {message}\n")

def format_dart_file(file_path: str) -> tuple[bool, str]:
    """
    格式化 Dart 檔案

    Returns:
        (success, message) - (是否成功, 訊息)
    """
    try:
        result = subprocess.run(
            ["flutter", "format", file_path],
            capture_output=True,
            text=True,
            timeout=30
        )

        if result.returncode == 0:
            return True, f"✅ 格式化成功: {file_path}"
        else:
            return False, f"❌ 格式化失敗: {result.stderr}"

    except subprocess.TimeoutExpired:
        return False, f"❌ 格式化超時: {file_path}"
    except FileNotFoundError:
        return False, "❌ 找不到 flutter 指令"
    except Exception as e:
        return False, f"❌ 格式化錯誤: {str(e)}"

def main():
    """主要邏輯"""
    try:
        # 1. 讀取 JSON 輸入
        input_data = json.load(sys.stdin)

        # 2. 提取工具資訊
        tool_name = input_data.get("tool_name", "")
        tool_input = input_data.get("tool_input", {})
        tool_response = input_data.get("tool_response", {})

        # 3. 檢查是否成功執行
        if not tool_response.get("success", False):
            log_message(f"Tool {tool_name} failed, skipping format")
            sys.exit(0)

        # 4. 只處理 Dart 檔案
        file_path = tool_input.get("file_path", "")
        if not file_path.endswith(".dart"):
            sys.exit(0)

        # 5. 執行格式化
        success, message = format_dart_file(file_path)

        # 6. 記錄日誌
        log_message(message)

        # 7. 輸出結果
        if success:
            print(message)
            sys.exit(0)
        else:
            print(message, file=sys.stderr)
            sys.exit(1)  # 非阻塊錯誤

    except Exception as e:
        log_message(f"ERROR: {str(e)}")
        print(f"Hook 執行錯誤: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
```

### 模板 3: UserPromptSubmit Hook

**用途**: Context 注入和合規檢查

```python
#!/usr/bin/env python3
# /// script
# dependencies = []
# requires-python = ">=3.10"
# ///

"""
UserPromptSubmit Hook - Context 注入範例

用途: 自動載入專案規格文件到 context
觸發: UserPromptSubmit Hook
"""

import json
import sys
import os
from pathlib import Path
from datetime import datetime

PROJECT_ROOT = Path(os.environ.get("CLAUDE_PROJECT_DIR", "."))
LOG_DIR = PROJECT_ROOT / ".claude/hook-logs"
LOG_FILE = LOG_DIR / f"context-loader-{datetime.now():%Y%m%d}.log"

def log_message(message: str):
    """記錄訊息到日誌"""
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    with open(LOG_FILE, "a") as f:
        timestamp = datetime.now().isoformat()
        f.write(f"{timestamp} - {message}\n")

def load_project_context() -> str:
    """
    載入專案規格文件

    Returns:
        context - 要注入的 context 內容
    """
    context_parts = []

    # 載入需求規格
    spec_file = PROJECT_ROOT / "docs/app-requirements-spec.md"
    if spec_file.exists():
        context_parts.append(f"# 專案需求規格\n\n{spec_file.read_text()}")

    # 載入用例說明
    usecase_file = PROJECT_ROOT / "docs/app-use-cases.md"
    if usecase_file.exists():
        context_parts.append(f"# 用例說明\n\n{usecase_file.read_text()}")

    return "\n\n---\n\n".join(context_parts)

def main():
    """主要邏輯"""
    try:
        # 1. 讀取 JSON 輸入
        input_data = json.load(sys.stdin)

        # 2. 提取 prompt
        prompt = input_data.get("prompt", "")

        # 3. 檢查是否需要注入 context
        # 如果 prompt 包含特定關鍵字，載入相關 context
        keywords = ["需求", "規格", "用例", "UC-"]

        should_inject = any(keyword in prompt for keyword in keywords)

        if not should_inject:
            log_message("No context injection needed")
            sys.exit(0)

        # 4. 載入 context
        context = load_project_context()

        # 5. 記錄日誌
        log_message(f"Injecting context ({len(context)} chars)")

        # 6. 輸出 context
        output = {
            "hookSpecificOutput": {
                "hookEventName": "UserPromptSubmit",
                "additionalContext": context
            },
            "suppressOutput": True  # 不顯示在 transcript
        }
        print(json.dumps(output))
        sys.exit(0)

    except Exception as e:
        log_message(f"ERROR: {str(e)}")
        print(f"Hook 執行錯誤: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
```

### 模板 4: Stop Hook

**用途**: 完成驗證和通知

```python
#!/usr/bin/env python3
# /// script
# dependencies = ["anthropic>=0.20.0"]
# requires-python = ">=3.10"
# ///

"""
Stop Hook - 完成驗證範例

用途: 驗證測試通過才允許停止
觸發: Stop Hook
"""

import json
import sys
import os
import subprocess
from pathlib import Path
from datetime import datetime

PROJECT_ROOT = Path(os.environ.get("CLAUDE_PROJECT_DIR", "."))
LOG_DIR = PROJECT_ROOT / ".claude/hook-logs"
LOG_FILE = LOG_DIR / f"completion-check-{datetime.now():%Y%m%d}.log"

def log_message(message: str):
    """記錄訊息到日誌"""
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    with open(LOG_FILE, "a") as f:
        timestamp = datetime.now().isoformat()
        f.write(f"{timestamp} - {message}\n")

def check_tests_passed() -> tuple[bool, str]:
    """
    檢查測試是否通過

    Returns:
        (passed, message) - (是否通過, 訊息)
    """
    try:
        result = subprocess.run(
            ["flutter", "test"],
            capture_output=True,
            text=True,
            timeout=300,
            cwd=PROJECT_ROOT
        )

        if result.returncode == 0:
            return True, "✅ 所有測試通過"
        else:
            return False, f"❌ 測試失敗:\n{result.stdout}\n{result.stderr}"

    except subprocess.TimeoutExpired:
        return False, "❌ 測試執行超時"
    except Exception as e:
        return False, f"❌ 測試執行錯誤: {str(e)}"

def main():
    """主要邏輯"""
    try:
        # 1. 讀取 JSON 輸入
        input_data = json.load(sys.stdin)

        # 2. 檢查測試
        passed, message = check_tests_passed()

        # 3. 記錄日誌
        log_message(message)

        # 4. 輸出決策
        if passed:
            # 允許停止
            print("✅ 任務完成，測試全部通過")
            sys.exit(0)
        else:
            # 阻止停止，要求修正
            output = {
                "decision": "block",
                "reason": message
            }
            print(json.dumps(output))
            sys.exit(2)

    except Exception as e:
        log_message(f"ERROR: {str(e)}")
        print(f"Hook 執行錯誤: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
```

---

## 🚀 進階功能

### 使用外部套件

```python
#!/usr/bin/env python3
# /// script
# dependencies = [
#     "anthropic>=0.20.0",    # Anthropic API
#     "rich>=13.0.0",         # 美化輸出
#     "pydantic>=2.0.0",      # 資料驗證
#     "httpx>=0.24.0"         # HTTP 客戶端
# ]
# requires-python = ">=3.10"
# ///

from anthropic import Anthropic
from rich import print
from pydantic import BaseModel
import httpx

# 使用範例
def use_anthropic_api():
    client = Anthropic()
    # API 呼叫邏輯
```

### 版本管理最佳實踐

```python
#!/usr/bin/env python3
# /// script
# dependencies = [
#     "anthropic>=0.20.0,<1.0.0",  # 主版本鎖定
#     "rich==13.7.0",               # 精確版本
#     "pydantic>=2.0.0",            # 最低版本
#     "httpx~=0.24.0"               # 相容版本 (>=0.24.0, <0.25.0)
# ]
# requires-python = ">=3.10"
# ///
```

### 多檔案支援

UV 單檔腳本可以匯入同目錄的其他模組：

**主腳本 (my-hook.py)**:
```python
#!/usr/bin/env python3
# /// script
# dependencies = ["rich"]
# ///

from helper import format_message
from rich import print

def main():
    message = format_message("Hello")
    print(message)
```

**輔助模組 (helper.py)**:
```python
def format_message(text: str) -> str:
    return f"[bold]{text}[/bold]"
```

---

## 🔍 除錯和測試

### 本地測試腳本

```bash
# 建立測試輸入
cat > test-input.json <<EOF
{
  "hook_event_name": "PreToolUse",
  "tool_name": "Write",
  "tool_input": {
    "file_path": "test.dart"
  }
}
EOF

# 執行腳本
cat test-input.json | uv run my-hook.py

# 檢查 exit code
echo $?
```

### 除錯模式

```python
#!/usr/bin/env python3
# /// script
# dependencies = []
# ///

import json
import sys
import os

# 啟用除錯模式
DEBUG = os.environ.get("HOOK_DEBUG", "false").lower() == "true"

def debug_log(message: str):
    """除錯訊息"""
    if DEBUG:
        print(f"[DEBUG] {message}", file=sys.stderr)

def main():
    debug_log("Hook started")

    input_data = json.load(sys.stdin)
    debug_log(f"Input: {json.dumps(input_data, indent=2)}")

    # Hook 邏輯
    result = process_hook(input_data)
    debug_log(f"Result: {result}")

    sys.exit(0)
```

**使用除錯模式**:
```bash
# 啟用除錯
HOOK_DEBUG=true cat test-input.json | uv run my-hook.py
```

---

## 📊 效能比較

### 啟動時間

| 方式 | 首次執行 | 後續執行 | 備註 |
|------|---------|---------|------|
| **傳統 venv** | ~500ms | ~300ms | 需要啟用 venv |
| **UV 單檔** | ~200ms | ~50ms | 自動快取依賴 |
| **Bash** | ~10ms | ~10ms | 無依賴管理 |

### 依賴安裝

| 方式 | 首次安裝 | 後續安裝 | 隔離性 |
|------|---------|---------|--------|
| **pip** | ~30s | ~10s | 全域或 venv |
| **UV** | ~5s | < 1s | 完全隔離 |

---

## 🎯 最佳實踐

### 1. 明確依賴版本

```python
# ❌ 錯誤：無版本限制
# dependencies = ["anthropic"]

# ✅ 正確：明確版本範圍
# dependencies = ["anthropic>=0.20.0,<1.0.0"]
```

### 2. 最小化依賴

```python
# ❌ 錯誤：過多依賴
# dependencies = [
#     "anthropic", "openai", "rich", "click",
#     "requests", "httpx", "pydantic", "pytest"
# ]

# ✅ 正確：只包含必要依賴
# dependencies = ["anthropic>=0.20.0"]
```

### 3. 錯誤處理

```python
try:
    # 主邏輯
    result = process_hook(input_data)
except json.JSONDecodeError as e:
    print(f"JSON 解析錯誤: {e}", file=sys.stderr)
    sys.exit(1)
except Exception as e:
    print(f"未預期錯誤: {e}", file=sys.stderr)
    sys.exit(1)
```

### 4. 日誌記錄

```python
import logging

logging.basicConfig(
    filename=LOG_FILE,
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)

logging.info("Hook started")
logging.error(f"Error: {error_message}")
```

---

## 🔗 相關資源

- **[Hook 基礎概念](./01-hook-fundamentals.md)** - Hook 系統基本原理
- **[Hook 最佳實踐](./02-hook-best-practices.md)** - 進階技巧
- **[Hook 範例集](./04-hook-examples.md)** - 實用範例
- **[Astral UV 官方文件](https://docs.astral.sh/uv/)** - UV 完整說明
- **[PEP 723](https://peps.python.org/pep-0723/)** - Inline Script Metadata 標準

---

**文件版本**: v1.0
**建立日期**: 2025-10-09
**維護者**: rosemary-project-manager
**基於**: PEP 723 和 Astral UV 最佳實踐
