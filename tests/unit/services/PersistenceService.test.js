import { describe, it, expect, beforeEach } from 'bun:test';
import { PersistenceService } from '../../../src/services/PersistenceService.js';

/**
 * Mock localStorage
 */
function createMockStorage() {
  const storage = new Map();
  return {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
    clear: () => storage.clear(),
  };
}

describe('PersistenceService', () => {
  let service;
  let mockStorage;

  beforeEach(() => {
    mockStorage = createMockStorage();
    service = new PersistenceService(mockStorage);
  });

  describe('load', () => {
    it('should return default values when storage is empty', () => {
      const settings = service.load();
      expect(settings).toEqual({
        inputMode: 'romaji',
        showRomajiHint: true,
        filters: { jlpt: 'all' },
      });
    });

    it('should load saved inputMode', () => {
      mockStorage.setItem('practice-input-mode', 'direct');
      const settings = service.load();
      expect(settings.inputMode).toBe('direct');
    });

    it('should load saved showRomajiHint as true', () => {
      mockStorage.setItem('practice-show-hint', 'true');
      const settings = service.load();
      expect(settings.showRomajiHint).toBe(true);
    });

    it('should load saved showRomajiHint as false', () => {
      mockStorage.setItem('practice-show-hint', 'false');
      const settings = service.load();
      expect(settings.showRomajiHint).toBe(false);
    });

    it('should load saved jlpt filter', () => {
      mockStorage.setItem('practice-jlpt-filter', 'n4');
      const settings = service.load();
      expect(settings.filters.jlpt).toBe('n4');
    });

    it('should return null if storage is not available', () => {
      const serviceWithoutStorage = new PersistenceService(null);
      const settings = serviceWithoutStorage.load();
      expect(settings).toBe(null);
    });
  });

  describe('save', () => {
    it('should save inputMode', () => {
      service.save({ inputMode: 'direct' });
      expect(mockStorage.getItem('practice-input-mode')).toBe('direct');
    });

    it('should save showRomajiHint true', () => {
      service.save({ showRomajiHint: true });
      expect(mockStorage.getItem('practice-show-hint')).toBe('true');
    });

    it('should save showRomajiHint false', () => {
      service.save({ showRomajiHint: false });
      expect(mockStorage.getItem('practice-show-hint')).toBe('false');
    });

    it('should save jlpt filter', () => {
      service.save({ filters: { jlpt: 'n3' } });
      expect(mockStorage.getItem('practice-jlpt-filter')).toBe('n3');
    });

    it('should handle partial updates', () => {
      // 先設定初始值
      service.save({ inputMode: 'direct', showRomajiHint: false });

      // 只更新一個值
      service.save({ inputMode: 'romaji' });

      // inputMode 更新了
      expect(mockStorage.getItem('practice-input-mode')).toBe('romaji');
      // showRomajiHint 保持不變
      expect(mockStorage.getItem('practice-show-hint')).toBe('false');
    });

    it('should do nothing if storage is not available', () => {
      const serviceWithoutStorage = new PersistenceService(null);
      // 不應該拋出錯誤
      serviceWithoutStorage.save({ inputMode: 'direct' });
    });
  });

  describe('clear', () => {
    it('should remove all settings', () => {
      // 先儲存一些值
      service.save({
        inputMode: 'direct',
        showRomajiHint: false,
        filters: { jlpt: 'n4' },
      });

      // 清除
      service.clear();

      // 驗證所有值都被移除
      expect(mockStorage.getItem('practice-input-mode')).toBe(null);
      expect(mockStorage.getItem('practice-show-hint')).toBe(null);
      expect(mockStorage.getItem('practice-jlpt-filter')).toBe(null);
    });
  });

  describe('get', () => {
    it('should get single value', () => {
      mockStorage.setItem('practice-input-mode', 'direct');
      expect(service.get('inputMode')).toBe('direct');
    });

    it('should return null for unknown key', () => {
      expect(service.get('unknownKey')).toBe(null);
    });

    it('should return null for unset key', () => {
      expect(service.get('inputMode')).toBe(null);
    });
  });

  describe('set', () => {
    it('should set single value', () => {
      service.set('inputMode', 'direct');
      expect(mockStorage.getItem('practice-input-mode')).toBe('direct');
    });

    it('should ignore unknown key', () => {
      service.set('unknownKey', 'value');
      // 不應該有任何儲存
      expect(mockStorage.getItem('unknownKey')).toBe(null);
    });
  });

  describe('backward compatibility', () => {
    it('should use correct localStorage keys', () => {
      service.save({
        inputMode: 'direct',
        showRomajiHint: false,
        filters: { jlpt: 'n5' },
      });

      // 驗證使用的是舊的 localStorage 鍵名
      expect(mockStorage.getItem('practice-input-mode')).toBe('direct');
      expect(mockStorage.getItem('practice-show-hint')).toBe('false');
      expect(mockStorage.getItem('practice-jlpt-filter')).toBe('n5');
    });
  });
});
