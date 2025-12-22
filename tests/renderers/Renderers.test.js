import { describe, it, expect, beforeEach } from 'bun:test';
import { TextRenderer } from '../../src/renderers/TextRenderer.js';
import { RomajiRenderer } from '../../src/renderers/RomajiRenderer.js';
import { ResultRenderer } from '../../src/renderers/ResultRenderer.js';
import { FlashEffect } from '../../src/effects/FlashEffect.js';
import { i18n } from '../../src/i18n/index.js';

// Mock DOM Element
function createMockElement() {
  return {
    innerHTML: '',
    style: { display: '', transform: '' },
    classList: {
      _classes: new Set(),
      add(c) { this._classes.add(c); },
      remove(c) { this._classes.delete(c); },
      contains(c) { return this._classes.has(c); },
    },
    parentElement: {
      getBoundingClientRect: () => ({ width: 800 }),
    },
    querySelector: function(selector) {
      // 簡單的 mock 實現
      const match = selector.match(/\[data-index="(\d+)"\]/);
      if (match) {
        return { offsetLeft: parseInt(match[1]) * 20 };
      }
      if (selector === '#next-question-btn') {
        return {
          addEventListener: () => {},
        };
      }
      return null;
    },
  };
}

// Mock Question
function createMockQuestion(text = 'あいう') {
  return {
    text,
    characters: text.split('').map((kana, i) => ({
      kana,
      state: i === 0 ? 'current' : 'pending',
      romaji: [kana === 'あ' ? 'a' : kana === 'い' ? 'i' : 'u'],
    })),
    currentIndex: 0,
  };
}

describe('TextRenderer', () => {
  let renderer;
  let mockContainer;

  beforeEach(() => {
    mockContainer = createMockElement();
    renderer = new TextRenderer(mockContainer);
  });

  describe('constructor', () => {
    it('should create with container', () => {
      expect(renderer).toBeInstanceOf(TextRenderer);
      expect(renderer.getContainer()).toBe(mockContainer);
    });
  });

  describe('render', () => {
    it('should render kana characters', () => {
      const question = createMockQuestion('あい');
      renderer.render(question);

      expect(mockContainer.innerHTML).toContain('あ');
      expect(mockContainer.innerHTML).toContain('い');
      expect(mockContainer.innerHTML).toContain('char-current');
      expect(mockContainer.innerHTML).toContain('char-pending');
    });

    it('should render with question data (kanji mode)', () => {
      const question = createMockQuestion('あい');
      const questionData = {
        characters: [
          { display: '会' },
          { display: 'い' },
        ],
      };

      renderer.render(question, questionData);

      expect(mockContainer.innerHTML).toContain('会');
      expect(mockContainer.innerHTML).toContain('い');
    });

    it('should do nothing if container is null', () => {
      const nullRenderer = new TextRenderer(null);
      const question = createMockQuestion('あ');
      // 不應該拋出錯誤
      nullRenderer.render(question);
    });

    it('should do nothing if question is null', () => {
      // 不應該拋出錯誤
      renderer.render(null);
      expect(mockContainer.innerHTML).toBe('');
    });
  });

  describe('clear', () => {
    it('should clear content and transform', () => {
      const question = createMockQuestion('あ');
      renderer.render(question);
      mockContainer.style.transform = 'translateX(-10px)';

      renderer.clear();

      expect(mockContainer.innerHTML).toBe('');
      expect(mockContainer.style.transform).toBe('');
    });
  });
});

describe('RomajiRenderer', () => {
  let renderer;
  let mockContainer;

  beforeEach(() => {
    mockContainer = createMockElement();
    renderer = new RomajiRenderer(mockContainer);
  });

  describe('render', () => {
    it('should render romaji hints', () => {
      const question = createMockQuestion('あい');
      renderer.render(question);

      expect(mockContainer.innerHTML).toContain('a');
      expect(mockContainer.innerHTML).toContain('i');
      expect(mockContainer.innerHTML).toContain('romaji-current');
      expect(mockContainer.innerHTML).toContain('romaji-pending');
    });
  });

  describe('clear', () => {
    it('should clear content', () => {
      const question = createMockQuestion('あ');
      renderer.render(question);

      renderer.clear();

      expect(mockContainer.innerHTML).toBe('');
    });
  });
});

