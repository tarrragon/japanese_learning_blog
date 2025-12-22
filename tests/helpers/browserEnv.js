/**
 * Browser Environment Mock Factory
 *
 * 提供可重用的瀏覽器環境模擬工具
 * 用於測試依賴瀏覽器 API 的服務（SpeechService, PersistenceService 等）
 */

import { mock } from 'bun:test';

/**
 * 建立模擬的 speechSynthesis
 * @returns {Object}
 */
export function createMockSpeechSynthesis() {
  return {
    speak: mock((utterance) => {
      // 模擬異步完成
      if (utterance.onend) {
        setTimeout(() => utterance.onend(), 0);
      }
    }),
    cancel: mock(() => {}),
    getVoices: mock(() => []),
  };
}

/**
 * 建立模擬的 localStorage
 * @returns {Object}
 */
export function createMockLocalStorage() {
  const store = new Map();
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
    get length() {
      return store.size;
    },
    key: (i) => [...store.keys()][i] ?? null,
  };
}

/**
 * 建立模擬的 navigator
 * @param {string} language - 瀏覽器語言設定
 * @returns {Object}
 */
export function createMockNavigator(language = 'en-US') {
  return {
    language,
    userLanguage: language,
  };
}

/**
 * 建立模擬的 window.location
 * @param {Object} options
 * @returns {Object}
 */
export function createMockLocation(options = {}) {
  const pathname = options.pathname || '/practice/';
  const search = options.search || '';
  const hash = options.hash || '';
  const origin = options.origin || 'http://localhost';
  const href = options.href || `${origin}${pathname}${search}${hash}`;

  return {
    pathname,
    search,
    href,
    hash,
    origin,
    host: 'localhost',
    hostname: 'localhost',
    port: '',
    protocol: 'http:',
    toString() {
      return href;
    },
  };
}

/**
 * 建立模擬的 window 物件
 * @param {Object} options
 * @returns {Object}
 */
export function createMockWindow(options = {}) {
  return {
    location: createMockLocation(options.location),
    history: {
      replaceState: mock(() => {}),
      pushState: mock(() => {}),
    },
    speechSynthesis: options.withSpeech
      ? createMockSpeechSynthesis()
      : undefined,
    URL: globalThis.URL,
  };
}

/**
 * 設置瀏覽器環境
 *
 * @param {Object} options
 * @param {boolean} options.withSpeech - 是否包含 speechSynthesis
 * @param {string} options.language - navigator.language
 * @param {Object} options.location - window.location 設定
 * @returns {Function} cleanup 函數，呼叫以恢復環境
 *
 * @example
 * let cleanup;
 * beforeEach(() => {
 *   cleanup = setupBrowserEnv({ withSpeech: true });
 * });
 * afterEach(() => cleanup());
 */
export function setupBrowserEnv(options = {}) {
  // 保存原始值
  const original = {
    window: globalThis.window,
    document: globalThis.document,
    localStorage: globalThis.localStorage,
    navigator: globalThis.navigator,
    SpeechSynthesisUtterance: globalThis.SpeechSynthesisUtterance,
  };

  // 設置模擬環境
  globalThis.window = createMockWindow(options);
  globalThis.localStorage = createMockLocalStorage();
  globalThis.navigator = createMockNavigator(options.language);

  if (options.withSpeech) {
    globalThis.SpeechSynthesisUtterance = class {
      constructor(text) {
        this.text = text;
        this.lang = '';
        this.rate = 1.0;
        this.onend = null;
        this.onerror = null;
      }
    };
  }

  // 返回 cleanup 函數
  return function cleanup() {
    if (original.window === undefined) {
      delete globalThis.window;
    } else {
      globalThis.window = original.window;
    }

    if (original.document === undefined) {
      delete globalThis.document;
    } else {
      globalThis.document = original.document;
    }

    if (original.localStorage === undefined) {
      delete globalThis.localStorage;
    } else {
      globalThis.localStorage = original.localStorage;
    }

    if (original.navigator === undefined) {
      delete globalThis.navigator;
    } else {
      globalThis.navigator = original.navigator;
    }

    if (original.SpeechSynthesisUtterance === undefined) {
      delete globalThis.SpeechSynthesisUtterance;
    } else {
      globalThis.SpeechSynthesisUtterance = original.SpeechSynthesisUtterance;
    }
  };
}

/**
 * 清除瀏覽器環境（用於測試 Node 環境行為）
 * @returns {Function} cleanup 函數
 */
export function clearBrowserEnv() {
  const original = {
    window: globalThis.window,
    document: globalThis.document,
    localStorage: globalThis.localStorage,
    navigator: globalThis.navigator,
    SpeechSynthesisUtterance: globalThis.SpeechSynthesisUtterance,
  };

  delete globalThis.window;
  delete globalThis.document;
  delete globalThis.localStorage;
  delete globalThis.navigator;
  delete globalThis.SpeechSynthesisUtterance;

  return function restore() {
    if (original.window !== undefined) globalThis.window = original.window;
    if (original.document !== undefined)
      globalThis.document = original.document;
    if (original.localStorage !== undefined)
      globalThis.localStorage = original.localStorage;
    if (original.navigator !== undefined)
      globalThis.navigator = original.navigator;
    if (original.SpeechSynthesisUtterance !== undefined)
      globalThis.SpeechSynthesisUtterance = original.SpeechSynthesisUtterance;
  };
}
