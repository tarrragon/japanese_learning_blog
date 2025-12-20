/**
 * DirectInputHandler - 直接輸入處理器
 *
 * 處理手機輸入（使用日文 IME 直接輸入假名）
 */

import { InputHandler } from './InputHandler.js';

export class DirectInputHandler extends InputHandler {
  #inputElement;
  #boundInputHandler = null;
  #boundCompositionHandler = null;

  /**
   * @param {HTMLInputElement} [inputElement] - 輸入框元素
   */
  constructor(inputElement = null) {
    super();
    this.#inputElement = inputElement;
  }

  /**
   * 設定輸入框元素
   * @param {HTMLInputElement} element
   */
  setInputElement(element) {
    this.#inputElement = element;
  }

  /**
   * 啟用輸入處理
   */
  activate() {
    // 先停用，確保不會重複註冊
    this.deactivate();

    super.activate();

    if (!this.#inputElement) {
      console.warn('DirectInputHandler: Input element not set');
      return;
    }

    this.#boundInputHandler = this.#handleInput.bind(this);
    this.#boundCompositionHandler = this.#handleInput.bind(this);

    this.#inputElement.addEventListener('input', this.#boundInputHandler);
    this.#inputElement.addEventListener('compositionend', this.#boundCompositionHandler);

    // 清空並自動 focus
    this.#inputElement.value = '';
    setTimeout(() => {
      this.#inputElement?.focus();
    }, 100);
  }

  /**
   * 停用輸入處理
   */
  deactivate() {
    super.deactivate();

    if (this.#inputElement) {
      if (this.#boundInputHandler) {
        this.#inputElement.removeEventListener('input', this.#boundInputHandler);
      }
      if (this.#boundCompositionHandler) {
        this.#inputElement.removeEventListener('compositionend', this.#boundCompositionHandler);
      }
    }

    this.#boundInputHandler = null;
    this.#boundCompositionHandler = null;
  }

  /**
   * 處理輸入事件
   * @param {Event} event
   * @private
   */
  #handleInput(event) {
    if (!this.isActive || !this.session || !this.#inputElement) return;

    const value = this.#inputElement.value;
    if (!value) return;

    const result = this.session.handleDirectInput(value);

    if (result.matchedCount > 0) {
      // 成功匹配：只清除已消耗的部分
      this.#inputElement.value = value.substring(result.consumedLength);
      this.triggerUpdate();
    }
    // 失敗：保留輸入框內容，讓用戶修正
  }

  /**
   * 清理資源
   */
  dispose() {
    this.deactivate();
    if (this.#inputElement) {
      this.#inputElement.value = '';
    }
    super.dispose();
  }

  /**
   * 讓輸入框獲得焦點
   */
  focus() {
    this.#inputElement?.focus();
  }

  /**
   * 取得輸入框元素（用於測試）
   * @returns {HTMLInputElement | null}
   */
  getInputElement() {
    return this.#inputElement;
  }
}
