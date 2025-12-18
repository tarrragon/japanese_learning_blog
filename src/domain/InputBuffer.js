/**
 * 匹配結果類型
 */
export const MatchType = {
  COMPLETE: 'COMPLETE',   // 完全匹配
  PARTIAL: 'PARTIAL',     // 部分匹配（前綴）
  MISMATCH: 'MISMATCH',   // 不匹配
};

/**
 * InputBuffer Value Object
 * 暫存使用者輸入的羅馬字鍵
 *
 * 設計為 Immutable：所有操作都返回新實例
 */
export class InputBuffer {
  #value;

  /**
   * @param {string} value - 緩衝區內容（預設為空）
   */
  constructor(value = '') {
    this.#value = value;
  }

  /**
   * 取得緩衝區內容
   * @returns {string}
   */
  get value() {
    return this.#value;
  }

  /**
   * 取得緩衝區長度
   * @returns {number}
   */
  get length() {
    return this.#value.length;
  }

  /**
   * 檢查緩衝區是否為空
   * @returns {boolean}
   */
  isEmpty() {
    return this.#value.length === 0;
  }

  /**
   * 新增一個按鍵到緩衝區（返回新實例）
   * @param {string} key - 按下的鍵
   * @returns {InputBuffer}
   */
  add(key) {
    return new InputBuffer(this.#value + key);
  }

  /**
   * 重置緩衝區（返回新的空實例）
   * @returns {InputBuffer}
   */
  reset() {
    return new InputBuffer();
  }

  /**
   * 嘗試匹配字元的羅馬字
   * @param {import('./Character.js').Character} character - 要匹配的字元
   * @returns {{ type: string }} - 匹配結果
   */
  tryMatch(character) {
    // 完全匹配
    if (character.matchesRomaji(this.#value)) {
      return { type: MatchType.COMPLETE };
    }

    // 部分匹配（前綴）
    if (character.isPartialMatch(this.#value)) {
      return { type: MatchType.PARTIAL };
    }

    // 不匹配
    return { type: MatchType.MISMATCH };
  }
}
