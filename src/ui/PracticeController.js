import { Question } from '../domain/Question.js';
import { TypingSession } from '../domain/TypingSession.js';
import { SpeechService } from '../services/SpeechService.js';

/**
 * PracticeController
 * 連接 DOM 和 TypingSession，處理 UI 更新
 */
// 全域鍵盤監聽器（避免重複註冊）
let globalKeyboardHandler = null;

export class PracticeController {
  #session;
  #speechService;
  #elements;
  #keyboardRenderer;
  #questionData;  // 題庫資料（用於顯示漢字和來源連結）
  #onNextQuestion;  // 下一題回調
  #keyboardHandler;  // 當前實例的鍵盤處理器
  #basePath;  // 網站根路徑（支援子目錄部署）
  #inputMode;  // 輸入模式：'romaji' | 'direct'
  #mobileInputElement;  // 手機輸入框元素

  /**
   * @param {Object} options - 配置選項
   * @param {string} [options.text] - 練習文字（純假名模式）
   * @param {Object} [options.questionData] - 題庫資料（題庫模式）
   * @param {Object} options.elements - DOM 元素
   * @param {KeyboardRenderer} options.keyboardRenderer - 鍵盤渲染器
   * @param {Function} [options.onNextQuestion] - 下一題回調
   * @param {string} [options.inputMode] - 輸入模式：'romaji' | 'direct'
   */
  constructor(options) {
    // 支援兩種初始化方式
    let question;
    if (options.questionData) {
      // 從題庫資料建立
      question = Question.fromQuestionData(options.questionData);
      this.#questionData = options.questionData;
    } else {
      // 從純文字建立
      question = Question.fromText(options.text);
      this.#questionData = null;
    }

    this.#session = new TypingSession(question);
    this.#speechService = new SpeechService({
      speechSynthesis: typeof speechSynthesis !== 'undefined' ? speechSynthesis : undefined
    });
    this.#elements = options.elements;
    this.#keyboardRenderer = options.keyboardRenderer;
    this.#onNextQuestion = options.onNextQuestion || null;
    this.#inputMode = options.inputMode || 'romaji';

    // 自動偵測 base path（支援 GitHub Pages 子目錄部署）
    // 例如：/japanese_learning_blog/practice/ → /japanese_learning_blog
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    const match = pathname.match(/^(.*?)\/[^\/]+\/?$/);
    this.#basePath = match ? match[1] : '';

    this.#setupEventHandlers();

    // 根據輸入模式設定不同的監聽器
    if (this.#inputMode === 'direct') {
      this.#setupDirectInputMode();
    } else {
      this.#setupKeyboardListener();
    }

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
    // 移除舊的全域監聽器（避免重複註冊）
    if (globalKeyboardHandler) {
      document.removeEventListener('keydown', globalKeyboardHandler);
    }

    // 創建新的處理器
    this.#keyboardHandler = (e) => {
      // 忽略修飾鍵和特殊鍵
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (e.key.length !== 1) return; // 只處理單字元按鍵

      e.preventDefault();
      const key = e.key.toLowerCase();

      // 顯示按鍵效果
      this.#keyboardRenderer?.showKeyPress(key);

      // 傳遞給 Session
      this.#session.handleKeyPress(key);
    };

    // 註冊新的監聯器
    document.addEventListener('keydown', this.#keyboardHandler);
    globalKeyboardHandler = this.#keyboardHandler;
  }

  /**
   * 設定直接輸入模式（手機模式）
   * @private
   */
  #setupDirectInputMode() {
    // 移除鍵盤監聽器（如果有的話）
    if (globalKeyboardHandler) {
      document.removeEventListener('keydown', globalKeyboardHandler);
      globalKeyboardHandler = null;
    }

    // 取得輸入框元素
    this.#mobileInputElement = document.getElementById('mobile-kana-input');
    if (!this.#mobileInputElement) {
      console.warn('Mobile input element not found');
      return;
    }

    // 顯示輸入框區塊
    const inputSection = document.getElementById('mobile-input-section');
    if (inputSection) {
      inputSection.style.display = 'block';
    }

    // 隱藏虛擬鍵盤
    const keyboard = document.getElementById('keyboard');
    if (keyboard) {
      keyboard.style.display = 'none';
    }

    // 在練習容器加上 mode-direct class
    const container = document.querySelector('.practice-container');
    if (container) {
      container.classList.add('mode-direct');
    }

    // 設定輸入事件監聽
    this.#mobileInputElement.addEventListener('input', (e) => {
      this.#handleDirectInput(e);
    });

    // 處理 IME 組合結束事件（確保輸入完成後處理）
    this.#mobileInputElement.addEventListener('compositionend', (e) => {
      // compositionend 事件在 IME 輸入完成後觸發
      // input 事件已經處理過了，這裡只需確保處理
      this.#handleDirectInput(e);
    });

    // 自動 focus 到輸入框
    setTimeout(() => {
      this.#mobileInputElement.focus();
    }, 100);
  }

  /**
   * 處理直接輸入
   * @private
   */
  #handleDirectInput(e) {
    const value = this.#mobileInputElement.value;
    if (!value) return;

    const result = this.#session.handleDirectInput(value);

    if (result.matchedCount > 0) {
      // 成功匹配：只清除已消耗的部分
      this.#mobileInputElement.value = value.substring(result.consumedLength);
      this.#render();
    }
    // 失敗：保留輸入框內容，讓用戶修正
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

    // 如果有題庫資料，使用 display 顯示漢字
    let html;
    if (this.#questionData) {
      const displayChars = this.#questionData.characters;
      html = displayChars.map((charData, index) => {
        const char = characters[index];
        const stateClass = char ? `char-${char.state}` : 'char-pending';
        // 顯示 display（漢字或假名）
        return `<span class="char ${stateClass}" data-index="${index}">${charData.display}</span>`;
      }).join('');
    } else {
      // 純假名模式
      html = characters.map((char, index) => {
        const stateClass = `char-${char.state}`;
        return `<span class="char ${stateClass}" data-index="${index}">${char.kana}</span>`;
      }).join('');
    }

    container.innerHTML = html;

    // 自動捲動到當前字元
    this.#scrollToCurrentChar();
  }

  /**
   * 自動捲動到當前字元
   * @private
   */
  #scrollToCurrentChar() {
    const container = this.#elements.textContainer;
    if (!container) return;

    const currentIndex = this.#session.question.currentIndex;
    const currentChar = container.querySelector(`[data-index="${currentIndex}"]`);

    if (currentChar) {
      const containerRect = container.parentElement?.getBoundingClientRect();
      const charRect = currentChar.getBoundingClientRect();

      if (containerRect) {
        // 計算需要的偏移量，讓當前字元保持在中央偏左位置
        const containerCenter = containerRect.width / 3;
        const charOffset = currentChar.offsetLeft;
        const scrollOffset = Math.max(0, charOffset - containerCenter);

        container.style.transform = `translateX(-${scrollOffset}px)`;
      }
    }
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
      return `<span class="romaji ${stateClass}" data-index="${index}">${romaji}</span>`;
    }).join('');

    // 同步捲動羅馬字
    this.#scrollRomajiToCurrentChar();
  }

  /**
   * 捲動羅馬字到當前字元
   * @private
   */
  #scrollRomajiToCurrentChar() {
    const container = this.#elements.romajiContainer;
    if (!container) return;

    const currentIndex = this.#session.question.currentIndex;
    const currentRomaji = container.querySelector(`[data-index="${currentIndex}"]`);

    if (currentRomaji) {
      const containerRect = container.parentElement?.getBoundingClientRect();

      if (containerRect) {
        const containerCenter = containerRect.width / 3;
        const romajiOffset = currentRomaji.offsetLeft;
        const scrollOffset = Math.max(0, romajiOffset - containerCenter);

        container.style.transform = `translateX(-${scrollOffset}px)`;
      }
    }
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
    // 取得第一個字母（跳過非字母字符如標點符號）
    let nextKey = null;
    if (hint) {
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

    // 來源連結（題庫模式）
    let sourceLink = '';
    if (this.#questionData?.source) {
      const source = this.#questionData.source;
      // 使用 basePath 拼接完整路徑（支援子目錄部署）
      const fullPath = this.#basePath + source.path;
      sourceLink = `
        <a href="${fullPath}" class="source-link" target="_blank">
          查看來源卡片：${source.title} →
        </a>
      `;
    }

    // 下一題按鈕
    const nextButton = this.#onNextQuestion
      ? `<button class="next-btn" id="next-question-btn">下一題</button>`
      : '';

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
        ${sourceLink}
        <div class="result-actions">
          ${nextButton}
          <button class="retry-btn" onclick="location.reload()">重新開始</button>
        </div>
      </div>
    `;
    resultContainer.style.display = 'flex';

    // 綁定下一題按鈕事件
    if (this.#onNextQuestion) {
      const nextBtn = document.getElementById('next-question-btn');
      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          this.#onNextQuestion();
        });
      }
    }
  }

  /**
   * 取得當前進度
   * @returns {number}
   */
  getProgress() {
    return this.#session.getProgress();
  }
}
