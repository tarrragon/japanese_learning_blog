/**
 * 日文輸入練習 - 主入口
 *
 * 支援兩種模式：
 * 1. 題庫模式：從 /data/questions.json 載入卡片解釋作為題目
 * 2. 傳統模式：使用預設假名練習題目
 */
import { PracticeController } from './ui/PracticeController.js';
import { KeyboardRenderer } from './ui/KeyboardRenderer.js';
import { QuestionLoader } from './services/QuestionLoader.js';

/**
 * 傳統練習題目（假名）
 */
const PRACTICE_TEXTS = [
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
  'がぎぐげご',
  'ざじずぜぞ',
  'だぢづでど',
  'ばびぶべぼ',
  'ぱぴぷぺぽ',
  'きゃきゅきょ',
  'しゃしゅしょ',
  'ちゃちゅちょ',
  'こんにちは',
  'ありがとう',
  'おはよう',
  'さようなら',
  'いただきます',
  'ごちそうさま',
];

/**
 * 應用程式狀態
 */
let questionLoader = null;
let currentController = null;
let keyboardRenderer = null;
let elements = {};
let currentFilters = {
  jlpt: 'all',
};
let currentInputMode = 'romaji'; // 'romaji' | 'direct'
let showRomajiHint = true; // 是否顯示羅馬拼音提示

/**
 * 隨機選擇傳統練習文字
 */
function getRandomText() {
  const index = Math.floor(Math.random() * PRACTICE_TEXTS.length);
  return PRACTICE_TEXTS[index];
}

/**
 * 顯示載入中狀態
 */
function showLoading() {
  const textContainer = elements.textContainer;
  if (textContainer) {
    textContainer.innerHTML = '<span class="loading">載入題庫中...</span>';
  }
}

/**
 * 顯示錯誤狀態
 */
