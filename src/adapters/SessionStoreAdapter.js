/**
 * SessionStoreAdapter - Session 事件到 Store 的橋接器
 *
 * @module adapters/SessionStoreAdapter
 * @description
 * 將 TypingSession 的事件轉換為 Store actions，
 * 實現從事件驅動到單向資料流的漸進式遷移。
 *
 * ## 設計原理
 *
 * ```
 * TypingSession                SessionStoreAdapter                 Store
 *      │                              │                              │
 *      │──emit(KEY_PRESSED)──────────▶│                              │
 *      │                              │──dispatch(keyPress())───────▶│
 *      │                              │                              │
 *      │──emit(ROMAJI_MATCHED)───────▶│                              │
 *      │                              │──dispatch(romajiMatch())────▶│
 *      │                              │                              │
 *      │──emit(CHARACTER_COMPLETED)──▶│                              │
 *      │                              │──dispatch(characterComplete())▶│
 *      │                              │                              │
 * ```
 *
 * ## 使用方式
 *
 * ```javascript
 * const session = new TypingSession(question);
 * const adapter = new SessionStoreAdapter(session, store);
 *
 * // 當 session 觸發事件時，adapter 自動轉發到 store
 * session.handleKeyPress('a');
 * // → store.dispatch(actions.keyPress('a'))
 * // → store.dispatch(actions.romajiMatch('a', false))
 * // → store.dispatch(actions.characterComplete(...))
 *
 * // 清理
 * adapter.dispose();
 * ```
 */

import { SessionEventTypes } from '../domain/EventTypes.js';
import { actions } from '../store/actions.js';

export class SessionStoreAdapter {
  #session;
  #store;
  #unsubscribers = [];

  /**
   * 建立 Session-Store 橋接器
   *
   * @param {import('../domain/TypingSession.js').TypingSession} session - TypingSession 實例
   * @param {import('../store/Store.js').Store} store - Store 實例
   */
  constructor(session, store) {
    this.#session = session;
    this.#store = store;
    this.#setupListeners();
  }

  /**
   * 設定事件監聽器
   * @private
   */
  #setupListeners() {
    // KEY_PRESSED → keyPress
    this.#subscribe(SessionEventTypes.KEY_PRESSED, (e) => {
      this.#store.dispatch(actions.keyPress(e.key));
    });

    // ROMAJI_MATCHED → romajiMatch
    this.#subscribe(SessionEventTypes.ROMAJI_MATCHED, (e) => {
      this.#store.dispatch(actions.romajiMatch(e.romaji, e.isPartial));
    });

    // CHARACTER_COMPLETED → characterComplete
    this.#subscribe(SessionEventTypes.CHARACTER_COMPLETED, (e) => {
      this.#store.dispatch(actions.characterComplete(e.character, e.duration));
    });

    // CHARACTER_MISTAKEN → characterMistake
    this.#subscribe(SessionEventTypes.CHARACTER_MISTAKEN, (e) => {
      this.#store.dispatch(actions.characterMistake(e.expected, e.actual));
    });

    // SPEECH_REQUESTED → speechRequest
    this.#subscribe(SessionEventTypes.SPEECH_REQUESTED, (e) => {
      this.#store.dispatch(actions.speechRequest(e.text));
    });
  }

  /**
   * 訂閱 session 事件並追蹤 unsubscriber
   * @private
   */
  #subscribe(eventType, handler) {
    const unsubscribe = this.#session.on(eventType, handler);
    this.#unsubscribers.push(unsubscribe);
  }

  /**
   * 清理所有監聽器
   */
  dispose() {
    this.#unsubscribers.forEach((unsubscribe) => unsubscribe());
    this.#unsubscribers = [];
  }
}
