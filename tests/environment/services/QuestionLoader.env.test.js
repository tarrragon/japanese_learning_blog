/**
 * QuestionLoader 環境適應測試
 *
 * 測試 QuestionLoader 在不同環境下的行為：
 * - 瀏覽器環境：自動偵測 basePath
 * - Node 環境：需要明確提供 dataUrl
 */
import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import { setupBrowserEnv } from '../../helpers/browserEnv.js';

// 動態導入以確保每次測試都能獲取新的模組狀態
async function importQuestionLoader() {
  const modulePath = '../../../src/services/QuestionLoader.js';
  delete require.cache[require.resolve(modulePath)];
  return import(modulePath);
}

describe('QuestionLoader 環境適應', () => {
  describe('瀏覽器環境 - 預設建構', () => {
    let cleanup;

    beforeEach(() => {
      cleanup = setupBrowserEnv({
        location: { pathname: '/practice/' },
      });
      // 設定 mock fetch
      globalThis.fetch = mock(async (url) => ({
        ok: true,
        json: async () => ({
          version: '1.0',
          generated: new Date().toISOString(),
          questions: [{ id: 'q1', text: 'テスト' }],
          stats: {},
        }),
      }));
    });

    afterEach(() => {
      cleanup();
      delete globalThis.fetch;
    });

    it('應自動偵測 basePath', async () => {
      const { QuestionLoader } = await importQuestionLoader();
      const loader = new QuestionLoader();

      expect(loader.dataUrl).toBe('/data/questions.json');
      expect(loader.basePath).toBe('/data');
    });

    it('從 /blog/practice/ 應偵測 basePath 為 /blog', async () => {
      globalThis.window.location.pathname = '/blog/practice/';

      const { QuestionLoader } = await importQuestionLoader();
      const loader = new QuestionLoader();

      expect(loader.dataUrl).toBe('/blog/data/questions.json');
      expect(loader.basePath).toBe('/blog/data');
    });

    it('從根路徑應正常運作', async () => {
      globalThis.window.location.pathname = '/';

      const { QuestionLoader } = await importQuestionLoader();
      const loader = new QuestionLoader();

      expect(loader.dataUrl).toBe('/data/questions.json');
    });
  });

  describe('Node 環境 - 需要明確 dataUrl', () => {
    // 注意：QuestionLoader 模組會在導入時建立單例 questionLoader
    // 這會嘗試存取 window.location，在 Node 環境會失敗
    // 因此我們需要在瀏覽器環境下測試「提供 dataUrl」的行為

    let cleanup;

    beforeEach(() => {
      // 使用瀏覽器環境來導入模組，避免單例建立失敗
      cleanup = setupBrowserEnv({
        location: { pathname: '/practice/' },
      });
    });

    afterEach(() => {
      cleanup();
    });

    it('提供 dataUrl 應優先使用（不偵測環境）', async () => {
      const { QuestionLoader } = await importQuestionLoader();

      const loader = new QuestionLoader('/data/questions.json');

      expect(loader.dataUrl).toBe('/data/questions.json');
      expect(loader.basePath).toBe('/data');
    });

    it('自訂 dataUrl 應正確解析 basePath', async () => {
      const { QuestionLoader } = await importQuestionLoader();

      const loader = new QuestionLoader('/custom/path/to/questions.json');

      expect(loader.basePath).toBe('/custom/path/to');
    });

    it('dataUrl 優先於 window.location 偵測', async () => {
      // window.location.pathname 是 /practice/
      // 但我們提供了明確的 dataUrl
      const { QuestionLoader } = await importQuestionLoader();

      const loader = new QuestionLoader('/explicit/questions.json');

      // 應使用提供的 URL，而非偵測結果
      expect(loader.dataUrl).toBe('/explicit/questions.json');
    });
  });

  describe('注入 dataUrl 優先於環境', () => {
    let cleanup;

    beforeEach(() => {
      cleanup = setupBrowserEnv({
        location: { pathname: '/practice/' },
      });
    });

    afterEach(() => {
      cleanup();
    });

    it('提供的 dataUrl 應優先使用', async () => {
      const { QuestionLoader } = await importQuestionLoader();

      const loader = new QuestionLoader('/custom/questions.json');

      // 應使用提供的 URL，而非自動偵測
      expect(loader.dataUrl).toBe('/custom/questions.json');
      expect(loader.basePath).toBe('/custom');
    });
  });

  describe('初始狀態', () => {
    let cleanup;

    beforeEach(() => {
      cleanup = setupBrowserEnv({
        location: { pathname: '/practice/' },
      });
    });

    afterEach(() => {
      cleanup();
    });

    it('初始化後 questionBank 應為 null', async () => {
      const { QuestionLoader } = await importQuestionLoader();
      const loader = new QuestionLoader();

      expect(loader.isLoaded()).toBe(false);
      expect(loader.questionBank).toBe(null);
    });

    it('getAllQuestions() 應返回空陣列', async () => {
      const { QuestionLoader } = await importQuestionLoader();
      const loader = new QuestionLoader();

      expect(loader.getAllQuestions()).toEqual([]);
    });

    it('getRandomQuestion() 應返回 null', async () => {
      const { QuestionLoader } = await importQuestionLoader();
      const loader = new QuestionLoader();

      expect(loader.getRandomQuestion()).toBe(null);
    });
  });

  describe('載入流程', () => {
    let cleanup;

    beforeEach(() => {
      cleanup = setupBrowserEnv({
        location: { pathname: '/practice/' },
      });

      // 設定 mock fetch
      globalThis.fetch = mock(async (url) => {
        if (url.includes('questions-index.json')) {
          // 索引檔不存在，回退到傳統模式
          return { ok: false, status: 404 };
        }
        return {
          ok: true,
          json: async () => ({
            version: '1.0',
            generated: new Date().toISOString(),
            questions: [
              { id: 'q1', text: 'テスト', source: { jlpt: 'n5' } },
              { id: 'q2', text: '勉強', source: { jlpt: 'n4' } },
            ],
            stats: { total: 2 },
          }),
        };
      });
    });

    afterEach(() => {
      cleanup();
      delete globalThis.fetch;
    });

    it('load() 應載入題庫', async () => {
      const { QuestionLoader } = await importQuestionLoader();
      const loader = new QuestionLoader();

      await loader.load();

      expect(loader.isLoaded()).toBe(true);
      expect(loader.getAllQuestions().length).toBe(2);
    });

    it('載入後 getRandomQuestion() 應返回題目', async () => {
      const { QuestionLoader } = await importQuestionLoader();
      const loader = new QuestionLoader();

      await loader.load();

      const question = loader.getRandomQuestion();
      expect(question).not.toBe(null);
      expect(question.id).toMatch(/^q[12]$/);
    });

    it('filterQuestions() 應正確篩選', async () => {
      const { QuestionLoader } = await importQuestionLoader();
      const loader = new QuestionLoader();

      await loader.load();

      const n5Questions = loader.filterQuestions({ jlpt: 'n5' });
      expect(n5Questions.length).toBe(1);
      expect(n5Questions[0].id).toBe('q1');
    });
  });
});
