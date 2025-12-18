import { InputBuffer, MatchType } from './InputBuffer.js';

/**
 * TypingSession Aggregate Root
 * 管理整個輸入練習的狀態和事件
 *
 * 事件類型：
 * - KeyPressed: 使用者按下任意鍵
 * - RomajiMatched: 輸入匹配部分羅馬字
 * - CharacterCompleted: 完成一個假名
 * - CharacterMistaken: 輸入錯誤
 * - SpeechRequested: 需要朗讀
 * - SessionCompleted: 完成整個題目
 */
export class TypingSession {
  #question;
  #inputBuffer;
  #startTime;
  #handlers;
  #totalKeystrokes;
  #mistakes;

  /**
   * @param {import('./Question.js').Question} question - 題目
   */
  constructor(question) {
    this.#question = question;
    this.#inputBuffer = new InputBuffer();
    this.#startTime = new Date();
    this.#handlers = new Map();
    this.#totalKeystrokes = 0;
    this.#mistakes = 0;
  }

  /**
   * 取得題目
   * @returns {import('./Question.js').Question}
   */
  get question() {
    return this.#question;
  }

  /**
   * 取得開始時間
   * @returns {Date}
   */
  get startTime() {
    return this.#startTime;
  }

  /**
   * 取得輸入緩衝區
   * @returns {InputBuffer}
   */
  get inputBuffer() {
    return this.#inputBuffer;
  }

  /**
   * 註冊事件處理器
   * @param {string} eventType - 事件類型
   * @param {Function} handler - 處理函數
   */
  on(eventType, handler) {
    if (!this.#handlers.has(eventType)) {
      this.#handlers.set(eventType, []);
    }
    this.#handlers.get(eventType).push(handler);
  }

  /**
   * 發出事件
   * @private
   * @param {string} eventType - 事件類型
   * @param {Object} data - 事件資料
   */
  #emit(eventType, data) {
    const handlers = this.#handlers.get(eventType);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  /**
   * 處理按鍵輸入
   * @param {string} key - 按下的鍵
   */
  handleKeyPress(key) {
    // 如果已完成，忽略輸入
    if (this.#question.isCompleted()) {
      return;
    }

    this.#totalKeystrokes++;

    // 發出 KeyPressed 事件
    this.#emit('KeyPressed', {
      key,
      timestamp: Date.now(),
    });

    // 取得當前字元
    const currentChar = this.#question.getCurrentCharacter();
    if (!currentChar) {
      return;
    }

    // 嘗試匹配
    const newBuffer = this.#inputBuffer.add(key);
    const matchResult = newBuffer.tryMatch(currentChar);

    switch (matchResult.type) {
      case MatchType.COMPLETE:
        this.#handleComplete(currentChar, newBuffer);
        break;

      case MatchType.PARTIAL:
        this.#handlePartial(newBuffer);
        break;

      case MatchType.MISMATCH:
        this.#handleMismatch(currentChar, key);
        break;
    }
  }

  /**
   * 處理完全匹配
   * @private
   */
  #handleComplete(character, buffer) {
    // 發出 RomajiMatched 事件
    this.#emit('RomajiMatched', {
      romaji: buffer.value,
      isPartial: false,
    });

    // 發出 CharacterCompleted 事件
    this.#emit('CharacterCompleted', {
      character,
      duration: Date.now() - this.#startTime.getTime(),
    });

    // 發出 SpeechRequested 事件
    this.#emit('SpeechRequested', {
      text: character.kana,
    });

    // 推進到下一個字元
    this.#question = this.#question.advance();

    // 重置 buffer
    this.#inputBuffer = new InputBuffer();

    // 檢查是否完成整個題目
    if (this.#question.isCompleted()) {
      this.#handleSessionComplete();
    }
  }

  /**
   * 處理部分匹配
   * @private
   */
  #handlePartial(buffer) {
    this.#inputBuffer = buffer;

    // 發出 RomajiMatched 事件
    this.#emit('RomajiMatched', {
      romaji: buffer.value,
      isPartial: true,
    });
  }

  /**
   * 處理不匹配
   * @private
   */
  #handleMismatch(character, key) {
    this.#mistakes++;

    // 發出 CharacterMistaken 事件
    this.#emit('CharacterMistaken', {
      expected: character.romaji,
      actual: key,
    });

    // 重置 buffer
    this.#inputBuffer = new InputBuffer();
  }

  /**
   * 處理完成整個題目
   * @private
   */
  #handleSessionComplete() {
    const endTime = new Date();
    const totalTime = endTime.getTime() - this.#startTime.getTime();
    const correctKeystrokes = this.#totalKeystrokes - this.#mistakes;
    const accuracy = this.#totalKeystrokes > 0
      ? correctKeystrokes / this.#totalKeystrokes
      : 1;

    this.#emit('SessionCompleted', {
      totalTime,
      accuracy,
      totalKeystrokes: this.#totalKeystrokes,
      mistakes: this.#mistakes,
    });
  }

  /**
   * 取得當前字元
   * @returns {import('./Character.js').Character|null}
   */
  getCurrentCharacter() {
    return this.#question.getCurrentCharacter();
  }

  /**
   * 取得提示羅馬字（第一個選項）
   * @returns {string}
   */
  getHintRomaji() {
    const char = this.getCurrentCharacter();
    if (!char || char.romaji.length === 0) {
      return '';
    }
    return char.romaji[0];
  }

  /**
   * 取得進度
   * @returns {number}
   */
  getProgress() {
    return this.#question.getProgress();
  }
}
