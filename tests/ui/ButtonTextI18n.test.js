import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { i18n } from '../../src/i18n/index.js';

/**
 * 按鈕文字與 i18n 整合測試
 *
 * 測試目的：
 * 1. 確保按鈕文字根據當前狀態正確顯示「目標模式」
 * 2. 確保多語系翻譯正確應用
 * 3. 驗證修復的 bug：按鈕文字在初始化和切換後都正確
 */

// 模擬按鈕文字生成邏輯（與 main.js 中相同）
function getInputModeButtonText(currentInputMode) {
  return currentInputMode === 'romaji'
    ? i18n.t('mobileMode')
    : i18n.t('keyboardMode');
}

function getHintButtonText(showRomajiHint) {
  return showRomajiHint
    ? i18n.t('hideHint')
    : i18n.t('showHint');
}

function getPracticeModeButtonText(currentPracticeMode) {
  return currentPracticeMode === 'question'
    ? i18n.t('kanaMode')
    : i18n.t('questionMode');
}

describe('按鈕文字與 i18n 整合', () => {
  describe('繁體中文 (zh-TW)', () => {
    beforeEach(() => {
      i18n.setLanguage('zh-TW');
    });

    describe('輸入模式按鈕', () => {
      it('romaji 模式時顯示「手機模式」', () => {
        expect(getInputModeButtonText('romaji')).toBe('手機模式');
      });

      it('direct 模式時顯示「鍵盤模式」', () => {
        expect(getInputModeButtonText('direct')).toBe('鍵盤模式');
      });

      it('切換 romaji → direct 後按鈕文字正確更新', () => {
        // 初始 romaji
        expect(getInputModeButtonText('romaji')).toBe('手機模式');

        // 切換後 direct
        const newMode = 'direct';
        expect(getInputModeButtonText(newMode)).toBe('鍵盤模式');
      });

      it('切換 direct → romaji 後按鈕文字正確更新', () => {
        // 初始 direct
        expect(getInputModeButtonText('direct')).toBe('鍵盤模式');

        // 切換後 romaji
        const newMode = 'romaji';
        expect(getInputModeButtonText(newMode)).toBe('手機模式');
      });
    });

    describe('提示按鈕', () => {
      it('showHint=true 時顯示「隱藏提示」', () => {
        expect(getHintButtonText(true)).toBe('隱藏提示');
      });

      it('showHint=false 時顯示「顯示提示」', () => {
        expect(getHintButtonText(false)).toBe('顯示提示');
      });
    });

    describe('練習模式按鈕', () => {
      it('question 模式時顯示「假名模式」', () => {
        expect(getPracticeModeButtonText('question')).toBe('假名模式');
      });

      it('kana 模式時顯示「題庫模式」', () => {
        expect(getPracticeModeButtonText('kana')).toBe('題庫模式');
      });
    });
  });

  describe('英文 (en)', () => {
    beforeEach(() => {
      i18n.setLanguage('en');
    });

    describe('輸入模式按鈕', () => {
      it('romaji 模式時顯示「Mobile Mode」', () => {
        expect(getInputModeButtonText('romaji')).toBe('Mobile Mode');
      });

      it('direct 模式時顯示「Keyboard Mode」', () => {
        expect(getInputModeButtonText('direct')).toBe('Keyboard Mode');
      });
    });

    describe('提示按鈕', () => {
      it('showHint=true 時顯示「Hide Hint」', () => {
        expect(getHintButtonText(true)).toBe('Hide Hint');
      });

      it('showHint=false 時顯示「Show Hint」', () => {
        expect(getHintButtonText(false)).toBe('Show Hint');
      });
    });

    describe('練習模式按鈕', () => {
      it('question 模式時顯示「Kana Mode」', () => {
        expect(getPracticeModeButtonText('question')).toBe('Kana Mode');
      });

      it('kana 模式時顯示「Question Mode」', () => {
        expect(getPracticeModeButtonText('kana')).toBe('Question Mode');
      });
    });
  });

  describe('日文 (ja)', () => {
    beforeEach(() => {
      i18n.setLanguage('ja');
    });

    describe('輸入模式按鈕', () => {
      it('romaji 模式時顯示「スマホモード」', () => {
        expect(getInputModeButtonText('romaji')).toBe('スマホモード');
      });

      it('direct 模式時顯示「キーボードモード」', () => {
        expect(getInputModeButtonText('direct')).toBe('キーボードモード');
      });
    });

    describe('提示按鈕', () => {
      it('showHint=true 時顯示「ヒントを隠す」', () => {
        expect(getHintButtonText(true)).toBe('ヒントを隠す');
      });

      it('showHint=false 時顯示「ヒントを表示」', () => {
        expect(getHintButtonText(false)).toBe('ヒントを表示');
      });
    });

    describe('練習模式按鈕', () => {
      it('question 模式時顯示「かなモード」', () => {
        expect(getPracticeModeButtonText('question')).toBe('かなモード');
      });

      it('kana 模式時顯示「問題モード」', () => {
        expect(getPracticeModeButtonText('kana')).toBe('問題モード');
      });
    });
  });
});

