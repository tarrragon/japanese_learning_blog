/**
 * Action Types 和 Action Creators
 *
 * @module store/actions
 * @description
 * 定義所有狀態變更的動作類型和建立函數。
 *
 * ## Action 設計原則
 *
 * 1. **Action 是純物件**
 *    - 必須包含 `type` 屬性（字串）
 *    - 可選包含 `payload` 屬性（任意資料）
 *
 * 2. **Action Type 使用常數**
 *    - 避免字串拼寫錯誤
 *    - 便於重構和搜尋
 *    - IDE 自動完成支援
 *
 * 3. **Action Creator 是純函數**
 *    - 只負責建立 Action 物件
 *    - 不執行副作用（API 呼叫、localStorage 等）
 *
 * ## 命名慣例
 *
 * | 前綴      | 用途                    | 範例                    |
 * |----------|------------------------|------------------------|
 * | SET_     | 設定特定值              | SET_INPUT_MODE         |
 * | TOGGLE_  | 切換布林值              | TOGGLE_KEYBOARD        |
 * | START_   | 開始非同步操作           | START_LOADING          |
 * | _SUCCESS | 非同步操作成功           | LOAD_QUESTION_SUCCESS  |
 * | _FAILURE | 非同步操作失敗           | LOAD_QUESTION_FAILURE  |
 * | RESET_   | 重置為初始狀態           | RESET_SESSION          |
 *
 * ## 使用範例
 *
 * ```javascript
 * import { actions, ActionTypes } from './actions.js';
 *
 * // 使用 Action Creator（推薦）
 * store.dispatch(actions.setInputMode('direct'));
 *
 * // 直接建立 Action（不推薦，但可行）
 * store.dispatch({ type: ActionTypes.SET_INPUT_MODE, payload: 'direct' });
 * ```
 */

/**
 * Action 類型常數
 *
 * 將所有 Action type 集中定義，避免魔法字串。
 * 在 reducer 和 subscriber 中使用這些常數進行比對。
 *
 * @constant {Object}
 */
export const ActionTypes = {
  // ─────────────────────────────────────────────────────────
  // 模式切換
  // ─────────────────────────────────────────────────────────
  /** 設定練習模式（題庫/假名） */
  SET_PRACTICE_MODE: 'SET_PRACTICE_MODE',
  /** 設定輸入模式（羅馬拼音/直接輸入） */
  SET_INPUT_MODE: 'SET_INPUT_MODE',

  // ─────────────────────────────────────────────────────────
  // UI 設定
  // ─────────────────────────────────────────────────────────
  /** 切換羅馬拼音提示顯示 */
  TOGGLE_ROMAJI_HINT: 'TOGGLE_ROMAJI_HINT',
  /** 切換虛擬鍵盤顯示（僅在 romaji 模式有效） */
  TOGGLE_KEYBOARD: 'TOGGLE_KEYBOARD',

  // ─────────────────────────────────────────────────────────
  // 篩選條件
  // ─────────────────────────────────────────────────────────
  /** 設定題目篩選條件 */
  SET_FILTER: 'SET_FILTER',

  // ─────────────────────────────────────────────────────────
  // Session 生命週期
  // ─────────────────────────────────────────────────────────
  /** 開始載入題目 */
  START_LOADING: 'START_LOADING',
  /** 題目載入成功 */
  LOAD_QUESTION_SUCCESS: 'LOAD_QUESTION_SUCCESS',
  /** 題目載入失敗 */
  LOAD_QUESTION_FAILURE: 'LOAD_QUESTION_FAILURE',
  /** 完成練習 Session */
  COMPLETE_SESSION: 'COMPLETE_SESSION',

  // ─────────────────────────────────────────────────────────
  // 清理
  // ─────────────────────────────────────────────────────────
  /** 重置 Session 狀態 */
  RESET_SESSION: 'RESET_SESSION',
};

