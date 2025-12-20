import { describe, it, expect, beforeEach } from 'bun:test';
import { Store } from '../../src/store/Store.js';
import { appReducer } from '../../src/store/reducer.js';
import { initialState } from '../../src/store/AppState.js';
import { actions, ActionTypes } from '../../src/store/actions.js';

describe('Store', () => {
  let store;

  beforeEach(() => {
    store = new Store(appReducer, initialState);
  });

  describe('getState', () => {
    it('should return initial state', () => {
      const state = store.getState();
      expect(state).toEqual(initialState);
    });

    it('should return same reference if no dispatch', () => {
      const state1 = store.getState();
      const state2 = store.getState();
      expect(state1).toBe(state2);
    });
  });

  describe('dispatch', () => {
    it('should update state with valid action', () => {
      store.dispatch(actions.setInputMode('direct'));
      expect(store.getState().inputMode).toBe('direct');
    });

    it('should throw if action has no type', () => {
      expect(() => store.dispatch({})).toThrow('Action must have a type property');
      expect(() => store.dispatch({ payload: 'test' })).toThrow();
    });

    it('should throw if action is null', () => {
      expect(() => store.dispatch(null)).toThrow();
    });

    it('should not modify original state', () => {
      const originalState = store.getState();
      store.dispatch(actions.setInputMode('direct'));
      expect(originalState.inputMode).toBe('romaji');
    });
  });

  describe('subscribe', () => {
    it('should notify listener on state change', () => {
      let notified = false;
      let receivedState = null;
      let receivedAction = null;

      store.subscribe((state, action) => {
        notified = true;
        receivedState = state;
        receivedAction = action;
      });

      store.dispatch(actions.setInputMode('direct'));

      expect(notified).toBe(true);
      expect(receivedState.inputMode).toBe('direct');
      expect(receivedAction.type).toBe(ActionTypes.SET_INPUT_MODE);
    });

    it('should not notify if state unchanged', () => {
      let notifyCount = 0;

      store.subscribe(() => {
        notifyCount++;
      });

      // 派發會產生相同狀態的 action
      store.dispatch({ type: 'UNKNOWN_ACTION' });

      expect(notifyCount).toBe(0);
    });

    it('should return unsubscribe function', () => {
      let notifyCount = 0;

      const unsubscribe = store.subscribe(() => {
        notifyCount++;
      });

      store.dispatch(actions.setInputMode('direct'));
      expect(notifyCount).toBe(1);

      unsubscribe();

      store.dispatch(actions.setInputMode('romaji'));
      expect(notifyCount).toBe(1); // 沒有再次通知
    });

    it('should support multiple listeners', () => {
      let count1 = 0;
      let count2 = 0;

      store.subscribe(() => count1++);
      store.subscribe(() => count2++);

      store.dispatch(actions.setInputMode('direct'));

      expect(count1).toBe(1);
      expect(count2).toBe(1);
    });

    it('should throw if listener is not a function', () => {
      expect(() => store.subscribe('not a function')).toThrow('Listener must be a function');
      expect(() => store.subscribe(null)).toThrow();
    });

    it('should handle listener errors gracefully', () => {
      let secondCalled = false;

      store.subscribe(() => {
        throw new Error('Listener error');
      });
      store.subscribe(() => {
        secondCalled = true;
      });

      // 不應該拋出錯誤，且第二個 listener 應該被呼叫
      store.dispatch(actions.setInputMode('direct'));
      expect(secondCalled).toBe(true);
    });
  });

  describe('getListenerCount', () => {
    it('should return correct listener count', () => {
      expect(store.getListenerCount()).toBe(0);

      const unsub1 = store.subscribe(() => {});
      expect(store.getListenerCount()).toBe(1);

      const unsub2 = store.subscribe(() => {});
      expect(store.getListenerCount()).toBe(2);

      unsub1();
      expect(store.getListenerCount()).toBe(1);

      unsub2();
      expect(store.getListenerCount()).toBe(0);
    });
  });
});

