/**
 * 日文輸入練習 - 主入口
 */
import { PracticeController } from './ui/PracticeController.js';
import { KeyboardRenderer } from './ui/KeyboardRenderer.js';

/**
 * 練習題目列表
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
 * 隨機選擇練習文字
 */
function getRandomText() {
  const index = Math.floor(Math.random() * PRACTICE_TEXTS.length);
  return PRACTICE_TEXTS[index];
}

/**
 * 初始化應用程式
 */
function init() {
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

  // 建立鍵盤渲染器
  const keyboardRenderer = new KeyboardRenderer(keyboardContainer);

  // 取得練習文字（可從 URL 參數或隨機選擇）
  const urlParams = new URLSearchParams(window.location.search);
  const practiceText = urlParams.get('text') || getRandomText();

  // 建立控制器
  const controller = new PracticeController({
    text: practiceText,
    elements: {
      textContainer,
      romajiContainer,
      resultContainer,
      bufferDisplay,
    },
    keyboardRenderer,
  });

  // 顯示當前練習文字（debug 用）
  console.log('練習文字:', practiceText);
}

// 頁面載入後初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
