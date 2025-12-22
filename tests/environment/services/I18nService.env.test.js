/**
 * I18nService 環境適應測試
 *
 * 測試 I18nService 在不同環境下的語言偵測行為：
 * - 瀏覽器環境：偵測 localStorage、URL 參數、瀏覽器語言
 * - Node 環境：使用預設語言
 *
 * 注意：I18nService 使用單例模式，每個測試需要重新導入模組
 */
import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import {
  setupBrowserEnv,
  clearBrowserEnv,
  createMockLocalStorage,
} from '../../helpers/browserEnv.js';

// 動態導入以確保每次測試都能獲取新的單例實例
async function importI18n() {
  const modulePath = '../../../src/i18n/I18nService.js';
  delete require.cache[require.resolve(modulePath)];
  return import(modulePath);
}

describe('I18nService 環境適應', () => {
  describe('瀏覽器環境 - 語言偵測優先順序', () => {
    let cleanup;

    afterEach(() => {
      if (cleanup) cleanup();
    });

    it('localStorage 優先於瀏覽器設定', async () => {
      cleanup = setupBrowserEnv({ language: 'en' });
      globalThis.localStorage.setItem('practice_language', 'ja');

      const { i18n } = await importI18n();

      expect(i18n.getLanguage()).toBe('ja');
    });

    it('URL 參數優先於瀏覽器設定', async () => {
      cleanup = setupBrowserEnv({ language: 'zh-TW' });
      globalThis.window.location.search = '?lang=en';
      // 重新建立 URLSearchParams
      globalThis.URLSearchParams = URLSearchParams;

      const { i18n } = await importI18n();

      expect(i18n.getLanguage()).toBe('en');
    });

    it('瀏覽器語言 ja 應匹配 ja', async () => {
      cleanup = setupBrowserEnv({ language: 'ja' });

      const { i18n } = await importI18n();

      expect(i18n.getLanguage()).toBe('ja');
    });

    it('瀏覽器語言 ja-JP 應匹配 ja', async () => {
      cleanup = setupBrowserEnv({ language: 'ja-JP' });

      const { i18n } = await importI18n();

      expect(i18n.getLanguage()).toBe('ja');
    });

    it('瀏覽器語言 zh-TW 應直接匹配', async () => {
      cleanup = setupBrowserEnv({ language: 'zh-TW' });

      const { i18n } = await importI18n();

      expect(i18n.getLanguage()).toBe('zh-TW');
    });

    it('瀏覽器語言 zh-CN 應匹配 zh-TW', async () => {
      cleanup = setupBrowserEnv({ language: 'zh-CN' });

      const { i18n } = await importI18n();

      expect(i18n.getLanguage()).toBe('zh-TW');
    });

    it('瀏覽器語言 en-US 應匹配 en', async () => {
      cleanup = setupBrowserEnv({ language: 'en-US' });

      const { i18n } = await importI18n();

      expect(i18n.getLanguage()).toBe('en');
    });

    it('不支援的語言應使用預設 zh-TW', async () => {
      cleanup = setupBrowserEnv({ language: 'de-DE' });

      const { i18n } = await importI18n();

      expect(i18n.getLanguage()).toBe('zh-TW');
    });
  });

  describe('Node 環境 - 預設語言', () => {
    let restore;

    beforeEach(() => {
      restore = clearBrowserEnv();
    });

    afterEach(() => {
      restore();
    });

    it('應使用預設語言 zh-TW', async () => {
      const { i18n } = await importI18n();

      expect(i18n.getLanguage()).toBe('zh-TW');
    });

    it('getSupportedLanguages() 應正常運作', async () => {
      const { i18n } = await importI18n();

      const languages = i18n.getSupportedLanguages();
      expect(languages).toContain('zh-TW');
      expect(languages).toContain('en');
      expect(languages).toContain('ja');
    });

    it('t() 應返回翻譯或 key', async () => {
      const { i18n } = await importI18n();

      // 預設是 zh-TW，應該有翻譯
      const result = i18n.t('some.key');
      expect(typeof result).toBe('string');
    });

    it('setLanguage() 應不拋錯', async () => {
      const { i18n } = await importI18n();

      // Node 環境下 setLanguage 會嘗試存取 localStorage 和 window
      // 但應該有保護機制不拋錯
      expect(() => {
        i18n.setLanguage('en');
      }).not.toThrow();

      expect(i18n.getLanguage()).toBe('en');
    });
  });

  describe('語言切換', () => {
    let cleanup;

    beforeEach(() => {
      cleanup = setupBrowserEnv({
        language: 'zh-TW',
        location: { pathname: '/practice/', search: '' },
      });
    });

    afterEach(() => {
      cleanup();
    });

    it('setLanguage() 應更新當前語言', async () => {
      const { i18n } = await importI18n();

      i18n.setLanguage('ja');
      expect(i18n.getLanguage()).toBe('ja');
    });

    it('setLanguage() 應儲存到 localStorage', async () => {
      const { i18n } = await importI18n();

      i18n.setLanguage('en');

      expect(globalThis.localStorage.getItem('practice_language')).toBe('en');
    });

    it('不支援的語言應被忽略', async () => {
      const { i18n } = await importI18n();

      i18n.setLanguage('invalid');

      // 應該保持原來的語言
      expect(i18n.getLanguage()).toBe('zh-TW');
    });

    it('subscribe() 應在語言變更時被呼叫', async () => {
      const { i18n } = await importI18n();

      let calledWith = null;
      const unsubscribe = i18n.subscribe((lang) => {
        calledWith = lang;
      });

      i18n.setLanguage('ja');

      expect(calledWith).toBe('ja');

      // 清理
      unsubscribe();
    });
  });

  describe('翻譯功能', () => {
    let cleanup;

    beforeEach(() => {
      cleanup = setupBrowserEnv({
        language: 'zh-TW',
        location: { pathname: '/practice/', search: '' },
      });
    });

    afterEach(() => {
      cleanup();
    });

    it('t() 應返回翻譯文字', async () => {
      const { i18n } = await importI18n();

      // 使用已知存在的 key（來自 translations.js）
      const result = i18n.t('nextQuestion');
      expect(typeof result).toBe('string');
      expect(result).toBe('下一題');
    });

    it('t() 不存在的 key 應返回 key 本身', async () => {
      const { i18n } = await importI18n();

      const result = i18n.t('nonexistent.key.for.testing');
      expect(result).toBe('nonexistent.key.for.testing');
    });

    it('t() 應支援參數替換', async () => {
      const { i18n } = await importI18n();

      // 使用已知存在的 key，但帶參數
      const result = i18n.t('pageTitle', { param: 'test' });
      expect(typeof result).toBe('string');
    });

    it('切換語言後 t() 應返回對應語言的翻譯', async () => {
      const { i18n } = await importI18n();

      i18n.setLanguage('en');
      const enResult = i18n.t('nextQuestion');

      i18n.setLanguage('ja');
      const jaResult = i18n.t('nextQuestion');

      // en 和 ja 的翻譯應該不同
      expect(enResult).not.toBe(jaResult);
    });
  });

  describe('語言常量', () => {
    it('Languages 應包含所有支援的語言', async () => {
      const { Languages } = await importI18n();

      expect(Languages.ZH_TW).toBe('zh-TW');
      expect(Languages.EN).toBe('en');
      expect(Languages.JA).toBe('ja');
    });
  });
});
