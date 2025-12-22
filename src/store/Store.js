/**
 * Store - 輕量級狀態管理
 *
 * @module store/Store
 * @description
 * 採用 Flux 架構的簡化實作，提供可預測的狀態管理。
 *
 * ## 設計模式：Flux 單向資料流
 *
 * ```
 * ┌─────────┐     ┌──────────┐     ┌─────────┐     ┌──────────┐
 * │  View   │ ──▶ │  Action  │ ──▶ │  Store  │ ──▶ │   View   │
 * │ (UI)    │     │ (事件)    │     │ (狀態)   │     │ (更新)    │
 * └─────────┘     └──────────┘     └─────────┘     └──────────┘
 *      │                               │
 *      │         dispatch(action)      │
 *      └───────────────────────────────┘
 * ```
 *
 * ## 核心原則
 *
 * 1. **單一資料來源 (Single Source of Truth)**
 *    - 整個應用程式的狀態儲存在單一 Store 物件中
 *    - 避免狀態分散導致的同步問題
 *
 * 2. **狀態唯讀 (State is Read-Only)**
 *    - 不能直接修改 state，必須透過 dispatch(action) 觸發變更
 *    - 確保狀態變更可追蹤、可預測
 *
 * 3. **純函數更新 (Changes via Pure Functions)**
 *    - Reducer 是純函數：(state, action) => newState
 *    - 相同輸入永遠產生相同輸出，便於測試和除錯
 *
 * ## 選擇性訂閱設計
 *
 * Store 通知所有訂閱者，由訂閱者自行決定是否處理：
 *
 * ```javascript
 * store.subscribe((state, action) => {
 *   // 選擇性處理：只響應特定 action
 *   switch (action.type) {
 *     case 'TOGGLE_KEYBOARD':
 *       updateKeyboardUI(state.uiSettings.showKeyboard);
 *       break;
 *     // 忽略其他 action
 *   }
 * });
 * ```
 *
 * ## 與 Redux 的差異
 *
 * | 特性           | 本實作      | Redux        |
 * |---------------|------------|--------------|
 * | Middleware    | ✗ 無       | ✓ 有         |
 * | DevTools      | ✗ 無       | ✓ 有         |
 * | Selector      | ✗ 無       | ✓ reselect   |
 * | 非同步處理     | 外部處理    | thunk/saga   |
 * | 程式碼量       | ~90 行     | ~2000+ 行    |
 *
 * ## 使用範例
 *
 * ```javascript
 * // 1. 定義 reducer
 * const reducer = (state, action) => {
 *   switch (action.type) {
 *     case 'INCREMENT':
 *       return { ...state, count: state.count + 1 };
 *     default:
 *       return state;
 *   }
 * };
 *
 * // 2. 建立 store
 * const store = new Store(reducer, { count: 0 });
 *
 * // 3. 訂閱變更
 * const unsubscribe = store.subscribe((state, action) => {
 *   console.log('New count:', state.count);
 * });
 *
 * // 4. 派發動作
 * store.dispatch({ type: 'INCREMENT' });
 *
 * // 5. 取消訂閱
 * unsubscribe();
 * ```
 */

export class Store {
  /** @type {Object} 當前應用程式狀態 */
  #state;

  /** @type {Set<Function>} 狀態變更監聽器集合 */
  #listeners;

  /** @type {Function} 狀態更新純函數 */
  #reducer;

  /**
   * 建立 Store 實例
   *
   * @param {Function} reducer - 狀態更新函數，簽名: (state, action) => newState
   * @param {Object} initialState - 初始狀態物件
   *
   * @example
   * const store = new Store(appReducer, { count: 0, user: null });
   */
  constructor(reducer, initialState) {
    this.#state = initialState;
    this.#listeners = new Set();
    this.#reducer = reducer;
  }

  /**
   * 取得當前狀態
   *
   * @returns {Object} 當前狀態（應視為唯讀，直接修改不會觸發更新）
   *
   * @example
   * const { inputMode, uiSettings } = store.getState();
   */
  getState() {
    return this.#state;
  }

  /**
   * 派發動作以更新狀態
   *
   * 這是改變狀態的唯一方式。動作會傳給 reducer，
   * reducer 計算新狀態後，若狀態有變化則通知所有訂閱者。
   *
   * @param {Object} action - 動作物件
   * @param {string} action.type - 動作類型（必要）
   * @param {*} [action.payload] - 動作附帶的資料（選填）
   * @throws {Error} 若 action 沒有 type 屬性
   *
   * @example
   * // 簡單動作
   * store.dispatch({ type: 'TOGGLE_KEYBOARD' });
   *
   * // 帶資料的動作
   * store.dispatch({ type: 'SET_FILTER', payload: { key: 'jlpt', value: 'N3' } });
   */
  dispatch(action) {
    if (!action || typeof action.type !== 'string') {
      throw new Error('Action must have a type property');
    }

    const prevState = this.#state;
    this.#state = this.#reducer(this.#state, action);

    // 淺層比較：只在狀態引用改變時通知訂閱者
    // Reducer 必須返回新物件才會觸發更新（Immutable 原則）
    if (prevState !== this.#state) {
      this.#notify(action);
    }
  }

  /**
   * 訂閱狀態變化
   *
   * 當狀態變化時，所有訂閱者都會收到通知。
   * 訂閱者可透過 action.type 實作選擇性處理。
   *
   * @param {Function} listener - 回調函數，接收 (state, action) 參數
   * @returns {Function} 取消訂閱函數，呼叫後不再收到通知
   *
   * @example
   * // 訂閱並實作選擇性處理
   * const unsubscribe = store.subscribe((state, action) => {
   *   if (action.type === 'COMPLETE_SESSION') {
   *     showResult(state.result);
   *   }
   * });
   *
   * // 元件卸載時取消訂閱
   * unsubscribe();
   */
  subscribe(listener) {
    if (typeof listener !== 'function') {
      throw new Error('Listener must be a function');
    }

    this.#listeners.add(listener);

    // 返回取消訂閱函數（閉包模式）
    return () => {
      this.#listeners.delete(listener);
    };
  }

  /**
   * 通知所有訂閱者
   *
   * @param {Object} action - 觸發變化的動作
   * @private
   */
  #notify(action) {
    this.#listeners.forEach((listener) => {
      try {
        listener(this.#state, action);
      } catch (error) {
        // 隔離錯誤：單一訂閱者的錯誤不影響其他訂閱者
        console.error('Store listener error:', error);
      }
    });
  }

  /**
   * 取得訂閱者數量
   *
   * 主要用於測試和除錯，確認訂閱/取消訂閱正確運作。
   *
   * @returns {number} 目前的訂閱者數量
   */
  getListenerCount() {
    return this.#listeners.size;
  }
}
