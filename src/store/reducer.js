/**
 * Reducer - 狀態更新邏輯
 *
 * @module store/reducer
 * @description
 * 純函數，根據 action 類型計算並返回新狀態。
 *
 * ## Reducer 設計原則
 *
 * 1. **純函數 (Pure Function)**
 *    - 給定相同的 (state, action)，永遠返回相同的結果
 *    - 不產生副作用（不修改參數、不呼叫 API、不存取外部變數）
 *
 * 2. **不可變性 (Immutability)**
 *    - 不直接修改 state，而是返回新物件
 *    - 使用展開運算符 {...state} 建立淺拷貝
 *    - 確保 Store 的淺層比較能正確偵測變化
 *
 * 3. **預設返回原狀態**
 *    - 未知的 action.type 應返回原 state
 *    - 確保 reducer 可組合且不會意外丟失狀態
 *
 * ## 狀態更新模式
 *
 * ```javascript
 * // ✓ 正確：返回新物件
 * return { ...state, count: state.count + 1 };
 *
 * // ✗ 錯誤：直接修改 state
 * state.count += 1;
 * return state;
 *
 * // ✓ 正確：巢狀物件也要展開
 * return {
 *   ...state,
 *   uiSettings: {
 *     ...state.uiSettings,
 *     showKeyboard: true,
 *   },
 * };
 *
 * // ✗ 錯誤：只展開外層
 * state.uiSettings.showKeyboard = true;
 * return { ...state };
 * ```
 *
 * ## 狀態機轉換
 *
 * ```
 * status 狀態轉換圖：
 *
 *                    START_LOADING
 *   ┌─────────────────────────────────────┐
 *   │                                     ▼
 * ┌─────┐                           ┌─────────┐
 * │idle │ ──── START_LOADING ────▶  │loading  │
 * └─────┘                           └─────────┘
 *   ▲                                    │
 *   │                    ┌───────────────┼───────────────┐
 *   │                    │               │               │
 *   │              SUCCESS          FAILURE        COMPLETE
 *   │                    ▼               ▼               ▼
 *   │              ┌──────────┐    ┌─────────┐    ┌───────────┐
 *   │              │practicing│    │  error  │    │ completed │
 *   │              └──────────┘    └─────────┘    └───────────┘
 *   │                    │                              │
 *   │            COMPLETE_SESSION                       │
 *   │                    │                              │
 *   │                    ▼                              │
 *   │              ┌───────────┐                        │
 *   └───────────── │ completed │ ◀──────────────────────┘
 *    RESET_SESSION └───────────┘
 * ```
 */

import { ActionTypes } from './actions.js';

/**
 * 應用程式 Reducer
 *
 * 根據 action 類型計算新狀態。
 * 每個 case 都返回新的狀態物件，確保不可變性。
 *
 * @param {import('./AppState.js').AppState} state - 當前狀態
 * @param {Object} action - 動作物件
 * @param {string} action.type - 動作類型
 * @param {*} [action.payload] - 動作資料
 * @returns {import('./AppState.js').AppState} 新狀態
 *
 * @example
 * // 在 Store 中使用
 * const store = new Store(appReducer, initialState);
 *
 * // 測試 reducer
 * const newState = appReducer(
 *   { inputMode: 'romaji' },
 *   { type: 'SET_INPUT_MODE', payload: 'direct' }
 * );
 * expect(newState.inputMode).toBe('direct');
 */
export function appReducer(state, action) {
  switch (action.type) {
    // ─────────────────────────────────────────────────────────
    // 模式切換
    // ─────────────────────────────────────────────────────────

    case ActionTypes.SET_PRACTICE_MODE:
      return {
        ...state,
        practiceMode: action.payload,
      };

    case ActionTypes.SET_INPUT_MODE:
      return {
        ...state,
        inputMode: action.payload,
      };

    // ─────────────────────────────────────────────────────────
    // UI 設定（巢狀物件更新）
    // ─────────────────────────────────────────────────────────

    case ActionTypes.TOGGLE_ROMAJI_HINT:
      return {
        ...state,
        uiSettings: {
          ...state.uiSettings,
          showRomajiHint: !state.uiSettings.showRomajiHint,
        },
      };

    case ActionTypes.TOGGLE_KEYBOARD:
      return {
        ...state,
        uiSettings: {
          ...state.uiSettings,
          showKeyboard: !state.uiSettings.showKeyboard,
        },
      };

    // ─────────────────────────────────────────────────────────
    // 篩選條件（動態鍵值）
    // ─────────────────────────────────────────────────────────

    case ActionTypes.SET_FILTER:
      return {
        ...state,
        filters: {
          ...state.filters,
          [action.payload.key]: action.payload.value,
        },
      };

    // ─────────────────────────────────────────────────────────
    // Session 生命週期
    // ─────────────────────────────────────────────────────────

    case ActionTypes.START_LOADING:
      return {
        ...state,
        status: 'loading',
        error: null,
      };

    case ActionTypes.LOAD_QUESTION_SUCCESS:
      return {
        ...state,
        status: 'practicing',
        currentQuestion: action.payload,
        error: null,
      };

    case ActionTypes.LOAD_QUESTION_FAILURE:
      return {
        ...state,
        status: 'error',
        error: action.payload,
      };

    case ActionTypes.COMPLETE_SESSION:
      return {
        ...state,
        status: 'completed',
        result: action.payload,
      };

    // ─────────────────────────────────────────────────────────
    // 清理
    // ─────────────────────────────────────────────────────────

    case ActionTypes.RESET_SESSION:
      return {
        ...state,
        status: 'idle',
        currentQuestion: null,
        result: null,
        error: null,
      };

    // ─────────────────────────────────────────────────────────
    // 未知 Action：返回原狀態
    // ─────────────────────────────────────────────────────────

    default:
      return state;
  }
}