function showError(message) {
  const textContainer = elements.textContainer;
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
 * 建立控制面板
 */
function createControlPanel() {
  const container = document.querySelector('.practice-container');
  if (!container) return;

  // 檢查是否已存在
  if (document.getElementById('practice-controls')) return;

  const controlPanel = document.createElement('div');
  controlPanel.id = 'practice-controls';
  controlPanel.className = 'practice-controls';
  const inputModeText = currentInputMode === 'romaji' ? '手機模式' : '鍵盤模式';
  const hintBtnText = showRomajiHint ? '隱藏提示' : '顯示提示';
  controlPanel.innerHTML = `
    <div class="control-group">
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
      <button id="btn-kana-mode" class="control-btn secondary">假名模式</button>
      <button id="btn-toggle-input" class="control-btn secondary">${inputModeText}</button>
      <button id="btn-toggle-hint" class="control-btn secondary">${hintBtnText}</button>
    </div>
  `;

  // 插入到練習區域上方
  const practiceArea = container.querySelector('.practice-area') || container.firstChild;
  container.insertBefore(controlPanel, practiceArea);

  // 綁定事件
  const jlptFilter = document.getElementById('jlpt-filter');
  if (jlptFilter) {
    // 恢復儲存的篩選條件
    const savedJlpt = localStorage.getItem('practice-jlpt-filter');
    if (savedJlpt) {
      jlptFilter.value = savedJlpt;
      currentFilters.jlpt = savedJlpt;
    }

    jlptFilter.addEventListener('change', (e) => {
      currentFilters.jlpt = e.target.value;
      localStorage.setItem('practice-jlpt-filter', e.target.value);
      loadNextQuestion();
    });
  }

  const nextBtn = document.getElementById('btn-next');
  if (nextBtn) {
    nextBtn.addEventListener('click', loadNextQuestion);
  }

  const kanaModeBtn = document.getElementById('btn-kana-mode');
  if (kanaModeBtn) {
    kanaModeBtn.addEventListener('click', () => {
      startKanaMode();
    });
  }

  const toggleInputBtn = document.getElementById('btn-toggle-input');
  if (toggleInputBtn) {
    toggleInputBtn.addEventListener('click', () => {
      toggleInputMode();
    });
  }

  const toggleHintBtn = document.getElementById('btn-toggle-hint');
  if (toggleHintBtn) {
    toggleHintBtn.addEventListener('click', () => {
      toggleRomajiHint();
    });
  }
}

/**
 * 切換輸入模式
 */
function toggleInputMode() {
  currentInputMode = currentInputMode === 'romaji' ? 'direct' : 'romaji';

  // 儲存偏好
  localStorage.setItem('practice-input-mode', currentInputMode);

  // 更新 URL 參數
  const url = new URL(window.location);
  if (currentInputMode === 'direct') {
    url.searchParams.set('input', 'direct');
  } else {
    url.searchParams.delete('input');
  }
  window.history.replaceState({}, '', url);

  // 更新按鈕文字
  const btn = document.getElementById('btn-toggle-input');
  if (btn) {
    btn.textContent = currentInputMode === 'romaji' ? '手機模式' : '鍵盤模式';
  }

  // 重新載入當前題目
  loadNextQuestion();
}

/**
 * 切換羅馬拼音提示顯示
 */
function toggleRomajiHint() {
  showRomajiHint = !showRomajiHint;

  // 儲存偏好
  localStorage.setItem('practice-show-hint', showRomajiHint ? 'true' : 'false');

  // 更新按鈕文字
  const btn = document.getElementById('btn-toggle-hint');
  if (btn) {
    btn.textContent = showRomajiHint ? '隱藏提示' : '顯示提示';
  }

  // 切換羅馬拼音顯示
  const container = document.querySelector('.practice-container');
  if (container) {
    if (showRomajiHint) {
      container.classList.remove('hide-romaji-hint');
    } else {
      container.classList.add('hide-romaji-hint');
    }
  }
}

/**
 * 取得載入優先級
 * @param {string} savedFilter - 使用者偏好的 JLPT 等級
 * @returns {string[]}
 */
function getLoadingPriority(savedFilter) {
  const levels = ['n5', 'n4', 'n3', 'n2', 'n1'];
  if (!savedFilter || savedFilter === 'all') {
    return levels;
  }
  // 優先載入使用者選擇的等級
  return [savedFilter, ...levels.filter(l => l !== savedFilter)];
}

/**
 * 載入下一題
 */
async function loadNextQuestion() {
  if (!questionLoader || !questionLoader.isLoaded()) {
    console.error('題庫尚未載入');
    return;
  }

  // 隱藏結果面板
  if (elements.resultContainer) {
    elements.resultContainer.style.display = 'none';
  }

  // 隨機選取題目
  let questionData = questionLoader.getRandomQuestion(currentFilters);

  // 如果找不到題目，嘗試按需載入對應等級
  if (!questionData && currentFilters.jlpt !== 'all') {
    if (questionLoader.useProgressiveLoading && !questionLoader.isLevelLoaded(currentFilters.jlpt)) {
      showLoading();
      try {
        await questionLoader.loadBundle(currentFilters.jlpt);
        questionData = questionLoader.getRandomQuestion(currentFilters);
      } catch (error) {
        console.error('按需載入失敗:', error);
      }
    }
  }

  if (!questionData) {
    showError('找不到符合條件的題目');
    return;
  }

  // 建立新的控制器
  currentController = new PracticeController({
    questionData,
    elements,
    keyboardRenderer,
    onNextQuestion: loadNextQuestion,
    inputMode: currentInputMode,
  });

  console.log('載入題目:', questionData.id, questionData.text.substring(0, 30) + '...');
}

/**
 * 啟動假名模式
 */
function startKanaMode() {
  // 隱藏結果面板
  if (elements.resultContainer) {
    elements.resultContainer.style.display = 'none';
  }

  const practiceText = getRandomText();

  currentController = new PracticeController({
    text: practiceText,
    elements,
    keyboardRenderer,
    onNextQuestion: startKanaMode,
    inputMode: currentInputMode,
  });

  console.log('假名模式:', practiceText);
}

/**
 * 初始化應用程式
 */
async function init() {
  // 取得 DOM 元素
  const textContainer = document.getElementById('practice-text');
  const romajiContainer = document.getElementById('practice-romaji');
  const keyboardContainer = document.getElementById('keyboard');

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
    document.querySelector('.practice-container')?.appendChild(resultContainer);
  }

  // 建立緩衝區顯示（如果不存在）
  let bufferDisplay = document.getElementById('buffer-display');
  if (!bufferDisplay) {
    bufferDisplay = document.createElement('div');
    bufferDisplay.id = 'buffer-display';
    bufferDisplay.className = 'buffer-display';
    romajiContainer.parentNode?.insertBefore(bufferDisplay, romajiContainer.nextSibling);
  }

  // 儲存元素參照
  elements = {
    textContainer,
    romajiContainer,
    resultContainer,
    bufferDisplay,
  };

  // 建立鍵盤渲染器
  keyboardRenderer = new KeyboardRenderer(keyboardContainer);

  // 檢查 URL 參數
  const urlParams = new URLSearchParams(window.location.search);
  const textParam = urlParams.get('text');
  const modeParam = urlParams.get('mode');
  const inputParam = urlParams.get('input');

  // 設定輸入模式（優先級：URL 參數 > localStorage > 預設值）
  if (inputParam === 'direct' || inputParam === 'mobile') {
    currentInputMode = 'direct';
  } else {
    const savedInputMode = localStorage.getItem('practice-input-mode');
    if (savedInputMode === 'direct') {
      currentInputMode = 'direct';
    }
  }

  // 設定羅馬拼音提示顯示（從 localStorage 讀取，預設顯示）
  const savedShowHint = localStorage.getItem('practice-show-hint');
  if (savedShowHint === 'false') {
    showRomajiHint = false;
  }

  // 建立控制面板
  createControlPanel();

  // 應用提示顯示設定
  if (!showRomajiHint) {
    const container = document.querySelector('.practice-container');
    if (container) {
      container.classList.add('hide-romaji-hint');
    }
  }

  if (textParam) {
    // 直接使用 URL 指定的文字
    currentController = new PracticeController({
      text: textParam,
      elements,
      keyboardRenderer,
      inputMode: currentInputMode,
    });
    console.log('URL 模式:', textParam);
    return;
  }

  if (modeParam === 'kana') {
    // 假名模式
    startKanaMode();
    return;
  }

  // 預設：題庫模式
  showLoading();

  try {
    questionLoader = new QuestionLoader();
    await questionLoader.load();

    console.log('題庫載入完成:', questionLoader.getLoadingStatus());

    // 載入第一題
    loadNextQuestion();

    // 背景載入剩餘分包
    if (questionLoader.useProgressiveLoading) {
      const savedJlpt = localStorage.getItem('practice-jlpt-filter');
      const priority = getLoadingPriority(savedJlpt);
      questionLoader.loadInBackground(priority).then(() => {
        console.log('背景載入完成:', questionLoader.getLoadingStatus());
      });
    }
  } catch (error) {
    console.error('題庫載入失敗:', error);
    // 降級到假名模式
    showError('題庫載入失敗，切換到假名模式');
    setTimeout(() => {
      startKanaMode();
    }, 2000);
  }
}

// 頁面載入後初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