describe('ResultRenderer', () => {
  let renderer;
  let mockContainer;

  beforeEach(() => {
    mockContainer = createMockElement();
    renderer = new ResultRenderer(mockContainer, '/base');
    // 設定語言為中文以確保測試一致性
    i18n.setLanguage('zh-TW');
  });

  describe('render', () => {
    it('should render result stats', () => {
      const stats = {
        accuracy: 0.95,
        totalTime: 5000,
        totalKeystrokes: 10,
      };

      renderer.render(stats);

      expect(mockContainer.innerHTML).toContain('95%');
      expect(mockContainer.innerHTML).toContain('5.0s');
      expect(mockContainer.innerHTML).toContain('10');
      expect(mockContainer.innerHTML).toContain('完成');
    });

    it('should render source link when available', () => {
      const stats = { accuracy: 1, totalTime: 1000, totalKeystrokes: 5 };
      const questionData = {
        source: {
          path: '/card/001',
          title: '測試卡片',
        },
      };

      renderer.render(stats, questionData);

      expect(mockContainer.innerHTML).toContain('/base/card/001');
      expect(mockContainer.innerHTML).toContain('測試卡片');
    });

    it('should show next button when callback is set', () => {
      renderer.setNextQuestionCallback(() => {});
      const stats = { accuracy: 1, totalTime: 1000, totalKeystrokes: 5 };

      renderer.render(stats);

      expect(mockContainer.innerHTML).toContain('next-question-btn');
      expect(mockContainer.innerHTML).toContain('下一題');
    });

    it('should not show next button when no callback', () => {
      const stats = { accuracy: 1, totalTime: 1000, totalKeystrokes: 5 };

      renderer.render(stats);

      expect(mockContainer.innerHTML).not.toContain('next-question-btn');
    });
  });

  describe('hide', () => {
    it('should set display to none', () => {
      mockContainer.style.display = 'flex';
      renderer.hide();
      expect(mockContainer.style.display).toBe('none');
    });
  });

  describe('dispose', () => {
    it('should clear callback', () => {
      renderer.setNextQuestionCallback(() => {});
      renderer.dispose();
      // 驗證不會拋出錯誤
      const stats = { accuracy: 1, totalTime: 1000, totalKeystrokes: 5 };
      renderer.render(stats);
      expect(mockContainer.innerHTML).not.toContain('next-question-btn');
    });
  });
});

describe('FlashEffect', () => {
  let effect;
  let mockContainer;

  beforeEach(() => {
    mockContainer = createMockElement();
    effect = new FlashEffect(mockContainer);
  });

  describe('constructor', () => {
    it('should create with default options', () => {
      expect(effect).toBeInstanceOf(FlashEffect);
    });

    it('should accept custom options', () => {
      const customEffect = new FlashEffect(mockContainer, {
        successClass: 'custom-success',
        errorClass: 'custom-error',
        duration: 500,
      });
      expect(customEffect).toBeInstanceOf(FlashEffect);
    });
  });

  describe('flashSuccess', () => {
    it('should add success class', () => {
      effect.flashSuccess();
      expect(mockContainer.classList.contains('flash-success')).toBe(true);
    });
  });

  describe('flashError', () => {
    it('should add error class', () => {
      effect.flashError();
      expect(mockContainer.classList.contains('flash-error')).toBe(true);
    });
  });

  describe('setContainer', () => {
    it('should update container', () => {
      const newContainer = createMockElement();
      effect.setContainer(newContainer);
      expect(effect.getContainer()).toBe(newContainer);
    });
  });

  describe('null container', () => {
    it('should handle null container gracefully', () => {
      const nullEffect = new FlashEffect(null);
      // 不應該拋出錯誤
      nullEffect.flashSuccess();
      nullEffect.flashError();
    });
  });
});
