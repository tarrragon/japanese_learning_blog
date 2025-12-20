/**
 * RomajiRenderer - 羅馬拼音提示渲染器
 *
 * 負責渲染羅馬拼音提示
 */

export class RomajiRenderer {
  #container;

  /**
   * @param {HTMLElement} container - 羅馬拼音容器元素
   */
  constructor(container) {
    this.#container = container;
  }

  /**
   * 渲染羅馬拼音提示
   * @param {import('../domain/Question.js').Question} question - 題目物件
   */
  render(question) {
    if (!this.#container || !question) return;

    const characters = question.characters;
    const html = characters
      .map((char, index) => {
        const stateClass = `romaji-${char.state}`;
        const romaji = char.romaji[0] || '';
        return `<span class="romaji ${stateClass}" data-index="${index}">${romaji}</span>`;
      })
      .join('');

    this.#container.innerHTML = html;
    this.#scrollToCurrentChar(question.currentIndex);
  }

  /**
   * 捲動到當前字元
   * @param {number} currentIndex
   * @private
   */
  #scrollToCurrentChar(currentIndex) {
    const currentRomaji = this.#container?.querySelector(`[data-index="${currentIndex}"]`);
    if (!currentRomaji) return;

    const containerRect = this.#container.parentElement?.getBoundingClientRect();
    if (!containerRect) return;

    const containerCenter = containerRect.width / 3;
    const romajiOffset = currentRomaji.offsetLeft;
    const scrollOffset = Math.max(0, romajiOffset - containerCenter);

    this.#container.style.transform = `translateX(-${scrollOffset}px)`;
  }

  /**
   * 清空內容
   */
  clear() {
    if (this.#container) {
      this.#container.innerHTML = '';
      this.#container.style.transform = '';
    }
  }

  /**
   * 取得容器元素（用於測試）
   * @returns {HTMLElement | null}
   */
  getContainer() {
    return this.#container;
  }
}
