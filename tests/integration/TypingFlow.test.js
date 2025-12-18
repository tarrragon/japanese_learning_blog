import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { TypingSession } from '../../src/domain/TypingSession.js';
import { Question } from '../../src/domain/Question.js';
import { SpeechService } from '../../src/services/SpeechService.js';

describe('TypingFlow 整合測試', () => {
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

      // When: 依序輸入 'a', 'i'
      session.handleKeyPress('a');
      session.handleKeyPress('i');

      // Then: 應觸發 2 次字元完成和 1 次 Session 完成
      const completedEvents = events.filter(e => e.type === 'completed');
      const sessionEvents = events.filter(e => e.type === 'session');

      expect(completedEvents.length).toBe(2);
      expect(sessionEvents.length).toBe(1);

      // And: 應朗讀 2 次
      expect(mockSpeechSynthesis.speak).toHaveBeenCalledTimes(2);
    });

    it('多字元羅馬字：輸入「かきく」', () => {
      // Given: 一個包含「かきく」的題目
      const question = Question.fromText('かきく');
      const session = new TypingSession(question);

      const completedChars = [];
      session.on('CharacterCompleted', (e) => completedChars.push(e.character.kana));

      // When: 依序輸入 'k','a','k','i','k','u'
      session.handleKeyPress('k');
      session.handleKeyPress('a'); // か 完成
      session.handleKeyPress('k');
      session.handleKeyPress('i'); // き 完成
      session.handleKeyPress('k');
      session.handleKeyPress('u'); // く 完成

      // Then: 應完成 3 個字元
      expect(completedChars).toEqual(['か', 'き', 'く']);
    });

    it('多種輸入方式：輸入「し」可用 si 或 shi', () => {
      // Given: 兩個相同的題目
      const question1 = Question.fromText('し');
      const question2 = Question.fromText('し');
      const session1 = new TypingSession(question1);
      const session2 = new TypingSession(question2);

      const completed1 = mock(() => {});
      const completed2 = mock(() => {});
      session1.on('SessionCompleted', completed1);
      session2.on('SessionCompleted', completed2);

      // When: 分別用 'si' 和 'shi' 輸入
      session1.handleKeyPress('s');
      session1.handleKeyPress('i');

      session2.handleKeyPress('s');
      session2.handleKeyPress('h');
      session2.handleKeyPress('i');

      // Then: 兩種方式都應完成
      expect(completed1).toHaveBeenCalled();
      expect(completed2).toHaveBeenCalled();
    });

    it('拗音輸入：輸入「しゃ」', () => {
      // Given: 一個包含「しゃ」的題目
      const question = Question.fromText('しゃ');
      const session = new TypingSession(question);

      const completed = mock(() => {});
      session.on('SessionCompleted', completed);

      // When: 輸入 'sha'
      session.handleKeyPress('s');
      session.handleKeyPress('h');
      session.handleKeyPress('a');

      // Then: 應完成
      expect(completed).toHaveBeenCalled();
    });
  });

  describe('錯誤處理流程', () => {
    it('錯誤後可以繼續正確輸入', () => {
      // Given: 一個包含「あ」的題目
      const question = Question.fromText('あ');
      const session = new TypingSession(question);

      const mistakes = [];
      const completed = mock(() => {});
      session.on('CharacterMistaken', (e) => mistakes.push(e));
      session.on('SessionCompleted', completed);

      // When: 先按錯，再按對
      session.handleKeyPress('k'); // 錯誤
      session.handleKeyPress('a'); // 正確

      // Then: 應有 1 次錯誤，但最終完成
      expect(mistakes.length).toBe(1);
      expect(completed).toHaveBeenCalled();
    });

    it('多次錯誤後仍可完成', () => {
      // Given: 一個包含「あ」的題目
      const question = Question.fromText('あ');
      const session = new TypingSession(question);

      let mistakeCount = 0;
      const completed = mock(() => {});
      session.on('CharacterMistaken', () => mistakeCount++);
      session.on('SessionCompleted', completed);

      // When: 連續按錯 3 次，最後按對
      session.handleKeyPress('k');
      session.handleKeyPress('x');
      session.handleKeyPress('z');
      session.handleKeyPress('a');

      // Then: 應有 3 次錯誤，但最終完成
      expect(mistakeCount).toBe(3);
      expect(completed).toHaveBeenCalled();
    });

    it('部分輸入後按錯應重置 buffer', () => {
      // Given: 一個包含「か」的題目
      const question = Question.fromText('か');
      const session = new TypingSession(question);

      // When: 輸入 'k' 後按錯
      session.handleKeyPress('k'); // 正確的部分
      session.handleKeyPress('x'); // 錯誤

      // Then: buffer 應被重置，需要重新輸入 'ka'
      expect(session.inputBuffer.isEmpty()).toBe(true);

      // When: 重新輸入 'ka'
      const completed = mock(() => {});
      session.on('SessionCompleted', completed);
      session.handleKeyPress('k');
      session.handleKeyPress('a');

      // Then: 應完成
      expect(completed).toHaveBeenCalled();
    });
  });

  describe('事件順序', () => {
    it('事件應按正確順序觸發', () => {
      // Given: 一個題目
      const question = Question.fromText('あ');
      const session = new TypingSession(question);

      const eventOrder = [];
      session.on('KeyPressed', () => eventOrder.push('KeyPressed'));
      session.on('RomajiMatched', () => eventOrder.push('RomajiMatched'));
      session.on('CharacterCompleted', () => eventOrder.push('CharacterCompleted'));
      session.on('SpeechRequested', () => eventOrder.push('SpeechRequested'));
      session.on('SessionCompleted', () => eventOrder.push('SessionCompleted'));

      // When: 輸入 'a'
      session.handleKeyPress('a');

      // Then: 事件順序應為 KeyPressed -> RomajiMatched -> CharacterCompleted -> SpeechRequested -> SessionCompleted
      expect(eventOrder).toEqual([
        'KeyPressed',
        'RomajiMatched',
        'CharacterCompleted',
        'SpeechRequested',
        'SessionCompleted'
      ]);
    });

    it('錯誤時的事件順序', () => {
      // Given: 一個題目
      const question = Question.fromText('あ');
      const session = new TypingSession(question);

      const eventOrder = [];
      session.on('KeyPressed', () => eventOrder.push('KeyPressed'));
      session.on('CharacterMistaken', () => eventOrder.push('CharacterMistaken'));

      // When: 輸入錯誤的 'k'
      session.handleKeyPress('k');

      // Then: 事件順序應為 KeyPressed -> CharacterMistaken
      expect(eventOrder).toEqual(['KeyPressed', 'CharacterMistaken']);
    });
  });

  describe('統計計算', () => {
    it('應正確計算總按鍵數', () => {
      // Given: 一個題目
      const question = Question.fromText('あ');
      const session = new TypingSession(question);

      let stats;
      session.on('SessionCompleted', (e) => stats = e);

      // When: 按錯 2 次，按對 1 次
      session.handleKeyPress('k');
      session.handleKeyPress('x');
      session.handleKeyPress('a');

      // Then: 總按鍵數應為 3
      expect(stats.totalKeystrokes).toBe(3);
    });

    it('應正確計算錯誤數', () => {
      // Given: 一個題目
      const question = Question.fromText('あい');
      const session = new TypingSession(question);

      let stats;
      session.on('SessionCompleted', (e) => stats = e);

      // When: あ 按錯 1 次，い 按對
      session.handleKeyPress('k'); // 錯誤
      session.handleKeyPress('a'); // 正確
      session.handleKeyPress('i'); // 正確

      // Then: 錯誤數應為 1
      expect(stats.mistakes).toBe(1);
    });

    it('應正確計算準確率', () => {
      // Given: 一個題目
      const question = Question.fromText('あ');
      const session = new TypingSession(question);

      let stats;
      session.on('SessionCompleted', (e) => stats = e);

      // When: 按錯 1 次（50% 準確率）
      session.handleKeyPress('k');
      session.handleKeyPress('a');

      // Then: 準確率應為 0.5
      expect(stats.accuracy).toBe(0.5);
    });
  });

  describe('進度追蹤', () => {
    it('應正確追蹤進度', () => {
      // Given: 一個有 4 個字元的題目
      const question = Question.fromText('あいうえ');
      const session = new TypingSession(question);

      // When/Then: 初始進度為 0
      expect(session.getProgress()).toBe(0);

      // When: 完成 1 個字元
      session.handleKeyPress('a');

      // Then: 進度為 0.25
      expect(session.getProgress()).toBe(0.25);

      // When: 完成 2 個字元
      session.handleKeyPress('i');

      // Then: 進度為 0.5
      expect(session.getProgress()).toBe(0.5);
    });
  });
});