/**
 * Action Creators
 *
 * 建立 Action 物件的工廠函數集合。
 * 使用 Action Creator 而非直接建立物件的好處：
 * - 統一 Action 結構
 * - 便於加入驗證邏輯
 * - 更好的 TypeScript/JSDoc 支援
 *
 * @namespace actions
 */
export const actions = {
  /**
   * 設定練習模式
   *
   * @param {'question'|'kana'} mode - 練習模式
   * @returns {Object} Action 物件
   *
   * @example
   * store.dispatch(actions.setPracticeMode('kana'));
   */
  setPracticeMode: (mode) => ({
    type: ActionTypes.SET_PRACTICE_MODE,
    payload: mode,
  }),

  /**
   * 設定輸入模式
   *
   * @param {'romaji'|'direct'} mode - 輸入模式
   *   - romaji: 羅馬拼音輸入（顯示虛擬鍵盤）
   *   - direct: 直接輸入假名（手機模式）
   * @returns {Object} Action 物件
   *
   * @example
   * store.dispatch(actions.setInputMode('direct'));
   */
  setInputMode: (mode) => ({
    type: ActionTypes.SET_INPUT_MODE,
    payload: mode,
  }),

  /**
   * 切換羅馬拼音提示顯示
   *
   * @returns {Object} Action 物件
   *
   * @example
   * store.dispatch(actions.toggleRomajiHint());
   */
  toggleRomajiHint: () => ({
    type: ActionTypes.TOGGLE_ROMAJI_HINT,
  }),

  /**
   * 切換虛擬鍵盤顯示
   *
   * 注意：只在 romaji 輸入模式下有效。
   * direct 模式下鍵盤強制隱藏。
   *
   * @returns {Object} Action 物件
   *
   * @example
   * store.dispatch(actions.toggleKeyboard());
   */
  toggleKeyboard: () => ({
    type: ActionTypes.TOGGLE_KEYBOARD,
  }),

  /**
   * 設定篩選條件
   *
   * @param {string} key - 篩選鍵（如 'jlpt', 'category'）
   * @param {string} value - 篩選值（如 'N3', 'economics'）
   * @returns {Object} Action 物件
   *
   * @example
   * store.dispatch(actions.setFilter('jlpt', 'N3'));
   */
  setFilter: (key, value) => ({
    type: ActionTypes.SET_FILTER,
    payload: { key, value },
  }),

  /**
   * 開始載入題目
   *
   * 將狀態設為 loading，清除之前的錯誤。
   *
   * @returns {Object} Action 物件
   */
  startLoading: () => ({
    type: ActionTypes.START_LOADING,
  }),

  /**
   * 題目載入成功
   *
   * @param {Object} question - 題目資料
   * @param {string} question.text - 題目文字
   * @param {Array} question.characters - 字元資料陣列
   * @returns {Object} Action 物件
   */
  loadQuestionSuccess: (question) => ({
    type: ActionTypes.LOAD_QUESTION_SUCCESS,
    payload: question,
  }),

  /**
   * 題目載入失敗
   *
   * @param {string} error - 錯誤訊息
   * @returns {Object} Action 物件
   */
  loadQuestionFailure: (error) => ({
    type: ActionTypes.LOAD_QUESTION_FAILURE,
    payload: error,
  }),

  /**
   * 完成練習 Session
   *
   * @param {Object} result - 練習結果統計
   * @param {number} result.accuracy - 正確率 (0-1)
   * @param {number} result.totalTime - 總耗時（毫秒）
   * @param {number} result.totalKeystrokes - 總按鍵次數
   * @returns {Object} Action 物件
   */
  completeSession: (result) => ({
    type: ActionTypes.COMPLETE_SESSION,
    payload: result,
  }),

  /**
   * 重置 Session 狀態
   *
   * 將 Session 相關狀態重置為初始值。
   * 注意：目前未使用，loadNextQuestion 直接載入新題目。
   *
   * @returns {Object} Action 物件
   */
  resetSession: () => ({
    type: ActionTypes.RESET_SESSION,
  }),
};
