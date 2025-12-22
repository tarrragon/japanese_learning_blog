import { describe, it, expect } from 'bun:test';
import { Question } from '../../../src/domain/Question.js';
import { TypingSession } from '../../../src/domain/TypingSession.js';
import { getRomajiOptions } from '../../../src/domain/RomajiMap.js';

/**
 * 外來語片假名 BDD 測試
 *
 * 現代日文中使用的外來語特殊片假名組合：
 * - ティ/ディ 系列（ti/di 音）
 * - ファ行（fa/fi/fe/fo 音）
 * - ウィ/ウェ/ウォ（wi/we/wo 音）
 * - ヴ系列（v 音）
 */
describe('外來語片假名', () => {
  describe('ティ/ディ 系列', () => {
    it('「ティ」應有羅馬字選項', () => {
      const options = getRomajiOptions('ティ');
      expect(options.length).toBeGreaterThan(0);
      expect(options).toContain('thi');
    });

    it('「ディ」應有羅馬字選項', () => {
      const options = getRomajiOptions('ディ');
      expect(options.length).toBeGreaterThan(0);
      expect(options).toContain('dhi');
    });

    it('「ティーム」應接受 "thi-mu" 輸入', () => {
      // Given: 題目「ティーム」（team）
      const question = Question.fromText('ティーム');
      const session = new TypingSession(question);

      // When: 輸入 thi, -, mu
      'thi-mu'.split('').forEach(key => session.handleKeyPress(key));

      // Then: 應完成所有字元
      expect(session.question.isCompleted()).toBe(true);
    });

    it('「パーティー」應接受 "pa-thi-" 輸入', () => {
      // Given: 題目「パーティー」（party）
      const question = Question.fromText('パーティー');
      const session = new TypingSession(question);

      // When: 輸入
      'pa-thi-'.split('').forEach(key => session.handleKeyPress(key));

      // Then: 應完成所有字元
      expect(session.question.isCompleted()).toBe(true);
    });
  });

  describe('ファ行', () => {
    it('「ファ」應有羅馬字選項', () => {
      const options = getRomajiOptions('ファ');
      expect(options.length).toBeGreaterThan(0);
      expect(options).toContain('fa');
    });

    it('「フィ」應有羅馬字選項', () => {
      const options = getRomajiOptions('フィ');
      expect(options.length).toBeGreaterThan(0);
      expect(options).toContain('fi');
    });

    it('「フェ」應有羅馬字選項', () => {
      const options = getRomajiOptions('フェ');
      expect(options.length).toBeGreaterThan(0);
      expect(options).toContain('fe');
    });

    it('「フォ」應有羅馬字選項', () => {
      const options = getRomajiOptions('フォ');
      expect(options.length).toBeGreaterThan(0);
      expect(options).toContain('fo');
    });

    it('「ファン」應接受 "fan" 輸入', () => {
      // Given: 題目「ファン」（fan）
      const question = Question.fromText('ファン');
      const session = new TypingSession(question);

      // When: 輸入 fa, n
      'fan'.split('').forEach(key => session.handleKeyPress(key));

      // Then: 應完成所有字元
      expect(session.question.isCompleted()).toBe(true);
    });

    it('「コーヒー」應接受 "ko-hi-" 輸入', () => {
      // Given: 題目「コーヒー」（coffee）
      const question = Question.fromText('コーヒー');
      const session = new TypingSession(question);

      // When: 輸入
      'ko-hi-'.split('').forEach(key => session.handleKeyPress(key));

      // Then: 應完成所有字元
      expect(session.question.isCompleted()).toBe(true);
    });

    it('「ソファー」應接受 "sofa-" 輸入', () => {
      // Given: 題目「ソファー」（sofa）
      const question = Question.fromText('ソファー');
      const session = new TypingSession(question);

      // When: 輸入
      'sofa-'.split('').forEach(key => session.handleKeyPress(key));

      // Then: 應完成所有字元
      expect(session.question.isCompleted()).toBe(true);
    });
  });

  describe('ウィ/ウェ/ウォ', () => {
    it('「ウィ」應有羅馬字選項', () => {
      const options = getRomajiOptions('ウィ');
      expect(options.length).toBeGreaterThan(0);
      expect(options).toContain('wi');
    });

    it('「ウェ」應有羅馬字選項', () => {
      const options = getRomajiOptions('ウェ');
      expect(options.length).toBeGreaterThan(0);
      expect(options).toContain('we');
    });

    it('「ウォ」應有羅馬字選項', () => {
      const options = getRomajiOptions('ウォ');
      expect(options.length).toBeGreaterThan(0);
      expect(options).toContain('wo');
    });

    it('「ウェブ」應接受 "webu" 輸入', () => {
      // Given: 題目「ウェブ」（web）
      const question = Question.fromText('ウェブ');
      const session = new TypingSession(question);

      // When: 輸入
      'webu'.split('').forEach(key => session.handleKeyPress(key));

      // Then: 應完成所有字元
      expect(session.question.isCompleted()).toBe(true);
    });

    it('「ウィンドウ」應接受 "windou" 輸入', () => {
      // Given: 題目「ウィンドウ」（window）
      const question = Question.fromText('ウィンドウ');
      const session = new TypingSession(question);

      // When: 輸入
      'windou'.split('').forEach(key => session.handleKeyPress(key));

      // Then: 應完成所有字元
      expect(session.question.isCompleted()).toBe(true);
    });
  });

  describe('ヴ系列', () => {
    it('「ヴァ」應有羅馬字選項', () => {
      const options = getRomajiOptions('ヴァ');
      expect(options.length).toBeGreaterThan(0);
      expect(options).toContain('va');
    });

    it('「ヴィ」應有羅馬字選項', () => {
      const options = getRomajiOptions('ヴィ');
      expect(options.length).toBeGreaterThan(0);
      expect(options).toContain('vi');
    });

    it('「ヴ」應有羅馬字選項', () => {
      const options = getRomajiOptions('ヴ');
      expect(options.length).toBeGreaterThan(0);
      expect(options).toContain('vu');
    });

    it('「ヴェ」應有羅馬字選項', () => {
      const options = getRomajiOptions('ヴェ');
      expect(options.length).toBeGreaterThan(0);
      expect(options).toContain('ve');
    });

    it('「ヴォ」應有羅馬字選項', () => {
      const options = getRomajiOptions('ヴォ');
      expect(options.length).toBeGreaterThan(0);
      expect(options).toContain('vo');
    });

    it('「ヴァイオリン」應接受 "vaiorinn" 輸入', () => {
      // Given: 題目「ヴァイオリン」（violin）
      const question = Question.fromText('ヴァイオリン');
      const session = new TypingSession(question);

      // When: 輸入
      'vaiorinn'.split('').forEach(key => session.handleKeyPress(key));

      // Then: 應完成所有字元
      expect(session.question.isCompleted()).toBe(true);
    });
  });

  describe('Question 解析外來語組合', () => {
    it('「ティ」應解析為單一字元', () => {
      const question = Question.fromText('ティ');
      expect(question.characters.length).toBe(1);
      expect(question.characters[0].kana).toBe('ティ');
    });

    it('「ファ」應解析為單一字元', () => {
      const question = Question.fromText('ファ');
      expect(question.characters.length).toBe(1);
      expect(question.characters[0].kana).toBe('ファ');
    });

    it('「ウェ」應解析為單一字元', () => {
      const question = Question.fromText('ウェ');
      expect(question.characters.length).toBe(1);
      expect(question.characters[0].kana).toBe('ウェ');
    });

    it('「ヴァ」應解析為單一字元', () => {
      const question = Question.fromText('ヴァ');
      expect(question.characters.length).toBe(1);
      expect(question.characters[0].kana).toBe('ヴァ');
    });
  });
});
