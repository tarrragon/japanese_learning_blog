import { describe, it, expect } from 'bun:test';
import { Question } from '../../../src/domain/Question.js';
import { TypingSession } from '../../../src/domain/TypingSession.js';

/**
 * 促音（っ）BDD 測試
 *
 * 促音是日文中的「小っ」，用於表示子音重複。
 * 主流 IME 支援兩種輸入方式：
 * 1. 子音重複：kka → っか（主要使用者期望）
 * 2. 傳統輸入：xtu/ltu → っ（向後相容）
 */
describe('促音（っ）處理', () => {
  describe('子音重複輸入', () => {
    it('「かった」應接受 "katta" 輸入', () => {
      // Given: 題目「かった」
      const question = Question.fromText('かった');
      const session = new TypingSession(question);

      // When: 輸入 k, a, t, t, a
      'katta'.split('').forEach(key => session.handleKeyPress(key));

      // Then: 應完成所有字元
      expect(session.question.isCompleted()).toBe(true);
    });

    it('「ちょっと」應接受 "chotto" 輸入', () => {
      // Given: 題目「ちょっと」
      const question = Question.fromText('ちょっと');
      const session = new TypingSession(question);

      // When: 輸入 c, h, o, t, t, o
      'chotto'.split('').forEach(key => session.handleKeyPress(key));

      // Then: 應完成所有字元
      expect(session.question.isCompleted()).toBe(true);
    });

    it('「いっしょ」應接受 "issho" 輸入', () => {
      // Given: 題目「いっしょ」
      const question = Question.fromText('いっしょ');
      const session = new TypingSession(question);

      // When: 輸入 i, s, s, h, o
      'issho'.split('').forEach(key => session.handleKeyPress(key));

      // Then: 應完成所有字元
      expect(session.question.isCompleted()).toBe(true);
    });

    it('「いっしょ」應接受 "issyo" 輸入（替代羅馬字）', () => {
      // Given: 題目「いっしょ」
      const question = Question.fromText('いっしょ');
      const session = new TypingSession(question);

      // When: 輸入 i, s, s, y, o
      'issyo'.split('').forEach(key => session.handleKeyPress(key));

      // Then: 應完成所有字元
      expect(session.question.isCompleted()).toBe(true);
    });

    it('「まって」應接受 "matte" 輸入', () => {
      // Given: 題目「まって」
      const question = Question.fromText('まって');
      const session = new TypingSession(question);

      // When: 輸入 m, a, t, t, e
      'matte'.split('').forEach(key => session.handleKeyPress(key));

      // Then: 應完成所有字元
      expect(session.question.isCompleted()).toBe(true);
    });

    it('「がっこう」應接受 "gakkou" 輸入', () => {
      // Given: 題目「がっこう」
      const question = Question.fromText('がっこう');
      const session = new TypingSession(question);

      // When: 輸入 g, a, k, k, o, u
      'gakkou'.split('').forEach(key => session.handleKeyPress(key));

      // Then: 應完成所有字元
      expect(session.question.isCompleted()).toBe(true);
    });

    it('「ざっし」應接受 "zassi" 或 "zasshi" 輸入', () => {
      // Given: 題目「ざっし」（雜誌）
      // Test with "zasshi"
      const question1 = Question.fromText('ざっし');
      const session1 = new TypingSession(question1);
      'zasshi'.split('').forEach(key => session1.handleKeyPress(key));
      expect(session1.question.isCompleted()).toBe(true);

      // Test with "zassi"
      const question2 = Question.fromText('ざっし');
      const session2 = new TypingSession(question2);
      'zassi'.split('').forEach(key => session2.handleKeyPress(key));
      expect(session2.question.isCompleted()).toBe(true);
    });

    it('「はっぱ」應接受 "happa" 輸入', () => {
      // Given: 題目「はっぱ」（葉子）
      const question = Question.fromText('はっぱ');
      const session = new TypingSession(question);

      // When: 輸入 h, a, p, p, a
      'happa'.split('').forEach(key => session.handleKeyPress(key));

      // Then: 應完成所有字元
      expect(session.question.isCompleted()).toBe(true);
    });
  });

  describe('傳統輸入方式（向後相容）', () => {
    it('「かった」也應接受 "kaxtuta" 輸入', () => {
      // Given: 題目「かった」
      const question = Question.fromText('かった');
      const session = new TypingSession(question);

      // When: 輸入傳統方式 ka + xtu + ta
      'kaxtuta'.split('').forEach(key => session.handleKeyPress(key));

      // Then: 應完成所有字元
      expect(session.question.isCompleted()).toBe(true);
    });

    it('「かった」也應接受 "kaltuta" 輸入', () => {
      // Given: 題目「かった」
      const question = Question.fromText('かった');
      const session = new TypingSession(question);

      // When: 輸入傳統方式 ka + ltu + ta
      'kaltuta'.split('').forEach(key => session.handleKeyPress(key));

      // Then: 應完成所有字元
      expect(session.question.isCompleted()).toBe(true);
    });

    it('「まって」也應接受 "maxtute" 輸入', () => {
      // Given: 題目「まって」
      const question = Question.fromText('まって');
      const session = new TypingSession(question);

      // When: 輸入傳統方式 ma + xtu + te
      'maxtute'.split('').forEach(key => session.handleKeyPress(key));

      // Then: 應完成所有字元
      expect(session.question.isCompleted()).toBe(true);
    });
  });

  describe('Question 解析促音合併', () => {
    it('「かった」應解析為 2 個字元單位：か + った', () => {
      // Given: 題目「かった」
      const question = Question.fromText('かった');

      // Then: 應有 2 個字元（っ 與 た 合併）
      expect(question.characters.length).toBe(2);
      expect(question.characters[0].kana).toBe('か');
      expect(question.characters[1].kana).toBe('った');
    });

    it('「ちょっと」應解析為 2 個字元單位：ちょ + っと', () => {
      // Given: 題目「ちょっと」
      const question = Question.fromText('ちょっと');

      // Then: 應有 2 個字元（拗音 + 促音合併）
      expect(question.characters.length).toBe(2);
      expect(question.characters[0].kana).toBe('ちょ');
      expect(question.characters[1].kana).toBe('っと');
    });

    it('「いっしょ」應解析為 2 個字元單位：い + っしょ', () => {
      // Given: 題目「いっしょ」
      const question = Question.fromText('いっしょ');

      // Then: 應有 2 個字元（促音 + 拗音合併）
      expect(question.characters.length).toBe(2);
      expect(question.characters[0].kana).toBe('い');
      expect(question.characters[1].kana).toBe('っしょ');
    });
  });

  describe('促音羅馬字選項', () => {
    it('「った」的羅馬字選項應包含 "tta"', () => {
      // Given: 題目含有「った」
      const question = Question.fromText('った');

      // Then: 羅馬字選項應包含子音重複形式
      const romaji = question.characters[0].romaji;
      expect(romaji).toContain('tta');
    });

    it('「っか」的羅馬字選項應包含 "kka"', () => {
      // Given: 題目含有「っか」
      const question = Question.fromText('っか');

      // Then: 羅馬字選項應包含子音重複形式
      const romaji = question.characters[0].romaji;
      expect(romaji).toContain('kka');
    });

    it('「っしょ」的羅馬字選項應包含 "ssho" 和 "ssyo"', () => {
      // Given: 題目含有「っしょ」
      const question = Question.fromText('っしょ');

      // Then: 羅馬字選項應包含多種形式
      const romaji = question.characters[0].romaji;
      expect(romaji).toContain('ssho');
      expect(romaji).toContain('ssyo');
    });

    it('「っち」的羅馬字選項應包含 "cchi" 和 "tti"', () => {
      // Given: 題目含有「っち」
      const question = Question.fromText('っち');

      // Then: 羅馬字選項應包含 Hepburn 和訓令式
      const romaji = question.characters[0].romaji;
      expect(romaji).toContain('cchi');
      expect(romaji).toContain('tti');
    });
  });

  describe('獨立促音處理', () => {
    it('字尾的獨立「っ」應使用傳統輸入', () => {
      // Given: 題目「あっ」（字尾促音，表示驚訝等）
      const question = Question.fromText('あっ');

      // Then: 應有 2 個字元（っ 未合併）
      expect(question.characters.length).toBe(2);
      expect(question.characters[1].kana).toBe('っ');

      // And: 獨立っ應使用傳統羅馬字
      const romaji = question.characters[1].romaji;
      expect(romaji).toContain('xtu');
      expect(romaji).toContain('ltu');
    });
  });

  describe('片假名促音', () => {
    it('「カッコ」應接受 "kakko" 輸入', () => {
      // Given: 題目「カッコ」（括號）
      const question = Question.fromText('カッコ');
      const session = new TypingSession(question);

      // When: 輸入 k, a, k, k, o
      'kakko'.split('').forEach(key => session.handleKeyPress(key));

      // Then: 應完成所有字元
      expect(session.question.isCompleted()).toBe(true);
    });

    it('「サッカー」應接受 "sakka-" 輸入', () => {
      // Given: 題目「サッカー」（足球）
      const question = Question.fromText('サッカー');
      const session = new TypingSession(question);

      // When: 輸入 s, a, k, k, a, -
      'sakka-'.split('').forEach(key => session.handleKeyPress(key));

      // Then: 應完成所有字元
      expect(session.question.isCompleted()).toBe(true);
    });
  });
});
