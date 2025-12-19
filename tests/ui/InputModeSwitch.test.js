import { describe, it, expect, beforeEach } from 'bun:test';

/**
 * 輸入模式切換 UI 測試
 *
 * 測試不同輸入模式和提示顯示的正確 UI 狀態
 *
 * 狀態變數：
 * - currentInputMode: 'romaji' | 'direct'
 * - showRomajiHint: true | false
 *
 * UI 元件：
 * - keyboard: 虛擬鍵盤（romaji 模式顯示）
 * - mobile-input-section: 手機輸入區（direct 模式顯示）
 * - practice-romaji-wrapper: 羅馬拼音提示區（showRomajiHint 控制）
 *
 * CSS Classes：
 * - mode-direct: 直接輸入模式（加在 container 和 body）
 * - hide-romaji-hint: 隱藏羅馬拼音提示（加在 container）
 */

// ============================================================
// Mock DOM 工廠
// ============================================================

/**
 * 建立模擬的 DOM 結構
 * 模擬所有受模式影響的 UI 元件
 */
function createMockDOM() {
  return {
    container: {
      classList: createClassList(),
    },
    body: {
      classList: createClassList(),
    },
    mobileInputSection: {
      style: { display: 'none' },
    },
    keyboard: {
      style: { display: '' },
    },
    romajiWrapper: {
      style: { display: '' },
    },
  };
}

/**
 * 建立模擬的 classList
 */
function createClassList() {
  return {
    _classes: new Set(),
    add(className) { this._classes.add(className); },
    remove(className) { this._classes.delete(className); },
    contains(className) { return this._classes.has(className); },
    toggle(className) {
      if (this._classes.has(className)) {
        this._classes.delete(className);
        return false;
      } else {
        this._classes.add(className);
        return true;
      }
    },
  };
}

// ============================================================
// UI 狀態應用函數（模擬實際代碼的行為）
// ============================================================

/**
 * 應用輸入模式的 UI 狀態
 * 模擬 PracticeController 的 #setupKeyboardListener() 和 #setupDirectInputMode()
 */
function applyInputModeUI(dom, inputMode) {
  if (inputMode === 'direct') {
    // 設定 direct 模式
    dom.mobileInputSection.style.display = 'block';
    dom.keyboard.style.display = 'none';
    dom.container.classList.add('mode-direct');
    dom.body.classList.add('mode-direct');
  } else {
    // 設定 romaji 模式（修復後的邏輯）
    dom.mobileInputSection.style.display = 'none';
    dom.keyboard.style.display = '';
    dom.container.classList.remove('mode-direct');
    dom.body.classList.remove('mode-direct');
  }
}

/**
 * 應用羅馬拼音提示的 UI 狀態
 * 模擬 main.js 的 toggleRomajiHint()
 */
function applyHintUI(dom, showHint) {
  if (showHint) {
    dom.container.classList.remove('hide-romaji-hint');
  } else {
    dom.container.classList.add('hide-romaji-hint');
  }
}

/**
 * 驗證 UI 狀態是否符合預期
 */
