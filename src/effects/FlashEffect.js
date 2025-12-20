/**
 * FlashEffect - 視覺閃爍效果
 *
 * 負責顯示成功/錯誤的視覺回饋
 */

export class FlashEffect {
  #container;
  #successClass;
  #errorClass;
  #duration;

  /**
   * @param {HTMLElement} container - 要添加效果的容器元素
   * @param {Object} [options]
   * @param {string} [options.successClass='flash-success'] - 成功效果的 CSS class
   * @param {string} [options.errorClass='flash-error'] - 錯誤效果的 CSS class
   * @param {number} [options.duration=200] - 效果持續時間（毫秒）
   */
  constructor(container, options = {}) {
    this.#container = container;
    this.#successClass = options.successClass || 'flash-success';
    this.#errorClass = options.errorClass || 'flash-error';
    this.#duration = options.duration || 200;
  }

  /**
   * 顯示成功效果
   */
  flashSuccess() {
    this.#flash(this.#successClass);
  }

  /**
   * 顯示錯誤效果
   */
  flashError() {
    this.#flash(this.#errorClass);
  }

  /**
   * 顯示閃爍效果
   * @param {string} className - CSS class 名稱
   * @private
   */
  #flash(className) {
    if (!this.#container) return;

    this.#container.classList.add(className);

    setTimeout(() => {
      this.#container?.classList.remove(className);
    }, this.#duration);
  }

  /**
   * 設定容器元素
   * @param {HTMLElement} container
   */
  setContainer(container) {
    this.#container = container;
  }

  /**
   * 取得容器元素（用於測試）
   * @returns {HTMLElement | null}
   */
  getContainer() {
    return this.#container;
  }
}
