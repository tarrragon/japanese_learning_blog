import { describe, it, expect } from 'bun:test';
import { Question } from '../../../src/domain/Question.js';
import { CharacterState } from '../../../src/domain/Character.js';

describe('Question', () => {
  describe('從文字建立', () => {
    it('應該將文字拆解為字元列表', () => {
      // Given: 無前置條件
      // When: 從「あい」建立題目
      const question = Question.fromText('あい');

      // Then: 應有 2 個字元
      expect(question.characters.length).toBe(2);
      expect(question.characters[0].kana).toBe('あ');
      expect(question.characters[1].kana).toBe('い');
    });

    it('應保存原始文字', () => {
      // Given: 無前置條件
      // When: 從「こんにちは」建立題目
      const question = Question.fromText('こんにちは');

      // Then: 原始文字應被保存
      expect(question.text).toBe('こんにちは');
    });

    it('第一個字元應為 CURRENT 狀態', () => {
      // Given: 無前置條件
      // When: 從「あい」建立題目
      const question = Question.fromText('あい');

      // Then: 第一個字元應為 CURRENT
      expect(question.characters[0].state).toBe(CharacterState.CURRENT);
      // And: 其他字元應為 PENDING
      expect(question.characters[1].state).toBe(CharacterState.PENDING);
    });

    it('應處理拗音為單一字元', () => {
      // Given: 無前置條件
      // When: 從「しゃ」建立題目（拗音）
      const question = Question.fromText('しゃ');

      // Then: 應為 1 個字元（拗音視為整體）
      expect(question.characters.length).toBe(1);
      expect(question.characters[0].kana).toBe('しゃ');
    });

    it('應處理混合文字', () => {
      // Given: 無前置條件
      // When: 從「あしゃい」建立題目
      const question = Question.fromText('あしゃい');

      // Then: 應為 3 個字元
      expect(question.characters.length).toBe(3);
      expect(question.characters[0].kana).toBe('あ');
      expect(question.characters[1].kana).toBe('しゃ');
      expect(question.characters[2].kana).toBe('い');
    });
  });

  describe('取得當前字元', () => {
    it('應返回 CURRENT 狀態的字元', () => {
      // Given: 一個題目
      const question = Question.fromText('あい');

      // When: 取得當前字元
      const current = question.getCurrentCharacter();

      // Then: 應為第一個字元
      expect(current.kana).toBe('あ');
      expect(current.state).toBe(CharacterState.CURRENT);
    });
  });

  describe('取得當前索引', () => {
    it('初始時應為 0', () => {
      // Given: 一個題目
      const question = Question.fromText('あいう');

      // When: 取得當前索引
      const index = question.currentIndex;

      // Then: 應為 0
      expect(index).toBe(0);
    });
  });

  describe('推進到下一個字元', () => {
    it('應將當前字元標記為 COMPLETED', () => {
      // Given: 一個題目
      const question = Question.fromText('あい');

      // When: 推進到下一個字元
      const newQuestion = question.advance();

      // Then: 第一個字元應為 COMPLETED
      expect(newQuestion.characters[0].state).toBe(CharacterState.COMPLETED);
    });

    it('應將下一個字元標記為 CURRENT', () => {
      // Given: 一個題目
      const question = Question.fromText('あい');

      // When: 推進到下一個字元
      const newQuestion = question.advance();

      // Then: 第二個字元應為 CURRENT
      expect(newQuestion.characters[1].state).toBe(CharacterState.CURRENT);
    });

    it('當前索引應增加', () => {
      // Given: 一個題目
      const question = Question.fromText('あいう');

      // When: 推進到下一個字元
      const newQuestion = question.advance();

      // Then: 索引應為 1
      expect(newQuestion.currentIndex).toBe(1);
    });

    it('原題目應保持不變（immutable）', () => {
      // Given: 一個題目
      const question = Question.fromText('あい');

      // When: 推進到下一個字元
      question.advance();

      // Then: 原題目索引仍為 0
      expect(question.currentIndex).toBe(0);
    });
  });

  describe('檢查是否完成', () => {
    it('未完成時應返回 false', () => {
      // Given: 一個題目
      const question = Question.fromText('あい');

      // When: 檢查是否完成
      const result = question.isCompleted();

      // Then: 應為 false
      expect(result).toBe(false);
    });

    it('全部完成時應返回 true', () => {
      // Given: 一個題目並推進到最後
      let question = Question.fromText('あい');
      question = question.advance(); // あ -> completed
      question = question.advance(); // い -> completed

      // When: 檢查是否完成
      const result = question.isCompleted();

      // Then: 應為 true
      expect(result).toBe(true);
    });
  });

  describe('取得進度', () => {
    it('應返回完成比例', () => {
      // Given: 一個有 4 個字元的題目，完成 2 個
      let question = Question.fromText('あいうえ');
      question = question.advance();
      question = question.advance();

      // When: 取得進度
      const progress = question.getProgress();

      // Then: 應為 0.5（2/4）
      expect(progress).toBe(0.5);
    });
  });
});
