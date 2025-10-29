# Hook 開發完整檢查清單

## 📖 文件資訊

- **版本**: v1.0
- **建立日期**: 2025-10-09
- **目的**: 提供 Hook 開發的完整流程和檢查清單
- **適用對象**: 所有 Hook 開發者

---

## 🎯 開發流程總覽

```text
1. 規劃階段 → 確定需求和觸發時機
2. 設計階段 → 選擇 Hook 類型和實作方式
3. 實作階段 → 編寫 Hook 腳本
4. 測試階段 → 驗證功能和效能
5. 配置階段 → 設定 settings.json
6. 文件階段 → 記錄用途和使用方式
7. 部署階段 → 上線和監控
```

---

## 📋 Phase 1: 規劃階段

### ✅ 需求分析

- [ ] **明確目標** - 清楚定義 Hook 要解決什麼問題
- [ ] **使用場景** - 列出所有適用場景
- [ ] **預期行為** - 定義成功和失敗的標準
- [ ] **優先級** - 確認是否為必要功能

### ✅ 觸發時機確定

- [ ] **選擇 Hook 類型** - PreToolUse/PostToolUse/UserPromptSubmit/Stop/SubagentStop
- [ ] **確認觸發條件** - 明確何時應該觸發
- [ ] **避免重複** - 檢查是否已有類似 Hook

**決策表格**：

| 需求 | Hook 類型 | 說明 |
|------|----------|------|
| 阻止操作 | PreToolUse | 執行前驗證和控制 |
| 後處理 | PostToolUse | 執行後處理和記錄 |
| Context 注入 | UserPromptSubmit | 自動載入資訊 |
| 完成驗證 | Stop | 確認任務完成 |
| 子任務追蹤 | SubagentStop | 並行任務管理 |

### ✅ 相依性檢查

- [ ] **檢查相依 Hook** - 是否依賴其他 Hook 的輸出
- [ ] **執行順序** - 確認多個 Hook 的執行順序
- [ ] **資料共享** - 確認 Hook 間如何共享資料

---

## 📋 Phase 2: 設計階段

### ✅ 實作方式選擇

**決策樹**：

```text
需要外部套件？
├─ 是 → UV Python 單檔
│  └─ dependencies = ["package>=1.0.0"]
└─ 否 → 簡單腳本
   ├─ 複雜邏輯 → Python
   └─ 簡單操作 → Bash
```

**選擇 Python UV 單檔如果**：
- [ ] 需要使用外部套件（anthropic, rich, pydantic）
- [ ] 複雜的資料處理和邏輯
- [ ] 需要依賴隔離

**選擇 Python 標準腳本如果**：
- [ ] 中等複雜度
- [ ] 只使用標準庫
- [ ] 需要跨平台

**選擇 Bash 腳本如果**：
- [ ] 簡單的檔案操作
- [ ] 呼叫系統指令
- [ ] 需要極快執行速度

### ✅ 輸入輸出設計

**輸入處理**：
- [ ] 從 stdin 讀取 JSON
- [ ] 處理必要欄位（tool_name, tool_input, hook_event_name）
- [ ] 處理可選欄位（tool_response, prompt）
- [ ] 錯誤處理（JSON 解析失敗）

**輸出設計**：
- [ ] 決定使用 Exit Code 或 JSON 輸出
- [ ] PreToolUse: 設計 permissionDecision (allow/deny/ask)
- [ ] PostToolUse: 設計 additionalContext
- [ ] UserPromptSubmit: 設計 Context 注入內容
- [ ] Stop/SubagentStop: 設計 block reason

### ✅ 錯誤處理策略

- [ ] **輸入驗證** - 檢查必要欄位是否存在
- [ ] **例外捕捉** - 處理所有可能的例外
- [ ] **錯誤訊息** - 提供清晰的錯誤說明
- [ ] **降級方案** - 錯誤時的備用處理

### ✅ 效能考量

- [ ] **執行時間目標** - 設定效能目標（< 2 秒）
- [ ] **快取策略** - 是否需要快取機制
- [ ] **背景執行** - 是否需要非同步處理
- [ ] **資源限制** - 記憶體和 CPU 使用限制

---

## 📋 Phase 3: 實作階段

### ✅ 腳本架構

