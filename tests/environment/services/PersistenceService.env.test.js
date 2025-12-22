/**
 * PersistenceService 環境適應測試
 *
 * 測試 PersistenceService 在不同環境下的行為：
 * - 瀏覽器環境：自動使用 localStorage
 * - Node 環境：優雅降級
 * - 注入優先：注入的 storage 優先於環境
 */
import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import {
  setupBrowserEnv,
  clearBrowserEnv,
  createMockLocalStorage,
} from '../../helpers/browserEnv.js';

// 動態導入以確保每次測試都能獲取新的模組狀態
async function importPersistenceService() {
  const modulePath = '../../../src/services/PersistenceService.js';
  delete require.cache[require.resolve(modulePath)];
  return import(modulePath);
}

describe('PersistenceService 環境適應', () => {
  describe('瀏覽器環境 - 預設建構', () => {
    let cleanup;

    beforeEach(() => {
      cleanup = setupBrowserEnv();
    });

    afterEach(() => {
      cleanup();
    });

    it('應自動偵測 localStorage', async () => {
      const { PersistenceService } = await importPersistenceService();
      const service = new PersistenceService();

      // load() 應返回預設值，而非 null
      const settings = service.load();
      expect(settings).not.toBe(null);
      expect(settings.inputMode).toBe('romaji');
    });

    it('save() 應寫入 localStorage', async () => {
      const { PersistenceService } = await importPersistenceService();
      const service = new PersistenceService();

      service.save({ inputMode: 'direct' });

      // 驗證寫入 localStorage
      expect(globalThis.localStorage.getItem('practice-input-mode')).toBe(
        'direct'
      );
    });

    it('load() 應從 localStorage 讀取', async () => {
      // 先設定資料
      globalThis.localStorage.setItem('practice-input-mode', 'direct');
      globalThis.localStorage.setItem('practice-show-hint', 'false');
      globalThis.localStorage.setItem('practice-jlpt-filter', 'n4');

      const { PersistenceService } = await importPersistenceService();
      const service = new PersistenceService();

      const settings = service.load();
      expect(settings.inputMode).toBe('direct');
      expect(settings.showRomajiHint).toBe(false);
      expect(settings.filters.jlpt).toBe('n4');
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

    it('load() 應返回 null', async () => {
      const { PersistenceService } = await importPersistenceService();
      const service = new PersistenceService();

      expect(service.load()).toBe(null);
    });

    it('save() 應不拋錯', async () => {
      const { PersistenceService } = await importPersistenceService();
      const service = new PersistenceService();

      // 不應該拋錯
      expect(() => {
        service.save({ inputMode: 'direct' });
      }).not.toThrow();
    });

    it('clear() 應不拋錯', async () => {
      const { PersistenceService } = await importPersistenceService();
      const service = new PersistenceService();

      expect(() => {
        service.clear();
      }).not.toThrow();
    });

    it('get() 應返回 null', async () => {
      const { PersistenceService } = await importPersistenceService();
      const service = new PersistenceService();

      expect(service.get('inputMode')).toBe(null);
    });

    it('set() 應不拋錯', async () => {
      const { PersistenceService } = await importPersistenceService();
      const service = new PersistenceService();

      expect(() => {
        service.set('inputMode', 'direct');
      }).not.toThrow();
    });
  });

  describe('注入優先於環境', () => {
    let cleanup;

    beforeEach(() => {
      cleanup = setupBrowserEnv();
    });

    afterEach(() => {
      cleanup();
    });

    it('注入的 storage 應優先使用', async () => {
      // 設定全域 localStorage
      globalThis.localStorage.setItem('practice-input-mode', 'global-value');

      const { PersistenceService } = await importPersistenceService();

      // 建立獨立的 mock storage
      const mockStorage = createMockLocalStorage();
      mockStorage.setItem('practice-input-mode', 'injected-value');

      const service = new PersistenceService(mockStorage);
      const settings = service.load();

      // 應該讀取 injected-value，而非 global-value
      expect(settings.inputMode).toBe('injected-value');
    });

    it('注入 undefined 時應 fallback 到 localStorage', async () => {
      // 設定全域 localStorage 資料
      globalThis.localStorage.setItem('practice-input-mode', 'direct');

      const { PersistenceService } = await importPersistenceService();

      // 不傳入 storage 時，應該使用 localStorage
      const service = new PersistenceService();

      const settings = service.load();
      // 應該讀取到 localStorage 中的資料
      expect(settings.inputMode).toBe('direct');
    });
  });

  describe('預設值行為', () => {
    let cleanup;

    beforeEach(() => {
      cleanup = setupBrowserEnv();
    });

    afterEach(() => {
      cleanup();
    });

    it('空 localStorage 應返回預設值', async () => {
      const { PersistenceService } = await importPersistenceService();
      const service = new PersistenceService();

      const settings = service.load();

      expect(settings).toEqual({
        inputMode: 'romaji',
        showRomajiHint: true,
        filters: { jlpt: 'all' },
      });
    });

    it('showRomajiHint 未設定時預設為 true', async () => {
      const { PersistenceService } = await importPersistenceService();
      const service = new PersistenceService();

      const settings = service.load();
      expect(settings.showRomajiHint).toBe(true);
    });
  });
});
