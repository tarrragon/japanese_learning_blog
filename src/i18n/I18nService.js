/**
 * I18nService - 國際化服務
 *
 * 提供多語言支援，包括：
 * - 語言偵測（瀏覽器設定、localStorage）
 * - 翻譯文字取得
 * - 語言切換
 */

import { translations } from './translations.js';

const STORAGE_KEY = 'practice_language';
const SUPPORTED_LANGUAGES = ['zh-TW', 'en', 'ja'];
const DEFAULT_LANGUAGE = 'zh-TW';

class I18nService {
  #currentLanguage;
  #listeners = [];

  constructor() {
    this.#currentLanguage = this.#detectLanguage();
  }

  /**
   * 偵測使用者語言
   * 優先順序：localStorage > URL 參數 > 瀏覽器設定 > 預設
   * @returns {string}
   * @private
   */
  #detectLanguage() {
    if (typeof window === 'undefined') {
      return DEFAULT_LANGUAGE;
    }

    // 1. 從 localStorage 讀取
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED_LANGUAGES.includes(saved)) {
      return saved;
    }

    // 2. 從 URL 參數讀取
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    if (urlLang && SUPPORTED_LANGUAGES.includes(urlLang)) {
      return urlLang;
    }

    // 3. 從瀏覽器設定讀取
    const browserLang = navigator.language || navigator.userLanguage;
    if (browserLang) {
      // 完全匹配
      if (SUPPORTED_LANGUAGES.includes(browserLang)) {
        return browserLang;
      }
      // 前綴匹配（例如 zh-CN → zh-TW, ja-JP → ja）
      const prefix = browserLang.split('-')[0];
      const matched = SUPPORTED_LANGUAGES.find(lang =>
        lang.startsWith(prefix) || lang === prefix
      );
      if (matched) {
        return matched;
      }
    }

    // 4. 預設語言
    return DEFAULT_LANGUAGE;
  }

  /**
   * 取得當前語言
   * @returns {string}
   */
  getLanguage() {
    return this.#currentLanguage;
  }

  /**
   * 取得支援的語言列表
   * @returns {string[]}
   */
  getSupportedLanguages() {
    return [...SUPPORTED_LANGUAGES];
  }

  /**
   * 設定語言
   * @param {string} lang
   */
  setLanguage(lang) {
    if (!SUPPORTED_LANGUAGES.includes(lang)) {
      console.warn(`Unsupported language: ${lang}`);
      return;
    }

    this.#currentLanguage = lang;

    // 儲存到 localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, lang);
    }

    // 更新 URL 參數
    if (typeof window !== 'undefined') {
      const url = new URL(window.location);
      if (lang !== DEFAULT_LANGUAGE) {
        url.searchParams.set('lang', lang);
      } else {
        url.searchParams.delete('lang');
      }
      window.history.replaceState({}, '', url);
    }

    // 通知監聽器
    this.#listeners.forEach(callback => callback(lang));
  }

  /**
   * 取得翻譯文字
   * @param {string} key - 翻譯鍵值
   * @param {Object} [params] - 替換參數
   * @returns {string}
   */
  t(key, params = {}) {
    const langTranslations = translations[this.#currentLanguage];
    if (!langTranslations) {
      console.warn(`No translations for language: ${this.#currentLanguage}`);
      return key;
    }

    let text = langTranslations[key];
    if (text === undefined) {
      // 回退到預設語言
      text = translations[DEFAULT_LANGUAGE]?.[key];
      if (text === undefined) {
        console.warn(`Missing translation for key: ${key}`);
        return key;
      }
    }

    // 替換參數 {{param}}
    Object.keys(params).forEach(param => {
      text = text.replace(new RegExp(`{{${param}}}`, 'g'), params[param]);
    });

    return text;
  }

  /**
   * 訂閱語言變更事件
   * @param {Function} callback
   * @returns {Function} 取消訂閱函數
   */
  subscribe(callback) {
    this.#listeners.push(callback);
    return () => {
      const index = this.#listeners.indexOf(callback);
      if (index > -1) {
        this.#listeners.splice(index, 1);
      }
    };
  }

  /**
   * 取得語言的本地名稱
   * @param {string} lang
   * @returns {string}
   */
  getLanguageName(lang) {
    const names = {
      'zh-TW': '繁體中文',
      'en': 'English',
      'ja': '日本語',
    };
    return names[lang] || lang;
  }
}

// 單例模式
export const i18n = new I18nService();
