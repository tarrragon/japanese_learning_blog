import { Character, CharacterState } from './Character.js';
import { ROMAJI_MAP, isSokuon, getRomajiOptions } from './RomajiMap.js';

/**
 * 拗音列表（需要視為單一字元的組合）
 */
const YOUON_LIST = [
  // 平假名拗音
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

  // 片假名拗音
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

  // 外來語片假名組合
  'ティ', 'ディ',
  'ファ', 'フィ', 'フェ', 'フォ',
  'ウィ', 'ウェ', 'ウォ',
  'ヴァ', 'ヴィ', 'ヴェ', 'ヴォ',
];

/**
 * 取得下一個輸入單位（考慮拗音）
 * @param {string} text - 原始文字
 * @param {number} startIndex - 起始索引
 * @returns {string|null} - 下一個輸入單位
 */
function getNextUnit(text, startIndex) {
  if (startIndex >= text.length) {
    return null;
  }

  // 先檢查是否為拗音（兩個字元的組合）
  if (startIndex + 1 < text.length) {
    const twoChars = text.slice(startIndex, startIndex + 2);
    if (YOUON_LIST.includes(twoChars) || ROMAJI_MAP[twoChars]) {
      return twoChars;
    }
  }

  // 單一字元
  return text[startIndex];
}

/**
 * 檢查假名是否可以與促音合併（有子音開頭的羅馬字）
 * @param {string} kana - 假名
 * @returns {boolean}
 */
function canMergeWithSokuon(kana) {
  const romaji = getRomajiOptions(kana);
  if (romaji.length === 0) return false;

  // 檢查是否有任何羅馬字以子音開頭
  const vowels = ['a', 'i', 'u', 'e', 'o'];
  return romaji.some(r => !vowels.includes(r[0]));
}

/**
 * 將文字拆解為字元陣列（處理拗音和促音合併）
 * @param {string} text - 原始文字
 * @returns {string[]} - 字元陣列
 */
function parseText(text) {
  const result = [];
  let i = 0;

  while (i < text.length) {
    // 1. 檢查是否為促音 + 後續可合併假名
    if (isSokuon(text[i]) && i + 1 < text.length) {
      const nextUnit = getNextUnit(text, i + 1);
      if (nextUnit && canMergeWithSokuon(nextUnit)) {
        // 合併促音與後續假名
        result.push(text[i] + nextUnit);
        i += 1 + nextUnit.length;
        continue;
      }
    }

    // 2. 檢查是否為拗音（兩個字元的組合）
    if (i + 1 < text.length) {
      const twoChars = text.slice(i, i + 2);
      if (YOUON_LIST.includes(twoChars) || ROMAJI_MAP[twoChars]) {
        result.push(twoChars);
        i += 2;
        continue;
      }
    }

    // 3. 單一字元
    result.push(text[i]);
    i += 1;
  }

  return result;
}

/**
 * 需要「ん」消歧義的後續假名
 *
 * 當「ん」後面跟著這些假名時，必須使用 nn 或 n' 來避免歧義：
 * 1. n 開頭假名（な行）- 避免 'na' 被誤解為 な
 * 2. 母音開頭假名 - 避免 'na' 等被誤解
 * 3. y 開頭假名（や行）- 避免 'nya' 被誤解為 にゃ
 */
const REQUIRES_NN_BEFORE = [
  // n 開頭假名（な行）
  'な', 'に', 'ぬ', 'ね', 'の',
  'にゃ', 'にゅ', 'にょ',

  // 母音開頭假名
  'あ', 'い', 'う', 'え', 'お',

  // y 開頭假名（や行）
  'や', 'ゆ', 'よ',

  // 片假名版本
  'ナ', 'ニ', 'ヌ', 'ネ', 'ノ',
  'ニャ', 'ニュ', 'ニョ',
  'ア', 'イ', 'ウ', 'エ', 'オ',
  'ヤ', 'ユ', 'ヨ',
];

/**
 * 檢查是否為「ん」或「ン」
 */
function isN(kana) {
  return kana === 'ん' || kana === 'ン';
}

/**
 * 檢查假名是否需要前面的「ん」使用 nn 消歧義
 */
function requiresNNBefore(kana) {
  return REQUIRES_NN_BEFORE.includes(kana);
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

      // 特殊處理：「ん」的消歧義
      if (isN(kana)) {
        if (index === arr.length - 1) {
          // 情況 1：字尾的「ん」- 接受 n 或 nn（無歧義）
          romajiOverride = ['n', 'nn'];
        } else {
          const nextKana = arr[index + 1];
          if (requiresNNBefore(nextKana)) {
            // 情況 2：後面跟著需要消歧義的假名 - 必須使用 nn 或 n'
            romajiOverride = ['nn', "n'"];
          }
          // 情況 3：後面跟著其他子音 - 使用預設 ['n', 'nn']（無歧義）
        }
      }

      const char = new Character(kana, CharacterState.PENDING, romajiOverride);
      // 第一個字元設為 CURRENT
      return index === 0 ? char.setCurrent() : char;
    });

    return new Question(text, characters, 0);
  }

  /**
   * 從題庫資料建立題目
   * @param {Object} data - 題庫中的題目資料
   * @param {string} data.id - 題目 ID
   * @param {string} data.text - 題目文字
   * @param {Array} data.characters - 字元陣列
   * @param {Object} data.source - 來源資訊
   * @param {Object} data.metadata - 元資料
   * @returns {Question}
   */
  static fromQuestionData(data) {
    const characters = data.characters.map((charData, index) => {
      // 使用題庫提供的 kana、romaji 和 display
      const char = new Character(
        charData.kana,
        CharacterState.PENDING,
        charData.romaji,
        charData.display  // 傳入顯示用的文字（可能是漢字）
      );
      // 第一個字元設為 CURRENT
      return index === 0 ? char.setCurrent() : char;
    });

    // 建立題目實例
    const question = new Question(data.text, characters, 0);

    // 附加額外資訊
    question._id = data.id;
    question._displayCharacters = data.characters; // 保留 display 資訊
    question._source = data.source;
    question._metadata = data.metadata;

    return question;
  }

  /**
   * 取得題目 ID（題庫題目專用）
   * @returns {string|undefined}
   */
  get id() {
    return this._id;
  }

  /**
   * 取得顯示用字元（題庫題目專用）
   * @returns {Array|undefined}
   */
  get displayCharacters() {
    return this._displayCharacters;
  }

  /**
   * 取得來源資訊（題庫題目專用）
   * @returns {Object|undefined}
   */
  get source() {
    return this._source;
  }

  /**
   * 取得元資料（題庫題目專用）
   * @returns {Object|undefined}
   */
  get metadata() {
    return this._metadata;
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
