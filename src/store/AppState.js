/**
 * AppState - 應用程式狀態定義
 *
 * 集中管理所有 UI 狀態，取代散落的全域變數
 */

/**
 * @typedef {'question'|'kana'} PracticeMode - 練習模式
 */

/**
 * @typedef {'romaji'|'direct'} InputMode - 輸入模式
 */

/**
 * @typedef {'idle'|'loading'|'practicing'|'completed'|'error'} AppStatus - 應用狀態
 */

/**
 * @typedef {Object} UISettings - UI 設定
 * @property {boolean} showRomajiHint - 是否顯示羅馬拼音提示
 * @property {boolean} showKeyboard - 是否顯示虛擬鍵盤
 */

/**
 * @typedef {Object} Filters - 題目篩選條件
 * @property {string} jlpt - JLPT 等級 ('all'|'n5'|'n4'|'n3'|'n2'|'n1')
 */

/**
 * @typedef {Object} SessionState - Session 即時狀態
 * @property {string} inputBuffer - 當前輸入緩衝區
 * @property {number} currentIndex - 當前字元索引
 * @property {number} keystrokes - 總按鍵數
 * @property {number} mistakes - 錯誤數
 * @property {number|null} startTime - Session 開始時間戳
 */

/**
 * @typedef {Object} AppState - 應用程式狀態
 * @property {PracticeMode} practiceMode - 練習模式
 * @property {InputMode} inputMode - 輸入模式
 * @property {UISettings} uiSettings - UI 設定
 * @property {Filters} filters - 題目篩選條件
 * @property {AppStatus} status - 應用狀態
 * @property {Object|null} currentQuestion - 當前題目資料
 * @property {Object|null} result - 練習結果
 * @property {string|null} error - 錯誤訊息
 * @property {SessionState} session - Session 即時狀態
 */

/**
 * 初始狀態
 * @type {AppState}
 */
export const initialState = {
  practiceMode: 'question',
  inputMode: 'romaji',
  uiSettings: {
    showRomajiHint: true,
    showKeyboard: true,
  },
  filters: {
    jlpt: 'all',
  },
  status: 'idle',
  currentQuestion: null,
  result: null,
  error: null,

  // Session 即時狀態（對應 TypingSession 內部狀態）
  session: {
    inputBuffer: '',
    currentIndex: 0,
    keystrokes: 0,
    mistakes: 0,
    startTime: null,
  },
};

/**
 * 建立新狀態（淺複製）
 * @param {AppState} state - 原始狀態
 * @param {Partial<AppState>} updates - 更新內容
 * @returns {AppState}
 */
export function createState(state, updates) {
  return { ...state, ...updates };
}
