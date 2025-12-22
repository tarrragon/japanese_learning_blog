/**
 * SpeechService 環境適應測試
 *
 * 測試 SpeechService 在不同環境下的行為：
 * - 瀏覽器環境：自動使用 window.speechSynthesis
 * - Node 環境：優雅降級
 * - 注入優先：注入的 mock 優先於環境
 */
import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import {
  setupBrowserEnv,
  clearBrowserEnv,
  createMockSpeechSynthesis,
} from '../../helpers/browserEnv.js';

// 動態導入以確保每次測試都能獲取新的模組狀態
async function importSpeechService() {
  // 清除模組快取以確保每次測試都重新評估環境
  const modulePath = '../../../src/services/SpeechService.js';
  delete require.cache[require.resolve(modulePath)];
  return import(modulePath);
}

describe('SpeechService 環境適應', () => {
  describe('瀏覽器環境 - 預設建構', () => {
    let cleanup;

    beforeEach(() => {
      cleanup = setupBrowserEnv({ withSpeech: true });
    });

    afterEach(() => {
      cleanup();
    });

    it('應自動偵測 window.speechSynthesis', async () => {
      const { SpeechService } = await importSpeechService();
      const service = new SpeechService();

      expect(service.isSupported()).toBe(true);
    });

    it('預設語言應為 ja-JP', async () => {
      const { SpeechService } = await importSpeechService();
      const service = new SpeechService();

      expect(service.lang).toBe('ja-JP');
    });

    it('speak() 應使用 window.speechSynthesis', async () => {
      const { SpeechService } = await importSpeechService();
      const service = new SpeechService();

      // 模擬異步完成
      const promise = service.speak('あ');
      expect(promise).toBeInstanceOf(Promise);

      // 應該能正常完成（不拋錯）
      await expect(promise).resolves.toBeUndefined();
    });
  });

  describe('Node 環境 - 優雅降級', () => {
    let restore;

    beforeEach(() => {
      restore = clearBrowserEnv();
    });

    afterEach(() => {
      restore();
    });

    it('isSupported() 應返回 false', async () => {
      const { SpeechService } = await importSpeechService();
      const service = new SpeechService();

      expect(service.isSupported()).toBe(false);
    });

    it('speak() 應靜默完成不拋錯', async () => {
      const { SpeechService } = await importSpeechService();
      const service = new SpeechService();

      // 不應該拋錯，應該靜默 resolve
      await expect(service.speak('test')).resolves.toBeUndefined();
    });

    it('cancel() 應不拋錯', async () => {
      const { SpeechService } = await importSpeechService();
      const service = new SpeechService();

      // 不應該拋錯
      expect(() => service.cancel()).not.toThrow();
    });
  });

  describe('注入優先於環境', () => {
    let cleanup;

    beforeEach(() => {
      cleanup = setupBrowserEnv({ withSpeech: true });
    });

    afterEach(() => {
      cleanup();
    });

    it('注入的 speechSynthesis 應優先使用', async () => {
      const { SpeechService } = await importSpeechService();

      let injectedCalled = false;
      const injectedMock = {
        speak: mock((utterance) => {
          injectedCalled = true;
          if (utterance.onend) utterance.onend();
        }),
        cancel: mock(() => {}),
      };

      const service = new SpeechService({ speechSynthesis: injectedMock });

      await service.speak('test');

      expect(injectedCalled).toBe(true);
      expect(injectedMock.speak).toHaveBeenCalledTimes(1);
    });

    it('注入 undefined 時應 fallback 到 window.speechSynthesis', async () => {
      const { SpeechService } = await importSpeechService();

      // 不傳入 speechSynthesis 時，應該使用 window.speechSynthesis
      const service = new SpeechService({});

      // 因為瀏覽器環境有 speechSynthesis，所以應該支援
      expect(service.isSupported()).toBe(true);
    });
  });

  describe('自訂選項', () => {
    let cleanup;

    beforeEach(() => {
      cleanup = setupBrowserEnv({ withSpeech: true });
    });

    afterEach(() => {
      cleanup();
    });

    it('應支援自訂語言', async () => {
      const { SpeechService } = await importSpeechService();
      const service = new SpeechService({ lang: 'en-US' });

      expect(service.lang).toBe('en-US');
    });

    it('應支援自訂語速', async () => {
      const { SpeechService } = await importSpeechService();

      const mockSpeechSynthesis = createMockSpeechSynthesis();
      const service = new SpeechService({
        speechSynthesis: mockSpeechSynthesis,
        rate: 0.8,
      });

      // 驗證可以正常工作
      await service.speak('test');
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    });
  });
});
