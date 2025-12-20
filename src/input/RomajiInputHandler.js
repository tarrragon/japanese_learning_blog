/**
 * RomajiInputHandler - 羅馬字輸入處理器
 *
 * 處理實體鍵盤輸入，將按鍵轉換為羅馬字並傳遞給 TypingSession
 */

import { InputHandler } from './InputHandler.js';

export class RomajiInputHandler extends InputHandler {
  #keyboardRenderer;
  #boundHandler = null;

  /**
   * @param {import('../ui/KeyboardRenderer.js').KeyboardRenderer} [keyboardRenderer] - 虛擬鍵盤渲染器
   */
  constructor(keyboardRenderer = null) {
    super();
    this.#keyboardRenderer = keyboardRenderer;
  }

  /**
   * 啟用鍵盤監聽
   */
  activate() {
    // 先停用，確保不會重複註冊
    this.deactivate();

    super.activate();

    // 檢查 document 是否存在（測試環境可能沒有）
    if (typeof document === 'undefined') return;

    this.#boundHandler = this.#handleKeyDown.bind(this);
    document.addEventListener('keydown', this.#boundHandler);
  }

  /**
   * 停用鍵盤監聯
   */
  deactivate() {
    super.deactivate();

    if (this.#boundHandler && typeof document !== 'undefined') {
      document.removeEventListener('keydown', this.#boundHandler);
      this.#boundHandler = null;
    }
  }

  /**
   * 處理鍵盤按下事件
   * @param {KeyboardEvent} event
   * @private
   */
  #handleKeyDown(event) {
    if (!this.isActive || !this.session) return;

    // 忽略修飾鍵組合
    if (event.ctrlKey || event.altKey || event.metaKey) return;

    // 只處理單字元按鍵
    if (event.key.length !== 1) return;

    event.preventDefault();
    const key = event.key.toLowerCase();

    // 顯示按鍵效果
    this.#keyboardRenderer?.showKeyPress(key);

    // 傳遞給 Session
    this.session.handleKeyPress(key);

    // 觸發更新回調
    this.triggerUpdate();
  }

  /**
   * 更新鍵盤高亮
   */
  updateHighlight() {
    if (!this.session || !this.#keyboardRenderer) return;

    const hint = this.session.getHintRomaji();
    let nextKey = null;

    if (hint) {
      // 取得第一個字母
      for (const char of hint) {
        if (/[a-z]/i.test(char)) {
          nextKey = char.toLowerCase();
          break;
        }
      }
    }

    this.#keyboardRenderer.highlightKey(nextKey);
  }

  /**
   * 清理資源
   */
  dispose() {
    this.deactivate();
    this.#keyboardRenderer?.highlightKey(null);
    super.dispose();
  }

  /**
   * 設定鍵盤渲染器
   * @param {import('../ui/KeyboardRenderer.js').KeyboardRenderer} renderer
   */
  setKeyboardRenderer(renderer) {
    this.#keyboardRenderer = renderer;
  }
}
