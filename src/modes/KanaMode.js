/**
 * KanaMode - 假名模式
 *
 * 練習基礎假名輸入
 */

import { PracticeMode } from './PracticeMode.js';
import { Question } from '../domain/Question.js';
import { actions } from '../store/actions.js';

/**
 * 假名練習文字集合
 */
const PRACTICE_TEXTS = [
  // 清音
  'あいうえお',
  'かきくけこ',
  'さしすせそ',
  'たちつてと',
  'なにぬねの',
  'はひふへほ',
  'まみむめも',
  'やゆよ',
  'らりるれろ',
  'わをん',
  // 濁音
  'がぎぐげご',
  'ざじずぜぞ',
  'だぢづでど',
  'ばびぶべぼ',
  // 半濁音
  'ぱぴぷぺぽ',
  // 拗音
  'きゃきゅきょ',
  'しゃしゅしょ',
  'ちゃちゅちょ',
  // 常用詞彙
  'こんにちは',
  'ありがとう',
  'おはよう',
  'さようなら',
  'いただきます',
  'ごちそうさま',
];

export class KanaMode extends PracticeMode {
  static get id() {
    return 'kana';
  }

  static get displayName() {
    return '假名模式';
  }

  static get description() {
    return '練習基礎假名輸入';
  }

  static get requiresQuestionLoader() {
    return false;
  }

  /**
   * 初始化模式
   * 假名模式不需要載入題庫
   */
  async initialize() {
    // 無需初始化
  }

  /**
   * 載入下一個題目
   * @returns {Promise<Question>}
   */
  async loadNextQuestion() {
    const text = this.#getRandomText();

    // 儲存到 Store（簡化的題目資料）
    this.store.dispatch(actions.loadQuestionSuccess({ text }));

    // 建立 Question 物件
    return Question.fromText(text);
  }

  /**
   * 隨機選擇練習文字
   * @returns {string}
   * @private
   */
  #getRandomText() {
    const index = Math.floor(Math.random() * PRACTICE_TEXTS.length);
    return PRACTICE_TEXTS[index];
  }

  /**
   * 取得 UI 配置
   */
  getUIConfig() {
    return {
      showFilters: false,
      showSourceLink: false,
    };
  }

  /**
   * 取得所有練習文字（用於測試）
   * @returns {string[]}
   */
  static getPracticeTexts() {
    return [...PRACTICE_TEXTS];
  }
}
