import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { SessionStoreAdapter } from '../../src/adapters/SessionStoreAdapter.js';
import { TypingSession } from '../../src/domain/TypingSession.js';
import { Question } from '../../src/domain/Question.js';
import { Store } from '../../src/store/Store.js';
import { appReducer } from '../../src/store/reducer.js';
import { initialState } from '../../src/store/AppState.js';
import { ActionTypes } from '../../src/store/actions.js';

describe('SessionStoreAdapter', () => {
  let session;
  let store;
  let adapter;
  let dispatchedActions;
  let originalDispatch;

  beforeEach(() => {
    const question = Question.fromText('あい');
    session = new TypingSession(question);
    store = new Store(appReducer, initialState);

    // 追蹤所有 dispatch 的 actions（包括不改變狀態的）
    dispatchedActions = [];
    originalDispatch = store.dispatch.bind(store);
    store.dispatch = (action) => {
      dispatchedActions.push(action);
      return originalDispatch(action);
    };

    adapter = new SessionStoreAdapter(session, store);
  });

  describe('事件轉換', () => {
    it('KEY_PRESSED 應轉換為 KEY_PRESS action', () => {
      session.handleKeyPress('a');

      const keyPressActions = dispatchedActions.filter(
        (a) => a.type === ActionTypes.KEY_PRESS
      );
      expect(keyPressActions.length).toBeGreaterThanOrEqual(1);
      expect(keyPressActions[0].payload.key).toBe('a');
    });

    it('ROMAJI_MATCHED 應轉換為 ROMAJI_MATCH action', () => {
      session.handleKeyPress('a');

      const romajiActions = dispatchedActions.filter(
        (a) => a.type === ActionTypes.ROMAJI_MATCH
      );
      expect(romajiActions.length).toBeGreaterThanOrEqual(1);
    });

    it('CHARACTER_COMPLETED 應轉換為 CHARACTER_COMPLETE action', () => {
      session.handleKeyPress('a');

      const completeActions = dispatchedActions.filter(
        (a) => a.type === ActionTypes.CHARACTER_COMPLETE
      );
      expect(completeActions.length).toBe(1);
      expect(completeActions[0].payload.character.kana).toBe('あ');
    });

    it('CHARACTER_MISTAKEN 應轉換為 CHARACTER_MISTAKE action', () => {
      session.handleKeyPress('x'); // 錯誤輸入

      const mistakeActions = dispatchedActions.filter(
        (a) => a.type === ActionTypes.CHARACTER_MISTAKE
      );
      expect(mistakeActions.length).toBe(1);
      expect(mistakeActions[0].payload.actual).toBe('x');
    });

    it('SPEECH_REQUESTED 應轉換為 SPEECH_REQUEST action', () => {
      session.handleKeyPress('a');

      const speechActions = dispatchedActions.filter(
        (a) => a.type === ActionTypes.SPEECH_REQUEST
      );
      expect(speechActions.length).toBe(1);
      expect(speechActions[0].payload.text).toBe('あ');
    });
  });

  describe('完整流程', () => {
    it('輸入「あい」應產生正確的 action 序列', () => {
      // 輸入 'a' → あ
      session.handleKeyPress('a');

      // 輸入 'i' → い
      session.handleKeyPress('i');

      // 驗證 action 類型
      const actionTypes = dispatchedActions.map((a) => a.type);

      // 應包含 KEY_PRESS x2
      expect(actionTypes.filter((t) => t === ActionTypes.KEY_PRESS).length).toBe(2);

      // 應包含 CHARACTER_COMPLETE x2
      expect(
        actionTypes.filter((t) => t === ActionTypes.CHARACTER_COMPLETE).length
      ).toBe(2);

      // 應包含 SPEECH_REQUEST x2
      expect(
        actionTypes.filter((t) => t === ActionTypes.SPEECH_REQUEST).length
      ).toBe(2);
    });

    it('錯誤後重試應產生 MISTAKE 和 COMPLETE actions', () => {
      // 按錯
      session.handleKeyPress('x');

      // 按對
      session.handleKeyPress('a');

      const actionTypes = dispatchedActions.map((a) => a.type);

      expect(actionTypes).toContain(ActionTypes.CHARACTER_MISTAKE);
      expect(actionTypes).toContain(ActionTypes.CHARACTER_COMPLETE);
    });
  });

  describe('Store 狀態更新', () => {
    it('輸入後 Store 狀態應正確更新', () => {
      session.handleKeyPress('a');

      const state = store.getState();
      expect(state.session.keystrokes).toBe(1);
      expect(state.session.currentIndex).toBe(1);
    });

    it('錯誤輸入後 mistakes 應增加', () => {
      session.handleKeyPress('x');

      const state = store.getState();
      expect(state.session.mistakes).toBe(1);
    });
  });

  describe('dispose', () => {
    it('dispose 後應不再轉發事件', () => {
      adapter.dispose();

      const countBefore = dispatchedActions.length;
      session.handleKeyPress('a');

      // 不應有新的 actions（除了 SESSION_COMPLETED 等非 adapter 轉發的）
      // 因為 adapter 已經 dispose
      expect(dispatchedActions.length).toBe(countBefore);
    });
  });
});
