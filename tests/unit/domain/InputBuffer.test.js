import { describe, it, expect } from 'bun:test';
import { InputBuffer } from '../../../src/domain/InputBuffer.js';
import { Character } from '../../../src/domain/Character.js';

describe('InputBuffer', () => {
  describe('建立時', () => {
    it('應為空', () => {
      // Given: 無前置條件
      // When: 建立一個 InputBuffer
      const buffer = new InputBuffer();

      // Then: 應為空
      expect(buffer.value).toBe('');
      expect(buffer.isEmpty()).toBe(true);
    });
  });

  describe('新增按鍵', () => {
    it('應累積輸入', () => {
      // Given: 一個空的 InputBuffer
      let buffer = new InputBuffer();

      // When: 依序新增 'k' 和 'a'
      buffer = buffer.add('k');
      buffer = buffer.add('a');

      // Then: 值應為 'ka'
      expect(buffer.value).toBe('ka');
    });

    it('應保持 immutable', () => {
      // Given: 一個空的 InputBuffer
      const buffer = new InputBuffer();

      // When: 新增 'k'
      const newBuffer = buffer.add('k');

      // Then: 原 buffer 應仍為空
      expect(buffer.value).toBe('');
      expect(newBuffer.value).toBe('k');
    });
  });

  describe('嘗試匹配', () => {
    it('完全匹配時應返回 COMPLETE', () => {
      // Given: 一個包含 'ka' 的 buffer 和「か」字元
      const buffer = new InputBuffer().add('k').add('a');
      const char = new Character('か');

      // When: 嘗試匹配
      const result = buffer.tryMatch(char);

      // Then: 應為完全匹配
      expect(result.type).toBe('COMPLETE');
    });

    it('部分匹配時應返回 PARTIAL', () => {
      // Given: 一個包含 'k' 的 buffer 和「か」字元
      const buffer = new InputBuffer().add('k');
      const char = new Character('か');

      // When: 嘗試匹配
      const result = buffer.tryMatch(char);

      // Then: 應為部分匹配
      expect(result.type).toBe('PARTIAL');
    });

    it('不匹配時應返回 MISMATCH', () => {
      // Given: 一個包含 'x' 的 buffer 和「か」字元
      const buffer = new InputBuffer().add('x');
      const char = new Character('か');

      // When: 嘗試匹配
      const result = buffer.tryMatch(char);

      // Then: 應為不匹配
      expect(result.type).toBe('MISMATCH');
    });

    it('多種輸入方式都應能匹配', () => {
      // Given:「し」字元（可輸入 si 或 shi）
      const char = new Character('し');

      // When/Then: 'si' 應該完全匹配
      const buffer1 = new InputBuffer().add('s').add('i');
      expect(buffer1.tryMatch(char).type).toBe('COMPLETE');

      // When/Then: 'shi' 也應該完全匹配
      const buffer2 = new InputBuffer().add('s').add('h').add('i');
      expect(buffer2.tryMatch(char).type).toBe('COMPLETE');
    });

    it('多種輸入方式的前綴都應為部分匹配', () => {
      // Given:「し」字元（可輸入 si 或 shi）
      const char = new Character('し');

      // When/Then: 's' 應為部分匹配（si 和 shi 的共同前綴）
      const buffer1 = new InputBuffer().add('s');
      expect(buffer1.tryMatch(char).type).toBe('PARTIAL');

      // When/Then: 'sh' 也應為部分匹配
      const buffer2 = new InputBuffer().add('s').add('h');
      expect(buffer2.tryMatch(char).type).toBe('PARTIAL');
    });
  });

  describe('重置', () => {
    it('應清空 buffer', () => {
      // Given: 一個有內容的 buffer
      const buffer = new InputBuffer().add('k').add('a');

      // When: 重置
      const newBuffer = buffer.reset();

      // Then: 應為空
      expect(newBuffer.value).toBe('');
      expect(newBuffer.isEmpty()).toBe(true);
    });
  });

  describe('取得長度', () => {
    it('應返回正確長度', () => {
      // Given: 一個包含 'shi' 的 buffer
      const buffer = new InputBuffer().add('s').add('h').add('i');

      // When: 取得長度
      const length = buffer.length;

      // Then: 應為 3
      expect(length).toBe(3);
    });
  });
});
