/**
 * PracticeMode - 練習模式抽象基類
 *
 * 定義所有練習模式必須實現的介面
 * 子類需要覆寫 static getters 和 async 方法
 */

import { TypingSession } from '../domain/TypingSession.js';
import { SessionEventTypes } from '../domain/EventTypes.js';
import { actions } from '../store/actions.js';

export class PracticeMode {
  /**
   * 模式識別碼
   * @returns {string}
   */
  static get id() {
    throw new Error('Must implement static id getter');
  }

  /**
   * 模式顯示名稱
   * @returns {string}
   */
  static get displayName() {
    throw new Error('Must implement static displayName getter');
  }

  /**
   * 模式描述
   * @returns {string}
   */
  static get description() {
    return '';
  }

  /**
   * 是否需要題庫載入器
   * @returns {boolean}
   */
  static get requiresQuestionLoader() {
    return false;
  }

  /**
   * 支援的輸入模式
   * @returns {string[]}
   */
  static get supportedInputModes() {
    return ['romaji', 'direct'];
  }

  /**
   * @param {Object} dependencies - 依賴注入
   * @param {import('../store/Store.js').Store} dependencies.store - 狀態 Store
   * @param {import('../services/QuestionLoader.js').QuestionLoader} [dependencies.questionLoader] - 題庫載入器
   * @param {import('../services/SpeechService.js').SpeechService} dependencies.speechService - 語音服務
   */
  constructor(dependencies) {
    if (new.target === PracticeMode) {
      throw new Error('PracticeMode is abstract and cannot be instantiated directly');
    }

    this.store = dependencies.store;
    this.questionLoader = dependencies.questionLoader;
    this.speechService = dependencies.speechService;
    this.session = null;
  }

  /**
   * 初始化模式
   * @returns {Promise<void>}
   */
  async initialize() {
    throw new Error('Must implement initialize()');
  }

  /**
   * 載入下一個題目
   * @returns {Promise<import('../domain/Question.js').Question>}
   */
  async loadNextQuestion() {
    throw new Error('Must implement loadNextQuestion()');
  }

  /**
   * 建立 TypingSession
   * @param {import('../domain/Question.js').Question} question
   * @returns {import('../domain/TypingSession.js').TypingSession}
   */
  createSession(question) {
    this.session = new TypingSession(question);
    return this.session;
  }

  /**
   * 設定 Session 事件監聽
   * @param {import('../domain/TypingSession.js').TypingSession} session
   */
  setupSessionListeners(session) {
    session.on(SessionEventTypes.SPEECH_REQUESTED, (e) => {
      this.speechService?.speak(e.text);
    });

    session.on(SessionEventTypes.SESSION_COMPLETED, (e) => {
      this.onSessionCompleted(e);
    });

    session.on(SessionEventTypes.CHARACTER_MISTAKEN, (e) => {
      this.onCharacterMistaken(e);
    });
  }

  /**
   * 字元完成回調
   * @param {Object} event
   */
  onCharacterCompleted(event) {
    // 子類可覆寫
  }

  /**
   * Session 完成回調
   * @param {Object} event
   */
  onSessionCompleted(event) {
    this.store.dispatch(actions.completeSession(event));
  }

  /**
   * 錯誤回調
   * @param {Object} event
   */
  onCharacterMistaken(event) {
    // 子類可覆寫
  }

  /**
   * 清理資源
   */
  dispose() {
    this.session = null;
  }

  /**
   * 取得額外的 UI 配置
   * @returns {Object}
   */
  getUIConfig() {
    return {
      showFilters: false,
      showSourceLink: false,
    };
  }
}
