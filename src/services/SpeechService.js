/**
 * SpeechService
 * 封裝 Web Speech API 的語音合成功能
 *
 * 支援依賴注入以便測試
 */
export class SpeechService {
  #lang;
  #rate;
  #speechSynthesis;

  /**
   * @param {Object} options - 配置選項
   * @param {string} options.lang - 語言（預設 'ja-JP'）
   * @param {number} options.rate - 語速（預設 1.0）
   * @param {SpeechSynthesis} options.speechSynthesis - SpeechSynthesis 實例（用於測試注入）
   */
  constructor(options = {}) {
    this.#lang = options.lang || 'ja-JP';
    this.#rate = options.rate || 1.0;
    // 允許注入 mock，或使用全域的 speechSynthesis
    this.#speechSynthesis = options.speechSynthesis;
  }

  /**
   * 取得語言設定
   * @returns {string}
   */
  get lang() {
    return this.#lang;
  }

  /**
   * 檢查是否支援語音合成
   * @returns {boolean}
   */
  isSupported() {
    return this.#speechSynthesis !== undefined && this.#speechSynthesis !== null;
  }

  /**
   * 朗讀文字
   * @param {string} text - 要朗讀的文字
   * @returns {Promise<void>}
   */
  speak(text) {
    return new Promise((resolve, reject) => {
      if (!this.isSupported()) {
        resolve(); // 不支援時靜默完成
        return;
      }

      // 建立 SpeechSynthesisUtterance
      // 在瀏覽器環境中使用全域的 SpeechSynthesisUtterance
      // 在測試環境中模擬
      const utterance = this.#createUtterance(text);

      utterance.lang = this.#lang;
      utterance.rate = this.#rate;

      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(event);

      this.#speechSynthesis.speak(utterance);
    });
  }

  /**
   * 停止朗讀
   */
  cancel() {
    if (this.isSupported()) {
      this.#speechSynthesis.cancel();
    }
  }

  /**
   * 建立 Utterance 物件
   * @private
   */
  #createUtterance(text) {
    // 檢查是否在瀏覽器環境
    if (typeof SpeechSynthesisUtterance !== 'undefined') {
      return new SpeechSynthesisUtterance(text);
    }

    // 測試環境：返回簡單的物件
    return {
      text,
      lang: '',
      rate: 1.0,
      onend: null,
      onerror: null,
    };
  }
}