describe('Bug 修復驗證：初始化順序', () => {
  /**
   * Bug 描述：
   * 當 URL 帶有 ?input=direct 或從 localStorage 恢復 direct 模式時，
   * 按鈕仍顯示「手機模式」而非「鍵盤模式」
   *
   * 根因：
   * createControlPanel() 在 app.initialize() 之前呼叫，
   * 導致讀取到的 inputMode 是預設值 'romaji' 而非恢復後的值
   *
   * 修復：
   * 將 createControlPanel() 移到 app.initialize() 之後執行
   */

  beforeEach(() => {
    i18n.setLanguage('zh-TW');
  });

  describe('模擬初始化流程', () => {
    it('預設狀態：romaji 模式，按鈕顯示「手機模式」', () => {
      // 模擬 App 初始化後的狀態
      const state = { inputMode: 'romaji' };

      // 建立控制面板時讀取狀態
      const buttonText = getInputModeButtonText(state.inputMode);
      expect(buttonText).toBe('手機模式');
    });

    it('從 URL 恢復 direct 模式：按鈕應顯示「鍵盤模式」', () => {
      // 模擬 App.initialize() 處理 URL 參數後的狀態
      const state = { inputMode: 'direct' }; // 從 ?input=direct 恢復

      // 建立控制面板時讀取狀態（修復後在 initialize 之後）
      const buttonText = getInputModeButtonText(state.inputMode);
      expect(buttonText).toBe('鍵盤模式');
    });

    it('從 localStorage 恢復 direct 模式：按鈕應顯示「鍵盤模式」', () => {
      // 模擬 App.initialize() 從 localStorage 恢復後的狀態
      const state = { inputMode: 'direct' }; // 從 localStorage 恢復

      // 建立控制面板時讀取狀態（修復後在 initialize 之後）
      const buttonText = getInputModeButtonText(state.inputMode);
      expect(buttonText).toBe('鍵盤模式');
    });
  });

  describe('Bug 場景重現（修復前的錯誤行為）', () => {
    it('錯誤：initialize 之前建立面板，狀態還是預設值', () => {
      // 模擬修復前的錯誤邏輯
      const defaultState = { inputMode: 'romaji' }; // 預設值
      const buttonTextBeforeInit = getInputModeButtonText(defaultState.inputMode);

      // 這是 bug！URL 帶 ?input=direct 時應該顯示「鍵盤模式」
      expect(buttonTextBeforeInit).toBe('手機模式'); // 錯誤的結果
    });

    it('正確：initialize 之後建立面板，狀態已更新', () => {
      // 模擬修復後的正確邏輯
      // 1. App 建立
      // 2. app.initialize() 處理 URL/localStorage
      const stateAfterInit = { inputMode: 'direct' }; // URL ?input=direct
      // 3. createControlPanel() 讀取已更新的狀態
      const buttonTextAfterInit = getInputModeButtonText(stateAfterInit.inputMode);

      expect(buttonTextAfterInit).toBe('鍵盤模式'); // 正確的結果
    });
  });
});

describe('切換後按鈕文字同步', () => {
  beforeEach(() => {
    i18n.setLanguage('zh-TW');
  });

  it('連續切換輸入模式，按鈕文字始終正確', () => {
    let currentMode = 'romaji';

    for (let i = 0; i < 5; i++) {
      // 切換到 direct
      currentMode = 'direct';
      expect(getInputModeButtonText(currentMode)).toBe('鍵盤模式');

      // 切換回 romaji
      currentMode = 'romaji';
      expect(getInputModeButtonText(currentMode)).toBe('手機模式');
    }
  });

  it('連續切換提示，按鈕文字始終正確', () => {
    let showHint = true;

    for (let i = 0; i < 5; i++) {
      // 隱藏提示
      showHint = false;
      expect(getHintButtonText(showHint)).toBe('顯示提示');

      // 顯示提示
      showHint = true;
      expect(getHintButtonText(showHint)).toBe('隱藏提示');
    }
  });

  it('連續切換練習模式，按鈕文字始終正確', () => {
    let practiceMode = 'question';

    for (let i = 0; i < 5; i++) {
      // 切換到 kana
      practiceMode = 'kana';
      expect(getPracticeModeButtonText(practiceMode)).toBe('題庫模式');

      // 切換回 question
      practiceMode = 'question';
      expect(getPracticeModeButtonText(practiceMode)).toBe('假名模式');
    }
  });
});

describe('語言切換後按鈕文字', () => {
  it('切換語言後所有按鈕文字都更新', () => {
    // 初始中文
    i18n.setLanguage('zh-TW');
    expect(getInputModeButtonText('romaji')).toBe('手機模式');
    expect(getHintButtonText(true)).toBe('隱藏提示');
    expect(getPracticeModeButtonText('question')).toBe('假名模式');

    // 切換到英文
    i18n.setLanguage('en');
    expect(getInputModeButtonText('romaji')).toBe('Mobile Mode');
    expect(getHintButtonText(true)).toBe('Hide Hint');
    expect(getPracticeModeButtonText('question')).toBe('Kana Mode');

    // 切換到日文
    i18n.setLanguage('ja');
    expect(getInputModeButtonText('romaji')).toBe('スマホモード');
    expect(getHintButtonText(true)).toBe('ヒントを隠す');
    expect(getPracticeModeButtonText('question')).toBe('かなモード');
  });

  it('切換語言不影響模式狀態邏輯', () => {
    const testCases = ['zh-TW', 'en', 'ja'];

    testCases.forEach(lang => {
      i18n.setLanguage(lang);

      // romaji 模式的按鈕應該顯示「切換到手機模式」的文字
      const romajiText = getInputModeButtonText('romaji');
      const directText = getInputModeButtonText('direct');

      // 兩個文字應該不同
      expect(romajiText).not.toBe(directText);

      // 且都不應該是空的
      expect(romajiText.length).toBeGreaterThan(0);
      expect(directText.length).toBeGreaterThan(0);
    });
  });
});