describe('appReducer', () => {
  describe('SET_PRACTICE_MODE', () => {
    it('should update practiceMode', () => {
      const state = appReducer(initialState, actions.setPracticeMode('kana'));
      expect(state.practiceMode).toBe('kana');
    });

    it('should not modify other state', () => {
      const state = appReducer(initialState, actions.setPracticeMode('kana'));
      expect(state.inputMode).toBe(initialState.inputMode);
      expect(state.uiSettings).toEqual(initialState.uiSettings);
    });
  });

  describe('SET_INPUT_MODE', () => {
    it('should update inputMode', () => {
      const state = appReducer(initialState, actions.setInputMode('direct'));
      expect(state.inputMode).toBe('direct');
    });
  });

  describe('TOGGLE_ROMAJI_HINT', () => {
    it('should toggle showRomajiHint from true to false', () => {
      const state = appReducer(initialState, actions.toggleRomajiHint());
      expect(state.uiSettings.showRomajiHint).toBe(false);
    });

    it('should toggle showRomajiHint from false to true', () => {
      const stateWithHintOff = {
        ...initialState,
        uiSettings: { ...initialState.uiSettings, showRomajiHint: false },
      };
      const state = appReducer(stateWithHintOff, actions.toggleRomajiHint());
      expect(state.uiSettings.showRomajiHint).toBe(true);
    });
  });

  describe('SET_FILTER', () => {
    it('should update filter value', () => {
      const state = appReducer(initialState, actions.setFilter('jlpt', 'n4'));
      expect(state.filters.jlpt).toBe('n4');
    });

    it('should add new filter key', () => {
      const state = appReducer(initialState, actions.setFilter('category', 'verb'));
      expect(state.filters.category).toBe('verb');
      expect(state.filters.jlpt).toBe('all'); // 保留原有
    });
  });

  describe('START_LOADING', () => {
    it('should set status to loading and clear error', () => {
      const stateWithError = { ...initialState, status: 'error', error: 'Some error' };
      const state = appReducer(stateWithError, actions.startLoading());
      expect(state.status).toBe('loading');
      expect(state.error).toBe(null);
    });
  });

  describe('LOAD_QUESTION_SUCCESS', () => {
    it('should set status to practicing and store question', () => {
      const question = { id: 1, text: 'テスト' };
      const state = appReducer(initialState, actions.loadQuestionSuccess(question));
      expect(state.status).toBe('practicing');
      expect(state.currentQuestion).toEqual(question);
      expect(state.error).toBe(null);
    });
  });

  describe('LOAD_QUESTION_FAILURE', () => {
    it('should set status to error and store error message', () => {
      const state = appReducer(initialState, actions.loadQuestionFailure('Load failed'));
      expect(state.status).toBe('error');
      expect(state.error).toBe('Load failed');
    });
  });

  describe('COMPLETE_SESSION', () => {
    it('should set status to completed and store result', () => {
      const result = { accuracy: 0.95, totalTime: 5000 };
      const state = appReducer(initialState, actions.completeSession(result));
      expect(state.status).toBe('completed');
      expect(state.result).toEqual(result);
    });
  });

  describe('RESET_SESSION', () => {
    it('should reset session state to idle', () => {
      const stateWithSession = {
        ...initialState,
        status: 'completed',
        currentQuestion: { id: 1 },
        result: { accuracy: 0.95 },
        error: 'Old error',
      };
      const state = appReducer(stateWithSession, actions.resetSession());
      expect(state.status).toBe('idle');
      expect(state.currentQuestion).toBe(null);
      expect(state.result).toBe(null);
      expect(state.error).toBe(null);
    });

    it('should preserve other state', () => {
      const stateWithSettings = {
        ...initialState,
        inputMode: 'direct',
        practiceMode: 'kana',
        status: 'completed',
      };
      const state = appReducer(stateWithSettings, actions.resetSession());
      expect(state.inputMode).toBe('direct');
      expect(state.practiceMode).toBe('kana');
    });
  });

  describe('unknown action', () => {
    it('should return same state for unknown action', () => {
      const state = appReducer(initialState, { type: 'UNKNOWN' });
      expect(state).toBe(initialState);
    });
  });
});
