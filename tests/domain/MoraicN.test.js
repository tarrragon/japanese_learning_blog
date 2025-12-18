import { describe, it, expect } from 'bun:test';
import { Question } from '../../src/domain/Question.js';
import { TypingSession } from '../../src/domain/TypingSession.js';

/**
 * 「ん」消歧義 BDD 測試
 *
 * 「ん」是日文中最複雜的假名之一，因為：
 * 1. 'n' 是 ん 的羅馬字，但也是 な/に/ぬ/ね/の 的前綴
 * 2. 在特定情況下需要使用 'nn' 或 "n'" 來消歧義
 *
 * 消歧義規則：
 * - ん + n 開頭假名（な行）：必須使用 nn 或 n'
 * - ん + 母音開頭假名：必須使用 nn 或 n'
 * - ん + y 開頭假名：必須使用 nn 或 n'
 * - ん + 其他子音：可使用 n（無歧義）
 * - ん 在字尾：可使用 n 或 nn
 */
describe('「ん」消歧義處理', () => {
  describe('在 n 開頭假名前（現有功能驗證）', () => {
    it('「こんにちは」必須使用 triple-n（nn + ni）', () => {
      // Given: 題目「こんにちは」
      // 說明：ん 需要 nn，に 需要 ni，所以 ん + に = nnn + i
      const question = Question.fromText('こんにちは');
      const session = new TypingSession(question);

      // When: 輸入 ko + nnn (nn for ん, n for に) + i + chi + ha
      'konnnichiha'.split('').forEach(key => session.handleKeyPress(key));

      // Then: 應完成所有字元
      expect(session.question.isCompleted()).toBe(true);
    });

    it('「かんな」必須使用 triple-n（nn + na）', () => {
      // Given: 題目「かんな」（鉋子）
      // 說明：ん 需要 nn，な 需要 na，所以 ん + な = nnn + a
      const question = Question.fromText('かんな');
      const session = new TypingSession(question);

      // When: 輸入 ka + nnna (nn for ん, na for な)
      'kannna'.split('').forEach(key => session.handleKeyPress(key));

      // Then: 應完成所有字元
      expect(session.question.isCompleted()).toBe(true);
    });

    it('「おんな」必須使用 triple-n', () => {
      // Given: 題目「おんな」（女性）
      const question = Question.fromText('おんな');
      const session = new TypingSession(question);

      // When: 輸入 o + nnna (nn for ん, na for な)
      'onnna'.split('').forEach(key => session.handleKeyPress(key));

      // Then: 應完成所有字元
      expect(session.question.isCompleted()).toBe(true);
    });
  });

  describe('在母音開頭假名前', () => {
    it('「けんい」必須使用 "nn"', () => {
      // Given: 題目「けんい」（權威）
      const question = Question.fromText('けんい');
      const session = new TypingSession(question);

      // When: 輸入 ke, nn, i
      'kenni'.split('').forEach(key => session.handleKeyPress(key));

      // Then: 應完成所有字元
      expect(session.question.isCompleted()).toBe(true);
    });

    it('「たんい」必須使用 "nn"', () => {
      // Given: 題目「たんい」（單位）
      const question = Question.fromText('たんい');
      const session = new TypingSession(question);

      // When: 輸入 ta, nn, i
      'tanni'.split('').forEach(key => session.handleKeyPress(key));

      // Then: 應完成所有字元
      expect(session.question.isCompleted()).toBe(true);
    });

    it('「しんあい」必須使用 "nn"', () => {
      // Given: 題目「しんあい」（親愛）
      const question = Question.fromText('しんあい');
      const session = new TypingSession(question);

      // When: 輸入 shi, nn, a, i
      'shinnai'.split('').forEach(key => session.handleKeyPress(key));

      // Then: 應完成所有字元
      expect(session.question.isCompleted()).toBe(true);
    });

    it('「れんあい」必須使用 "nn"', () => {
      // Given: 題目「れんあい」（戀愛）
      const question = Question.fromText('れんあい');
      const session = new TypingSession(question);

      // When: 輸入 re, nn, a, i
      'rennai'.split('').forEach(key => session.handleKeyPress(key));

      // Then: 應完成所有字元
      expect(session.question.isCompleted()).toBe(true);
    });
  });

  describe('在 y 開頭假名前', () => {
    it('「きんゆう」必須使用 "nn"', () => {
      // Given: 題目「きんゆう」（金融）
      const question = Question.fromText('きんゆう');
      const session = new TypingSession(question);

      // When: 輸入 ki, nn, yu, u
      'kinnyuu'.split('').forEach(key => session.handleKeyPress(key));

      // Then: 應完成所有字元
      expect(session.question.isCompleted()).toBe(true);
    });

    it('「てんよう」必須使用 "nn"', () => {
      // Given: 題目「てんよう」（轉用）
      const question = Question.fromText('てんよう');
      const session = new TypingSession(question);

      // When: 輸入 te, nn, yo, u
      'tennyou'.split('').forEach(key => session.handleKeyPress(key));

      // Then: 應完成所有字元
      expect(session.question.isCompleted()).toBe(true);
    });

    it('「でんや」必須使用 "nn"', () => {
      // Given: 題目「でんや」
      const question = Question.fromText('でんや');
      const session = new TypingSession(question);

      // When: 輸入 de, nn, ya
      'dennya'.split('').forEach(key => session.handleKeyPress(key));

      // Then: 應完成所有字元
      expect(session.question.isCompleted()).toBe(true);
    });
  });

  describe('撇號支援（n\'）', () => {
    it('「けんいち」可接受 "ken\'ichi"', () => {
      // Given: 題目「けんいち」（健一，人名）
      const question = Question.fromText('けんいち');
      const session = new TypingSession(question);

      // When: 輸入 ke, n', i, chi
      "ken'ichi".split('').forEach(key => session.handleKeyPress(key));

      // Then: 應完成所有字元
      expect(session.question.isCompleted()).toBe(true);
    });

    it('「てんよう」可接受 "ten\'you"', () => {
      // Given: 題目「てんよう」
      const question = Question.fromText('てんよう');
      const session = new TypingSession(question);

      // When: 輸入 te, n', yo, u
      "ten'you".split('').forEach(key => session.handleKeyPress(key));

      // Then: 應完成所有字元
      expect(session.question.isCompleted()).toBe(true);
    });

    it('「しんあい」可接受 "shin\'ai"', () => {
      // Given: 題目「しんあい」
      const question = Question.fromText('しんあい');
      const session = new TypingSession(question);

      // When: 輸入 shi, n', a, i
      "shin'ai".split('').forEach(key => session.handleKeyPress(key));

      // Then: 應完成所有字元
      expect(session.question.isCompleted()).toBe(true);
    });
  });

  describe('在字尾（無歧義）', () => {
    it('「かん」可接受 "kan"', () => {
      // Given: 題目「かん」（罐）
      const question = Question.fromText('かん');
      const session = new TypingSession(question);

      // When: 輸入 ka, n
      'kan'.split('').forEach(key => session.handleKeyPress(key));

      // Then: 應完成所有字元
      expect(session.question.isCompleted()).toBe(true);
    });

    it('「かん」也可接受 "kann"', () => {
      // Given: 題目「かん」
      const question = Question.fromText('かん');
      const session = new TypingSession(question);

      // When: 輸入 ka, nn
      'kann'.split('').forEach(key => session.handleKeyPress(key));

      // Then: 應完成所有字元
      expect(session.question.isCompleted()).toBe(true);
    });

    it('「にほん」可接受 "nihon"', () => {
      // Given: 題目「にほん」（日本）
      const question = Question.fromText('にほん');
      const session = new TypingSession(question);

      // When: 輸入 ni, ho, n
      'nihon'.split('').forEach(key => session.handleKeyPress(key));

      // Then: 應完成所有字元
      expect(session.question.isCompleted()).toBe(true);
    });
  });

  describe('在其他子音前（無歧義）', () => {
    it('「かんたん」可使用單一 "n"', () => {
      // Given: 題目「かんたん」（簡單）
      const question = Question.fromText('かんたん');
      const session = new TypingSession(question);

      // When: 輸入 ka, n, ta, n
      'kantan'.split('').forEach(key => session.handleKeyPress(key));

      // Then: 應完成所有字元
      expect(session.question.isCompleted()).toBe(true);
    });

    it('「さんぽ」可使用單一 "n"', () => {
      // Given: 題目「さんぽ」（散步）
      const question = Question.fromText('さんぽ');
      const session = new TypingSession(question);

      // When: 輸入 sa, n, po
      'sanpo'.split('').forEach(key => session.handleKeyPress(key));

      // Then: 應完成所有字元
      expect(session.question.isCompleted()).toBe(true);
    });

    it('「しんぶん」可使用單一 "n"', () => {
      // Given: 題目「しんぶん」（新聞）
      const question = Question.fromText('しんぶん');
      const session = new TypingSession(question);

      // When: 輸入 shi, n, bu, n
      'shinbun'.split('').forEach(key => session.handleKeyPress(key));

      // Then: 應完成所有字元
      expect(session.question.isCompleted()).toBe(true);
    });
  });

  describe('Question 的 ん 羅馬字選項', () => {
    it('字尾的「ん」應接受 "n" 和 "nn"', () => {
      // Given: 題目「かん」
      const question = Question.fromText('かん');

      // Then: ん 的羅馬字應包含 n 和 nn
      const nChar = question.characters[1];
      expect(nChar.kana).toBe('ん');
      expect(nChar.romaji).toContain('n');
      expect(nChar.romaji).toContain('nn');
    });

    it('母音前的「ん」應只接受 "nn" 和 "n\'"', () => {
      // Given: 題目「けんい」
      const question = Question.fromText('けんい');

      // Then: ん 的羅馬字應只有 nn 和 n'（排除單一 n）
      const nChar = question.characters[1];
      expect(nChar.kana).toBe('ん');
      expect(nChar.romaji).toContain('nn');
      expect(nChar.romaji).toContain("n'");
      expect(nChar.romaji).not.toContain('n');
    });

    it('y 開頭前的「ん」應只接受 "nn" 和 "n\'"', () => {
      // Given: 題目「きんゆう」
      const question = Question.fromText('きんゆう');

      // Then: ん 的羅馬字應只有 nn 和 n'
      const nChar = question.characters[1];
      expect(nChar.kana).toBe('ん');
      expect(nChar.romaji).toContain('nn');
      expect(nChar.romaji).toContain("n'");
    });

    it('其他子音前的「ん」可接受 "n"', () => {
      // Given: 題目「かんたん」
      const question = Question.fromText('かんたん');

      // Then: 第一個 ん（在た前）可使用 n
      const firstN = question.characters[1];
      expect(firstN.kana).toBe('ん');
      expect(firstN.romaji).toContain('n');
    });
  });

  describe('片假名「ン」處理', () => {
    it('「ラーメン」字尾可接受 "n"', () => {
      // Given: 題目「ラーメン」
      const question = Question.fromText('ラーメン');
      const session = new TypingSession(question);

      // When: 輸入 ra, -, me, n
      'ra-men'.split('').forEach(key => session.handleKeyPress(key));

      // Then: 應完成所有字元
      expect(session.question.isCompleted()).toBe(true);
    });

    it('「コンビニ」必須使用 "nn"（ン + ビ 的 b 前）', () => {
      // Given: 題目「コンビニ」（便利商店）
      // 注意：b 是子音，不需要 nn
      const question = Question.fromText('コンビニ');
      const session = new TypingSession(question);

      // When: 輸入 ko, n, bi, ni
      'konbini'.split('').forEach(key => session.handleKeyPress(key));

      // Then: 應完成所有字元
      expect(session.question.isCompleted()).toBe(true);
    });
  });
});
