/**
 * App 初始化測試
 *
 * 驗證 App 在瀏覽器環境中正確初始化所有服務
 */
import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import {
  setupBrowserEnv,
  createMockAppElements,
  createMockDocument,
} from '../helpers/index.js';

// 動態導入以確保每次測試都能獲取新的模組狀態
async function importApp() {
  // 清除相關模組快取
  const modules = [
    '../src/App.js',
    '../src/store/index.js',
    '../src/services/SpeechService.js',
    '../src/services/PersistenceService.js',
    '../src/services/QuestionLoader.js',
  ];

  modules.forEach((mod) => {
    try {
      delete require.cache[require.resolve(mod)];
    } catch {
      // 忽略不存在的模組
    }
  });

  return import('../../src/App.js');
}

describe('App 初始化', () => {
  let cleanup;
  let mockElements;

  beforeEach(() => {
    // 設置瀏覽器環境
    cleanup = setupBrowserEnv({
      withSpeech: true,
      language: 'zh-TW',
      location: { pathname: '/practice/', search: '' },
    });

    // 設置 document
    globalThis.document = createMockDocument();

    // 設置 fetch mock（返回完整的題目資料格式）
    globalThis.fetch = mock(async (url) => {
      if (url.includes('questions-index.json')) {
        return { ok: false, status: 404 };
      }
      return {
        ok: true,
        json: async () => ({
          version: '1.0',
          generated: new Date().toISOString(),
          questions: [
            {
              id: 'q1',
              text: 'テスト',
              characters: [
                {
                  display: 'テ',
                  kana: 'て',
                  romaji: ['te'],
                },
                {
                  display: 'ス',
                  kana: 'す',
                  romaji: ['su'],
                },
                {
                  display: 'ト',
                  kana: 'と',
                  romaji: ['to'],
                },
              ],
              source: { jlpt: 'n5', path: '/test', title: 'Test', category: 'test' },
              metadata: { characterCount: 3, difficulty: 'easy', hasKanji: false },
            },
          ],
          stats: { total: 1 },
        }),
      };
    });

    // 建立 mock DOM 元素
    mockElements = createMockAppElements();
  });

  afterEach(() => {
    cleanup();
    delete globalThis.document;
    delete globalThis.fetch;
  });

  describe('基本初始化', () => {
    it('應成功建立 App 實例', async () => {
      const { App } = await importApp();

      const app = new App(mockElements);

      expect(app).toBeDefined();
    });

    it('getStore() 應返回 Store 實例', async () => {
      const { App } = await importApp();

      const app = new App(mockElements);
      const store = app.getStore();

      expect(store).toBeDefined();
      expect(typeof store.getState).toBe('function');
      expect(typeof store.dispatch).toBe('function');
      expect(typeof store.subscribe).toBe('function');
    });

    it('getState() 應返回初始狀態', async () => {
      const { App } = await importApp();

      const app = new App(mockElements);
      const state = app.getState();

      expect(state).toBeDefined();
      expect(state.inputMode).toBe('romaji');
      expect(state.practiceMode).toBe('question');
    });

    it('getQuestionLoader() 應返回 QuestionLoader 實例', async () => {
      const { App } = await importApp();

      const app = new App(mockElements);
      const loader = app.getQuestionLoader();

      expect(loader).toBeDefined();
      expect(typeof loader.load).toBe('function');
    });
  });

  describe('服務整合', () => {
    it('Store 應有 effectMiddleware 訂閱', async () => {
      const { App } = await importApp();

      const app = new App(mockElements);
      const store = app.getStore();

      // Store 應該能正常 dispatch actions
      const { actions } = await import('../../src/store/index.js');

      // 這些 action 不應拋錯
      expect(() => {
        store.dispatch(actions.speechRequest('あ'));
        store.dispatch(actions.keyPress('a'));
      }).not.toThrow();
    });

    it('PersistenceService 應從 localStorage 恢復設定', async () => {
      // 預設設定
      globalThis.localStorage.setItem('practice-input-mode', 'direct');

      const { App } = await importApp();

      const app = new App(mockElements);
      await app.initialize();

      const state = app.getState();
      expect(state.inputMode).toBe('direct');
    });

    it('speechSynthesis 環境應已設置', async () => {
      // 驗證瀏覽器環境中 speechSynthesis 存在
      expect(globalThis.window.speechSynthesis).toBeDefined();
      expect(typeof globalThis.window.speechSynthesis.speak).toBe('function');
    });
  });

  describe('初始化流程', () => {
    it('initialize() 應完成初始化', async () => {
      const { App } = await importApp();

      const app = new App(mockElements);

      // initialize() 不應拋錯
      await expect(app.initialize()).resolves.toBeUndefined();
    });

    it('dispose() 應清理資源', async () => {
      const { App } = await importApp();

      const app = new App(mockElements);
      await app.initialize();

      // dispose() 不應拋錯
      expect(() => app.dispose()).not.toThrow();
    });
  });

  describe('URL 參數處理', () => {
    it('?mode=kana 應切換到假名模式', async () => {
      // 設定 URL 參數
      globalThis.window.location.search = '?mode=kana';

      const { App } = await importApp();

      const app = new App(mockElements);
      await app.initialize();

      const state = app.getState();
      expect(state.practiceMode).toBe('kana');
    });

    it('?input=direct 應切換到直接輸入模式', async () => {
      globalThis.window.location.search = '?input=direct';

      const { App } = await importApp();

      const app = new App(mockElements);
      await app.initialize();

      const state = app.getState();
      expect(state.inputMode).toBe('direct');
    });
  });
});
