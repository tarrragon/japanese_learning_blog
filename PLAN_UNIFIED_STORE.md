# 計畫：統一事件系統到 Store

## 目標

將 TypingSession 的事件發布/訂閱模式整合進 Store 的單向資料流，實現：
- 單一資料來源
- 可追蹤的狀態變更
- 更好的測試覆蓋

## 現況分析

### 目前架構

```
User Input
    │
    ▼
TypingSession.handleKeyPress()
    │
    ├──▶ emit(KEY_PRESSED)         ──▶ 無人監聽
    ├──▶ emit(ROMAJI_MATCHED)      ──▶ App.js (UI 更新)
    ├──▶ emit(CHARACTER_COMPLETED) ──▶ App.js (閃爍 + 渲染)
    ├──▶ emit(CHARACTER_MISTAKEN)  ──▶ App.js + PracticeMode
    ├──▶ emit(SPEECH_REQUESTED)    ──▶ PracticeMode (語音)
    └──▶ emit(SESSION_COMPLETED)   ──▶ PracticeMode ──▶ Store
```

### 目標架構

```
User Input
    │
    ▼
InputHandler
    │
    ▼
Store.dispatch(action)
    │
    ▼
Reducer (純函數計算新狀態)
    │
    ▼
Store.notify(subscribers)
    │
    ├──▶ App.js (UI 更新)
    ├──▶ SpeechService (語音)
    └──▶ FlashEffect (視覺效果)
```

## 實作步驟

### 階段 1：新增 Session 相關 Actions（低風險）

**檔案：** `src/store/actions.js`

```javascript
// 新增 Action Types
export const ActionTypes = {
  // ... 現有 ...

  // Session 即時事件
  KEY_PRESS: 'KEY_PRESS',
  ROMAJI_MATCH: 'ROMAJI_MATCH',
  CHARACTER_COMPLETE: 'CHARACTER_COMPLETE',
  CHARACTER_MISTAKE: 'CHARACTER_MISTAKE',
  SPEECH_REQUEST: 'SPEECH_REQUEST',
};

// 新增 Action Creators
export const actions = {
  // ... 現有 ...

  keyPress: (key) => ({
    type: ActionTypes.KEY_PRESS,
    payload: { key, timestamp: Date.now() },
  }),

  romajiMatch: (romaji, isPartial) => ({
    type: ActionTypes.ROMAJI_MATCH,
    payload: { romaji, isPartial },
  }),

  characterComplete: (character, duration) => ({
    type: ActionTypes.CHARACTER_COMPLETE,
    payload: { character, duration },
  }),

  characterMistake: (expected, actual) => ({
    type: ActionTypes.CHARACTER_MISTAKE,
    payload: { expected, actual },
  }),

  speechRequest: (text) => ({
    type: ActionTypes.SPEECH_REQUEST,
    payload: { text },
  }),
};
```

### 階段 2：擴展 AppState（低風險）

**檔案：** `src/store/AppState.js`

```javascript
export const initialState = {
  // ... 現有 ...

  // 新增：Session 即時狀態
  session: {
    inputBuffer: '',      // 當前輸入緩衝
    currentIndex: 0,      // 當前字元索引
    keystrokes: 0,        // 總按鍵數
    mistakes: 0,          // 錯誤數
    startTime: null,      // 開始時間
  },
};
```

### 階段 3：擴展 Reducer（中風險）

**檔案：** `src/store/reducer.js`

```javascript
case ActionTypes.KEY_PRESS:
  return {
    ...state,
    session: {
      ...state.session,
      keystrokes: state.session.keystrokes + 1,
    },
  };

case ActionTypes.ROMAJI_MATCH:
  return {
    ...state,
    session: {
      ...state.session,
      inputBuffer: action.payload.romaji,
    },
  };

case ActionTypes.CHARACTER_COMPLETE:
  return {
    ...state,
    session: {
      ...state.session,
      inputBuffer: '',
      currentIndex: state.session.currentIndex + 1,
    },
  };

case ActionTypes.CHARACTER_MISTAKE:
  return {
    ...state,
    session: {
      ...state.session,
      inputBuffer: '',
      mistakes: state.session.mistakes + 1,
    },
  };

case ActionTypes.SPEECH_REQUEST:
  // 純狀態，不執行副作用
  return state;
```

### 階段 4：建立 Middleware 層處理副作用（中風險）

**新檔案：** `src/store/middleware/effectMiddleware.js`

```javascript
/**
 * 副作用中介層
 *
 * 監聽特定 Action，執行非純函數操作（語音、閃爍等）
 */
export function createEffectMiddleware(dependencies) {
  const { speechService, flashEffect } = dependencies;

  return (state, action) => {
    switch (action.type) {
      case 'CHARACTER_COMPLETE':
        flashEffect?.flashSuccess();
        break;

      case 'CHARACTER_MISTAKE':
        flashEffect?.flashError();
        break;

      case 'SPEECH_REQUEST':
        speechService?.speak(action.payload.text);
        break;
    }
  };
}
```

### 階段 5：重構 TypingSession（高風險）

**選項 A：TypingSession 改為發送 Store Actions**

```javascript
// 修改前
this.#emit(SessionEventTypes.CHARACTER_COMPLETED, { character, duration });

// 修改後
this.#store.dispatch(actions.characterComplete(character, duration));
```

**選項 B：保留 TypingSession 事件，在 Adapter 層轉換**

