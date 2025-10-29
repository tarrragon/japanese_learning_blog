# 語音通知整合 - TTS Hook 實作指南

## 📖 文件資訊

- **版本**: v1.0
- **建立日期**: 2025-10-09
- **基於**: IndyDevDan TTS 整合見解
- **目的**: 提供完整的語音通知 Hook 實作指南

---

## 🌟 為什麼使用語音通知

> "TTS notifications dramatically improve the UX for long-running agentic tasks. You can go grab coffee and come back when Claude tells you it's done."
>
> — IndyDevDan, Hooked on Claude Code Hooks

### UX 價值

**傳統方式的問題**:
- 😞 需要持續盯著螢幕
- 😞 長時間任務無法離開
- 😞 錯過完成時機
- 😞 影響工作效率

**語音通知的優勢**:
- ✅ **解放注意力** - 可以處理其他任務
- ✅ **及時回饋** - 立即知道任務完成
- ✅ **提升效率** - 不用浪費時間等待
- ✅ **更好的 UX** - 更友善的使用體驗

---

## 🎯 適用場景

### 1. 長時間任務完成

```python
# Stop Hook
"✅ 所有測試通過，任務完成！"
```

### 2. 子任務並行完成

```python
# SubagentStop Hook
"✅ 子任務 3/5 完成：重構階段完成"
```

### 3. 錯誤警報

```python
# PostToolUse Hook
"❌ 測試失敗，發現 3 個錯誤"
```

### 4. 重要通知

```python
# UserPromptSubmit Hook
"⚠️  檢測到逃避行為，請修正 prompt"
```

---

## 🔧 TTS 方案比較

### 方案 1: ElevenLabs (推薦)

**優點**:
- ✅ 最自然的語音品質
- ✅ 多語言支援（包含繁體中文）
- ✅ 低延遲（< 1 秒）
- ✅ 豐富的語音選擇

**缺點**:
- ❌ 需要 API key
- ❌ 有用量限制
- ❌ 需要網路連線

**成本**: 免費方案 10,000 字/月

### 方案 2: OpenAI TTS

**優點**:
- ✅ 高品質語音
- ✅ 整合簡單
- ✅ 穩定可靠

**缺點**:
- ❌ 需要 OpenAI API key
- ❌ 按用量計費
- ❌ 繁體中文支援有限

**成本**: $0.015 / 1K 字元

### 方案 3: macOS/Windows 本地 TTS

**優點**:
- ✅ 完全免費
- ✅ 無需 API key
- ✅ 離線可用

**缺點**:
- ❌ 語音品質較差
- ❌ 繁體中文發音不自然
- ❌ 平台限制

**成本**: 免費

---

## 📋 ElevenLabs 整合（推薦）

### 1. 取得 API Key

