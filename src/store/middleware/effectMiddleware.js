/**
 * Effect Middleware - 副作用處理中介層
 *
 * @module store/middleware/effectMiddleware
 * @description
 * 監聽特定 Action，執行非純函數操作（語音、閃爍等）。
 * 將副作用從 UI 層分離，集中管理。
 *
 * ## 設計原理
 *
 * Reducer 必須是純函數，不能執行副作用。
 * 但某些 Action 需要觸發副作用（如語音朗讀、視覺效果）。
 * Middleware 在 Action 被 dispatch 後執行這些副作用。
 *
 * ```
 * dispatch(action)
 *      │
 *      ▼
 *  Reducer (純函數)
 *      │
 *      ▼
 *  Store.notify(subscribers)
 *      │
 *      ├──▶ EffectMiddleware (副作用)
 *      │         │
 *      │         ├──▶ SpeechService.speak()
 *      │         └──▶ FlashEffect.flashSuccess()
 *      │
 *      └──▶ UI Subscribers (渲染)
 * ```
 *
 * ## 使用方式
 *
 * ```javascript
 * const effectMiddleware = createEffectMiddleware({
 *   speechService: new SpeechService(),
 *   flashEffect: new FlashEffect(container),
 * });
 *
 * store.subscribe(effectMiddleware);
 * ```
 */

import { ActionTypes } from '../actions.js';

/**
 * 建立副作用中介層
 *
 * @param {Object} dependencies - 依賴服務
 * @param {import('../../services/SpeechService.js').SpeechService} [dependencies.speechService] - 語音服務
 * @param {import('../../effects/FlashEffect.js').FlashEffect} [dependencies.flashEffect] - 閃爍效果
 * @returns {Function} Store subscriber 函數
 */
export function createEffectMiddleware(dependencies) {
  const { speechService, flashEffect } = dependencies;

  /**
   * Store subscriber - 處理 Action 副作用
   * @param {Object} state - 當前狀態
   * @param {Object} action - 觸發的 Action
   */
  return (state, action) => {
    switch (action.type) {
      case ActionTypes.CHARACTER_COMPLETE:
        flashEffect?.flashSuccess();
        break;

      case ActionTypes.CHARACTER_MISTAKE:
        flashEffect?.flashError();
        break;

      case ActionTypes.SPEECH_REQUEST:
        speechService?.speak(action.payload.text);
        break;
    }
  };
}