**Python 標準架構**：
```python
#!/usr/bin/env python3
# /// script
# dependencies = []
# ///

import json
import sys
import os
from pathlib import Path
from datetime import datetime

# 1. 設定和常數
PROJECT_ROOT = Path(os.environ.get("CLAUDE_PROJECT_DIR", "."))
LOG_DIR = PROJECT_ROOT / ".claude/hook-logs"

# 2. 輔助函數
def log_message(message: str):
    """記錄訊息"""
    pass

# 3. 核心邏輯函數
def process_hook(input_data: dict) -> tuple[bool, str]:
    """處理 Hook 邏輯"""
    pass

# 4. 主函數
def main():
    try:
        input_data = json.load(sys.stdin)
        success, message = process_hook(input_data)

        if success:
            sys.exit(0)
        else:
            print(message, file=sys.stderr)
            sys.exit(2)

    except Exception as e:
        print(f"Hook 錯誤: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
```

### ✅ 必要元件檢查清單

- [ ] **Shebang** - `#!/usr/bin/env python3` 或 `#!/bin/bash`
- [ ] **PEP 723 metadata** (Python UV) - dependencies 宣告
- [ ] **Docstring** - 說明 Hook 用途
- [ ] **環境變數** - 使用 `$CLAUDE_PROJECT_DIR`
- [ ] **輸入讀取** - 從 stdin 讀取 JSON
- [ ] **日誌記錄** - 記錄關鍵操作
- [ ] **錯誤處理** - try-except 包裹主邏輯
- [ ] **Exit Code** - 正確使用 0/1/2

### ✅ 程式碼品質

- [ ] **單一職責** - 每個函數只做一件事
- [ ] **命名清晰** - 變數和函數名稱具描述性
- [ ] **註解完整** - 複雜邏輯有註解說明
- [ ] **無硬編碼** - 使用常數或環境變數
- [ ] **型別提示** (Python) - 使用 type hints

---

## 📋 Phase 4: 測試階段

### ✅ 單元測試

**建立測試輸入**：
```bash
cat > test-input.json <<EOF
{
  "hook_event_name": "PreToolUse",
  "tool_name": "Write",
  "tool_input": {
    "file_path": "test.dart"
  }
}
EOF
```

**執行測試**：
```bash
# Python UV 腳本
cat test-input.json | uv run my-hook.py

# Python 標準腳本
cat test-input.json | python3 my-hook.py

# Bash 腳本
cat test-input.json | bash my-hook.sh
```

**驗證項目**：
- [ ] **正常情況** - 輸入符合預期時的行為
- [ ] **邊界情況** - 空輸入、極端值
- [ ] **錯誤情況** - 無效輸入、缺少欄位
- [ ] **Exit Code** - 檢查返回值是否正確

### ✅ 整合測試

**啟用 Debug 模式**：
```bash
claude --debug
```

**監控 Debug Log**：
```bash
tail -f ~/.claude/debug.log
```

**驗證項目**：
- [ ] **觸發正確** - Hook 在正確時機觸發
- [ ] **輸入正確** - 接收到的 JSON 格式正確
- [ ] **輸出有效** - Hook 的輸出影響 Claude 行為
- [ ] **無副作用** - 不影響其他功能

### ✅ 效能測試

```bash
# 測量執行時間
time cat test-input.json | my-hook.py
```

**效能目標**：
- [ ] **執行時間** - < 2 秒（理想 < 500ms）
- [ ] **記憶體使用** - < 100MB
- [ ] **CPU 使用** - 不阻塞其他任務

### ✅ 壓力測試

```bash
# 連續執行 100 次
for i in {1..100}; do
    cat test-input.json | my-hook.py
done
```

**驗證項目**：
- [ ] **穩定性** - 連續執行不崩潰
- [ ] **記憶體洩漏** - 長時間執行無記憶體增長
- [ ] **檔案清理** - 臨時檔案正確清理

---

## 📋 Phase 5: 配置階段

### ✅ settings.local.json 配置

**基本配置**：
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/my-hook.py",
            "timeout": 60000
          }
        ]
      }
    ]
  }
}
```

**配置檢查清單**：
- [ ] **Hook 類型正確** - PreToolUse/PostToolUse/etc
- [ ] **Matcher 正確** - 精確匹配目標工具
- [ ] **路徑使用環境變數** - `$CLAUDE_PROJECT_DIR`
- [ ] **Timeout 合理** - 根據實際需求設定
- [ ] **JSON 格式正確** - 通過 JSON 驗證

### ✅ 檔案權限

```bash
# 設定執行權限
chmod +x .claude/hooks/my-hook.py

