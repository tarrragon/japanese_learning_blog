/**
 * App - 應用程式主控制器
 *
 * 整合所有模組，統一管理應用程式生命週期
 */

import { Store } from './store/Store.js';
import { appReducer } from './store/reducer.js';
import { initialState } from './store/AppState.js';
import { actions } from './store/actions.js';
import { modeRegistry } from './modes/ModeRegistry.js';
import { InputHandlerFactory } from './input/InputHandlerFactory.js';
import { TextRenderer } from './renderers/TextRenderer.js';
import { RomajiRenderer } from './renderers/RomajiRenderer.js';
import { ResultRenderer } from './renderers/ResultRenderer.js';
import { FlashEffect } from './effects/FlashEffect.js';
import { KeyboardRenderer } from './ui/KeyboardRenderer.js';
import { QuestionLoader } from './services/QuestionLoader.js';
import { SpeechService } from './services/SpeechService.js';
import { PersistenceService } from './services/PersistenceService.js';

export class App {
  #store;
  #elements;
  #renderers = {};
  #inputHandler = null;
  #inputHandlerFactory;
  #currentSession = null;
  #flashEffect;
  #persistence;
  #keyboardRenderer;
  #questionLoader;

  /**
   * @param {Object} elements - DOM 元素集合
   * @param {HTMLElement} elements.container - 主容器
   * @param {HTMLElement} elements.textContainer - 文字容器
   * @param {HTMLElement} elements.romajiContainer - 羅馬拼音容器
   * @param {HTMLElement} elements.resultContainer - 結果容器
   * @param {HTMLElement} elements.bufferDisplay - 緩衝區顯示
   * @param {HTMLElement} elements.keyboardContainer - 鍵盤容器
   * @param {HTMLInputElement} elements.mobileInputElement - 手機輸入框
   */
  constructor(elements) {
    this.#elements = elements;

    // 建立 Store
    this.#store = new Store(appReducer, initialState);

    // 建立服務
    this.#questionLoader = new QuestionLoader();
    const speechService = new SpeechService();
    this.#persistence = new PersistenceService();

    // 設定模式依賴
    modeRegistry.setDependencies({
      store: this.#store,
      questionLoader: this.#questionLoader,
      speechService,
    });

    // 建立渲染器
    this.#setupRenderers();

    // 建立鍵盤渲染器
    this.#keyboardRenderer = new KeyboardRenderer(elements.keyboardContainer);

    // 建立輸入處理器工廠
    this.#inputHandlerFactory = new InputHandlerFactory({
      keyboardRenderer: this.#keyboardRenderer,
      mobileInputElement: elements.mobileInputElement,
    });

    // 建立視覺效果
    this.#flashEffect = new FlashEffect(elements.textContainer);

    // 訂閱狀態變化
    this.#subscribeToStore();
  }

  /**
   * 設定渲染器
   * @private
   */
  #setupRenderers() {
    this.#renderers.text = new TextRenderer(this.#elements.textContainer);
    this.#renderers.romaji = new RomajiRenderer(this.#elements.romajiContainer);
    this.#renderers.result = new ResultRenderer(
      this.#elements.resultContainer,
      this.#detectBasePath()
    );
  }

  /**
   * 偵測網站根路徑
   * @returns {string}
   * @private
   */
  #detectBasePath() {
    if (typeof window === 'undefined') return '';
    const pathname = window.location.pathname;
    const match = pathname.match(/^(.*?)\/[^\/]+\/?$/);
    return match ? match[1] : '';
  }

  /**
   * 訂閱狀態變化
   * @private
   */
  #subscribeToStore() {
    this.#store.subscribe((state, action) => {
      this.#handleStateChange(state, action);
    });
  }

  /**
   * 處理狀態變化
   * @param {Object} state
   * @param {Object} action
   * @private
   */
  #handleStateChange(state, action) {
    switch (action.type) {
      case 'COMPLETE_SESSION':
        this.#showResult(state.result, state.currentQuestion);
        break;
      case 'TOGGLE_ROMAJI_HINT':
        this.#updateHintVisibility(state.uiSettings.showRomajiHint);
        break;
    }
  }

  /**
   * 初始化應用程式
   */
  async initialize() {
    // 恢復持久化的設定
    const savedSettings = this.#persistence.load();
    if (savedSettings) {
      if (savedSettings.inputMode && savedSettings.inputMode !== 'romaji') {
        this.#store.dispatch(actions.setInputMode(savedSettings.inputMode));
      }
      if (savedSettings.filters?.jlpt) {
        this.#store.dispatch(actions.setFilter('jlpt', savedSettings.filters.jlpt));
      }
      if (savedSettings.showRomajiHint === false) {
        this.#store.dispatch(actions.toggleRomajiHint());
      }
    }

    // 檢查 URL 參數
    const urlParams = this.#getUrlParams();

    // 處理 URL 指定的輸入模式
    if (urlParams.input === 'direct' || urlParams.input === 'mobile') {
      this.#store.dispatch(actions.setInputMode('direct'));
    }

    // 處理 URL 指定的練習模式或文字
    if (urlParams.text) {
      // 直接使用 URL 指定的文字（特殊模式）
      await this.#startWithText(urlParams.text);
    } else {
      // 切換到初始模式
      const modeId = urlParams.mode === 'kana' ? 'kana' : 'question';
      await this.switchPracticeMode(modeId);
    }

    // 應用 UI 設定
    this.#applyUISettings();
  }

  /**
   * 取得 URL 參數
   * @returns {Object}
   * @private
   */
  #getUrlParams() {
    if (typeof window === 'undefined') return {};
    const params = new URLSearchParams(window.location.search);
    return {
      text: params.get('text'),
      mode: params.get('mode'),
      input: params.get('input'),
    };
  }

  /**
   * 使用指定文字開始練習
   * @param {string} text
   * @private
   */
  async #startWithText(text) {
    const { Question } = await import('./domain/Question.js');
    const question = Question.fromText(text);

    this.#store.dispatch(actions.loadQuestionSuccess({ text }));
    this.#startSession(question);
  }

  /**
   * 切換練習模式
   * @param {string} modeId
   */
  async switchPracticeMode(modeId) {
    try {
      this.#store.dispatch(actions.setPracticeMode(modeId));
      await modeRegistry.switchMode(modeId);
      await this.loadNextQuestion();
    } catch (error) {
      console.error('Switch mode failed:', error);
      this.#store.dispatch(actions.loadQuestionFailure(error.message));
    }
  }

  /**
   * 切換輸入模式
   * @param {string} mode
   */
  switchInputMode(mode) {
    this.#store.dispatch(actions.setInputMode(mode));
    this.#persistence.save({ inputMode: mode });

    // 更新 URL 參數
    this.#updateUrlParam('input', mode === 'direct' ? 'direct' : null);

    // 更新 UI 模式
    this.#updateInputModeUI(mode);

    // 重新載入題目以應用新輸入模式
    this.loadNextQuestion();
  }

  /**
   * 設定篩選條件
   * @param {string} key
   * @param {string} value
   */
  setFilter(key, value) {
    this.#store.dispatch(actions.setFilter(key, value));
    this.#persistence.save({ filters: { [key]: value } });
    this.loadNextQuestion();
  }

  /**
   * 切換羅馬拼音提示
   */
  toggleRomajiHint() {
    this.#store.dispatch(actions.toggleRomajiHint());
    const state = this.#store.getState();
    this.#persistence.save({ showRomajiHint: state.uiSettings.showRomajiHint });
  }

  /**
   * 載入下一題
   */
  async loadNextQuestion() {
    const mode = modeRegistry.getCurrentMode();
    if (!mode) return;

    // 清理舊 Session
    this.#cleanupCurrentSession();

    try {
      this.#store.dispatch(actions.startLoading());
      this.#renderers.result.hide();

      // 載入題目
      const question = await mode.loadNextQuestion();

      // 啟動 Session
      this.#startSession(question);
    } catch (error) {
      console.error('Load question failed:', error);
      this.#store.dispatch(actions.loadQuestionFailure(error.message));
    }
  }

  /**
   * 啟動練習 Session
   * @param {import('./domain/Question.js').Question} question
   * @private
   */
  #startSession(question) {
    const mode = modeRegistry.getCurrentMode();

    // 建立新 Session
    const session = mode ? mode.createSession(question) : this.#createDefaultSession(question);
    this.#currentSession = session;

    // 設定事件監聽
    if (mode) {
      mode.setupSessionListeners(session);
    }

    // 設定額外事件監聽
    session.on('CharacterCompleted', () => {
      this.#flashEffect.flashSuccess();
      this.#render();
    });

    session.on('CharacterMistaken', () => {
      this.#flashEffect.flashError();
    });

    session.on('RomajiMatched', (e) => {
      this.#updateBufferDisplay(e.romaji);
    });

    session.on('SessionCompleted', (e) => {
      this.#store.dispatch(actions.completeSession(e));
    });

    // 啟動輸入處理
    this.#switchInputHandler(this.#store.getState().inputMode);

    // 渲染
    this.#render();
  }

  /**
   * 建立預設 Session（用於 URL text 模式）
   * @param {import('./domain/Question.js').Question} question
   * @private
   */
  async #createDefaultSession(question) {
    const { TypingSession } = await import('./domain/TypingSession.js');
    return new TypingSession(question);
  }

  /**
   * 清理當前 Session
   * @private
   */
  #cleanupCurrentSession() {
    if (this.#inputHandler) {
      this.#inputHandler.dispose();
      this.#inputHandler = null;
    }
    this.#currentSession = null;
  }

  /**
   * 切換輸入處理器
   * @param {string} mode
   * @private
   */
  #switchInputHandler(mode) {
    // 清理舊處理器
    if (this.#inputHandler) {
      this.#inputHandler.dispose();
    }

    // 建立新處理器
    this.#inputHandler = this.#inputHandlerFactory.create(mode);
    this.#inputHandler.setSession(this.#currentSession);
    this.#inputHandler.setUpdateCallback(() => this.#render());
    this.#inputHandler.activate();

    // 更新 UI 模式
    this.#updateInputModeUI(mode);
  }

  /**
   * 更新輸入模式 UI
   * @param {string} mode
   * @private
   */
  #updateInputModeUI(mode) {
    const container = this.#elements.container;
    const body = typeof document !== 'undefined' ? document.body : null;
    const inputSection = typeof document !== 'undefined'
      ? document.getElementById('mobile-input-section')
      : null;
    const keyboard = this.#elements.keyboardContainer;

    if (mode === 'direct') {
      container?.classList.add('mode-direct');
      body?.classList.add('mode-direct');
      if (inputSection) inputSection.style.display = 'block';
      if (keyboard) keyboard.style.display = 'none';
    } else {
      container?.classList.remove('mode-direct');
      body?.classList.remove('mode-direct');
      if (inputSection) inputSection.style.display = 'none';
      if (keyboard) keyboard.style.display = '';
    }
  }

  /**
   * 更新提示顯示
   * @param {boolean} show
   * @private
   */
  #updateHintVisibility(show) {
    const container = this.#elements.container;
    if (container) {
      container.classList.toggle('hide-romaji-hint', !show);
    }
  }

  /**
   * 應用 UI 設定
   * @private
   */
  #applyUISettings() {
    const state = this.#store.getState();
    this.#updateHintVisibility(state.uiSettings.showRomajiHint);
    this.#updateInputModeUI(state.inputMode);
  }

  /**
   * 渲染
   * @private
   */
  #render() {
    if (!this.#currentSession) return;

    const state = this.#store.getState();
    const question = this.#currentSession.question;

    this.#renderers.text.render(question, state.currentQuestion);
    this.#renderers.romaji.render(question);

    if (this.#inputHandler?.updateHighlight) {
      this.#inputHandler.updateHighlight();
    }
  }

  /**
   * 更新緩衝區顯示
   * @param {string} value
   * @private
   */
  #updateBufferDisplay(value) {
    const buffer = this.#elements.bufferDisplay;
    if (buffer) {
      buffer.textContent = value;
    }
  }

  /**
   * 顯示結果
   * @param {Object} stats
   * @param {Object} questionData
   * @private
   */
  #showResult(stats, questionData) {
    this.#renderers.result.setNextQuestionCallback(() => this.loadNextQuestion());
    this.#renderers.result.render(stats, questionData);
  }

  /**
   * 更新 URL 參數
   * @param {string} key
   * @param {string|null} value
   * @private
   */
  #updateUrlParam(key, value) {
    if (typeof window === 'undefined') return;

    const url = new URL(window.location);
    if (value) {
      url.searchParams.set(key, value);
    } else {
      url.searchParams.delete(key);
    }
    window.history.replaceState({}, '', url);
  }

  /**
   * 取得 Store（用於外部存取）
   * @returns {Store}
   */
  getStore() {
    return this.#store;
  }

  /**
   * 取得當前狀態
   * @returns {Object}
   */
  getState() {
    return this.#store.getState();
  }

  /**
   * 取得題庫載入器（用於控制面板）
   * @returns {QuestionLoader}
   */
  getQuestionLoader() {
    return this.#questionLoader;
  }

  /**
   * 清理資源
   */
  dispose() {
    this.#cleanupCurrentSession();
    Object.values(this.#renderers).forEach((r) => r.dispose?.());
    modeRegistry.reset();
  }
}
