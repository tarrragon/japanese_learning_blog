/**
 * Test Helpers Index
 *
 * 統一導出所有測試輔助工具
 */

// 瀏覽器環境模擬
export {
  setupBrowserEnv,
  clearBrowserEnv,
  createMockWindow,
  createMockLocalStorage,
  createMockSpeechSynthesis,
  createMockNavigator,
  createMockLocation,
} from './browserEnv.js';

// DOM 元素模擬
export {
  createMockElement,
  createMockClassList,
  createMockDocument,
  createMockAppElements,
  createMockUIDOM,
} from './domMock.js';

// Storage 模擬
export { createMockStorage, createMockStorageWithData } from './storageMock.js';
