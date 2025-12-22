import { describe, it, expect, beforeEach } from 'bun:test';
import { InputHandler } from '../../../src/input/InputHandler.js';
import { RomajiInputHandler } from '../../../src/input/RomajiInputHandler.js';
import { DirectInputHandler } from '../../../src/input/DirectInputHandler.js';
import { InputHandlerFactory } from '../../../src/input/InputHandlerFactory.js';

// Mock TypingSession
function createMockSession() {
  return {
    handleKeyPress: () => {},
    handleDirectInput: () => ({ matchedCount: 0, consumedLength: 0 }),
    getHintRomaji: () => 'a',
  };
}

// Mock KeyboardRenderer
function createMockKeyboardRenderer() {
  return {
    showKeyPress: () => {},
    highlightKey: () => {},
  };
}

// Mock Input Element
function createMockInputElement() {
  return {
    value: '',
    addEventListener: () => {},
    removeEventListener: () => {},
    focus: () => {},
  };
}

describe('InputHandler (abstract)', () => {
  it('should throw when instantiated directly', () => {
    expect(() => new InputHandler()).toThrow(
      'InputHandler is abstract and cannot be instantiated directly'
    );
  });
});

describe('RomajiInputHandler', () => {
  let handler;
  let mockSession;
  let mockKeyboardRenderer;

  beforeEach(() => {
    mockKeyboardRenderer = createMockKeyboardRenderer();
    handler = new RomajiInputHandler(mockKeyboardRenderer);
    mockSession = createMockSession();
  });

  describe('constructor', () => {
    it('should create without keyboard renderer', () => {
      const h = new RomajiInputHandler();
      expect(h).toBeInstanceOf(RomajiInputHandler);
    });

    it('should create with keyboard renderer', () => {
      expect(handler).toBeInstanceOf(RomajiInputHandler);
    });
  });

  describe('setSession', () => {
    it('should set session', () => {
      handler.setSession(mockSession);
      expect(handler.session).toBe(mockSession);
    });
  });

  describe('setUpdateCallback', () => {
    it('should set callback and call it via triggerUpdate', () => {
      let called = false;
      handler.setUpdateCallback(() => { called = true; });
      handler.triggerUpdate();
      expect(called).toBe(true);
    });
  });

  describe('activate/deactivate', () => {
    it('should set isActive to true when activated', () => {
      expect(handler.isActive).toBe(false);
      handler.activate();
      expect(handler.isActive).toBe(true);
    });

    it('should set isActive to false when deactivated', () => {
      handler.activate();
      handler.deactivate();
      expect(handler.isActive).toBe(false);
    });
  });

  describe('updateHighlight', () => {
    it('should call keyboard renderer highlightKey', () => {
      let highlightedKey = null;
      mockKeyboardRenderer.highlightKey = (key) => { highlightedKey = key; };

      handler.setSession(mockSession);
      handler.updateHighlight();

      expect(highlightedKey).toBe('a');
    });

    it('should handle null hint', () => {
      mockSession.getHintRomaji = () => null;
      let highlightedKey = 'initial';
      mockKeyboardRenderer.highlightKey = (key) => { highlightedKey = key; };

      handler.setSession(mockSession);
      handler.updateHighlight();

      expect(highlightedKey).toBe(null);
    });

    it('should skip non-alpha characters', () => {
      mockSession.getHintRomaji = () => '!@#abc';
      let highlightedKey = null;
      mockKeyboardRenderer.highlightKey = (key) => { highlightedKey = key; };

      handler.setSession(mockSession);
      handler.updateHighlight();

      expect(highlightedKey).toBe('a');
    });
  });

  describe('dispose', () => {
    it('should cleanup session and callback', () => {
      handler.setSession(mockSession);
      handler.setUpdateCallback(() => {});
      handler.activate();

      handler.dispose();

      expect(handler.session).toBe(null);
      expect(handler.isActive).toBe(false);
    });
  });

  describe('setKeyboardRenderer', () => {
    it('should update keyboard renderer', () => {
      const newRenderer = createMockKeyboardRenderer();
      handler.setKeyboardRenderer(newRenderer);

      let called = false;
      newRenderer.highlightKey = () => { called = true; };

      handler.setSession(mockSession);
      handler.updateHighlight();

      expect(called).toBe(true);
    });
  });
});