# 驗證權限
ls -la .claude/hooks/my-hook.py
```

- [ ] **可執行權限** - `chmod +x`
- [ ] **Shebang 正確** - 指向正確的直譯器

### ✅ 環境變數設定

```bash
# 在 shell 配置檔案中設定
export ELEVENLABS_API_KEY="your-api-key"
export OPENAI_API_KEY="your-api-key"
```

- [ ] **API Keys** - 如需使用外部服務
- [ ] **專案變數** - 專案特定配置
- [ ] **載入驗證** - 確認環境變數已載入

---

## 📋 Phase 6: 文件階段

### ✅ 腳本內文件

**必要文件**：
```python
"""
Hook 名稱

用途: 簡短說明用途（1-2 句）
觸發: Hook 類型和觸發條件
輸入: 預期的輸入格式
輸出: 輸出格式和決策類型

範例:
  輸入: { "tool_name": "Write", "file_path": "test.txt" }
  輸出: { "permissionDecision": "allow" }
"""
```

**檢查清單**：
- [ ] **Docstring** - 腳本開頭有完整說明
- [ ] **函數註解** - 每個函數有 docstring
- [ ] **複雜邏輯註解** - 關鍵邏輯有說明
- [ ] **範例** - 提供輸入輸出範例

### ✅ README 文件

**建立 Hook README**：

`.claude/hooks/README-my-hook.md`:
```markdown
# My Hook

## 用途

簡短說明這個 Hook 的用途。

## 觸發時機

- Hook 類型: PreToolUse
- Matcher: Write|Edit
- 觸發條件: 當嘗試寫入 lib/ 目錄下的檔案時

## 配置

```json
{
  "hooks": {
    "PreToolUse": [...]
  }
}
```

## 測試

```bash
cat test-input.json | .claude/hooks/my-hook.py
```

## 日誌位置

- 執行日誌: `.claude/hook-logs/my-hook.log`
- 統計資訊: `.claude/hook-logs/my-hook-stats.json`
```text

**檢查清單**：
- [ ] **用途說明** - 清楚說明為什麼需要這個 Hook
- [ ] **觸發時機** - 明確說明何時觸發
- [ ] **配置範例** - 提供完整的配置範例
- [ ] **測試方法** - 說明如何測試
- [ ] **日誌位置** - 說明日誌檔案位置

### ✅ 專案文件更新

**更新主文件**：
- [ ] **docs/hooks/README.md** - 更新索引
- [ ] **docs/hooks/project-hooks-summary.md** - 加入新 Hook 說明
- [ ] **CLAUDE.md** - 如需更新專案規範

---

## 📋 Phase 7: 部署階段

### ✅ 部署前檢查

- [ ] **所有測試通過** - 單元測試和整合測試
- [ ] **文件完整** - 腳本內和外部文件
- [ ] **配置正確** - settings.local.json 配置
- [ ] **權限正確** - 可執行權限設定
- [ ] **環境變數** - 必要環境變數已設定

### ✅ 灰度發布

**策略 1: 限制觸發範圍**：
```json
{
  "matcher": "Write.*/test/.*"  // 只在測試目錄觸發
}
```

**策略 2: 條件式啟用**：
```python
# 環境變數控制
ENABLE_HOOK = os.environ.get("ENABLE_MY_HOOK", "false").lower() == "true"

if not ENABLE_HOOK:
    sys.exit(0)
```

**檢查清單**：
- [ ] **小範圍測試** - 先在測試目錄啟用
- [ ] **監控日誌** - 觀察是否有異常
- [ ] **效能影響** - 確認無效能問題
- [ ] **逐步擴大** - 確認無問題後全面啟用

### ✅ 監控和維護

**日誌監控**：
```bash
# 監控 Hook 執行日誌
tail -f .claude/hook-logs/my-hook.log

# 監控錯誤日誌
grep "ERROR" .claude/hook-logs/my-hook.log

