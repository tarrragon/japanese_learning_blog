/**
 * InputHandlerFactory - 輸入處理器工廠
 *
 * 根據輸入模式建立對應的處理器
 */

import { RomajiInputHandler } from './RomajiInputHandler.js';
import { DirectInputHandler } from './DirectInputHandler.js';

export class InputHandlerFactory {
  #keyboardRenderer;
  #mobileInputElement;

  /**
   * @param {Object} options
   * @param {import('../ui/KeyboardRenderer.js').KeyboardRenderer} [options.keyboardRenderer] - 虛擬鍵盤渲染器
   * @param {HTMLInputElement} [options.mobileInputElement] - 手機輸入框元素
   */
  constructor(options = {}) {
    this.#keyboardRenderer = options.keyboardRenderer || null;
    this.#mobileInputElement = options.mobileInputElement || null;
  }

  /**
   * 設定鍵盤渲染器
   * @param {import('../ui/KeyboardRenderer.js').KeyboardRenderer} renderer
   */
  setKeyboardRenderer(renderer) {
    this.#keyboardRenderer = renderer;
  }

  /**
   * 設定手機輸入框元素
   * @param {HTMLInputElement} element
   */
  setMobileInputElement(element) {
    this.#mobileInputElement = element;
  }

  /**
   * 建立輸入處理器
   * @param {'romaji'|'direct'} mode - 輸入模式
   * @returns {import('./InputHandler.js').InputHandler}
   */
  create(mode) {
    switch (mode) {
      case 'romaji':
        return new RomajiInputHandler(this.#keyboardRenderer);

      case 'direct':
        return new DirectInputHandler(this.#mobileInputElement);

      default:
        throw new Error(`Unknown input mode: ${mode}`);
    }
  }

  /**
   * 取得支援的輸入模式
   * @returns {string[]}
   */
  static getSupportedModes() {
    return ['romaji', 'direct'];
  }
}
