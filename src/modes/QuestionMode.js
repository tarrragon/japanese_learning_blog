/**
 * QuestionMode - 題庫模式
 *
 * 從卡片庫中隨機選取例句進行練習
 */

import { PracticeMode } from './PracticeMode.js';
import { Question } from '../domain/Question.js';
import { actions } from '../store/actions.js';

export class QuestionMode extends PracticeMode {
  static get id() {
    return 'question';
  }

  static get displayName() {
    return '題庫模式';
  }

  static get description() {
    return '從卡片庫中隨機選取例句練習';
  }

  static get requiresQuestionLoader() {
    return true;
  }

  /**
   * 初始化模式
   * 確保題庫已載入
   */
  async initialize() {
    if (!this.questionLoader) {
      throw new Error('QuestionMode requires a QuestionLoader');
    }

    if (!this.questionLoader.isLoaded()) {
      this.store.dispatch(actions.startLoading());
      await this.questionLoader.load();
    }
  }

  /**
   * 載入下一個題目
   * @returns {Promise<Question>}
   */
  async loadNextQuestion() {
    const state = this.store.getState();
    const filters = state.filters;

    const questionData = this.questionLoader.getRandomQuestion(filters);

    if (!questionData) {
      throw new Error('找不到符合條件的題目');
    }

    // 儲存題目資料到 Store
    this.store.dispatch(actions.loadQuestionSuccess(questionData));

    // 建立 Question 物件
    return Question.fromQuestionData(questionData);
  }

  /**
   * 取得 UI 配置
   */
  getUIConfig() {
    return {
      showFilters: true,
      showSourceLink: true,
    };
  }
}
