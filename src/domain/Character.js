import {
  getRomajiOptions,
  isPartialMatch,
  isExactMatch,
  isSokuonPattern,
  getSokuonRomajiOptions,
} from './RomajiMap.js';

/**
 * Character 狀態列舉
 */
export const CharacterState = {
  PENDING: 'pending',
  CURRENT: 'current',
  COMPLETED: 'completed',
};

/**
 * Character Value Object
 * 代表一個假名字元及其對應的羅馬字輸入
 *
 * 設計為 Immutable：所有狀態改變都返回新實例
 */
export class Character {
  #kana;
  #romaji;
  #state;

  /**
   * @param {string} kana - 假名字元
   * @param {string} state - 狀態（預設 PENDING）
   * @param {string[]|null} romajiOverride - 覆蓋的羅馬字選項（用於「ん」的特殊處理）
   */
  constructor(kana, state = CharacterState.PENDING, romajiOverride = null) {
    this.#kana = kana;

    // 決定羅馬字選項的優先順序：
    // 1. romajiOverride（如「ん」的特殊處理）
    // 2. 促音模式（如「った」、「っか」）
    // 3. 一般假名對應
    if (romajiOverride) {
      this.#romaji = romajiOverride;
    } else if (isSokuonPattern(kana)) {
      this.#romaji = getSokuonRomajiOptions(kana);
    } else {
      this.#romaji = getRomajiOptions(kana);
    }

    this.#state = state;
  }

  /**
   * 取得假名
   * @returns {string}
   */
  get kana() {
    return this.#kana;
  }

  /**
   * 取得可接受的羅馬字輸入選項
   * @returns {string[]}
   */
  get romaji() {
    return this.#romaji;
  }

  /**
   * 取得當前狀態
   * @returns {string}
   */
  get state() {
    return this.#state;
  }

  /**
   * 設定為當前目標（返回新實例）
   * @returns {Character}
   */
  setCurrent() {
    return new Character(this.#kana, CharacterState.CURRENT, this.#romaji);
  }

  /**
   * 設定為已完成（返回新實例）
   * @returns {Character}
   */
  setCompleted() {
    return new Character(this.#kana, CharacterState.COMPLETED, this.#romaji);
  }

  /**
   * 檢查輸入是否完全匹配此字元的羅馬字
   * @param {string} input - 使用者輸入的羅馬字
   * @returns {boolean}
   */
  matchesRomaji(input) {
    return isExactMatch(input, this.#romaji);
  }

  /**
   * 檢查輸入是否為羅馬字的前綴（部分匹配）
   * @param {string} input - 使用者輸入的羅馬字
   * @returns {boolean}
   */
  isPartialMatch(input) {
    return isPartialMatch(input, this.#romaji);
  }
}
