/**
 * Store - 輕量級狀態管理
 *
 * 採用 Flux 簡化模式：
 * - 單一狀態來源
 * - 透過 dispatch(action) 更新狀態
 * - 訂閱者在狀態變化時收到通知
 */

export class Store {
  #state;
  #listeners;
  #reducer;

  /**
   * @param {Function} reducer - 狀態更新函數
   * @param {Object} initialState - 初始狀態
   */
  constructor(reducer, initialState) {
    this.#state = initialState;
    this.#listeners = new Set();
    this.#reducer = reducer;
  }

  /**
   * 取得當前狀態
   * @returns {Object} 當前狀態（唯讀）
   */
  getState() {
    return this.#state;
  }

  /**
   * 派發動作以更新狀態
   * @param {Object} action - 動作物件，必須包含 type 屬性
   */
  dispatch(action) {
    if (!action || typeof action.type !== 'string') {
      throw new Error('Action must have a type property');
    }

    const prevState = this.#state;
    this.#state = this.#reducer(this.#state, action);

    // 只在狀態實際變化時通知訂閱者
    if (prevState !== this.#state) {
      this.#notify(action);
    }
  }

  /**
   * 訂閱狀態變化
   * @param {Function} listener - 回調函數，接收 (state, action) 參數
   * @returns {Function} 取消訂閱函數
   */
  subscribe(listener) {
    if (typeof listener !== 'function') {
      throw new Error('Listener must be a function');
    }

    this.#listeners.add(listener);

    // 返回取消訂閱函數
    return () => {
      this.#listeners.delete(listener);
    };
  }

  /**
   * 通知所有訂閱者
   * @param {Object} action - 觸發變化的動作
   * @private
   */
  #notify(action) {
    this.#listeners.forEach((listener) => {
      try {
        listener(this.#state, action);
      } catch (error) {
        console.error('Store listener error:', error);
      }
    });
  }

  /**
   * 取得訂閱者數量（用於測試）
   * @returns {number}
   */
  getListenerCount() {
    return this.#listeners.size;
  }
}
