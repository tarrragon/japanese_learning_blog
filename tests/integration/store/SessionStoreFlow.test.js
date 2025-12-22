import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { Store } from '../../../src/store/Store.js';
import { appReducer } from '../../../src/store/reducer.js';
import { initialState } from '../../../src/store/AppState.js';
import { actions, ActionTypes } from '../../../src/store/actions.js';

describe('Session → Store 整合測試', () => {
  let store;

  beforeEach(() => {
    store = new Store(appReducer, initialState);
  });

  describe('Session Actions', () => {
    it('KEY_PRESS 應增加 keystrokes 並設定 startTime', () => {
      const beforeTime = Date.now();
      store.dispatch(actions.keyPress('a'));
      const afterTime = Date.now();

      const state = store.getState();
      expect(state.session.keystrokes).toBe(1);
      expect(state.session.startTime).toBeGreaterThanOrEqual(beforeTime);
      expect(state.session.startTime).toBeLessThanOrEqual(afterTime);
    });

    it('多次 KEY_PRESS 應累加 keystrokes，startTime 保持首次值', () => {
      store.dispatch(actions.keyPress('a'));
      const firstStartTime = store.getState().session.startTime;

      store.dispatch(actions.keyPress('b'));
      store.dispatch(actions.keyPress('c'));

      const state = store.getState();
      expect(state.session.keystrokes).toBe(3);
      expect(state.session.startTime).toBe(firstStartTime);
    });

    it('ROMAJI_MATCH 應更新 inputBuffer', () => {
      store.dispatch(actions.romajiMatch('ka', true));

      const state = store.getState();
      expect(state.session.inputBuffer).toBe('ka');
    });

    it('CHARACTER_COMPLETE 應清空 inputBuffer 並增加 currentIndex', () => {
      // 先設定一些輸入
      store.dispatch(actions.romajiMatch('ka', true));
      expect(store.getState().session.inputBuffer).toBe('ka');

      // 完成字元
      store.dispatch(actions.characterComplete({ kana: 'か' }, 500));

      const state = store.getState();
      expect(state.session.inputBuffer).toBe('');
      expect(state.session.currentIndex).toBe(1);
    });

    it('CHARACTER_MISTAKE 應清空 inputBuffer 並增加 mistakes', () => {
      // 先設定一些輸入
      store.dispatch(actions.romajiMatch('k', true));

      // 輸入錯誤
      store.dispatch(actions.characterMistake(['ka', 'ca'], 'x'));

      const state = store.getState();
      expect(state.session.inputBuffer).toBe('');
      expect(state.session.mistakes).toBe(1);
    });

    it('SPEECH_REQUEST 應不改變狀態', () => {
      const stateBefore = store.getState();
      store.dispatch(actions.speechRequest('あ'));
      const stateAfter = store.getState();

      expect(stateAfter).toBe(stateBefore);
    });
  });

  describe('完整輸入流程模擬', () => {
    it('模擬輸入「あ」（成功）', () => {
      // 1. 按下 'a'
      store.dispatch(actions.keyPress('a'));

      // 2. 羅馬字匹配
      store.dispatch(actions.romajiMatch('a', false));

      // 3. 字元完成
      store.dispatch(actions.characterComplete({ kana: 'あ' }, 300));

      const state = store.getState();
      expect(state.session.keystrokes).toBe(1);
      expect(state.session.currentIndex).toBe(1);
      expect(state.session.mistakes).toBe(0);
      expect(state.session.inputBuffer).toBe('');
    });

    it('模擬輸入「か」（先錯後對）', () => {
      // 1. 按錯 'x'
      store.dispatch(actions.keyPress('x'));
      store.dispatch(actions.characterMistake(['k', 'ka', 'ca'], 'x'));

      // 2. 按對 'k'
      store.dispatch(actions.keyPress('k'));
      store.dispatch(actions.romajiMatch('k', true));

      // 3. 按對 'a'
      store.dispatch(actions.keyPress('a'));
      store.dispatch(actions.romajiMatch('ka', false));
      store.dispatch(actions.characterComplete({ kana: 'か' }, 800));

      const state = store.getState();
      expect(state.session.keystrokes).toBe(3);
      expect(state.session.currentIndex).toBe(1);
      expect(state.session.mistakes).toBe(1);
    });

    it('模擬輸入「あい」完整流程', () => {
      // あ
      store.dispatch(actions.keyPress('a'));
      store.dispatch(actions.romajiMatch('a', false));
      store.dispatch(actions.characterComplete({ kana: 'あ' }, 200));

      // い
      store.dispatch(actions.keyPress('i'));
      store.dispatch(actions.romajiMatch('i', false));
      store.dispatch(actions.characterComplete({ kana: 'い' }, 200));

      const state = store.getState();
      expect(state.session.keystrokes).toBe(2);
      expect(state.session.currentIndex).toBe(2);
      expect(state.session.mistakes).toBe(0);
    });
  });

  describe('RESET_SESSION', () => {
    it('應重置所有 session 狀態', () => {
      // 先產生一些狀態
      store.dispatch(actions.keyPress('a'));
      store.dispatch(actions.keyPress('b'));
      store.dispatch(actions.characterMistake(['a'], 'x'));
      store.dispatch(actions.characterComplete({ kana: 'あ' }, 200));

      // 確認有狀態
      expect(store.getState().session.keystrokes).toBe(2);
      expect(store.getState().session.mistakes).toBe(1);
      expect(store.getState().session.currentIndex).toBe(1);

      // 重置
      store.dispatch(actions.resetSession());

      // 驗證重置
      const state = store.getState();
      expect(state.session.keystrokes).toBe(0);
      expect(state.session.mistakes).toBe(0);
      expect(state.session.currentIndex).toBe(0);
      expect(state.session.inputBuffer).toBe('');
      expect(state.session.startTime).toBe(null);
    });
  });

  describe('Store 訂閱通知', () => {
    it('KEY_PRESS 應觸發訂閱者通知', () => {
      const listener = mock(() => {});
      store.subscribe(listener);

      store.dispatch(actions.keyPress('a'));

      expect(listener).toHaveBeenCalledTimes(1);
      const [state, action] = listener.mock.calls[0];
      expect(action.type).toBe(ActionTypes.KEY_PRESS);
      expect(state.session.keystrokes).toBe(1);
    });

    it('CHARACTER_COMPLETE 應觸發訂閱者通知', () => {
      const listener = mock(() => {});
      store.subscribe(listener);

      store.dispatch(actions.characterComplete({ kana: 'あ' }, 200));

      expect(listener).toHaveBeenCalledTimes(1);
      const [state, action] = listener.mock.calls[0];
      expect(action.type).toBe(ActionTypes.CHARACTER_COMPLETE);
    });

    it('SPEECH_REQUEST 應不觸發訂閱者（狀態未變）', () => {
      const listener = mock(() => {});
      store.subscribe(listener);

      store.dispatch(actions.speechRequest('test'));

      expect(listener).toHaveBeenCalledTimes(0);
    });
  });
});