```javascript
// 新檔案：src/adapters/SessionStoreAdapter.js
export class SessionStoreAdapter {
  constructor(session, store) {
    session.on(SessionEventTypes.CHARACTER_COMPLETED, (e) => {
      store.dispatch(actions.characterComplete(e.character, e.duration));
    });
    // ... 其他事件
  }
}
```

**建議：選項 B**（風險較低，漸進式重構）

### 階段 6：更新 App.js 訂閱邏輯（中風險）

```javascript
#handleStateChange(state, action) {
  switch (action.type) {
    // 現有
    case 'COMPLETE_SESSION':
    case 'TOGGLE_ROMAJI_HINT':
    case 'TOGGLE_KEYBOARD':

    // 新增
    case 'ROMAJI_MATCH':
      this.#updateBufferDisplay(state.session.inputBuffer);
      break;

    case 'CHARACTER_COMPLETE':
      this.#render();
      break;
  }
}
```

### 階段 7：新增整合測試

**新檔案：** `tests/integration/SessionStoreFlow.test.js`

```javascript
describe('Session → Store 整合', () => {
  it('按鍵輸入應觸發 KEY_PRESS action', () => {});
  it('字元完成應觸發 CHARACTER_COMPLETE action', () => {});
  it('CHARACTER_COMPLETE 應觸發閃爍效果', () => {});
  it('SPEECH_REQUEST 應觸發語音服務', () => {});
});
```

## 實作順序

| 順序 | 階段 | 風險 | 預估變更檔案數 |
|------|------|------|--------------|
| 1 | 新增 Actions | 低 | 1 |
| 2 | 擴展 AppState | 低 | 1 |
| 3 | 擴展 Reducer | 中 | 1 |
| 4 | 新增測試 | 低 | 1 |
| 5 | 建立 Adapter | 中 | 1 (新) |
| 6 | 建立 Middleware | 中 | 1 (新) |
| 7 | 更新 App.js | 中 | 1 |
| 8 | 移除舊監聽器 | 高 | 2-3 |

## 回滾策略

每個階段獨立 commit，若出問題可 revert 單一 commit：

```
commit 1: feat: 新增 Session 相關 Actions
commit 2: feat: 擴展 AppState 包含 session 狀態
commit 3: feat: Reducer 處理 Session actions
commit 4: test: 新增 Session-Store 整合測試
commit 5: feat: 新增 SessionStoreAdapter
commit 6: feat: 新增 effectMiddleware
commit 7: refactor: App.js 使用 Store 訂閱
commit 8: refactor: 移除 PracticeMode 直接事件監聽
```

## 風險評估

| 風險 | 影響 | 緩解措施 |
|------|------|---------|
| 破壞現有功能 | 高 | 每階段運行完整測試 |
| 效能下降 | 中 | 保留直接 UI 更新路徑 |
| 測試失敗 | 中 | 先更新測試再改程式碼 |

## 預期成果

1. **單一資料流**：所有狀態變更經過 Store
2. **可追蹤性**：Redux DevTools 兼容（未來可加）
3. **測試覆蓋**：Session → Store → UI 完整測試
4. **程式碼簡化**：移除分散的事件監聽器

---

## 實作完成報告

### 已完成項目

1. ✅ **階段 1：新增 Session Actions** - `src/store/actions.js`
   - 新增 KEY_PRESS, ROMAJI_MATCH, CHARACTER_COMPLETE, CHARACTER_MISTAKE, SPEECH_REQUEST

2. ✅ **階段 2：擴展 AppState** - `src/store/AppState.js`
   - 新增 session 狀態結構（inputBuffer, currentIndex, keystrokes, mistakes, startTime）

3. ✅ **階段 3：擴展 Reducer** - `src/store/reducer.js`
   - 處理所有新增的 Session actions

4. ✅ **階段 4：新增整合測試** - `tests/integration/SessionStoreFlow.test.js`
   - 13 個測試案例驗證 Session → Store 流程

5. ✅ **階段 5：建立 SessionStoreAdapter** - `src/adapters/SessionStoreAdapter.js`
   - 將 TypingSession 事件轉發到 Store
   - 包含 10 個單元測試

6. ✅ **階段 6：建立 EffectMiddleware** - `src/store/middleware/effectMiddleware.js`
   - 處理 CHARACTER_COMPLETE（閃爍成功）和 CHARACTER_MISTAKE（閃爍錯誤）
   - 包含 6 個單元測試

7. ✅ **階段 7：更新 App.js** - `src/App.js`
   - 整合 SessionStoreAdapter 和 effectMiddleware
   - 使用 ActionTypes 常量
   - 新增 ROMAJI_MATCH 和 CHARACTER_COMPLETE 的 Store 訂閱處理

8. ✅ **階段 8：移除舊監聽器** - `src/App.js`
   - 移除 CHARACTER_COMPLETED, CHARACTER_MISTAKEN, ROMAJI_MATCHED 直接事件監聽

### 設計決策

**語音處理（Hybrid 方案）**：
- SPEECH_REQUEST 不改變 Store 狀態
- Store 不會為不變的狀態通知訂閱者
- 因此保留 PracticeMode 的 SPEECH_REQUESTED 直接監聽器
- effectMiddleware 中的 SPEECH_REQUEST 處理保留備用

### 測試結果

- 469 個測試全部通過
- 新增 29 個測試（13 + 10 + 6）

### 額外變更

- `TypingSession.on()` 現在返回 unsubscribe 函數，支援清理
