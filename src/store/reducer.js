/**
 * Reducer - 狀態更新邏輯
 *
 * 純函數，根據 action 類型返回新狀態
 */

import { ActionTypes } from './actions.js';

/**
 * 應用程式 Reducer
 * @param {import('./AppState.js').AppState} state - 當前狀態
 * @param {Object} action - 動作物件
 * @returns {import('./AppState.js').AppState} - 新狀態
 */
export function appReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_PRACTICE_MODE:
      return {
        ...state,
        practiceMode: action.payload,
      };

    case ActionTypes.SET_INPUT_MODE:
      return {
        ...state,
        inputMode: action.payload,
      };

    case ActionTypes.TOGGLE_ROMAJI_HINT:
      return {
        ...state,
        uiSettings: {
          ...state.uiSettings,
          showRomajiHint: !state.uiSettings.showRomajiHint,
        },
      };

    case ActionTypes.TOGGLE_KEYBOARD:
      return {
        ...state,
        uiSettings: {
          ...state.uiSettings,
          showKeyboard: !state.uiSettings.showKeyboard,
        },
      };

    case ActionTypes.SET_FILTER:
      return {
        ...state,
        filters: {
          ...state.filters,
          [action.payload.key]: action.payload.value,
        },
      };

    case ActionTypes.START_LOADING:
      return {
        ...state,
        status: 'loading',
        error: null,
      };

    case ActionTypes.LOAD_QUESTION_SUCCESS:
      return {
        ...state,
        status: 'practicing',
        currentQuestion: action.payload,
        error: null,
      };

    case ActionTypes.LOAD_QUESTION_FAILURE:
      return {
        ...state,
        status: 'error',
        error: action.payload,
      };

    case ActionTypes.COMPLETE_SESSION:
      return {
        ...state,
        status: 'completed',
        result: action.payload,
      };

    case ActionTypes.RESET_SESSION:
      return {
        ...state,
        status: 'idle',
        currentQuestion: null,
        result: null,
        error: null,
      };

    default:
      return state;
  }
}
