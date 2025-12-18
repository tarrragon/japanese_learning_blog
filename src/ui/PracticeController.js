import { Question } from '../domain/Question.js';
import { TypingSession } from '../domain/TypingSession.js';
import { SpeechService } from '../services/SpeechService.js';

/**
 * PracticeController
 * 連接 DOM 和 TypingSession，處理 UI 更新
 */
export class PracticeController {
  #session;
  #speechService;
  #elements;
  #keyboardRenderer;

  /**
   * @param {Object} options - 配置選項
   * @param {string} options.text - 練習文字
   * @param {Object} options.elements - DOM 元素
   * @param {KeyboardRenderer} options.keyboardRenderer - 鍵盤渲染器
   */
  constructor(options) {
    const question = Question.fromText(options.text);
    this.#session = new TypingSession(question);
    this.#speechService = new SpeechService({
      speechSynthesis: typeof speechSynthesis !== 'undefined' ? speechSynthesis : undefined
    });
    this.#elements = options.elements;
    this.#keyboardRenderer = options.keyboardRenderer;

    this.#setupEventHandlers();
    this.#setupKeyboardListener();
    this.#render();
  }

  /**
   * 設定 Session 事件處理器
   * @private
   */
  #setupEventHandlers() {
    // 部分匹配 - 更新緩衝區顯示
    this.#session.on('RomajiMatched', (event) => {
      this.#updateBufferDisplay(event.romaji);
    });

    // 字元完成 - 更新顯示、朗讀
    this.#session.on('CharacterCompleted', (event) => {
      this.#render();
      this.#flashSuccess();
    });

    // 朗讀請求
    this.#session.on('SpeechRequested', (event) => {
      this.#speechService.speak(event.text);
    });

    // 輸入錯誤 - 顯示錯誤效果
    this.#session.on('CharacterMistaken', (event) => {
      this.#flashError();
      this.#updateBufferDisplay('');
    });

    // 完成整個題目
    this.#session.on('SessionCompleted', (event) => {
      this.#showResult(event);
    });
  }

  /**
   * 設定鍵盤監聽器
   * @private
   */
  #setupKeyboardListener() {
    document.addEventListener('keydown', (e) => {
      // 忽略修飾鍵和特殊鍵
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (e.key.length !== 1) return; // 只處理單字元按鍵

      e.preventDefault();
      const key = e.key.toLowerCase();

      // 顯示按鍵效果
      this.#keyboardRenderer?.showKeyPress(key);

      // 傳遞給 Session
      this.#session.handleKeyPress(key);
    });
  }

  /**
   * 渲染整個畫面
   * @private
   */
  #render() {
    this.#renderText();
    this.#renderRomaji();
    this.#updateKeyboardHighlight();
  }

  /**
   * 渲染日文文字
   * @private
   */
  #renderText() {
    const container = this.#elements.textContainer;
    if (!container) return;

    const characters = this.#session.question.characters;
    container.innerHTML = characters.map((char, index) => {
      const stateClass = `char-${char.state}`;
      return `<span class="char ${stateClass}">${char.kana}</span>`;
    }).join('');
  }

  /**
   * 渲染羅馬字提示
   * @private
   */
  #renderRomaji() {
    const container = this.#elements.romajiContainer;
    if (!container) return;

    const characters = this.#session.question.characters;
    container.innerHTML = characters.map((char, index) => {
      const stateClass = `romaji-${char.state}`;
      const romaji = char.romaji[0] || '';
      return `<span class="romaji ${stateClass}">${romaji}</span>`;
    }).join('');
  }

  /**
   * 更新緩衝區顯示
   * @private
   */
  #updateBufferDisplay(value) {
    const buffer = this.#elements.bufferDisplay;
    if (buffer) {
      buffer.textContent = value;
    }
  }

  /**
   * 更新鍵盤高亮
   * @private
   */
  #updateKeyboardHighlight() {
    if (!this.#keyboardRenderer) return;

    const hint = this.#session.getHintRomaji();
    const nextKey = hint ? hint[0] : null;
    this.#keyboardRenderer.highlightKey(nextKey);
  }

  /**
   * 顯示成功效果
   * @private
   */
  #flashSuccess() {
    const container = this.#elements.textContainer;
    if (!container) return;

    container.classList.add('flash-success');
    setTimeout(() => container.classList.remove('flash-success'), 200);
  }

  /**
   * 顯示錯誤效果
   * @private
   */
  #flashError() {
    const container = this.#elements.textContainer;
    if (!container) return;

    container.classList.add('flash-error');
    setTimeout(() => container.classList.remove('flash-error'), 200);
  }

  /**
   * 顯示結果
   * @private
   */
  #showResult(stats) {
    const resultContainer = this.#elements.resultContainer;
    if (!resultContainer) return;

    const accuracy = Math.round(stats.accuracy * 100);
    const timeInSeconds = (stats.totalTime / 1000).toFixed(1);

    resultContainer.innerHTML = `
      <div class="result-box">
        <h2>完成！</h2>
        <div class="result-stats">
          <div class="stat">
            <span class="stat-value">${accuracy}%</span>
            <span class="stat-label">準確率</span>
          </div>
          <div class="stat">
            <span class="stat-value">${timeInSeconds}s</span>
            <span class="stat-label">時間</span>
          </div>
          <div class="stat">
            <span class="stat-value">${stats.totalKeystrokes}</span>
            <span class="stat-label">按鍵數</span>
          </div>
        </div>
        <button class="retry-btn" onclick="location.reload()">再試一次</button>
      </div>
    `;
    resultContainer.style.display = 'flex';
  }

  /**
   * 取得當前進度
   * @returns {number}
   */
  getProgress() {
    return this.#session.getProgress();
  }
}
