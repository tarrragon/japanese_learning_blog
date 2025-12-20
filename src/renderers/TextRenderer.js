/**
 * TextRenderer - 題目文字渲染器
 *
 * 負責渲染練習文字（假名或漢字）
 */

export class TextRenderer {
  #container;

  /**
   * @param {HTMLElement} container - 文字容器元素
   */
  constructor(container) {
    this.#container = container;
  }

  /**
   * 渲染題目文字
   * @param {import('../domain/Question.js').Question} question - 題目物件
   * @param {Object} [questionData] - 題庫資料（用於顯示漢字）
   */
  render(question, questionData = null) {
    if (!this.#container || !question) return;

    const characters = question.characters;
    let html;

    if (questionData?.characters) {
      // 題庫模式：顯示漢字
      html = questionData.characters
        .map((charData, index) => {
          const char = characters[index];
          const stateClass = char ? `char-${char.state}` : 'char-pending';
          return `<span class="char ${stateClass}" data-index="${index}">${charData.display}</span>`;
        })
        .join('');
    } else {
      // 假名模式
      html = characters
        .map((char, index) => {
          const stateClass = `char-${char.state}`;
          return `<span class="char ${stateClass}" data-index="${index}">${char.kana}</span>`;
        })
        .join('');
    }

    this.#container.innerHTML = html;
    this.#scrollToCurrentChar(question.currentIndex);
  }

  /**
   * 自動捲動到當前字元
   * @param {number} currentIndex
   * @private
   */
  #scrollToCurrentChar(currentIndex) {
    const currentChar = this.#container?.querySelector(`[data-index="${currentIndex}"]`);
    if (!currentChar) return;

    const containerRect = this.#container.parentElement?.getBoundingClientRect();
    if (!containerRect) return;

    const containerCenter = containerRect.width / 3;
    const charOffset = currentChar.offsetLeft;
    const scrollOffset = Math.max(0, charOffset - containerCenter);

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