describe('DirectInputHandler', () => {
  let handler;
  let mockSession;
  let mockInputElement;

  beforeEach(() => {
    mockInputElement = createMockInputElement();
    handler = new DirectInputHandler(mockInputElement);
    mockSession = createMockSession();
  });

  describe('constructor', () => {
    it('should create without input element', () => {
      const h = new DirectInputHandler();
      expect(h).toBeInstanceOf(DirectInputHandler);
    });

    it('should create with input element', () => {
      expect(handler).toBeInstanceOf(DirectInputHandler);
    });
  });

  describe('setInputElement', () => {
    it('should set input element', () => {
      const newElement = createMockInputElement();
      handler.setInputElement(newElement);
      expect(handler.getInputElement()).toBe(newElement);
    });
  });

  describe('activate/deactivate', () => {
    it('should add event listeners when activated', () => {
      let inputListenerAdded = false;
      let compositionListenerAdded = false;

      mockInputElement.addEventListener = (type) => {
        if (type === 'input') inputListenerAdded = true;
        if (type === 'compositionend') compositionListenerAdded = true;
      };

      handler.activate();

      expect(inputListenerAdded).toBe(true);
      expect(compositionListenerAdded).toBe(true);
      expect(handler.isActive).toBe(true);
    });

    it('should remove event listeners when deactivated', () => {
      let inputListenerRemoved = false;
      let compositionListenerRemoved = false;

      mockInputElement.removeEventListener = (type) => {
        if (type === 'input') inputListenerRemoved = true;
        if (type === 'compositionend') compositionListenerRemoved = true;
      };

      handler.activate();
      handler.deactivate();

      expect(inputListenerRemoved).toBe(true);
      expect(compositionListenerRemoved).toBe(true);
      expect(handler.isActive).toBe(false);
    });

    it('should handle activate without input element', () => {
      const h = new DirectInputHandler();
      // 不應該拋出錯誤
      h.activate();
      expect(h.isActive).toBe(true);
    });
  });

  describe('dispose', () => {
    it('should cleanup and clear input value', () => {
      mockInputElement.value = 'test';
      handler.activate();
      handler.dispose();

      expect(mockInputElement.value).toBe('');
      expect(handler.isActive).toBe(false);
    });
  });

  describe('focus', () => {
    it('should call focus on input element', () => {
      let focusCalled = false;
      mockInputElement.focus = () => { focusCalled = true; };

      handler.focus();
      expect(focusCalled).toBe(true);
    });

    it('should handle focus without input element', () => {
      const h = new DirectInputHandler();
      // 不應該拋出錯誤
      h.focus();
    });
  });
});

describe('InputHandlerFactory', () => {
  let factory;
  let mockKeyboardRenderer;
  let mockInputElement;

  beforeEach(() => {
    mockKeyboardRenderer = createMockKeyboardRenderer();
    mockInputElement = createMockInputElement();
    factory = new InputHandlerFactory({
      keyboardRenderer: mockKeyboardRenderer,
      mobileInputElement: mockInputElement,
    });
  });

  describe('constructor', () => {
    it('should create without options', () => {
      const f = new InputHandlerFactory();
      expect(f).toBeInstanceOf(InputHandlerFactory);
    });

    it('should create with options', () => {
      expect(factory).toBeInstanceOf(InputHandlerFactory);
    });
  });

  describe('create', () => {
    it('should create RomajiInputHandler for romaji mode', () => {
      const handler = factory.create('romaji');
      expect(handler).toBeInstanceOf(RomajiInputHandler);
    });

    it('should create DirectInputHandler for direct mode', () => {
      const handler = factory.create('direct');
      expect(handler).toBeInstanceOf(DirectInputHandler);
    });

    it('should throw for unknown mode', () => {
      expect(() => factory.create('unknown')).toThrow('Unknown input mode: unknown');
    });
  });

  describe('setKeyboardRenderer', () => {
    it('should update keyboard renderer for new handlers', () => {
      const newRenderer = createMockKeyboardRenderer();
      factory.setKeyboardRenderer(newRenderer);

      const handler = factory.create('romaji');
      let called = false;
      newRenderer.highlightKey = () => { called = true; };

      const mockSession = createMockSession();
      handler.setSession(mockSession);
      handler.updateHighlight();

      expect(called).toBe(true);
    });
  });

  describe('setMobileInputElement', () => {
    it('should update mobile input element for new handlers', () => {
      const newElement = createMockInputElement();
      factory.setMobileInputElement(newElement);

      const handler = factory.create('direct');
      expect(handler.getInputElement()).toBe(newElement);
    });
  });

  describe('getSupportedModes', () => {
    it('should return supported modes', () => {
      const modes = InputHandlerFactory.getSupportedModes();
      expect(modes).toContain('romaji');
      expect(modes).toContain('direct');
    });
  });
});

describe('InputHandler integration', () => {
  it('should work with real-like session', () => {
    let keyPresses = [];
    const mockSession = {
      handleKeyPress: (key) => { keyPresses.push(key); },
      handleDirectInput: () => ({ matchedCount: 0, consumedLength: 0 }),
      getHintRomaji: () => 'ka',
    };

    const handler = new RomajiInputHandler();
    handler.setSession(mockSession);

    // 模擬 triggerUpdate
    let updateCount = 0;
    handler.setUpdateCallback(() => { updateCount++; });

    // 直接呼叫私有方法的替代：驗證 updateHighlight
    handler.updateHighlight();
    // 無法直接測試 keydown，但可以驗證設定正確
    expect(handler.session).toBe(mockSession);
  });
});
