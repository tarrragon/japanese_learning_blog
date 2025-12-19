import { describe, it, expect, mock } from 'bun:test';
import { TypingSession } from '../../src/domain/TypingSession.js';
import { Question } from '../../src/domain/Question.js';
import { Character } from '../../src/domain/Character.js';

describe('handleDirectInput（直接假名輸入）', () => {
  describe('單一假名輸入', () => {
    it('應匹配正確的假名', () => {
      // Given: 一個包含「あ」的題目
      const question = Question.fromText('あ');
      const session = new TypingSession(question);

      // When: 使用者輸入「あ」
      const result = session.handleDirectInput('あ');

      // Then: 應匹配成功
      expect(result.matchedCount).toBe(1);
      expect(result.consumedLength).toBe(1);
    });

    it('匹配成功後應推進到下一個字元', () => {
      // Given: 一個包含「あい」的題目
      const question = Question.fromText('あい');
      const session = new TypingSession(question);

      // When: 使用者輸入「あ」
      session.handleDirectInput('あ');

      // Then: 當前字元應為「い」
      expect(session.getCurrentCharacter().kana).toBe('い');
    });

    it('應觸發 CharacterCompleted 事件', () => {
      // Given: 一個題目和事件處理器
      const question = Question.fromText('あ');
      const session = new TypingSession(question);
      const handler = mock(() => {});
      session.on('CharacterCompleted', handler);

      // When: 使用者輸入「あ」
      session.handleDirectInput('あ');

      // Then: 應觸發 CharacterCompleted 事件
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0].character.kana).toBe('あ');
    });

    it('應觸發 SpeechRequested 事件', () => {
      // Given: 一個題目和事件處理器
      const question = Question.fromText('あ');
      const session = new TypingSession(question);
      const handler = mock(() => {});
      session.on('SpeechRequested', handler);

      // When: 使用者輸入「あ」
      session.handleDirectInput('あ');

      // Then: 應觸發 SpeechRequested 事件
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0].text).toBe('あ');
    });
  });

  describe('批次輸入', () => {
    it('應一次匹配多個假名', () => {
      // Given: 一個包含「あいう」的題目
      const question = Question.fromText('あいう');
      const session = new TypingSession(question);

      // When: 使用者一次輸入「あいう」
      const result = session.handleDirectInput('あいう');

      // Then: 應匹配 3 個字元
      expect(result.matchedCount).toBe(3);
      expect(result.consumedLength).toBe(3);
    });

    it('批次輸入後應完成題目', () => {
      // Given: 一個包含「あいう」的題目
      const question = Question.fromText('あいう');
      const session = new TypingSession(question);

      // When: 使用者一次輸入「あいう」
      session.handleDirectInput('あいう');

      // Then: 題目應已完成
      expect(session.question.isCompleted()).toBe(true);
    });

    it('批次輸入應觸發多次 CharacterCompleted 事件', () => {
      // Given: 一個題目和事件處理器
      const question = Question.fromText('あいう');
      const session = new TypingSession(question);
      const handler = mock(() => {});
      session.on('CharacterCompleted', handler);

      // When: 使用者一次輸入「あいう」
      session.handleDirectInput('あいう');

      // Then: 應觸發 3 次 CharacterCompleted 事件
      expect(handler).toHaveBeenCalledTimes(3);
      expect(handler.mock.calls[0][0].character.kana).toBe('あ');
      expect(handler.mock.calls[1][0].character.kana).toBe('い');
      expect(handler.mock.calls[2][0].character.kana).toBe('う');
    });

    it('批次輸入應觸發多次 SpeechRequested 事件', () => {
      // Given: 一個題目和事件處理器
      const question = Question.fromText('あいう');
      const session = new TypingSession(question);
      const handler = mock(() => {});
      session.on('SpeechRequested', handler);

      // When: 使用者一次輸入「あいう」
      session.handleDirectInput('あいう');

      // Then: 應觸發 3 次 SpeechRequested 事件
      expect(handler).toHaveBeenCalledTimes(3);
    });
  });

  describe('部分正確輸入', () => {
    it('應匹配開頭正確的部分並停止在錯誤處', () => {
      // Given: 一個包含「あいう」的題目
      const question = Question.fromText('あいう');
      const session = new TypingSession(question);

      // When: 使用者輸入「あいえ」（え 錯誤）
      const result = session.handleDirectInput('あいえ');

      // Then: 應匹配 2 個字元
      expect(result.matchedCount).toBe(2);
      expect(result.consumedLength).toBe(2);
    });

    it('部分正確後應停在錯誤的字元位置', () => {
      // Given: 一個包含「あいう」的題目
      const question = Question.fromText('あいう');
      const session = new TypingSession(question);

      // When: 使用者輸入「あいえ」
      session.handleDirectInput('あいえ');

      // Then: 當前字元應為「う」（尚未輸入）
      expect(session.getCurrentCharacter().kana).toBe('う');
    });

    it('遇到錯誤時應觸發 CharacterMistaken 事件', () => {
      // Given: 一個題目和事件處理器
      const question = Question.fromText('あいう');
      const session = new TypingSession(question);
      const handler = mock(() => {});
      session.on('CharacterMistaken', handler);

      // When: 使用者輸入「あいえ」
      session.handleDirectInput('あいえ');

      // Then: 應觸發 CharacterMistaken 事件
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0].expected).toBe('う');
      expect(handler.mock.calls[0][0].actual).toBe('え');
    });
  });

  describe('錯誤輸入', () => {
    it('開頭就錯誤時 matchedCount 應為 0', () => {
      // Given: 一個包含「あ」的題目
      const question = Question.fromText('あ');
      const session = new TypingSession(question);

      // When: 使用者輸入「か」（錯誤）
      const result = session.handleDirectInput('か');

      // Then: 應沒有匹配
      expect(result.matchedCount).toBe(0);
      expect(result.consumedLength).toBe(0);
    });

    it('開頭錯誤時不應推進', () => {
      // Given: 一個包含「あ」的題目
      const question = Question.fromText('あ');
      const session = new TypingSession(question);

      // When: 使用者輸入「か」
      session.handleDirectInput('か');

      // Then: 當前字元應仍為「あ」
      expect(session.getCurrentCharacter().kana).toBe('あ');
    });
  });

  describe('拗音處理', () => {
    it('應正確匹配拗音', () => {
      // Given: 一個包含「しゃ」的題目
      const question = Question.fromText('しゃ');
      const session = new TypingSession(question);

      // When: 使用者輸入「しゃ」
      const result = session.handleDirectInput('しゃ');

      // Then: 應匹配 1 個字元（しゃ 是一個單位）
      expect(result.matchedCount).toBe(1);
      expect(result.consumedLength).toBe(2); // Unicode 長度為 2
    });

    it('拗音部分輸入不應匹配', () => {
      // Given: 一個包含「しゃ」的題目
      const question = Question.fromText('しゃ');
      const session = new TypingSession(question);

      // When: 使用者只輸入「し」
      const result = session.handleDirectInput('し');

      // Then: 不應匹配（因為期望的是「しゃ」）
      expect(result.matchedCount).toBe(0);
    });
  });

  describe('促音處理', () => {
    it('應正確匹配促音組合', () => {
      // Given: 一個包含「った」的題目
      const question = Question.fromText('った');
      const session = new TypingSession(question);

      // When: 使用者輸入「った」
      const result = session.handleDirectInput('った');

      // Then: 應匹配 1 個字元（った 是一個單位）
      expect(result.matchedCount).toBe(1);
      expect(result.consumedLength).toBe(2);
    });
  });

  describe('標點符號跳過', () => {
    it('完成字元後應自動跳過標點符號', () => {
      // Given: 一個包含「あ。い」的題目
      const question = Question.fromText('あ。い');
      const session = new TypingSession(question);

      // When: 使用者輸入「あ」
      session.handleDirectInput('あ');

      // Then: 應跳過「。」，當前字元應為「い」
      expect(session.getCurrentCharacter().kana).toBe('い');
    });

    it('跳過標點符號時應觸發 CharacterCompleted 事件', () => {
      // Given: 一個題目和事件處理器
      const question = Question.fromText('あ。い');
      const session = new TypingSession(question);
      const handler = mock(() => {});
      session.on('CharacterCompleted', handler);

      // When: 使用者輸入「あ」
      session.handleDirectInput('あ');

      // Then: 應觸發 2 次事件（あ 和被跳過的 。）
      expect(handler).toHaveBeenCalledTimes(2);
      expect(handler.mock.calls[1][0].skipped).toBe(true);
    });
  });

  describe('完成題目', () => {
    it('完成所有字元後應觸發 SessionCompleted 事件', () => {
      // Given: 一個題目和事件處理器
      const question = Question.fromText('あい');
      const session = new TypingSession(question);
      const handler = mock(() => {});
      session.on('SessionCompleted', handler);

      // When: 使用者完成輸入
      session.handleDirectInput('あい');

      // Then: 應觸發 SessionCompleted 事件
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('已完成的題目應忽略輸入', () => {
      // Given: 一個已完成的題目
      const question = Question.fromText('あ');
      const session = new TypingSession(question);
      session.handleDirectInput('あ');

      // When: 繼續輸入
      const result = session.handleDirectInput('い');

      // Then: 應被忽略
      expect(result.matchedCount).toBe(0);
      expect(result.consumedLength).toBe(0);
    });
  });

  describe('空輸入', () => {
    it('空字串應返回零匹配', () => {
      // Given: 一個題目
      const question = Question.fromText('あ');
      const session = new TypingSession(question);

      // When: 使用者輸入空字串
      const result = session.handleDirectInput('');

      // Then: 應沒有匹配
      expect(result.matchedCount).toBe(0);
      expect(result.consumedLength).toBe(0);
    });

    it('null 輸入應返回零匹配', () => {
      // Given: 一個題目
      const question = Question.fromText('あ');
      const session = new TypingSession(question);

      // When: 使用者輸入 null
      const result = session.handleDirectInput(null);

      // Then: 應沒有匹配
      expect(result.matchedCount).toBe(0);
      expect(result.consumedLength).toBe(0);
    });
  });
});

describe('Character.matchesKana', () => {
  it('應匹配相同的假名', () => {
    // Given: 一個字元
    const char = new Character('あ');

    // When & Then
    expect(char.matchesKana('あ')).toBe(true);
  });

  it('不同假名不應匹配', () => {
    // Given: 一個字元
    const char = new Character('あ');

    // When & Then
    expect(char.matchesKana('か')).toBe(false);
  });

  it('拗音應完整匹配', () => {
    // Given: 一個拗音字元
    const char = new Character('しゃ');

    // When & Then
    expect(char.matchesKana('しゃ')).toBe(true);
    expect(char.matchesKana('し')).toBe(false);
  });
});
