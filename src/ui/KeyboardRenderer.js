/**
 * KeyboardRenderer
 * 處理虛擬鍵盤的視覺效果
 */
export class KeyboardRenderer {
  #container;
  #currentHighlight;

  /**
   * @param {HTMLElement} container - 鍵盤容器元素
   */
  constructor(container) {
    this.#container = container;
    this.#currentHighlight = null;
  }

  /**
   * 高亮指定按鍵
   * @param {string|null} key - 要高亮的按鍵（小寫）
   */
  highlightKey(key) {
    // 移除之前的高亮
    if (this.#currentHighlight) {
      this.#currentHighlight.classList.remove('key-target');
    }

    if (!key) {
      this.#currentHighlight = null;
      return;
    }

    // 找到對應的按鍵元素
    const keyElement = this.#container.querySelector(`[data-key="${key}"]`);
    if (keyElement) {
      keyElement.classList.add('key-target');
      this.#currentHighlight = keyElement;
    }
  }

  /**
   * 顯示按鍵按下效果
   * @param {string} key - 按下的按鍵（小寫）
   */
  showKeyPress(key) {
    const keyElement = this.#container.querySelector(`[data-key="${key}"]`);
    if (!keyElement) return;

    keyElement.classList.add('key-pressed');

    // 短暫延遲後移除效果
    setTimeout(() => {
      keyElement.classList.remove('key-pressed');
    }, 100);
  }

  /**
   * 清除所有高亮
   */
  clearHighlights() {
    const allKeys = this.#container.querySelectorAll('.key');
    allKeys.forEach(key => {
      key.classList.remove('key-target', 'key-pressed');
    });
    this.#currentHighlight = null;
  }
}
