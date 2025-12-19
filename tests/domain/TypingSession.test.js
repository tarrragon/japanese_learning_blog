import { describe, it, expect, mock } from 'bun:test';
import { TypingSession } from '../../src/domain/TypingSession.js';
import { Question } from '../../src/domain/Question.js';

describe('TypingSession', () => {
  describe('建立時', () => {
    it('應保存題目', () => {
      // Given: 一個題目
      const question = Question.fromText('あ');

      // When: 建立 Session
      const session = new TypingSession(question);

      // Then: 應保存題目
      expect(session.question.text).toBe('あ');
    });

    it('應記錄開始時間', () => {
      // Given: 一個題目
      const question = Question.fromText('あ');

      // When: 建立 Session
      const session = new TypingSession(question);

      // Then: 應有開始時間
      expect(session.startTime).toBeInstanceOf(Date);
    });

    it('InputBuffer 應為空', () => {
      // Given: 一個題目
      const question = Question.fromText('あ');

      // When: 建立 Session
      const session = new TypingSession(question);

      // Then: buffer 應為空
      expect(session.inputBuffer.isEmpty()).toBe(true);
    });
  });

  describe('處理按鍵輸入', () => {
    describe('當使用者按下正確的鍵', () => {
      it('應觸發 KeyPressed 事件', () => {
        // Given: 一個包含「あ」的題目和 Session
        const question = Question.fromText('あ');
        const session = new TypingSession(question);
        const handler = mock(() => {});
        session.on('KeyPressed', handler);

        // When: 使用者按下 'a'
        session.handleKeyPress('a');

        // Then: 應觸發 KeyPressed 事件
        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler.mock.calls[0][0]).toMatchObject({ key: 'a' });
      });

      it('單一字元完成時應觸發 CharacterCompleted 事件', () => {
        // Given: 一個包含「あ」的題目
        const question = Question.fromText('あ');
        const session = new TypingSession(question);
        const handler = mock(() => {});
        session.on('CharacterCompleted', handler);

        // When: 使用者按下 'a'（完成「あ」）
        session.handleKeyPress('a');

        // Then: 應觸發 CharacterCompleted 事件
        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler.mock.calls[0][0]).toMatchObject({
          character: expect.objectContaining({ kana: 'あ' })
        });
      });

      it('完成字元時應觸發 SpeechRequested 事件', () => {
        // Given: 一個包含「あ」的題目
        const question = Question.fromText('あ');
        const session = new TypingSession(question);
        const handler = mock(() => {});
        session.on('SpeechRequested', handler);

        // When: 使用者按下 'a'（完成「あ」）
        session.handleKeyPress('a');

        // Then: 應觸發 SpeechRequested 事件
        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler.mock.calls[0][0]).toMatchObject({ text: 'あ' });
      });

      it('多字元輸入時應在完成時觸發事件', () => {
        // Given: 一個包含「か」的題目（需要輸入 'ka'）
        const question = Question.fromText('か');
        const session = new TypingSession(question);
        const completedHandler = mock(() => {});
        const partialHandler = mock(() => {});
        session.on('CharacterCompleted', completedHandler);
        session.on('RomajiMatched', partialHandler);

        // When: 使用者按下 'k'
        session.handleKeyPress('k');

        // Then: 應觸發部分匹配事件，但不觸發完成事件
        expect(partialHandler).toHaveBeenCalled();
        expect(completedHandler).not.toHaveBeenCalled();

        // When: 使用者繼續按下 'a'
        session.handleKeyPress('a');

        // Then: 現在應觸發完成事件
        expect(completedHandler).toHaveBeenCalledTimes(1);
      });
    });

    describe('當使用者按下錯誤的鍵', () => {
      it('應觸發 CharacterMistaken 事件', () => {
        // Given: 一個包含「あ」的題目
        const question = Question.fromText('あ');
        const session = new TypingSession(question);
        const handler = mock(() => {});
        session.on('CharacterMistaken', handler);

        // When: 使用者按下 'k'（錯誤）
        session.handleKeyPress('k');

        // Then: 應觸發 CharacterMistaken 事件
        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler.mock.calls[0][0]).toMatchObject({
          expected: expect.arrayContaining(['a']),
          actual: 'k'
        });
      });

      it('錯誤後 buffer 應被重置', () => {
        // Given: 一個包含「あ」的題目
        const question = Question.fromText('あ');
        const session = new TypingSession(question);

        // When: 使用者按下 'k'（錯誤）
        session.handleKeyPress('k');

        // Then: buffer 應被重置
        expect(session.inputBuffer.isEmpty()).toBe(true);
      });

      it('部分輸入後按錯應觸發錯誤', () => {
        // Given: 一個包含「か」的題目，已輸入 'k'
        const question = Question.fromText('か');
        const session = new TypingSession(question);
        session.handleKeyPress('k'); // 正確的部分輸入

        const handler = mock(() => {});
        session.on('CharacterMistaken', handler);

        // When: 使用者按下 'i'（錯誤，應該按 'a'）
        session.handleKeyPress('i');

        // Then: 應觸發錯誤事件
        expect(handler).toHaveBeenCalledTimes(1);
      });
    });

    describe('當完成整個題目', () => {
      it('應觸發 SessionCompleted 事件', () => {
        // Given: 一個包含「あい」的題目
        const question = Question.fromText('あい');
        const session = new TypingSession(question);
        const handler = mock(() => {});
        session.on('SessionCompleted', handler);

        // When: 使用者完成所有輸入
        session.handleKeyPress('a'); // あ
        session.handleKeyPress('i'); // い

        // Then: 應觸發 SessionCompleted 事件
        expect(handler).toHaveBeenCalledTimes(1);
      });

      it('SessionCompleted 事件應包含統計資訊', () => {
        // Given: 一個題目
        const question = Question.fromText('あい');
        const session = new TypingSession(question);
        const handler = mock(() => {});
        session.on('SessionCompleted', handler);

        // When: 完成輸入
        session.handleKeyPress('a');
        session.handleKeyPress('i');

        // Then: 事件應包含統計
        const eventData = handler.mock.calls[0][0];
        expect(eventData).toHaveProperty('totalTime');
        expect(eventData).toHaveProperty('accuracy');
        expect(eventData).toHaveProperty('totalKeystrokes');
      });

      it('準確率應正確計算', () => {
        // Given: 一個題目
        const question = Question.fromText('あ');
        const session = new TypingSession(question);
        const handler = mock(() => {});
        session.on('SessionCompleted', handler);

        // When: 先按錯一次，再按對
        session.handleKeyPress('k'); // 錯誤
        session.handleKeyPress('a'); // 正確

        // Then: 準確率應為 50%（1 正確 / 2 總按鍵）
        const eventData = handler.mock.calls[0][0];
        expect(eventData.accuracy).toBe(0.5);
      });
    });
  });

  describe('取得當前狀態', () => {
    it('應返回當前字元', () => {
      // Given: 一個題目
      const question = Question.fromText('あい');
      const session = new TypingSession(question);

      // When: 取得當前字元
      const current = session.getCurrentCharacter();

      // Then: 應為「あ」
      expect(current.kana).toBe('あ');
    });

    it('完成第一個字元後應返回第二個', () => {
      // Given: 一個題目並完成第一個字元
      const question = Question.fromText('あい');
      const session = new TypingSession(question);
      session.handleKeyPress('a');

      // When: 取得當前字元
      const current = session.getCurrentCharacter();

      // Then: 應為「い」
      expect(current.kana).toBe('い');
    });
  });

  describe('取得提示羅馬字', () => {
    it('應返回當前字元的羅馬字選項', () => {
      // Given: 一個包含「か」的題目
      const question = Question.fromText('か');
      const session = new TypingSession(question);

      // When: 取得提示
      const hint = session.getHintRomaji();

      // Then: 應為 'ka'（第一個選項）
      expect(hint).toBe('ka');
    });
  });

  describe('跳過標點符號', () => {
    it('建立時應自動跳過開頭的標點符號', () => {
      // Given: 一個以標點符號開頭的題目
      const question = Question.fromText('「あ」');
      const session = new TypingSession(question);

      // When: 取得當前字元
      const current = session.getCurrentCharacter();

      // Then: 應跳過開頭的「，當前字元應為「あ」
      expect(current.kana).toBe('あ');
    });

    it('完成字元後應自動跳過後續的標點符號', () => {
      // Given: 一個包含標點符號的題目
      const question = Question.fromText('あ。い');
      const session = new TypingSession(question);

      // When: 完成「あ」
      session.handleKeyPress('a');

      // Then: 應自動跳過「。」，當前字元應為「い」
      const current = session.getCurrentCharacter();
      expect(current.kana).toBe('い');
    });

    it('應自動跳過連續的標點符號', () => {
      // Given: 一個包含連續標點符號的題目
      const question = Question.fromText('あ。」い');
      const session = new TypingSession(question);

      // When: 完成「あ」
      session.handleKeyPress('a');

      // Then: 應自動跳過「。」和「」」，當前字元應為「い」
      const current = session.getCurrentCharacter();
      expect(current.kana).toBe('い');
    });

    it('跳過標點符號時應觸發 CharacterCompleted 事件', () => {
      // Given: 一個包含標點符號的題目
      const question = Question.fromText('あ。い');
      const session = new TypingSession(question);
      const handler = mock(() => {});
      session.on('CharacterCompleted', handler);

      // When: 完成「あ」
      session.handleKeyPress('a');

      // Then: 應觸發兩次 CharacterCompleted 事件（あ 和 。）
      expect(handler).toHaveBeenCalledTimes(2);
      // 第一次是「あ」
      expect(handler.mock.calls[0][0].character.kana).toBe('あ');
      // 第二次是被跳過的「。」，帶有 skipped 標記
      expect(handler.mock.calls[1][0].character.kana).toBe('。');
      expect(handler.mock.calls[1][0].skipped).toBe(true);
    });

    it('只有標點符號的題目應立即完成', () => {
      // Given: 一個只有標點符號的題目
      const question = Question.fromText('。');
      const session = new TypingSession(question);

      // Then: 應已完成
      expect(session.question.isCompleted()).toBe(true);
    });

    it('應跳過波浪符', () => {
      // Given: 一個包含波浪符的題目
      const question = Question.fromText('あ〜い');
      const session = new TypingSession(question);

      // When: 完成「あ」
      session.handleKeyPress('a');

      // Then: 應自動跳過「〜」，當前字元應為「い」
      const current = session.getCurrentCharacter();
      expect(current.kana).toBe('い');
    });

    it('應跳過長音符號', () => {
      // Given: 一個包含長音符號的題目
      const question = Question.fromText('あーい');
      const session = new TypingSession(question);

      // When: 完成「あ」
      session.handleKeyPress('a');

      // Then: 應自動跳過「ー」，當前字元應為「い」
      const current = session.getCurrentCharacter();
      expect(current.kana).toBe('い');
    });
  });
});