# 統計執行次數
grep "SUCCESS" .claude/hook-logs/my-hook.log | wc -l
```

**定期檢查**：
- [ ] **每日檢查** - 日誌是否有錯誤
- [ ] **每週檢查** - 效能指標和統計資訊
- [ ] **每月檢查** - 檢查是否需要優化

---

## 🔍 除錯指南

### ✅ 常見問題排查

#### 問題 1: Hook 沒有執行

**檢查項目**：
```bash
# 1. 檢查配置檔案
cat .claude/settings.local.json | jq '.hooks'

# 2. 檢查檔案權限
ls -la .claude/hooks/my-hook.py

# 3. 檢查 Shebang
head -1 .claude/hooks/my-hook.py

# 4. 啟用 Debug 模式
claude --debug
tail -f ~/.claude/debug.log
```

#### 問題 2: Hook 執行但無效果

**檢查項目**：
```bash
# 1. 檢查 Exit Code
cat test-input.json | my-hook.py
echo $?

# 2. 檢查輸出格式
cat test-input.json | my-hook.py | jq .

# 3. 檢查日誌
cat .claude/hook-logs/my-hook.log
```

#### 問題 3: Hook 執行超時

**檢查項目**：
```bash
# 1. 測量執行時間
time cat test-input.json | my-hook.py

# 2. 檢查是否有阻塞操作
# 3. 增加 timeout 或優化程式碼
```

### ✅ Debug 模式使用

```bash
# 啟用 Debug 模式
claude --debug

# 查看 Debug Log
tail -f ~/.claude/debug.log | grep "hook"

# 過濾特定 Hook
tail -f ~/.claude/debug.log | grep "my-hook"
```

**Debug Log 關鍵資訊**：
- Hook 執行命令
- Hook 輸入 JSON
- Hook 輸出
- Exit Code
- 執行時間

---

## 📊 效能優化檢查清單

### ✅ 啟動時間優化

- [ ] **延遲匯入** - 只在需要時匯入模組
- [ ] **移除重型依賴** - 避免不必要的套件
- [ ] **快取機制** - 快取常用資料

### ✅ 執行時間優化

- [ ] **減少檔案 I/O** - 批次讀寫
- [ ] **平行處理** - 使用 ThreadPoolExecutor
- [ ] **演算法優化** - 使用更高效的演算法

### ✅ 記憶體優化

- [ ] **串流處理** - 逐行處理大檔案
- [ ] **及時清理** - 不保留不需要的資料
- [ ] **限制快取大小** - 設定快取上限

---

## ✅ 最終檢查清單

### Phase 1-2: 規劃和設計
- [ ] 需求明確且合理
- [ ] Hook 類型選擇正確
- [ ] 實作方式適當

### Phase 3: 實作
- [ ] 腳本架構完整
- [ ] 程式碼品質良好
- [ ] 錯誤處理完善

### Phase 4: 測試
- [ ] 所有測試通過
- [ ] 效能符合目標
- [ ] 無副作用

### Phase 5: 配置
- [ ] settings.local.json 正確
- [ ] 檔案權限正確
- [ ] 環境變數設定

### Phase 6: 文件
- [ ] 腳本內文件完整
- [ ] README 文件清晰
- [ ] 專案文件已更新

### Phase 7: 部署
- [ ] 灰度發布成功
- [ ] 監控機制建立
- [ ] 維護計畫明確

---

## 📚 相關文件

- **[Hook 基礎概念](./01-hook-fundamentals.md)** - Hook 系統基本原理
- **[Hook 最佳實踐](./02-hook-best-practices.md)** - 進階技巧
- **[UV 單檔腳本模式](./03-uv-single-file-pattern.md)** - Python Hook 開發
- **[Hook 範例集](./04-hook-examples.md)** - 實用範例
- **[語音通知整合](./05-voice-notification.md)** - TTS 實作指南

---

## 🔗 工具和資源

### Debug 工具
```bash
# 啟用 Debug 模式
claude --debug

# 檢查 Debug Log
tail -f ~/.claude/debug.log
```

### 測試工具
```bash
# JSON 格式驗證
cat test-input.json | jq .

# Bash 語法檢查
bash -n my-hook.sh

# Python 語法檢查
python3 -m py_compile my-hook.py
```

### 效能工具
```bash
# 執行時間測量
time cat test-input.json | my-hook.py

# 記憶體使用監控
/usr/bin/time -l cat test-input.json | my-hook.py
```

---

**文件版本**: v1.0
**建立日期**: 2025-10-09
**維護者**: rosemary-project-manager
