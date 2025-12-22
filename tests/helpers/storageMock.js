/**
 * Storage Mock Factory
 *
 * 提供模擬 localStorage/sessionStorage 的工具
 * 與 browserEnv.js 中的 createMockLocalStorage 相同實作
 * 單獨提供以便在不需要完整瀏覽器環境時使用
 */

/**
 * 建立模擬的 localStorage/sessionStorage
 *
 * @returns {Object} 模擬的 Storage 物件
 *
 * @example
 * const mockStorage = createMockStorage();
 * const service = new PersistenceService(mockStorage);
 */
export function createMockStorage() {
  const storage = new Map();
  return {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
    clear: () => storage.clear(),
    get length() {
      return storage.size;
    },
    key: (i) => [...storage.keys()][i] ?? null,
  };
}

/**
 * 建立帶有預設值的模擬 Storage
 *
 * @param {Object} initialData - 初始資料
 * @returns {Object} 模擬的 Storage 物件
 *
 * @example
 * const mockStorage = createMockStorageWithData({
 *   'practice-input-mode': 'direct',
 *   'practice-show-hint': 'false',
 * });
 */
export function createMockStorageWithData(initialData = {}) {
  const storage = createMockStorage();
  for (const [key, value] of Object.entries(initialData)) {
    storage.setItem(key, value);
  }
  return storage;
}
