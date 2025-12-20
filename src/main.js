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
 */

import { App } from './App.js';
import { modeRegistry } from './modes/ModeRegistry.js';

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
  const inputModeText = state.inputMode === 'romaji' ? '手機模式' : '鍵盤模式';
  const hintBtnText = state.uiSettings.showRomajiHint ? '隱藏提示' : '顯示提示';
  const practiceModeText = state.practiceMode === 'question' ? '假名模式' : '題庫模式';
  // 假名模式不需要 JLPT 選單
  const jlptDisplayStyle = state.practiceMode === 'kana' ? 'none' : '';

  const controlPanel = document.createElement('div');
  controlPanel.id = 'practice-controls';
  controlPanel.className = 'practice-controls' + (state.practiceMode === 'kana' ? ' controls-centered' : '');
  controlPanel.innerHTML = `
    <div class="control-group" id="jlpt-filter-group" style="display: ${jlptDisplayStyle}">
      <label for="jlpt-filter">JLPT 等級：</label>
      <select id="jlpt-filter">
        <option value="all">全部</option>
        <option value="n5">N5</option>
        <option value="n4">N4</option>
        <option value="n3">N3</option>
        <option value="n2">N2</option>
        <option value="n1">N1</option>
      </select>
    </div>
    <div class="control-group">
      <button id="btn-next" class="control-btn">下一題</button>
      <button id="btn-toggle-practice" class="control-btn secondary">${practiceModeText}</button>
      <button id="btn-toggle-input" class="control-btn secondary">${inputModeText}</button>
      <button id="btn-toggle-hint" class="control-btn secondary">${hintBtnText}</button>
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
      togglePracticeBtn.textContent = newMode === 'question' ? '假名模式' : '題庫模式';

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
      toggleInputBtn.textContent = newMode === 'romaji' ? '手機模式' : '鍵盤模式';
    });
  }

  // 提示顯示切換按鈕
  const toggleHintBtn = document.getElementById('btn-toggle-hint');
  if (toggleHintBtn) {
    toggleHintBtn.addEventListener('click', () => {
      appInstance.toggleRomajiHint();
      const state = appInstance.getState();
      toggleHintBtn.textContent = state.uiSettings.showRomajiHint ? '隱藏提示' : '顯示提示';
    });
  }
}

/**
 * 顯示載入中狀態
 * @param {HTMLElement} textContainer
 */
function showLoading(textContainer) {
  if (textContainer) {
    textContainer.innerHTML = '<span class="loading">載入題庫中...</span>';
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
        <button onclick="location.reload()">重新載入</button>
      </div>
    `;
  }
}

/**
 * 初始化應用程式
 */
async function init() {
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

    // 建立控制面板
    createControlPanel(app);

    // 初始化應用程式
    await app.initialize();

    console.log('應用程式初始化完成');
  } catch (error) {
    console.error('應用程式初始化失敗:', error);
    showError(textContainer, '應用程式初始化失敗');
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
