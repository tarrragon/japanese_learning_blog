/**
 * 日文輸入練習 - 主入口
 *
 * v2.0 重構版本：使用 App.js 作為核心控制器
 *
 * 支援兩種練習模式：
 * 1. 題庫模式：從 /data/questions.json 載入卡片解釋作為題目
 * 2. 假名模式：使用預設假名練習題目
 *
 * 支援兩種輸入模式：
 * 1. romaji：實體鍵盤輸入羅馬字
 * 2. direct：手機輸入（日文 IME）
 *
 * 支援三種語言：
 * 1. zh-TW：繁體中文
 * 2. en：英文
 * 3. ja：日文
 */

import { App } from './App.js';
import { modeRegistry } from './modes/ModeRegistry.js';
import { i18n } from './i18n/index.js';

// 應用程式實例
let app = null;

/**
 * 建立控制面板
 * @param {App} appInstance - 應用程式實例
 */
function createControlPanel(appInstance) {
  const container = document.querySelector('.practice-container');
  if (!container) return;

  // 檢查是否已存在
  if (document.getElementById('practice-controls')) return;

  const state = appInstance.getState();
  // Bug 修復：按鈕顯示「切換後的目標模式」
  const inputModeText = state.inputMode === 'romaji'
    ? i18n.t('mobileMode')
    : i18n.t('keyboardMode');
  const hintBtnText = state.uiSettings.showRomajiHint
    ? i18n.t('hideHint')
    : i18n.t('showHint');
  const practiceModeText = state.practiceMode === 'question'
    ? i18n.t('kanaMode')
    : i18n.t('questionMode');
  // 假名模式不需要 JLPT 選單
  const jlptDisplayStyle = state.practiceMode === 'kana' ? 'none' : '';

  // 取得當前語言選項
  const currentLang = i18n.getLanguage();
  const langOptions = i18n.getSupportedLanguages().map(lang => {
    const selected = lang === currentLang ? 'selected' : '';
    return `<option value="${lang}" ${selected}>${i18n.getLanguageName(lang)}</option>`;
  }).join('');

  const controlPanel = document.createElement('div');
  controlPanel.id = 'practice-controls';
  controlPanel.className = 'practice-controls' + (state.practiceMode === 'kana' ? ' controls-centered' : '');
  controlPanel.innerHTML = `
    <div class="control-group" id="jlpt-filter-group" style="display: ${jlptDisplayStyle}">
      <label for="jlpt-filter">${i18n.t('jlptLabel')}</label>
      <select id="jlpt-filter">
        <option value="all">${i18n.t('jlptAll')}</option>
        <option value="n5">N5</option>
        <option value="n4">N4</option>
        <option value="n3">N3</option>
        <option value="n2">N2</option>
        <option value="n1">N1</option>
      </select>
    </div>
    <div class="control-group">
      <button id="btn-next" class="control-btn">${i18n.t('nextQuestion')}</button>
      <button id="btn-toggle-practice" class="control-btn secondary">${practiceModeText}</button>
      <button id="btn-toggle-input" class="control-btn secondary">${inputModeText}</button>
      <button id="btn-toggle-hint" class="control-btn secondary">${hintBtnText}</button>
      <select id="lang-selector" class="lang-selector">${langOptions}</select>
    </div>
  `;

  // 插入到練習區域上方
  const practiceArea = container.querySelector('.practice-area') || container.firstChild;
  container.insertBefore(controlPanel, practiceArea);

  // 綁定事件
  bindControlPanelEvents(appInstance);
}

/**
 * 綁定控制面板事件
 * @param {App} appInstance
 */
function bindControlPanelEvents(appInstance) {
  // JLPT 篩選
  const jlptFilter = document.getElementById('jlpt-filter');
  if (jlptFilter) {
    // 恢復儲存的篩選條件
    const state = appInstance.getState();
    jlptFilter.value = state.filters.jlpt;

    jlptFilter.addEventListener('change', (e) => {
      appInstance.setFilter('jlpt', e.target.value);
    });
  }

  // 下一題按鈕
  const nextBtn = document.getElementById('btn-next');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      appInstance.loadNextQuestion();
    });
  }

  // 練習模式切換按鈕
  const togglePracticeBtn = document.getElementById('btn-toggle-practice');
  if (togglePracticeBtn) {
    togglePracticeBtn.addEventListener('click', () => {
      const state = appInstance.getState();
      const newMode = state.practiceMode === 'question' ? 'kana' : 'question';
      appInstance.switchPracticeMode(newMode);
      togglePracticeBtn.textContent = newMode === 'question'
        ? i18n.t('kanaMode')
        : i18n.t('questionMode');

      // 假名模式不需要 JLPT 選單，並調整按鈕置中
      const jlptGroup = document.getElementById('jlpt-filter-group');
      const controls = document.getElementById('practice-controls');
      if (jlptGroup) {
        jlptGroup.style.display = newMode === 'kana' ? 'none' : '';
      }
      if (controls) {
        controls.classList.toggle('controls-centered', newMode === 'kana');
      }
    });
  }

  // 輸入模式切換按鈕
  const toggleInputBtn = document.getElementById('btn-toggle-input');
  if (toggleInputBtn) {
    toggleInputBtn.addEventListener('click', () => {
      const state = appInstance.getState();
      const newMode = state.inputMode === 'romaji' ? 'direct' : 'romaji';
      appInstance.switchInputMode(newMode);
      toggleInputBtn.textContent = newMode === 'romaji'
        ? i18n.t('mobileMode')
        : i18n.t('keyboardMode');
    });
  }

  // 提示顯示切換按鈕
  const toggleHintBtn = document.getElementById('btn-toggle-hint');
  if (toggleHintBtn) {
    toggleHintBtn.addEventListener('click', () => {
      appInstance.toggleRomajiHint();
      const state = appInstance.getState();
      toggleHintBtn.textContent = state.uiSettings.showRomajiHint
        ? i18n.t('hideHint')
        : i18n.t('showHint');
    });
  }

  // 語言切換選單
  const langSelector = document.getElementById('lang-selector');
  if (langSelector) {
    langSelector.addEventListener('change', (e) => {
      i18n.setLanguage(e.target.value);
      // 重新載入頁面以應用新語言
      location.reload();
    });
  }
}

