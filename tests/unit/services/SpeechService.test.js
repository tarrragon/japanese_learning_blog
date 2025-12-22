import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { SpeechService } from '../../../src/services/SpeechService.js';

describe('SpeechService', () => {
  describe('建立時', () => {
    it('應可指定語言', () => {
      // Given: 無前置條件
      // When: 建立日文語音服務
      const service = new SpeechService({ lang: 'ja-JP' });

      // Then: 語言應為日文
      expect(service.lang).toBe('ja-JP');
    });

    it('預設語言應為日文', () => {
      // Given: 無前置條件
      // When: 建立語音服務（不指定語言）
      const service = new SpeechService();

      // Then: 語言應為日文
      expect(service.lang).toBe('ja-JP');
    });
  });

  describe('朗讀功能', () => {
    it('speak 方法應接受文字參數', () => {
      // Given: 一個語音服務
      const service = new SpeechService();

      // When/Then: speak 方法應存在且可呼叫
      expect(typeof service.speak).toBe('function');
    });

    it('speak 應為非同步操作（返回 Promise）', async () => {
      // Given: 一個語音服務（使用 mock 的 speechSynthesis）
      const mockSpeechSynthesis = {
        speak: mock(() => {}),
        cancel: mock(() => {}),
      };
      const service = new SpeechService({
        speechSynthesis: mockSpeechSynthesis
      });

      // When: 呼叫 speak
      const result = service.speak('あ');

      // Then: 應返回 Promise
      expect(result).toBeInstanceOf(Promise);
    });

    it('應使用指定的語言設定', () => {
      // Given: 一個語音服務（使用 mock）
      const mockSpeechSynthesis = {
        speak: mock((utterance) => {
          // 模擬立即完成
          if (utterance.onend) utterance.onend();
        }),
        cancel: mock(() => {}),
      };
      const service = new SpeechService({
        lang: 'ja-JP',
        speechSynthesis: mockSpeechSynthesis
      });

      // When: 呼叫 speak
      service.speak('こんにちは');

      // Then: 應使用 ja-JP 語言
      const utterance = mockSpeechSynthesis.speak.mock.calls[0][0];
      expect(utterance.lang).toBe('ja-JP');
    });

    it('快速連續呼叫時應正常處理', async () => {
      // Given: 一個語音服務
      const speakCalls = [];
      const mockSpeechSynthesis = {
        speak: mock((utterance) => {
          speakCalls.push(utterance.text);
          if (utterance.onend) utterance.onend();
        }),
        cancel: mock(() => {}),
      };
      const service = new SpeechService({
        speechSynthesis: mockSpeechSynthesis
      });

      // When: 快速連續呼叫
      service.speak('あ');
      service.speak('い');
      service.speak('う');

      // Then: 所有呼叫都應被處理
      expect(speakCalls).toContain('あ');
      expect(speakCalls).toContain('い');
      expect(speakCalls).toContain('う');
    });
  });

  describe('瀏覽器支援檢查', () => {
    it('isSupported 應檢查 speechSynthesis 是否存在', () => {
      // Given: 沒有 speechSynthesis 的環境
      const service = new SpeechService({ speechSynthesis: undefined });

      // When: 檢查支援
      const supported = service.isSupported();

      // Then: 應為 false
      expect(supported).toBe(false);
    });

    it('有 speechSynthesis 時應返回 true', () => {
      // Given: 有 speechSynthesis 的環境
      const mockSpeechSynthesis = { speak: () => {} };
      const service = new SpeechService({ speechSynthesis: mockSpeechSynthesis });

      // When: 檢查支援
      const supported = service.isSupported();

      // Then: 應為 true
      expect(supported).toBe(true);
    });
  });

  describe('停止朗讀', () => {
    it('cancel 應停止當前朗讀', () => {
      // Given: 一個語音服務
      const mockSpeechSynthesis = {
        speak: mock(() => {}),
        cancel: mock(() => {}),
      };
      const service = new SpeechService({ speechSynthesis: mockSpeechSynthesis });

      // When: 呼叫 cancel
      service.cancel();

      // Then: 應呼叫 speechSynthesis.cancel
      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
    });
  });

  describe('設定語速', () => {
    it('應可設定語速', () => {
      // Given: 一個語音服務
      const mockSpeechSynthesis = {
        speak: mock((utterance) => {
          if (utterance.onend) utterance.onend();
        }),
        cancel: mock(() => {}),
      };
      const service = new SpeechService({
        rate: 0.8,
        speechSynthesis: mockSpeechSynthesis
      });

      // When: 呼叫 speak
      service.speak('あ');

      // Then: 語速應為 0.8
      const utterance = mockSpeechSynthesis.speak.mock.calls[0][0];
      expect(utterance.rate).toBe(0.8);
    });

    it('預設語速應為 1.0', () => {
      // Given: 一個語音服務（不設定語速）
      const mockSpeechSynthesis = {
        speak: mock((utterance) => {
          if (utterance.onend) utterance.onend();
        }),
        cancel: mock(() => {}),
      };
      const service = new SpeechService({
        speechSynthesis: mockSpeechSynthesis
      });

      // When: 呼叫 speak
      service.speak('あ');

      // Then: 語速應為 1.0
      const utterance = mockSpeechSynthesis.speak.mock.calls[0][0];
      expect(utterance.rate).toBe(1.0);
    });
  });
});
