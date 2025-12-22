import { describe, it, expect } from 'bun:test';
import { Question } from '../../../src/domain/Question.js';
import { TypingSession } from '../../../src/domain/TypingSession.js';
import { getRomajiOptions } from '../../../src/domain/RomajiMap.js';

/**
 * 古典假名 BDD 測試
 *
 * 古典日文（歷史假名遣い）中使用的假名：
 * - ゐ/ヰ (wi) - 現代已合併為 い
 * - ゑ/ヱ (we) - 現代已合併為 え
 *
 * 這些假名仍出現在：
 * - 古典文學作品
 * - 人名、地名
 * - 傳統品牌名稱（如「ヱビス」啤酒）
 */
describe('古典假名', () => {
  describe('ゐ (wi) 平假名', () => {
    it('「ゐ」應有羅馬字選項', () => {
      const options = getRomajiOptions('ゐ');
      expect(options.length).toBeGreaterThan(0);
      expect(options).toContain('wi');
    });

    it('「ゐる」應接受 "wiru" 輸入', () => {
      // Given: 題目「ゐる」（古典：いる）
      const question = Question.fromText('ゐる');
      const session = new TypingSession(question);

      // When: 輸入
      'wiru'.split('').forEach(key => session.handleKeyPress(key));

      // Then: 應完成所有字元
      expect(session.question.isCompleted()).toBe(true);
    });
  });

  describe('ゑ (we) 平假名', () => {
    it('「ゑ」應有羅馬字選項', () => {
      const options = getRomajiOptions('ゑ');
      expect(options.length).toBeGreaterThan(0);
      expect(options).toContain('we');
    });

    it('「ゑびす」應接受 "webisu" 輸入', () => {
      // Given: 題目「ゑびす」（惠比壽，七福神之一）
      const question = Question.fromText('ゑびす');
      const session = new TypingSession(question);

      // When: 輸入
      'webisu'.split('').forEach(key => session.handleKeyPress(key));

      // Then: 應完成所有字元
      expect(session.question.isCompleted()).toBe(true);
    });
  });

  describe('ヰ (wi) 片假名', () => {
    it('「ヰ」應有羅馬字選項', () => {
      const options = getRomajiOptions('ヰ');
      expect(options.length).toBeGreaterThan(0);
      expect(options).toContain('wi');
    });

    it('「ヰスキー」應接受 "wisuki-" 輸入', () => {
      // Given: 題目「ヰスキー」（whisky，舊式寫法）
      const question = Question.fromText('ヰスキー');
      const session = new TypingSession(question);

      // When: 輸入
      'wisuki-'.split('').forEach(key => session.handleKeyPress(key));

      // Then: 應完成所有字元
      expect(session.question.isCompleted()).toBe(true);
    });
  });

  describe('ヱ (we) 片假名', () => {
    it('「ヱ」應有羅馬字選項', () => {
      const options = getRomajiOptions('ヱ');
      expect(options.length).toBeGreaterThan(0);
      expect(options).toContain('we');
    });

    it('「ヱビス」應接受 "webisu" 輸入', () => {
      // Given: 題目「ヱビス」（惠比壽啤酒品牌）
      const question = Question.fromText('ヱビス');
      const session = new TypingSession(question);

      // When: 輸入
      'webisu'.split('').forEach(key => session.handleKeyPress(key));

      // Then: 應完成所有字元
      expect(session.question.isCompleted()).toBe(true);
    });
  });
});
