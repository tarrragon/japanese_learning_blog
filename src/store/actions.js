/**
 * Action Types 和 Action Creators
 *
 * 定義所有狀態變更的動作類型
 */

/**
 * Action 類型常數
 */
export const ActionTypes = {
  // 模式切換
  SET_PRACTICE_MODE: 'SET_PRACTICE_MODE',
  SET_INPUT_MODE: 'SET_INPUT_MODE',

  // UI 設定
  TOGGLE_ROMAJI_HINT: 'TOGGLE_ROMAJI_HINT',
  TOGGLE_KEYBOARD: 'TOGGLE_KEYBOARD',

  // 篩選條件
  SET_FILTER: 'SET_FILTER',

  // Session 生命週期
  START_LOADING: 'START_LOADING',
  LOAD_QUESTION_SUCCESS: 'LOAD_QUESTION_SUCCESS',
  LOAD_QUESTION_FAILURE: 'LOAD_QUESTION_FAILURE',
  COMPLETE_SESSION: 'COMPLETE_SESSION',

  // 清理
  RESET_SESSION: 'RESET_SESSION',
};

/**
 * Action Creators
 */
export const actions = {
  /**
   * 設定練習模式
   * @param {'question'|'kana'} mode
   */
  setPracticeMode: (mode) => ({
    type: ActionTypes.SET_PRACTICE_MODE,
    payload: mode,
  }),

  /**
   * 設定輸入模式
   * @param {'romaji'|'direct'} mode
   */
  setInputMode: (mode) => ({
    type: ActionTypes.SET_INPUT_MODE,
    payload: mode,
  }),

  /**
   * 切換羅馬拼音提示顯示
   */
  toggleRomajiHint: () => ({
    type: ActionTypes.TOGGLE_ROMAJI_HINT,
  }),

  /**
   * 切換虛擬鍵盤顯示
   */
  toggleKeyboard: () => ({
    type: ActionTypes.TOGGLE_KEYBOARD,
  }),

  /**
   * 設定篩選條件
   * @param {string} key - 篩選鍵（如 'jlpt'）
   * @param {string} value - 篩選值
   */
  setFilter: (key, value) => ({
    type: ActionTypes.SET_FILTER,
    payload: { key, value },
  }),

  /**
   * 開始載入
   */
  startLoading: () => ({
    type: ActionTypes.START_LOADING,
  }),

  /**
   * 載入題目成功
   * @param {Object} question - 題目資料
   */
  loadQuestionSuccess: (question) => ({
    type: ActionTypes.LOAD_QUESTION_SUCCESS,
    payload: question,
  }),

  /**
   * 載入題目失敗
   * @param {string} error - 錯誤訊息
   */
  loadQuestionFailure: (error) => ({
    type: ActionTypes.LOAD_QUESTION_FAILURE,
    payload: error,
  }),

  /**
   * 完成練習
   * @param {Object} result - 練習結果
   */
  completeSession: (result) => ({
    type: ActionTypes.COMPLETE_SESSION,
    payload: result,
  }),

  /**
   * 重置 Session
   */
  resetSession: () => ({
    type: ActionTypes.RESET_SESSION,
  }),
};