1. 註冊 [ElevenLabs](https://elevenlabs.io)
2. 前往 Profile → API Keys
3. 複製 API Key
4. 設定環境變數:
   ```bash
   export ELEVENLABS_API_KEY="your-api-key"
   ```

### 2. 完整實作

**檔案**: `.claude/hooks/tts-notification-elevenlabs.py`

```python
#!/usr/bin/env python3
# /// script
# dependencies = [
#     "elevenlabs>=0.2.0",
#     "httpx>=0.24.0"
# ]
# requires-python = ">=3.10"
# ///

"""
ElevenLabs TTS 語音通知

提供高品質的語音通知功能
"""

import json
import sys
import os
from pathlib import Path
from datetime import datetime
import tempfile
import subprocess

try:
    from elevenlabs import generate, play, Voice, VoiceSettings
except ImportError:
    # 如果無法匯入，提供降級方案
    print("警告: elevenlabs 套件未安裝，語音通知已停用", file=sys.stderr)
    sys.exit(0)

PROJECT_ROOT = Path(os.environ.get("CLAUDE_PROJECT_DIR", "."))
LOG_DIR = PROJECT_ROOT / ".claude/hook-logs"

# ElevenLabs 配置
ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY")
VOICE_ID = "21m00Tcm4TlvDq8ikWAM"  # Rachel (英語)
# 繁體中文語音 ID: "pNInz6obpgDQGcFmaJgB"  # Adam (多語言支援)

def speak(text: str, use_chinese: bool = False):
    """
    使用 ElevenLabs TTS 播放語音

    Args:
        text: 要播放的文字
        use_chinese: 是否使用中文語音
    """
    if not ELEVENLABS_API_KEY:
        print("警告: ELEVENLABS_API_KEY 未設定", file=sys.stderr)
        return

    try:
        # 選擇語音
        voice_id = "pNInz6obpgDQGcFmaJgB" if use_chinese else VOICE_ID

        # 產生語音
        audio = generate(
            text=text,
            voice=Voice(
                voice_id=voice_id,
                settings=VoiceSettings(
                    stability=0.5,
                    similarity_boost=0.75,
                    style=0.0,
                    use_speaker_boost=True
                )
            ),
            model="eleven_multilingual_v2"  # 支援多語言
        )

        # 播放語音
        play(audio)

        # 記錄日誌
        log_file = LOG_DIR / "tts-notifications.log"
        log_file.parent.mkdir(parents=True, exist_ok=True)
        with open(log_file, "a") as f:
            timestamp = datetime.now().isoformat()
            f.write(f"{timestamp} - TTS: {text}\n")

    except Exception as e:
        print(f"TTS 錯誤: {str(e)}", file=sys.stderr)

def main():
    try:
        input_data = json.load(sys.stdin)
        hook_event = input_data.get("hook_event_name", "")

        # 根據不同 Hook 事件決定通知內容
        if hook_event == "Stop":
            # 任務完成通知
            speak("Task completed successfully", use_chinese=False)
            print("🔊 語音通知: 任務完成")

        elif hook_event == "SubagentStop":
            # 子任務完成通知
            speak("Subtask completed", use_chinese=False)
            print("🔊 語音通知: 子任務完成")

        sys.exit(0)

    except Exception as e:
        print(f"Hook 錯誤: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
```

### 3. 配置

**`.claude/settings.local.json`**:
```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/tts-notification-elevenlabs.py"
          }
        ]
      }
    ],
    "SubagentStop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/tts-notification-elevenlabs.py"
          }
        ]
      }
    ]
  }
}
```

---

## 📋 OpenAI TTS 整合

### 完整實作

**檔案**: `.claude/hooks/tts-notification-openai.py`

```python
#!/usr/bin/env python3
# /// script
# dependencies = [
#     "openai>=1.0.0"
# ]
# requires-python = ">=3.10"
# ///

"""
OpenAI TTS 語音通知

使用 OpenAI Text-to-Speech API
"""

import json
import sys
import os
from pathlib import Path
from datetime import datetime
import tempfile
import subprocess

try:
    from openai import OpenAI
except ImportError:
    print("警告: openai 套件未安裝", file=sys.stderr)
    sys.exit(0)

PROJECT_ROOT = Path(os.environ.get("CLAUDE_PROJECT_DIR", "."))
LOG_DIR = PROJECT_ROOT / ".claude/hook-logs"

# OpenAI 配置
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
VOICE = "nova"  # alloy, echo, fable, onyx, nova, shimmer

def speak(text: str):
    """
    使用 OpenAI TTS 播放語音

    Args:
        text: 要播放的文字
    """
    if not OPENAI_API_KEY:
        print("警告: OPENAI_API_KEY 未設定", file=sys.stderr)
        return

    try:
        client = OpenAI(api_key=OPENAI_API_KEY)

        # 產生語音
        response = client.audio.speech.create(
            model="tts-1",  # 或 tts-1-hd 更高品質
            voice=VOICE,
            input=text
        )

        # 儲存並播放音訊
        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
            audio_file = f.name
            f.write(response.content)

        # 播放音訊（macOS）
        if sys.platform == "darwin":
            subprocess.run(["afplay", audio_file])
        # 播放音訊（Linux）
        elif sys.platform == "linux":
            subprocess.run(["mpg123", audio_file])
        # 播放音訊（Windows）
        elif sys.platform == "win32":
            subprocess.run(["start", audio_file], shell=True)

        # 清理臨時檔案
        os.unlink(audio_file)

        # 記錄日誌
        log_file = LOG_DIR / "tts-notifications.log"
        log_file.parent.mkdir(parents=True, exist_ok=True)
        with open(log_file, "a") as f:
            timestamp = datetime.now().isoformat()
            f.write(f"{timestamp} - TTS (OpenAI): {text}\n")

    except Exception as e:
        print(f"TTS 錯誤: {str(e)}", file=sys.stderr)

def main():
    try:
        input_data = json.load(sys.stdin)
        hook_event = input_data.get("hook_event_name", "")

        if hook_event == "Stop":
            speak("Task completed successfully")
            print("🔊 語音通知: 任務完成")

        elif hook_event == "SubagentStop":
            speak("Subtask completed")
            print("🔊 語音通知: 子任務完成")

        sys.exit(0)

    except Exception as e:
        print(f"Hook 錯誤: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
```

---

## 📋 macOS 本地 TTS

### 完整實作

**檔案**: `.claude/hooks/tts-notification-macos.sh`

```bash
#!/bin/bash

# macOS 本地 TTS 語音通知
# 使用 macOS 內建的 say 指令

PROJECT_ROOT="${CLAUDE_PROJECT_DIR}"
LOG_DIR="$PROJECT_ROOT/.claude/hook-logs"
INPUT=$(cat)

# 提取 Hook 事件
HOOK_EVENT=$(echo "$INPUT" | jq -r '.hook_event_name')

# 記錄函數
log_message() {
    local message="$1"
    local log_file="$LOG_DIR/tts-notifications.log"
    mkdir -p "$LOG_DIR"
    echo "$(date -Iseconds) - $message" >> "$log_file"
}

# 語音通知函數
speak() {
    local text="$1"
    local voice="${2:-Samantha}"  # 預設英語語音

    # macOS say 指令
    say -v "$voice" "$text" &

    log_message "TTS: $text"
    echo "🔊 語音通知: $text"
}

# 根據 Hook 事件決定通知內容
case "$HOOK_EVENT" in
    "Stop")
        speak "Task completed successfully" "Samantha"
        ;;
    "SubagentStop")
        speak "Subtask completed" "Samantha"
        ;;
    *)
        # 預設不通知
        exit 0
        ;;
esac

exit 0
```

**macOS 中文語音**:
```bash
# 使用 Mei-Jia (台灣中文)
say -v Mei-Jia "任務完成"

# 列出所有可用語音
say -v "?"
```

---

## 📋 Windows 本地 TTS

### PowerShell 實作

**檔案**: `.claude/hooks/tts-notification-windows.ps1`

```powershell
# Windows 本地 TTS 語音通知
# 使用 .NET System.Speech.Synthesis

$ProjectRoot = $env:CLAUDE_PROJECT_DIR
$LogDir = Join-Path $ProjectRoot ".claude/hook-logs"
$Input = $args[0] | ConvertFrom-Json

# 記錄函數
function Log-Message {
    param($Message)
    $LogFile = Join-Path $LogDir "tts-notifications.log"
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
    $Timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss"
    Add-Content -Path $LogFile -Value "$Timestamp - $Message"
}

# 語音通知函數
function Speak {
    param($Text)

    Add-Type -AssemblyName System.Speech
    $synthesizer = New-Object System.Speech.Synthesis.SpeechSynthesizer
    $synthesizer.Speak($Text)

    Log-Message "TTS: $Text"
    Write-Host "🔊 語音通知: $Text"
}

# 根據 Hook 事件決定通知內容
switch ($Input.hook_event_name) {
    "Stop" {
        Speak "Task completed successfully"
    }
    "SubagentStop" {
        Speak "Subtask completed"
    }
}

exit 0
```

---

## 🎯 進階功能

### 1. 條件式通知

只在特定條件下觸發語音通知：

```python
def should_notify(input_data: dict) -> bool:
    """決定是否應該通知"""

    # 1. 檢查執行時間（只通知長時間任務）
    # 可以從 transcript 檔案計算時間

    # 2. 檢查任務類型
    # 只通知重要任務

    # 3. 檢查時間（夜間不通知）
    hour = datetime.now().hour
    if hour < 8 or hour > 22:
        return False

    return True
```

### 2. 客製化訊息

根據任務類型產生不同訊息：

```python
def generate_message(input_data: dict) -> str:
    """產生客製化訊息"""
    hook_event = input_data.get("hook_event_name", "")

    if hook_event == "Stop":
        # 從 transcript 分析任務內容
        return "All tests passed. Ready to commit."

    elif hook_event == "SubagentStop":
        # 分析子任務資訊
        return "Refactoring phase completed."

    return "Task completed."
```

### 3. 多語言支援

根據專案設定選擇語言：

```python
def get_message_language() -> str:
    """取得訊息語言"""
    # 從專案設定讀取
    config_file = PROJECT_ROOT / ".claude/tts-config.json"

    if config_file.exists():
        with open(config_file) as f:
            config = json.load(f)
            return config.get("language", "en")

    return "en"

def get_localized_message(key: str, lang: str) -> str:
    """取得本地化訊息"""
    messages = {
        "en": {
            "task_completed": "Task completed successfully",
            "subtask_completed": "Subtask completed",
            "test_failed": "Tests failed"
        },
        "zh-TW": {
            "task_completed": "任務完成",
            "subtask_completed": "子任務完成",
            "test_failed": "測試失敗"
        }
    }

    return messages.get(lang, {}).get(key, key)
```

---

## 🚨 最佳實踐

### 1. 非阻塞播放

```python
import subprocess

# ❌ 錯誤：阻塞等待播放完成
play(audio)

# ✅ 正確：背景播放，立即返回
subprocess.Popen(["afplay", audio_file], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
sys.exit(0)
```

### 2. 錯誤處理

```python
try:
    speak(message)
except Exception as e:
    # 不因 TTS 失敗而影響 Hook 執行
    print(f"TTS 警告: {str(e)}", file=sys.stderr)
    # 繼續執行，不要 sys.exit(1)
```

### 3. 用量控制

```python
def check_daily_limit() -> bool:
    """檢查每日用量限制"""
    stats_file = LOG_DIR / "tts-usage-stats.json"

    if stats_file.exists():
        with open(stats_file) as f:
            stats = json.load(f)

        today = datetime.now().strftime("%Y-%m-%d")
        usage = stats.get(today, 0)

        # 限制每日 100 次
        return usage < 100

    return True
```

### 4. 音量控制

```python
def play_with_volume(audio_file: str, volume: float = 0.5):
    """播放音訊並控制音量（macOS）"""
    subprocess.run([
        "afplay",
        "-v", str(volume),  # 音量 0.0-1.0
        audio_file
    ])
```

---

## 📊 方案選擇建議

### 選擇 ElevenLabs 如果：
- ✅ 需要最高品質語音
- ✅ 需要多語言支援
- ✅ 用量在免費額度內

### 選擇 OpenAI TTS 如果：
- ✅ 已有 OpenAI 訂閱
- ✅ 需要整合其他 OpenAI 服務
- ✅ 用量較大

### 選擇本地 TTS 如果：
- ✅ 完全離線環境
- ✅ 不想使用 API
- ✅ 語音品質要求不高

---

## 📚 相關文件

- **[Hook 基礎概念](./01-hook-fundamentals.md)** - Hook 系統基本原理
- **[Hook 最佳實踐](./02-hook-best-practices.md)** - 進階技巧
- **[Hook 範例集](./04-hook-examples.md)** - 實用範例
- **[ElevenLabs 官方文件](https://elevenlabs.io/docs)** - API 說明
- **[OpenAI TTS 文件](https://platform.openai.com/docs/guides/text-to-speech)** - API 說明

---

**文件版本**: v1.0
**建立日期**: 2025-10-09
**維護者**: rosemary-project-manager
**基於**: IndyDevDan TTS 整合見解
