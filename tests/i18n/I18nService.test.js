import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { translations } from '../../src/i18n/translations.js';

// 模擬 localStorage
class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = value;
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

// 由於 I18nService 是單例，我們需要動態 import 來重置狀態
async function createFreshI18nService() {
  // 清除模組快取
  delete require.cache[require.resolve('../../src/i18n/I18nService.js')];
  const module = await import('../../src/i18n/I18nService.js');
  return module.i18n;
}

describe('translations', () => {
  describe('語言完整性', () => {
    const supportedLanguages = ['zh-TW', 'en', 'ja'];

    it('應該包含所有支援的語言', () => {
      supportedLanguages.forEach(lang => {
        expect(translations[lang]).toBeDefined();
      });
    });

    it('所有語言應該有相同的翻譯鍵值', () => {
      const zhKeys = Object.keys(translations['zh-TW']).sort();

      supportedLanguages.forEach(lang => {
        const langKeys = Object.keys(translations[lang]).sort();
        expect(langKeys).toEqual(zhKeys);
      });
    });

    it('所有翻譯值應該是字串', () => {
      supportedLanguages.forEach(lang => {
        Object.entries(translations[lang]).forEach(([key, value]) => {
          expect(typeof value).toBe('string');
        });
      });
    });

    it('所有翻譯值不應該是空字串', () => {
      supportedLanguages.forEach(lang => {
        Object.entries(translations[lang]).forEach(([key, value]) => {
          expect(value.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('必要的翻譯鍵值', () => {
    const requiredKeys = [
      'pageTitle',
      'nextQuestion',
      'mobileMode',
      'keyboardMode',
      'hideHint',
      'showHint',
      'complete',
      'accuracy',
      'time',
      'keystrokes',
      'retry',
    ];

    it('應該包含所有必要的翻譯鍵值', () => {
      requiredKeys.forEach(key => {
        expect(translations['zh-TW'][key]).toBeDefined();
        expect(translations['en'][key]).toBeDefined();
        expect(translations['ja'][key]).toBeDefined();
      });
    });
  });
});

describe('I18nService', () => {
  let mockLocalStorage;
  let originalLocalStorage;
  let originalNavigator;

  beforeEach(() => {
    mockLocalStorage = new MockLocalStorage();
    originalLocalStorage = globalThis.localStorage;
    originalNavigator = globalThis.navigator;

    // 設定 mock
    globalThis.localStorage = mockLocalStorage;
  });

  afterEach(() => {
    globalThis.localStorage = originalLocalStorage;
    globalThis.navigator = originalNavigator;
    mockLocalStorage.clear();
  });

  describe('getLanguage', () => {
    it('應該回傳當前語言', async () => {
      const i18n = await createFreshI18nService();
      const lang = i18n.getLanguage();
      expect(['zh-TW', 'en', 'ja']).toContain(lang);
    });
  });

  describe('getSupportedLanguages', () => {
    it('應該回傳支援的語言列表', async () => {
      const i18n = await createFreshI18nService();
      const languages = i18n.getSupportedLanguages();
      expect(languages).toContain('zh-TW');
      expect(languages).toContain('en');
      expect(languages).toContain('ja');
    });
  });

  describe('getLanguageName', () => {
    it('應該回傳語言的本地名稱', async () => {
      const i18n = await createFreshI18nService();
      expect(i18n.getLanguageName('zh-TW')).toBe('繁體中文');
      expect(i18n.getLanguageName('en')).toBe('English');
      expect(i18n.getLanguageName('ja')).toBe('日本語');
    });

    it('未知語言應該回傳語言代碼', async () => {
      const i18n = await createFreshI18nService();
      expect(i18n.getLanguageName('unknown')).toBe('unknown');
    });
  });

  describe('t (翻譯函數)', () => {
    it('應該回傳正確的翻譯', async () => {
      const i18n = await createFreshI18nService();
      // 設定為中文
      i18n.setLanguage('zh-TW');
      expect(i18n.t('nextQuestion')).toBe('下一題');
    });

    it('英文翻譯應該正確', async () => {
      const i18n = await createFreshI18nService();
      i18n.setLanguage('en');
      expect(i18n.t('nextQuestion')).toBe('Next');
    });

    it('日文翻譯應該正確', async () => {
      const i18n = await createFreshI18nService();
      i18n.setLanguage('ja');
      expect(i18n.t('nextQuestion')).toBe('次へ');
    });

    it('不存在的鍵值應該回傳鍵值本身', async () => {
      const i18n = await createFreshI18nService();
      expect(i18n.t('nonExistentKey')).toBe('nonExistentKey');
    });
  });

  describe('setLanguage', () => {
    it('應該能夠設定語言', async () => {
      const i18n = await createFreshI18nService();
      i18n.setLanguage('en');
      expect(i18n.getLanguage()).toBe('en');
    });

    it('應該儲存到 localStorage', async () => {
      const i18n = await createFreshI18nService();
      i18n.setLanguage('ja');
      expect(mockLocalStorage.getItem('practice_language')).toBe('ja');
    });

    it('不支援的語言不應該改變當前語言', async () => {
      const i18n = await createFreshI18nService();
      const originalLang = i18n.getLanguage();
      i18n.setLanguage('unsupported');
      expect(i18n.getLanguage()).toBe(originalLang);
    });
  });

  describe('subscribe', () => {
    it('應該在語言變更時通知監聽器', async () => {
      const i18n = await createFreshI18nService();
      let notifiedLang = null;
      i18n.subscribe((lang) => {
        notifiedLang = lang;
      });
      i18n.setLanguage('ja');
      expect(notifiedLang).toBe('ja');
    });

    it('應該能夠取消訂閱', async () => {
      const i18n = await createFreshI18nService();
      let callCount = 0;
      const unsubscribe = i18n.subscribe(() => {
        callCount++;
      });

      i18n.setLanguage('en');
      expect(callCount).toBe(1);

      unsubscribe();
      i18n.setLanguage('ja');
      expect(callCount).toBe(1); // 不應該增加
    });
  });
});
