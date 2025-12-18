import { Character, CharacterState } from './Character.js';
import { ROMAJI_MAP } from './RomajiMap.js';

/**
 * 拗音列表（需要視為單一字元的組合）
 */
const YOUON_LIST = [
  'きゃ', 'きゅ', 'きょ',
  'しゃ', 'しゅ', 'しょ',
  'ちゃ', 'ちゅ', 'ちょ',
  'にゃ', 'にゅ', 'にょ',
  'ひゃ', 'ひゅ', 'ひょ',
  'みゃ', 'みゅ', 'みょ',
  'りゃ', 'りゅ', 'りょ',
  'ぎゃ', 'ぎゅ', 'ぎょ',
  'じゃ', 'じゅ', 'じょ',
  'びゃ', 'びゅ', 'びょ',
  'ぴゃ', 'ぴゅ', 'ぴょ',
  // 片假名
  'キャ', 'キュ', 'キョ',
  'シャ', 'シュ', 'ショ',
  'チャ', 'チュ', 'チョ',
  'ニャ', 'ニュ', 'ニョ',
  'ヒャ', 'ヒュ', 'ヒョ',
  'ミャ', 'ミュ', 'ミョ',
  'リャ', 'リュ', 'リョ',
  'ギャ', 'ギュ', 'ギョ',
  'ジャ', 'ジュ', 'ジョ',
  'ビャ', 'ビュ', 'ビョ',
  'ピャ', 'ピュ', 'ピョ',
];

/**
 * 將文字拆解為字元陣列（處理拗音）
 * @param {string} text - 原始文字
 * @returns {string[]} - 字元陣列
 */
function parseText(text) {
  const result = [];
  let i = 0;

  while (i < text.length) {
    // 檢查是否為拗音（兩個字元的組合）
    if (i + 1 < text.length) {
      const twoChars = text.slice(i, i + 2);
      if (YOUON_LIST.includes(twoChars) || ROMAJI_MAP[twoChars]) {
        result.push(twoChars);
        i += 2;
        continue;
      }
    }

    // 單一字元
    result.push(text[i]);
    i += 1;
  }

  return result;
}

/**
 * 檢查假名是否以 n 開頭（用於判斷「ん」是否需要 nn）
 */
const N_START_KANA = [
  'な', 'に', 'ぬ', 'ね', 'の',
  'にゃ', 'にゅ', 'にょ',
  'ナ', 'ニ', 'ヌ', 'ネ', 'ノ',
  'ニャ', 'ニュ', 'ニョ',
];

/**
 * 檢查是否為「ん」或「ン」
 */
function isN(kana) {
  return kana === 'ん' || kana === 'ン';
}

/**
 * 檢查假名是否以 n 開頭
 */
function startsWithN(kana) {
  return N_START_KANA.includes(kana);
}

/**
 * Question Entity
 * 代表一個練習題目，包含要輸入的文字和字元列表
 *
 * 設計為 Immutable：所有狀態改變都返回新實例
 */
export class Question {
  #text;
  #characters;
  #currentIndex;

  /**
   * @param {string} text - 原始文字
   * @param {Character[]} characters - 字元列表
   * @param {number} currentIndex - 當前索引
   */
  constructor(text, characters, currentIndex = 0) {
    this.#text = text;
    this.#characters = characters;
    this.#currentIndex = currentIndex;
  }

  /**
   * 從文字建立題目
   * @param {string} text - 原始文字
   * @returns {Question}
   */
  static fromText(text) {
    const kanaList = parseText(text);
    const characters = kanaList.map((kana, index, arr) => {
      let romajiOverride = null;

      // 特殊處理：「ん」後面跟著 n 開頭的假名時，必須使用 nn
      if (isN(kana) && index < arr.length - 1) {
        const nextKana = arr[index + 1];
        if (startsWithN(nextKana)) {
          romajiOverride = ['nn']; // 強制使用 nn
        }
      }

      const char = new Character(kana, CharacterState.PENDING, romajiOverride);
      // 第一個字元設為 CURRENT
      return index === 0 ? char.setCurrent() : char;
    });

    return new Question(text, characters, 0);
  }

  /**
   * 取得原始文字
   * @returns {string}
   */
  get text() {
    return this.#text;
  }

  /**
   * 取得字元列表
   * @returns {Character[]}
   */
  get characters() {
    return this.#characters;
  }

  /**
   * 取得當前索引
   * @returns {number}
   */
  get currentIndex() {
    return this.#currentIndex;
  }

  /**
   * 取得當前字元
   * @returns {Character|null}
   */
  getCurrentCharacter() {
    if (this.#currentIndex >= this.#characters.length) {
      return null;
    }
    return this.#characters[this.#currentIndex];
  }

  /**
   * 推進到下一個字元（返回新實例）
   * @returns {Question}
   */
  advance() {
    if (this.isCompleted()) {
      return this;
    }

    const newCharacters = this.#characters.map((char, index) => {
      if (index === this.#currentIndex) {
        // 當前字元標記為完成
        return char.setCompleted();
      } else if (index === this.#currentIndex + 1) {
        // 下一個字元標記為當前
        return char.setCurrent();
      }
      return char;
    });

    return new Question(this.#text, newCharacters, this.#currentIndex + 1);
  }

  /**
   * 檢查是否已完成所有字元
   * @returns {boolean}
   */
  isCompleted() {
    return this.#currentIndex >= this.#characters.length;
  }

  /**
   * 取得進度（0 到 1）
   * @returns {number}
   */
  getProgress() {
    if (this.#characters.length === 0) {
      return 1;
    }
    return this.#currentIndex / this.#characters.length;
  }
}
