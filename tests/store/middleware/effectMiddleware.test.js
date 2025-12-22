import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { createEffectMiddleware } from '../../../src/store/middleware/effectMiddleware.js';
import { ActionTypes } from '../../../src/store/actions.js';

describe('effectMiddleware', () => {
  let speechService;
  let flashEffect;
  let middleware;
  let mockState;

  beforeEach(() => {
    speechService = {
      speak: mock(() => {}),
    };
    flashEffect = {
      flashSuccess: mock(() => {}),
      flashError: mock(() => {}),
    };
    middleware = createEffectMiddleware({ speechService, flashEffect });
    mockState = {};
  });

  describe('CHARACTER_COMPLETE', () => {
    it('應觸發 flashSuccess', () => {
      middleware(mockState, {
        type: ActionTypes.CHARACTER_COMPLETE,
        payload: { character: { kana: 'あ' }, duration: 200 },
      });

      expect(flashEffect.flashSuccess).toHaveBeenCalledTimes(1);
      expect(flashEffect.flashError).not.toHaveBeenCalled();
    });
  });

  describe('CHARACTER_MISTAKE', () => {
    it('應觸發 flashError', () => {
      middleware(mockState, {
        type: ActionTypes.CHARACTER_MISTAKE,
        payload: { expected: ['a'], actual: 'x' },
      });

      expect(flashEffect.flashError).toHaveBeenCalledTimes(1);
      expect(flashEffect.flashSuccess).not.toHaveBeenCalled();
    });
  });

  describe('SPEECH_REQUEST', () => {
    it('應觸發 speak', () => {
      middleware(mockState, {
        type: ActionTypes.SPEECH_REQUEST,
        payload: { text: 'あ' },
      });

      expect(speechService.speak).toHaveBeenCalledWith('あ');
    });
  });

  describe('其他 Action', () => {
    it('不應觸發任何效果', () => {
      middleware(mockState, {
        type: ActionTypes.KEY_PRESS,
        payload: { key: 'a' },
      });

      expect(speechService.speak).not.toHaveBeenCalled();
      expect(flashEffect.flashSuccess).not.toHaveBeenCalled();
      expect(flashEffect.flashError).not.toHaveBeenCalled();
    });
  });

  describe('可選依賴', () => {
    it('沒有 speechService 時不應報錯', () => {
      const noSpeechMiddleware = createEffectMiddleware({ flashEffect });

      expect(() => {
        noSpeechMiddleware(mockState, {
          type: ActionTypes.SPEECH_REQUEST,
          payload: { text: 'test' },
        });
      }).not.toThrow();
    });

    it('沒有 flashEffect 時不應報錯', () => {
      const noFlashMiddleware = createEffectMiddleware({ speechService });

      expect(() => {
        noFlashMiddleware(mockState, {
          type: ActionTypes.CHARACTER_COMPLETE,
          payload: { character: { kana: 'あ' }, duration: 200 },
        });
      }).not.toThrow();
    });
  });
});
