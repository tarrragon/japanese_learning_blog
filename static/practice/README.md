# 日文輸入練習系統

## 概述

基於事件驅動架構（Event-Driven）和領域驅動設計（DDD）的日文羅馬字輸入練習系統。

## 架構圖

```
┌─────────────────────────────────────────────────────────────────────┐
│                           UI Layer                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │   index.html    │  │   style.css     │  │ PracticeController│     │
│  │   (靜態結構)     │  │   (樣式)        │  │   (DOM 操作)     │     │
│  └─────────────────┘  └─────────────────┘  └────────┬────────┘     │
│                                                      │               │
│                                            訂閱事件 / 轉發按鍵        │
└──────────────────────────────────────────────────────┼───────────────┘
                                                       │
┌──────────────────────────────────────────────────────┼───────────────┐
│                        Event Bus                     │               │
│  ┌───────────────────────────────────────────────────▼─────────────┐ │
│  │                        EventBus                                 │ │
│  │   on(eventType, handler)  /  emit(event)                        │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ KeyPressed    │  │ CharacterCompleted│ │ SpeechRequested │
│ RomajiMatched │  │ CharacterMistaken │ │ SessionCompleted│
└───────────────┘  └─────────────────┘  └────────┬────────┘
                                                  │
┌─────────────────────────────────────────────────┼─────────────────────┐
│                     Application Services         │                     │
│                                                  ▼                     │
│                                        ┌─────────────────┐            │
│                                        │  SpeechService  │            │
│                                        │  (Web Speech API)│            │
│                                        └─────────────────┘            │
└───────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────┐
│                          Domain Layer                                  │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                    TypingSession (Aggregate Root)                │  │
│  │                                                                  │  │
│  │  - question: Question                                            │  │
│  │  - inputBuffer: InputBuffer                                      │  │
│  │  - startTime: Date                                               │  │
│  │  - handleKeyPress(key) → 發出 Domain Events                      │  │
│  └──────────────────────────┬──────────────────────────────────────┘  │
│                             │                                          │
│              ┌──────────────┴──────────────┐                          │
│              ▼                              ▼                          │
│  ┌─────────────────────┐      ┌─────────────────────┐                 │
│  │      Question       │      │    InputBuffer      │                 │
│  │                     │      │                     │                 │
│  │  - text: string     │      │  - value: string    │                 │
│  │  - characters[]     │      │  - add(key)         │                 │
│  │  - currentIndex     │      │  - tryMatch(char)   │                 │
│  │  - advance()        │      │  - reset()          │                 │
│  └──────────┬──────────┘      └─────────────────────┘                 │
│             │                                                          │
│             ▼                                                          │
│  ┌─────────────────────┐      ┌─────────────────────┐                 │
│  │     Character       │◄─────│     RomajiMap       │                 │
│  │                     │      │                     │                 │
│  │  - kana: string     │      │  あ → [a]           │                 │
│  │  - romaji: string[] │      │  か → [ka]          │                 │
│  │  - state: State     │      │  し → [si, shi]     │                 │
│  │  - matchesRomaji()  │      │  ...                │                 │
│  └─────────────────────┘      └─────────────────────┘                 │
│                                                                        │
└───────────────────────────────────────────────────────────────────────┘
```

## 目錄結構

```
static/practice/          ← UI 層（你在這裡）
├── index.html            # 靜態 HTML 結構
├── style.css             # 樣式定義
└── README.md             # 本文件

src/                      ← Domain 層
├── domain/
│   ├── RomajiMap.js      # 羅馬字對應表（已完成）
│   ├── Character.js      # 字元 Value Object
│   ├── Question.js       # 題目 Entity
│   ├── InputBuffer.js    # 輸入緩衝區 Value Object
│   └── TypingSession.js  # Aggregate Root
│
└── services/
    └── SpeechService.js  # 語音朗讀服務

tests/                    ← BDD 測試
├── domain/
│   ├── Character.test.js
│   ├── Question.test.js
│   ├── InputBuffer.test.js
│   └── TypingSession.test.js
└── integration/
    └── TypingFlow.test.js
```

## Domain Events

系統透過事件驅動 UI 更新，避免 Domain 層直接依賴 UI。

| 事件 | 觸發時機 | 資料 | UI 反應 |
|------|----------|------|---------|
| `KeyPressed` | 使用者按下任意鍵 | `{ key, timestamp }` | 記錄輸入 |
| `RomajiMatched` | 輸入匹配部分羅馬字 | `{ romaji, isPartial }` | 更新緩衝區顯示 |
| `CharacterCompleted` | 完成一個假名 | `{ character, duration }` | 字元變灰、推進 |
| `CharacterMistaken` | 輸入錯誤 | `{ expected, actual }` | 紅色閃爍 |
| `SpeechRequested` | 需要朗讀 | `{ text }` | 觸發語音 |
| `SessionCompleted` | 完成整個題目 | `{ totalTime, accuracy }` | 顯示結果 |

## 狀態機

### Character 狀態

```
PENDING ──(成為當前目標)──▶ CURRENT ──(輸入正確)──▶ COMPLETED
                              │
                              │ (輸入錯誤)
                              ▼
                           CURRENT (保持，觸發錯誤事件)
```

### 輸入匹配流程

```
使用者按鍵
    │
    ▼
┌─────────────────┐
│ InputBuffer.add │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ tryMatch(char)  │
└────────┬────────┘
         │
    ┌────┴────┬────────────┐
    ▼         ▼            ▼
 COMPLETE   PARTIAL    MISMATCH
    │         │            │
    ▼         ▼            ▼
 完成字元   等待更多    重置 buffer
 朗讀假名   輸入       觸發錯誤
```

## 技術決策

| 項目 | 決策 | 理由 |
|------|------|------|
| 測試框架 | Bun Test | 內建、快速、零配置 |
| 架構模式 | Event-Driven + DDD | 邏輯清晰、UI 解耦、易測試 |
| 語音朗讀 | Web Speech API | 瀏覽器原生、無依賴 |
| 打包工具 | Bun Build | 與測試框架一致 |
| 資料不可變 | Immutable Pattern | 狀態可預測、易於追蹤 |

## 執行命令

```bash
# 執行測試
bun test

# 監聽模式
bun test --watch

# 打包（未來）
bun build src/main.js --outdir static/practice/js
```

## 羅馬字輸入對應

系統支援多種輸入方式：

| 假名 | 可接受輸入 |
|------|-----------|
| し | `si`, `shi` |
| ち | `ti`, `chi` |
| つ | `tu`, `tsu` |
| ふ | `hu`, `fu` |
| じ | `zi`, `ji` |
| しゃ | `sya`, `sha` |
| ちゃ | `tya`, `cha` |
| じゃ | `zya`, `ja`, `jya` |

## 開發流程（TDD）

1. **紅色** - 執行測試，確認失敗
2. **綠色** - 實作最小程式碼讓測試通過
3. **重構** - 改善程式碼品質，確保測試仍通過

```bash
# 持續執行測試
bun test --watch
```

## 相關文檔

- [v1.0.9 規格](../../doc/specs/v1.0.9-typing-logic.md)
- [v1.0.8 UI 規格](../../doc/specs/v1.0.8-practice-ui.md)
