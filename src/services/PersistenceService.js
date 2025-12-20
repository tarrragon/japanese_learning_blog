/**
 * PersistenceService - localStorage 持久化服務
 *
 * 負責將使用者偏好設定持久化到 localStorage
 * 保持與現有 localStorage 鍵名相容
 */

/**
 * localStorage 鍵名對應（向後相容）
 */
const STORAGE_KEYS = {
  inputMode: 'practice-input-mode',
  showRomajiHint: 'practice-show-hint',
  jlptFilter: 'practice-jlpt-filter',
};

export class PersistenceService {
  #storage;

  /**
   * @param {Storage} [storage] - Storage 物件（預設 localStorage，可注入 mock）
   */
  constructor(storage = null) {
    this.#storage = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
  }

  /**
   * 載入所有持久化設定
   * @returns {Object|null} 設定物件，或 null（如果 localStorage 不可用）
   */
  load() {
    if (!this.#storage) return null;

    try {
      const inputMode = this.#storage.getItem(STORAGE_KEYS.inputMode);
      const showRomajiHint = this.#storage.getItem(STORAGE_KEYS.showRomajiHint);
      const jlptFilter = this.#storage.getItem(STORAGE_KEYS.jlptFilter);

      return {
        inputMode: inputMode || 'romaji',
        showRomajiHint: showRomajiHint !== 'false', // 預設 true
        filters: {
          jlpt: jlptFilter || 'all',
        },
      };
    } catch (error) {
      console.warn('Failed to load settings from localStorage:', error);
      return null;
    }
  }

  /**
   * 儲存設定（部分更新）
   * @param {Object} settings - 要儲存的設定
   * @param {string} [settings.inputMode] - 輸入模式
   * @param {boolean} [settings.showRomajiHint] - 顯示羅馬拼音提示
   * @param {Object} [settings.filters] - 篩選條件
   */
  save(settings) {
    if (!this.#storage) return;

    try {
      if (settings.inputMode !== undefined) {
        this.#storage.setItem(STORAGE_KEYS.inputMode, settings.inputMode);
      }

      if (settings.showRomajiHint !== undefined) {
        this.#storage.setItem(
          STORAGE_KEYS.showRomajiHint,
          settings.showRomajiHint ? 'true' : 'false'
        );
      }

      if (settings.filters?.jlpt !== undefined) {
        this.#storage.setItem(STORAGE_KEYS.jlptFilter, settings.filters.jlpt);
      }
    } catch (error) {
      console.warn('Failed to save settings to localStorage:', error);
    }
  }

  /**
   * 清除所有設定
   */
  clear() {
    if (!this.#storage) return;

    try {
      Object.values(STORAGE_KEYS).forEach((key) => {
        this.#storage.removeItem(key);
      });
    } catch (error) {
      console.warn('Failed to clear settings from localStorage:', error);
    }
  }

  /**
   * 取得單一設定值
   * @param {string} key - 設定鍵名
   * @returns {string|null}
   */
  get(key) {
    if (!this.#storage) return null;

    const storageKey = STORAGE_KEYS[key];
    if (!storageKey) return null;

    try {
      return this.#storage.getItem(storageKey);
    } catch (error) {
      return null;
    }
  }

  /**
   * 設定單一值
   * @param {string} key - 設定鍵名
   * @param {string} value - 值
   */
  set(key, value) {
    if (!this.#storage) return;

    const storageKey = STORAGE_KEYS[key];
    if (!storageKey) return;

    try {
      this.#storage.setItem(storageKey, value);
    } catch (error) {
      console.warn(`Failed to save ${key} to localStorage:`, error);
    }
  }
}
