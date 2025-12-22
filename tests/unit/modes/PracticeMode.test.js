import { describe, it, expect, beforeEach } from 'bun:test';
import { PracticeMode } from '../../../src/modes/PracticeMode.js';
import { QuestionMode } from '../../../src/modes/QuestionMode.js';
import { KanaMode } from '../../../src/modes/KanaMode.js';
import { ModeRegistryClass } from '../../../src/modes/ModeRegistry.js';
import { Store } from '../../../src/store/Store.js';
import { appReducer } from '../../../src/store/reducer.js';
import { initialState } from '../../../src/store/AppState.js';

// Mock QuestionLoader
function createMockQuestionLoader(questions = []) {
  return {
    isLoaded: () => questions.length > 0,
    load: async () => {},
    getRandomQuestion: (filters) => {
      if (questions.length === 0) return null;
      return questions[Math.floor(Math.random() * questions.length)];
    },
  };
}

// Mock SpeechService
function createMockSpeechService() {
  return {
    speak: () => {},
  };
}

describe('PracticeMode (abstract)', () => {
  it('should throw when instantiated directly', () => {
    const store = new Store(appReducer, initialState);
    expect(() => new PracticeMode({ store })).toThrow(
      'PracticeMode is abstract and cannot be instantiated directly'
    );
  });

  it('should throw when static getters not implemented', () => {
    expect(() => PracticeMode.id).toThrow('Must implement static id getter');
    expect(() => PracticeMode.displayName).toThrow('Must implement static displayName getter');
  });

  it('should have default description', () => {
    expect(PracticeMode.description).toBe('');
  });

  it('should have default requiresQuestionLoader as false', () => {
    expect(PracticeMode.requiresQuestionLoader).toBe(false);
  });

  it('should have default supportedInputModes', () => {
    expect(PracticeMode.supportedInputModes).toEqual(['romaji', 'direct']);
  });
});

describe('QuestionMode', () => {
  let store;
  let questionLoader;
  let speechService;
  let mode;

  const mockQuestions = [
    {
      id: 1,
      text: 'テスト',
      characters: [
        { kana: 'テ', display: 'テ' },
        { kana: 'ス', display: 'ス' },
        { kana: 'ト', display: 'ト' },
      ],
    },
  ];

  beforeEach(() => {
    store = new Store(appReducer, initialState);
    questionLoader = createMockQuestionLoader(mockQuestions);
    speechService = createMockSpeechService();
    mode = new QuestionMode({ store, questionLoader, speechService });
  });

  describe('static properties', () => {
    it('should have correct id', () => {
      expect(QuestionMode.id).toBe('question');
    });

    it('should have correct displayName', () => {
      expect(QuestionMode.displayName).toBe('題庫模式');
    });

    it('should require question loader', () => {
      expect(QuestionMode.requiresQuestionLoader).toBe(true);
    });
  });

  describe('initialize', () => {
    it('should throw if questionLoader is not provided', async () => {
      const modeWithoutLoader = new QuestionMode({ store, speechService });
      await expect(modeWithoutLoader.initialize()).rejects.toThrow(
        'QuestionMode requires a QuestionLoader'
      );
    });

    it('should load questions if not already loaded', async () => {
      const emptyLoader = createMockQuestionLoader([]);
      let loadCalled = false;
      emptyLoader.load = async () => {
        loadCalled = true;
      };

      const modeWithEmptyLoader = new QuestionMode({
        store,
        questionLoader: emptyLoader,
        speechService,
      });

      await modeWithEmptyLoader.initialize();
      expect(loadCalled).toBe(true);
    });

    it('should not reload if already loaded', async () => {
      let loadCalled = false;
      questionLoader.load = async () => {
        loadCalled = true;
      };

      await mode.initialize();
      expect(loadCalled).toBe(false);
    });
  });

  describe('loadNextQuestion', () => {
    it('should return a Question object', async () => {
      await mode.initialize();
      const question = await mode.loadNextQuestion();

      expect(question).toBeDefined();
      expect(question.text).toBe('テスト');
    });

    it('should update store with question data', async () => {
      await mode.initialize();
      await mode.loadNextQuestion();

      const state = store.getState();
      expect(state.status).toBe('practicing');
      expect(state.currentQuestion).toBeDefined();
    });

    it('should throw if no questions match filters', async () => {
      const emptyLoader = createMockQuestionLoader([]);
      emptyLoader.isLoaded = () => true;

      const modeWithEmptyQuestions = new QuestionMode({
        store,
        questionLoader: emptyLoader,
        speechService,
      });

      await expect(modeWithEmptyQuestions.loadNextQuestion()).rejects.toThrow(
        '找不到符合條件的題目'
      );
    });
  });

  describe('getUIConfig', () => {
    it('should show filters and source link', () => {
      const config = mode.getUIConfig();
      expect(config.showFilters).toBe(true);
      expect(config.showSourceLink).toBe(true);
    });
  });
});

