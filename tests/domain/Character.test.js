import { describe, it, expect } from 'bun:test';
import { Character, CharacterState } from '../../src/domain/Character.js';

describe('Character', () => {
  describe('建立時', () => {
    it('狀態應為 PENDING', () => {
      // Given: 無前置條件
      // When: 建立一個字元
      const char = new Character('あ');

      // Then: 狀態應為 PENDING
      expect(char.state).toBe(CharacterState.PENDING);
    });

    it('應保存假名字元', () => {
      // Given: 無前置條件
      // When: 建立「か」字元
      const char = new Character('か');

      // Then: 假名應為「か」
      expect(char.kana).toBe('か');
    });

    it('應包含正確的羅馬字選項（單一選項）', () => {
      // Given: 無前置條件
      // When: 建立「あ」字元
      const char = new Character('あ');

      // Then: 羅馬字選項應為 ['a']
      expect(char.romaji).toEqual(['a']);
    });

    it('應包含正確的羅馬字選項（多種輸入方式）', () => {
      // Given: 無前置條件
      // When: 建立「し」字元
      const char = new Character('し');

      // Then: 羅馬字選項應包含 'si' 和 'shi'
      expect(char.romaji).toContain('si');
      expect(char.romaji).toContain('shi');
    });

    it('應支援片假名', () => {
      // Given: 無前置條件
      // When: 建立「カ」字元
      const char = new Character('カ');

      // Then: 羅馬字選項應為 ['ka']
      expect(char.romaji).toEqual(['ka']);
    });
  });

  describe('狀態轉換', () => {
    it('可以從 PENDING 變成 CURRENT', () => {
      // Given: 一個 PENDING 狀態的字元
      const char = new Character('あ');

      // When: 設定為當前目標
      const newChar = char.setCurrent();

      // Then: 狀態應為 CURRENT
      expect(newChar.state).toBe(CharacterState.CURRENT);
      // And: 原字元不變（immutable）
      expect(char.state).toBe(CharacterState.PENDING);
    });

    it('可以從 CURRENT 變成 COMPLETED', () => {
      // Given: 一個 CURRENT 狀態的字元
      const char = new Character('あ').setCurrent();

      // When: 標記為完成
      const newChar = char.setCompleted();

      // Then: 狀態應為 COMPLETED
      expect(newChar.state).toBe(CharacterState.COMPLETED);
    });
  });

  describe('羅馬字匹配', () => {
    it('完全匹配時應返回 true', () => {
      // Given: 一個「か」字元
      const char = new Character('か');

      // When: 輸入 'ka'
      const result = char.matchesRomaji('ka');

      // Then: 應該匹配成功
      expect(result).toBe(true);
    });

    it('多種輸入方式都應匹配成功', () => {
      // Given: 一個「し」字元
      const char = new Character('し');

      // When/Then: 'si' 和 'shi' 都應該匹配
      expect(char.matchesRomaji('si')).toBe(true);
      expect(char.matchesRomaji('shi')).toBe(true);
    });

    it('不匹配時應返回 false', () => {
      // Given: 一個「あ」字元
      const char = new Character('あ');

      // When: 輸入 'ka'
      const result = char.matchesRomaji('ka');

      // Then: 應該匹配失敗
      expect(result).toBe(false);
    });

    it('部分輸入應視為不匹配', () => {
      // Given: 一個「か」字元
      const char = new Character('か');

      // When: 只輸入 'k'
      const result = char.matchesRomaji('k');

      // Then: 應該匹配失敗（部分輸入不算完成）
      expect(result).toBe(false);
    });
  });

  describe('部分匹配檢查', () => {
    it('輸入為羅馬字前綴時應返回 true', () => {
      // Given: 一個「か」字元
      const char = new Character('か');

      // When: 輸入 'k'（ka 的前綴）
      const result = char.isPartialMatch('k');

      // Then: 應為部分匹配
      expect(result).toBe(true);
    });

    it('輸入不是任何羅馬字前綴時應返回 false', () => {
      // Given: 一個「あ」字元
      const char = new Character('あ');

      // When: 輸入 'k'（不是 'a' 的前綴）
      const result = char.isPartialMatch('k');

      // Then: 不應為部分匹配
      expect(result).toBe(false);
    });

    it('多種輸入方式的前綴都應匹配', () => {
      // Given: 一個「し」字元（可輸入 si 或 shi）
      const char = new Character('し');

      // When/Then: 's' 和 'sh' 都應為部分匹配
      expect(char.isPartialMatch('s')).toBe(true);
      expect(char.isPartialMatch('sh')).toBe(true);
    });
  });
});
