# 腳本說明

本 Skill 使用專案根目錄的腳本：

```
scripts/lookup-dictionary.py
```

## 執行方式

```bash
uv run scripts/lookup-dictionary.py <詞彙> [選項]
```

## 為什麼不複製腳本到這裡？

1. **避免重複維護**：腳本已在專案中，複製會造成版本不一致
2. **依賴管理**：使用 `uv run` 自動處理依賴
3. **專案整合**：腳本與其他維護工具放在一起，便於管理
