import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { TypingSession } from '../../src/domain/TypingSession.js';
import { Question } from '../../src/domain/Question.js';
import { SpeechService } from '../../src/services/SpeechService.js';

describe('DirectInputFlow 整合測試（手機輸入模式）', () => {
  let mockSpeechSynthesis;
  let speechService;

  beforeEach(() => {
    mockSpeechSynthesis = {
      speak: mock((utterance) => {
        if (utterance.onend) utterance.onend();
      }),
      cancel: mock(() => {}),
    };
    speechService = new SpeechService({ speechSynthesis: mockSpeechSynthesis });
  });

  describe('完整輸入流程', () => {
    it('簡單題目：輸入「あい」', () => {
      // Given: 一個包含「あい」的題目
      const question = Question.fromText('あい');
      const session = new TypingSession(question);

      const events = [];
      session.on('CharacterCompleted', (e) => events.push({ type: 'completed', ...e }));
      session.on('SessionCompleted', (e) => events.push({ type: 'session', ...e }));
      session.on('SpeechRequested', (e) => speechService.speak(e.text));

      // When: 一次輸入「あい」
      session.handleDirectInput('あい');

      // Then: 應觸發 2 次字元完成和 1 次 Session 完成
      const completedEvents = events.filter(e => e.type === 'completed');
      const sessionEvents = events.filter(e => e.type === 'session');

      expect(completedEvents.length).toBe(2);
      expect(sessionEvents.length).toBe(1);

      // And: 應朗讀 2 次
      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(2);
    });

    it('批次輸入整個句子', () => {
      // Given: 一個包含「こんにちは」的題目
      const question = Question.fromText('こんにちは');
      const session = new TypingSession(question);

      const completedChars = [];
      session.on('CharacterCompleted', (e) => completedChars.push(e.character.kana));

      // When: 一次輸入整個句子
      session.handleDirectInput('こんにちは');

      // Then: 應完成所有字元
      expect(completedChars).toEqual(['こ', 'ん', 'に', 'ち', 'は']);
      expect(session.question.isCompleted()).toBe(true);
    });

    it('分段輸入', () => {
      // Given: 一個包含「あいうえお」的題目
      const question = Question.fromText('あいうえお');
      const session = new TypingSession(question);

      // When: 分兩次輸入
      const result1 = session.handleDirectInput('あい');
      const result2 = session.handleDirectInput('うえお');

      // Then: 兩次都應匹配成功
      expect(result1.matchedCount).toBe(2);
      expect(result2.matchedCount).toBe(3);
      expect(session.question.isCompleted()).toBe(true);
    });
  });

  describe('拗音和促音處理', () => {
    it('拗音輸入：しゃしゅしょ', () => {
      // Given: 一個包含拗音的題目
      const question = Question.fromText('しゃしゅしょ');
      const session = new TypingSession(question);

      const completedChars = [];
      session.on('CharacterCompleted', (e) => completedChars.push(e.character.kana));

      // When: 輸入拗音
      session.handleDirectInput('しゃしゅしょ');

      // Then: 應完成 3 個字元單位
      expect(completedChars).toEqual(['しゃ', 'しゅ', 'しょ']);
    });

    it('促音輸入：がっこう', () => {
      // Given: 一個包含促音的題目
      const question = Question.fromText('がっこう');
      const session = new TypingSession(question);

      const completedChars = [];
      session.on('CharacterCompleted', (e) => completedChars.push(e.character.kana));

      // When: 輸入帶促音的詞
      session.handleDirectInput('がっこう');

      // Then: 應完成所有字元單位
      expect(completedChars).toEqual(['が', 'っこ', 'う']);
    });
  });

  describe('錯誤處理流程', () => {
    it('不匹配後可以繼續正確輸入', () => {
      // Given: 一個題目
      const question = Question.fromText('あいう');
      const session = new TypingSession(question);

      const mistakes = [];
      session.on('CharacterMistaken', (e) => mistakes.push(e));

      // When: 輸入「あいえ」（最後一個不匹配）
      const result1 = session.handleDirectInput('あいえ');

      // Then: 應匹配 2 個，不計錯誤（手機模式容錯）
      expect(result1.matchedCount).toBe(2);
      expect(mistakes.length).toBe(0);

      // When: 繼續正確輸入
      const result2 = session.handleDirectInput('う');

      // Then: 應完成
      expect(result2.matchedCount).toBe(1);
      expect(session.question.isCompleted()).toBe(true);
    });

    it('完全錯誤的輸入不應推進', () => {
      // Given: 一個題目
      const question = Question.fromText('あいう');
      const session = new TypingSession(question);

      // When: 輸入完全錯誤
      const result = session.handleDirectInput('かきく');

      // Then: 不應匹配任何字元
      expect(result.matchedCount).toBe(0);
      expect(result.consumedLength).toBe(0);
      expect(session.getCurrentCharacter().kana).toBe('あ');
    });

    it('錯誤時輸入應保留在輸入框（模擬）', () => {
      // Given: 一個題目
      const question = Question.fromText('あいう');
      const session = new TypingSession(question);

      // When: 輸入「あいえ」
      const result = session.handleDirectInput('あいえ');

      // Then: consumedLength 應為 2，表示只消耗了「あい」
      // 輸入框應保留 'え'（由 UI 層處理）
      expect(result.consumedLength).toBe(2);

      // 模擬 UI 層的行為：只清除已消耗的部分
      const originalInput = 'あいえ';
      const remainingInput = originalInput.substring(result.consumedLength);
      expect(remainingInput).toBe('え');
    });
  });

  describe('標點符號處理', () => {
    it('應正確跳過標點符號', () => {
      // Given: 一個包含標點符號的題目
      const question = Question.fromText('あ。い');
      const session = new TypingSession(question);

      const completedChars = [];
      session.on('CharacterCompleted', (e) => completedChars.push(e.character.kana));

      // When: 輸入「あ」
      session.handleDirectInput('あ');

      // Then: 應完成「あ」並跳過「。」
      expect(completedChars).toContain('あ');
      expect(completedChars).toContain('。');
      expect(session.getCurrentCharacter().kana).toBe('い');
    });

    it('開頭標點符號應自動跳過', () => {
      // Given: 一個以標點符號開頭的題目
      const question = Question.fromText('「あ」');
      const session = new TypingSession(question);

      // Then: 當前字元應為「あ」，而非「「」
      expect(session.getCurrentCharacter().kana).toBe('あ');

      // When: 輸入「あ」
      session.handleDirectInput('あ');

      // Then: 題目應完成（自動跳過結尾的「」」）
      expect(session.question.isCompleted()).toBe(true);
    });
  });

  describe('統計計算', () => {
    it('批次輸入應正確計算總按鍵數', () => {
      // Given: 一個題目
      const question = Question.fromText('あいう');
      const session = new TypingSession(question);

      let stats;
      session.on('SessionCompleted', (e) => stats = e);

      // When: 一次輸入完成
      session.handleDirectInput('あいう');

      // Then: 總按鍵數應為 3
      expect(stats.totalKeystrokes).toBe(3);
    });

    it('手機模式下不計錯誤', () => {
      // Given: 一個題目
      const question = Question.fromText('あいう');
      const session = new TypingSession(question);

      let stats;
      session.on('SessionCompleted', (e) => stats = e);

      // When: 輸入「あいえ」（不匹配），再輸入「う」
      session.handleDirectInput('あいえ');
      session.handleDirectInput('う');

      // Then: 錯誤數應為 0（手機模式不計錯誤）
      expect(stats.mistakes).toBe(0);
    });

    it('手機模式下準確率應為 100%', () => {
      // Given: 一個題目
      const question = Question.fromText('あい');
      const session = new TypingSession(question);

      let stats;
      session.on('SessionCompleted', (e) => stats = e);

      // When: 先輸入「あえ」（不匹配），再輸入「い」
      session.handleDirectInput('あえ');
      session.handleDirectInput('い');

      // Then: 只計算成功匹配的按鍵，錯誤為 0，準確率 100%
      expect(stats.totalKeystrokes).toBe(2);
      expect(stats.mistakes).toBe(0);
      expect(stats.accuracy).toBe(1);
    });
  });

  describe('混合模式使用', () => {
    it('可以在同一個 session 中混用兩種輸入方式', () => {
      // Given: 一個題目
      const question = Question.fromText('あいうえ');
      const session = new TypingSession(question);

      // When: 用羅馬字輸入「あ」
      session.handleKeyPress('a');

      // And: 用直接輸入完成「いう」
      session.handleDirectInput('いう');

      // And: 再用羅馬字輸入「え」
      session.handleKeyPress('e');

      // Then: 題目應完成
      expect(session.question.isCompleted()).toBe(true);
    });
  });

  describe('片假名輸入', () => {
    it('應支援片假名', () => {
      // Given: 一個片假名題目
      const question = Question.fromText('カタカナ');
      const session = new TypingSession(question);

      const completedChars = [];
      session.on('CharacterCompleted', (e) => completedChars.push(e.character.kana));

      // When: 輸入片假名
      session.handleDirectInput('カタカナ');

      // Then: 應完成所有字元
      expect(completedChars).toEqual(['カ', 'タ', 'カ', 'ナ']);
    });
  });
});