/**
 * 更新 HTML 中的靜態文字
 * 根據當前語言設定更新頁面上的文字
 */
function updateStaticTexts() {
  // 頁面標題
  document.title = `${i18n.t('pageTitle')} | ${i18n.t('siteName')}`;

  // 返回連結
  const backLink = document.querySelector('.back-link');
  if (backLink) {
    backLink.textContent = i18n.t('backToCards');
  }

  // 行動裝置提示
  const mobileNotice = document.querySelector('.mobile-notice p');
  if (mobileNotice) {
    mobileNotice.textContent = i18n.t('mobileNotice');
  }

  const backBtn = document.querySelector('.mobile-notice .back-btn');
  if (backBtn) {
    backBtn.textContent = i18n.t('backButton');
  }

  // 練習標題
  const practiceTitle = document.querySelector('.practice-title');
  if (practiceTitle) {
    practiceTitle.textContent = i18n.t('pageTitle');
  }

  // 手機輸入框
  const mobileInput = document.getElementById('mobile-kana-input');
  if (mobileInput) {
    mobileInput.placeholder = i18n.t('mobileInputPlaceholder');
  }

  const mobileInputHint = document.querySelector('.mobile-input-hint');
  if (mobileInputHint) {
    mobileInputHint.textContent = i18n.t('mobileInputHint');
  }

  // 頁腳提示
  const footerHint = document.querySelector('.practice-footer .hint');
  if (footerHint) {
    footerHint.textContent = i18n.t('inputHint');
  }

  // 更新 HTML lang 屬性
  document.documentElement.lang = i18n.getLanguage();
}

/**
 * 顯示載入中狀態
 * @param {HTMLElement} textContainer
 */
function showLoading(textContainer) {
  if (textContainer) {
    textContainer.innerHTML = `<span class="loading">${i18n.t('loadingQuestions')}</span>`;
  }
}

/**
 * 顯示錯誤狀態
 * @param {HTMLElement} textContainer
 * @param {string} message
 */
function showError(textContainer, message) {
  if (textContainer) {
    textContainer.innerHTML = `
      <div class="error-message">
        <p>${message}</p>
        <button onclick="location.reload()">${i18n.t('reload')}</button>
      </div>
    `;
  }
}

/**
 * 初始化應用程式
 */
async function init() {
  // 更新靜態文字（根據語言設定）
  updateStaticTexts();

  // 取得 DOM 元素
  const textContainer = document.getElementById('practice-text');
  const romajiContainer = document.getElementById('practice-romaji');
  const keyboardContainer = document.getElementById('keyboard');
  const container = document.querySelector('.practice-container');

  if (!textContainer || !romajiContainer || !keyboardContainer) {
    console.error('找不到必要的 DOM 元素');
    return;
  }

  // 建立結果容器（如果不存在）
  let resultContainer = document.getElementById('result-container');
  if (!resultContainer) {
    resultContainer = document.createElement('div');
    resultContainer.id = 'result-container';
    resultContainer.className = 'result-container';
    resultContainer.style.display = 'none';
    container?.appendChild(resultContainer);
  }

  // 建立緩衝區顯示（如果不存在）
  let bufferDisplay = document.getElementById('buffer-display');
  if (!bufferDisplay) {
    bufferDisplay = document.createElement('div');
    bufferDisplay.id = 'buffer-display';
    bufferDisplay.className = 'buffer-display';
    romajiContainer.parentNode?.insertBefore(bufferDisplay, romajiContainer.nextSibling);
  }

  // 取得手機輸入框
  const mobileInputElement = document.getElementById('mobile-kana-input');

  // 顯示載入中
  showLoading(textContainer);

  try {
    // 建立 App 實例
    app = new App({
      container,
      textContainer,
      romajiContainer,
      resultContainer,
      bufferDisplay,
      keyboardContainer,
      mobileInputElement,
    });

    // 初始化應用程式（這裡會恢復 localStorage 和 URL 參數的設定）
    await app.initialize();

    // Bug 修復：控制面板必須在 initialize 之後建立
    // 這樣才能正確讀取恢復後的 inputMode 狀態
    createControlPanel(app);

    console.log('應用程式初始化完成');
  } catch (error) {
    console.error('應用程式初始化失敗:', error);
    showError(textContainer, i18n.t('initFailed'));
  }

  // 暴露到全域（用於除錯）
  if (typeof window !== 'undefined') {
    window.__app = app;
  }
}

// 頁面載入後初始化
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}

// 匯出（用於測試）
export { app, init };