describe('KanaMode', () => {
  let store;
  let speechService;
  let mode;

  beforeEach(() => {
    store = new Store(appReducer, initialState);
    speechService = createMockSpeechService();
    mode = new KanaMode({ store, speechService });
  });

  describe('static properties', () => {
    it('should have correct id', () => {
      expect(KanaMode.id).toBe('kana');
    });

    it('should have correct displayName', () => {
      expect(KanaMode.displayName).toBe('假名模式');
    });

    it('should not require question loader', () => {
      expect(KanaMode.requiresQuestionLoader).toBe(false);
    });
  });

  describe('initialize', () => {
    it('should complete without error', async () => {
      await expect(mode.initialize()).resolves.toBeUndefined();
    });
  });

  describe('loadNextQuestion', () => {
    it('should return a Question object', async () => {
      const question = await mode.loadNextQuestion();
      expect(question).toBeDefined();
      expect(typeof question.text).toBe('string');
    });

    it('should return text from practice texts', async () => {
      const practiceTexts = KanaMode.getPracticeTexts();
      const question = await mode.loadNextQuestion();
      expect(practiceTexts).toContain(question.text);
    });

    it('should update store with question data', async () => {
      await mode.loadNextQuestion();
      const state = store.getState();
      expect(state.status).toBe('practicing');
      expect(state.currentQuestion.text).toBeDefined();
    });
  });

  describe('getUIConfig', () => {
    it('should hide filters and source link', () => {
      const config = mode.getUIConfig();
      expect(config.showFilters).toBe(false);
      expect(config.showSourceLink).toBe(false);
    });
  });

  describe('getPracticeTexts', () => {
    it('should return array of practice texts', () => {
      const texts = KanaMode.getPracticeTexts();
      expect(Array.isArray(texts)).toBe(true);
      expect(texts.length).toBeGreaterThan(0);
      expect(texts).toContain('あいうえお');
      expect(texts).toContain('こんにちは');
    });
  });
});

describe('ModeRegistry', () => {
  let registry;
  let store;
  let questionLoader;
  let speechService;

  beforeEach(() => {
    registry = new ModeRegistryClass();
    store = new Store(appReducer, initialState);
    questionLoader = createMockQuestionLoader([
      { id: 1, text: 'テスト', characters: [] },
    ]);
    speechService = createMockSpeechService();
  });

  describe('register/unregister', () => {
    it('should register built-in modes', () => {
      expect(registry.hasMode('question')).toBe(true);
      expect(registry.hasMode('kana')).toBe(true);
    });

    it('should register custom mode', () => {
      class CustomMode extends PracticeMode {
        static get id() { return 'custom'; }
        static get displayName() { return 'Custom'; }
        async initialize() {}
        async loadNextQuestion() {}
      }

      registry.register(CustomMode);
      expect(registry.hasMode('custom')).toBe(true);
    });

    it('should throw when registering mode without id', () => {
      class InvalidMode {}
      expect(() => registry.register(InvalidMode)).toThrow(
        'Mode class must have a static id property'
      );
    });

    it('should unregister mode', () => {
      registry.unregister('kana');
      expect(registry.hasMode('kana')).toBe(false);
    });
  });

  describe('getAvailableModes', () => {
    it('should return list of available modes', () => {
      const modes = registry.getAvailableModes();
      expect(modes.length).toBeGreaterThanOrEqual(2);

      const questionMode = modes.find((m) => m.id === 'question');
      expect(questionMode).toBeDefined();
      expect(questionMode.displayName).toBe('題庫模式');

      const kanaMode = modes.find((m) => m.id === 'kana');
      expect(kanaMode).toBeDefined();
      expect(kanaMode.displayName).toBe('假名模式');
    });
  });

  describe('switchMode', () => {
    it('should throw if dependencies not set', async () => {
      await expect(registry.switchMode('kana')).rejects.toThrow(
        'Dependencies not set'
      );
    });

    it('should throw for unknown mode', async () => {
      registry.setDependencies({ store, questionLoader, speechService });
      await expect(registry.switchMode('unknown')).rejects.toThrow(
        'Unknown mode: unknown'
      );
    });

    it('should switch to kana mode', async () => {
      registry.setDependencies({ store, questionLoader, speechService });
      const mode = await registry.switchMode('kana');

      expect(mode).toBeInstanceOf(KanaMode);
      expect(registry.getCurrentMode()).toBe(mode);
      expect(registry.getCurrentModeId()).toBe('kana');
    });

    it('should switch to question mode', async () => {
      registry.setDependencies({ store, questionLoader, speechService });
      const mode = await registry.switchMode('question');

      expect(mode).toBeInstanceOf(QuestionMode);
      expect(registry.getCurrentModeId()).toBe('question');
    });

    it('should dispose previous mode when switching', async () => {
      registry.setDependencies({ store, questionLoader, speechService });

      const kanaMode = await registry.switchMode('kana');
      let disposed = false;
      kanaMode.dispose = () => { disposed = true; };

      await registry.switchMode('question');
      expect(disposed).toBe(true);
    });
  });

  describe('reset', () => {
    it('should reset current mode and dependencies', async () => {
      registry.setDependencies({ store, questionLoader, speechService });
      await registry.switchMode('kana');

      registry.reset();

      expect(registry.getCurrentMode()).toBe(null);
      expect(registry.getCurrentModeId()).toBe(null);
    });
  });
});