function verifyUIState(dom, expected) {
  const errors = [];

  // 驗證輸入模式相關 UI
  if (expected.inputMode === 'direct') {
    if (dom.mobileInputSection.style.display !== 'block') {
      errors.push(`mobileInputSection.display: expected 'block', got '${dom.mobileInputSection.style.display}'`);
    }
    if (dom.keyboard.style.display !== 'none') {
      errors.push(`keyboard.display: expected 'none', got '${dom.keyboard.style.display}'`);
    }
    if (!dom.container.classList.contains('mode-direct')) {
      errors.push(`container: expected to have 'mode-direct' class`);
    }
    if (!dom.body.classList.contains('mode-direct')) {
      errors.push(`body: expected to have 'mode-direct' class`);
    }
  } else {
    if (dom.mobileInputSection.style.display !== 'none') {
      errors.push(`mobileInputSection.display: expected 'none', got '${dom.mobileInputSection.style.display}'`);
    }
    if (dom.keyboard.style.display === 'none') {
      errors.push(`keyboard.display: should not be 'none' in romaji mode`);
    }
    if (dom.container.classList.contains('mode-direct')) {
      errors.push(`container: should not have 'mode-direct' class`);
    }
    if (dom.body.classList.contains('mode-direct')) {
      errors.push(`body: should not have 'mode-direct' class`);
    }
  }

  // 驗證提示顯示相關 UI
  if (expected.showHint) {
    if (dom.container.classList.contains('hide-romaji-hint')) {
      errors.push(`container: should not have 'hide-romaji-hint' class`);
    }
  } else {
    if (!dom.container.classList.contains('hide-romaji-hint')) {
      errors.push(`container: expected to have 'hide-romaji-hint' class`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// ============================================================
// 測試案例
// ============================================================

describe('UI 狀態 - 單一模式', () => {
  describe('輸入模式', () => {
    it('romaji 模式：顯示鍵盤、隱藏輸入區', () => {
      const dom = createMockDOM();
      applyInputModeUI(dom, 'romaji');

      expect(dom.keyboard.style.display).not.toBe('none');
      expect(dom.mobileInputSection.style.display).toBe('none');
      expect(dom.container.classList.contains('mode-direct')).toBe(false);
      expect(dom.body.classList.contains('mode-direct')).toBe(false);
    });

    it('direct 模式：隱藏鍵盤、顯示輸入區', () => {
      const dom = createMockDOM();
      applyInputModeUI(dom, 'direct');

      expect(dom.keyboard.style.display).toBe('none');
      expect(dom.mobileInputSection.style.display).toBe('block');
      expect(dom.container.classList.contains('mode-direct')).toBe(true);
      expect(dom.body.classList.contains('mode-direct')).toBe(true);
    });
  });

  describe('提示顯示', () => {
    it('showHint=true：不添加 hide-romaji-hint class', () => {
      const dom = createMockDOM();
      applyHintUI(dom, true);

      expect(dom.container.classList.contains('hide-romaji-hint')).toBe(false);
    });

    it('showHint=false：添加 hide-romaji-hint class', () => {
      const dom = createMockDOM();
      applyHintUI(dom, false);

      expect(dom.container.classList.contains('hide-romaji-hint')).toBe(true);
    });
  });
});

describe('UI 狀態 - 模式組合（2x2 矩陣）', () => {
  it('romaji + showHint：鍵盤顯示、提示顯示', () => {
    const dom = createMockDOM();
    applyInputModeUI(dom, 'romaji');
    applyHintUI(dom, true);

    const result = verifyUIState(dom, { inputMode: 'romaji', showHint: true });
    expect(result.valid).toBe(true);
  });

  it('romaji + hideHint：鍵盤顯示、提示隱藏', () => {
    const dom = createMockDOM();
    applyInputModeUI(dom, 'romaji');
    applyHintUI(dom, false);

    const result = verifyUIState(dom, { inputMode: 'romaji', showHint: false });
    expect(result.valid).toBe(true);
  });

  it('direct + showHint：輸入區顯示、提示顯示', () => {
    const dom = createMockDOM();
    applyInputModeUI(dom, 'direct');
    applyHintUI(dom, true);

    const result = verifyUIState(dom, { inputMode: 'direct', showHint: true });
    expect(result.valid).toBe(true);
  });

  it('direct + hideHint：輸入區顯示、提示隱藏', () => {
    const dom = createMockDOM();
    applyInputModeUI(dom, 'direct');
    applyHintUI(dom, false);

    const result = verifyUIState(dom, { inputMode: 'direct', showHint: false });
    expect(result.valid).toBe(true);
  });
});

describe('UI 狀態 - 切換順序獨立性', () => {
  describe('先切換輸入模式，再切換提示', () => {
    it('romaji → direct → hideHint', () => {
      const dom = createMockDOM();

      // 初始 romaji
      applyInputModeUI(dom, 'romaji');
      applyHintUI(dom, true);

      // 切換到 direct
      applyInputModeUI(dom, 'direct');
      let result = verifyUIState(dom, { inputMode: 'direct', showHint: true });
      expect(result.valid).toBe(true);

      // 隱藏提示
      applyHintUI(dom, false);
      result = verifyUIState(dom, { inputMode: 'direct', showHint: false });
      expect(result.valid).toBe(true);
    });

    it('direct → romaji → showHint', () => {
      const dom = createMockDOM();

      // 初始 direct + hideHint
      applyInputModeUI(dom, 'direct');
      applyHintUI(dom, false);

      // 切換到 romaji
      applyInputModeUI(dom, 'romaji');
      let result = verifyUIState(dom, { inputMode: 'romaji', showHint: false });
      expect(result.valid).toBe(true);

      // 顯示提示
      applyHintUI(dom, true);
      result = verifyUIState(dom, { inputMode: 'romaji', showHint: true });
      expect(result.valid).toBe(true);
    });
  });

  describe('先切換提示，再切換輸入模式', () => {
    it('showHint → hideHint → direct', () => {
      const dom = createMockDOM();

      // 初始 romaji + showHint
      applyInputModeUI(dom, 'romaji');
      applyHintUI(dom, true);

      // 隱藏提示
      applyHintUI(dom, false);
      let result = verifyUIState(dom, { inputMode: 'romaji', showHint: false });
      expect(result.valid).toBe(true);

      // 切換到 direct
      applyInputModeUI(dom, 'direct');
      result = verifyUIState(dom, { inputMode: 'direct', showHint: false });
      expect(result.valid).toBe(true);
    });

    it('hideHint → showHint → romaji', () => {
      const dom = createMockDOM();

      // 初始 direct + hideHint
      applyInputModeUI(dom, 'direct');
      applyHintUI(dom, false);

      // 顯示提示
      applyHintUI(dom, true);
      let result = verifyUIState(dom, { inputMode: 'direct', showHint: true });
      expect(result.valid).toBe(true);

      // 切換到 romaji
      applyInputModeUI(dom, 'romaji');
      result = verifyUIState(dom, { inputMode: 'romaji', showHint: true });
      expect(result.valid).toBe(true);
    });
  });
});

describe('UI 狀態 - 多次切換一致性', () => {
  it('連續切換輸入模式多次', () => {
    const dom = createMockDOM();
    applyHintUI(dom, true);

    for (let i = 0; i < 5; i++) {
      // 切換到 direct
      applyInputModeUI(dom, 'direct');
      expect(verifyUIState(dom, { inputMode: 'direct', showHint: true }).valid).toBe(true);

      // 切換回 romaji
      applyInputModeUI(dom, 'romaji');
      expect(verifyUIState(dom, { inputMode: 'romaji', showHint: true }).valid).toBe(true);
    }
  });

  it('連續切換提示顯示多次', () => {
    const dom = createMockDOM();
    applyInputModeUI(dom, 'romaji');

    for (let i = 0; i < 5; i++) {
      // 隱藏提示
      applyHintUI(dom, false);
      expect(verifyUIState(dom, { inputMode: 'romaji', showHint: false }).valid).toBe(true);

      // 顯示提示
      applyHintUI(dom, true);
      expect(verifyUIState(dom, { inputMode: 'romaji', showHint: true }).valid).toBe(true);
    }
  });

  it('交錯切換兩種模式', () => {
    const dom = createMockDOM();

    // 初始狀態
    applyInputModeUI(dom, 'romaji');
    applyHintUI(dom, true);

    // 模擬用戶隨機操作
    const operations = [
      () => applyInputModeUI(dom, 'direct'),
      () => applyHintUI(dom, false),
      () => applyInputModeUI(dom, 'romaji'),
      () => applyHintUI(dom, true),
      () => applyHintUI(dom, false),
      () => applyInputModeUI(dom, 'direct'),
      () => applyHintUI(dom, true),
      () => applyInputModeUI(dom, 'romaji'),
    ];

    const expectedStates = [
      { inputMode: 'direct', showHint: true },
      { inputMode: 'direct', showHint: false },
      { inputMode: 'romaji', showHint: false },
      { inputMode: 'romaji', showHint: true },
      { inputMode: 'romaji', showHint: false },
      { inputMode: 'direct', showHint: false },
      { inputMode: 'direct', showHint: true },
      { inputMode: 'romaji', showHint: true },
    ];

    for (let i = 0; i < operations.length; i++) {
      operations[i]();
      const result = verifyUIState(dom, expectedStates[i]);
      expect(result.valid).toBe(true);
    }
  });
});

describe('UI 狀態 - 初始化場景', () => {
  it('預設初始狀態：romaji + showHint', () => {
    const dom = createMockDOM();
    applyInputModeUI(dom, 'romaji');
    applyHintUI(dom, true);

    const result = verifyUIState(dom, { inputMode: 'romaji', showHint: true });
    expect(result.valid).toBe(true);
  });

  it('從 localStorage 恢復 direct 模式', () => {
    const dom = createMockDOM();

    // 模擬從 localStorage 恢復的設定
    const savedInputMode = 'direct';
    const savedShowHint = true;

    applyInputModeUI(dom, savedInputMode);
    applyHintUI(dom, savedShowHint);

    const result = verifyUIState(dom, { inputMode: 'direct', showHint: true });
    expect(result.valid).toBe(true);
  });

  it('從 localStorage 恢復 hideHint 設定', () => {
    const dom = createMockDOM();

    // 模擬從 localStorage 恢復的設定
    const savedInputMode = 'romaji';
    const savedShowHint = false;

    applyInputModeUI(dom, savedInputMode);
    applyHintUI(dom, savedShowHint);

    const result = verifyUIState(dom, { inputMode: 'romaji', showHint: false });
    expect(result.valid).toBe(true);
  });

  it('從 URL 參數初始化 direct 模式', () => {
    const dom = createMockDOM();

    // 模擬 URL 參數 ?input=direct
    const inputParam = 'direct';
    applyInputModeUI(dom, inputParam);
    applyHintUI(dom, true);

    const result = verifyUIState(dom, { inputMode: 'direct', showHint: true });
    expect(result.valid).toBe(true);
  });
});

describe('UI 狀態 - 按鈕文字', () => {
  describe('輸入模式按鈕', () => {
    it('romaji 模式時顯示「手機模式」', () => {
      const currentInputMode = 'romaji';
      const buttonText = currentInputMode === 'romaji' ? '手機模式' : '鍵盤模式';
      expect(buttonText).toBe('手機模式');
    });

    it('direct 模式時顯示「鍵盤模式」', () => {
      const currentInputMode = 'direct';
      const buttonText = currentInputMode === 'romaji' ? '手機模式' : '鍵盤模式';
      expect(buttonText).toBe('鍵盤模式');
    });
  });

  describe('提示顯示按鈕', () => {
    it('showHint=true 時顯示「隱藏提示」', () => {
      const showRomajiHint = true;
      const buttonText = showRomajiHint ? '隱藏提示' : '顯示提示';
      expect(buttonText).toBe('隱藏提示');
    });

    it('showHint=false 時顯示「顯示提示」', () => {
      const showRomajiHint = false;
      const buttonText = showRomajiHint ? '隱藏提示' : '顯示提示';
      expect(buttonText).toBe('顯示提示');
    });
  });
});

describe('UI 狀態 - 狀態切換邏輯', () => {
  it('toggleInputMode: romaji → direct', () => {
    let currentInputMode = 'romaji';
    currentInputMode = currentInputMode === 'romaji' ? 'direct' : 'romaji';
    expect(currentInputMode).toBe('direct');
  });

  it('toggleInputMode: direct → romaji', () => {
    let currentInputMode = 'direct';
    currentInputMode = currentInputMode === 'romaji' ? 'direct' : 'romaji';
    expect(currentInputMode).toBe('romaji');
  });

  it('toggleRomajiHint: true → false', () => {
    let showRomajiHint = true;
    showRomajiHint = !showRomajiHint;
    expect(showRomajiHint).toBe(false);
  });

  it('toggleRomajiHint: false → true', () => {
    let showRomajiHint = false;
    showRomajiHint = !showRomajiHint;
    expect(showRomajiHint).toBe(true);
  });
});

describe('UI 狀態 - CSS 規則獨立性', () => {
  it('mode-direct 和 hide-romaji-hint 是獨立的 class', () => {
    const dom = createMockDOM();

    // 添加 mode-direct
    dom.container.classList.add('mode-direct');
    expect(dom.container.classList.contains('mode-direct')).toBe(true);
    expect(dom.container.classList.contains('hide-romaji-hint')).toBe(false);

    // 添加 hide-romaji-hint
    dom.container.classList.add('hide-romaji-hint');
    expect(dom.container.classList.contains('mode-direct')).toBe(true);
    expect(dom.container.classList.contains('hide-romaji-hint')).toBe(true);

    // 移除 mode-direct 不影響 hide-romaji-hint
    dom.container.classList.remove('mode-direct');
    expect(dom.container.classList.contains('mode-direct')).toBe(false);
    expect(dom.container.classList.contains('hide-romaji-hint')).toBe(true);

    // 移除 hide-romaji-hint
    dom.container.classList.remove('hide-romaji-hint');
    expect(dom.container.classList.contains('mode-direct')).toBe(false);
    expect(dom.container.classList.contains('hide-romaji-hint')).toBe(false);
  });
});
