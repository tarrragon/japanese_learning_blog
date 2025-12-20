/**
 * InputHandler - 輸入處理抽象基類
 *
 * 定義所有輸入處理器必須實現的介面
 */

export class InputHandler {
  #session = null;
  #onUpdate = null;

  constructor() {
    if (new.target === InputHandler) {
      throw new Error('InputHandler is abstract and cannot be instantiated directly');
    }
    this.isActive = false;
  }

  /**
   * 設定 TypingSession
   * @param {import('../domain/TypingSession.js').TypingSession} session
   */
  setSession(session) {
    this.#session = session;
  }

  /**
   * 取得當前 Session
   * @returns {import('../domain/TypingSession.js').TypingSession | null}
   */
  get session() {
    return this.#session;
  }

  /**
   * 設定更新回調
   * @param {Function} callback - 當輸入導致狀態變化時呼叫
   */
  setUpdateCallback(callback) {
    this.#onUpdate = callback;
  }

  /**
   * 觸發更新回調
   * @protected
   */
  triggerUpdate() {
    if (this.#onUpdate) {
      this.#onUpdate();
    }
  }

  /**
   * 啟用輸入處理
   */
  activate() {
    this.isActive = true;
  }

  /**
   * 停用輸入處理
   */
  deactivate() {
    this.isActive = false;
  }

  /**
   * 清理資源
   */
  dispose() {
    this.deactivate();
    this.#session = null;
    this.#onUpdate = null;
  }

  /**
   * 更新鍵盤高亮（子類可選實現）
   */
  updateHighlight() {
    // 預設不做任何事
  }
}
