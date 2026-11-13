/**
 * GridSession - 表格式練習 Session
 *
 * 與 TypingSession 相同的介面（on / handleKeyPress / handleDirectInput /
 * getHintRomaji / getProgress），因此可直接搭配既有的 InputHandler 使用。
 *
 * 兩種比對方式：
 * - ordered: false（五十音表）：任何尚未完成的格子都可輸入，照順序輸入時
 *   「游標」會自動往下一格移動，亂序輸入也會讓對應格子變色。
 *   僅支援單一假名的格子。
 * - ordered: true（五十音進階）：只接受游標所在的格子，每格可以是單字，
 *   內部使用 TypingSession 處理拗音、促音、長音等規則。
 */

import { TypingSession } from './TypingSession.js';
import { Question } from './Question.js';
import { Character } from './Character.js';
import { getRomajiOptions } from './RomajiMap.js';
import { SessionEventTypes } from './EventTypes.js';

/**
 * @typedef {Object} GridCellSpec
 * @property {'label'|'target'|'empty'} kind
 * @property {string} [text] - 顯示文字（target 為要輸入的假名）
 * @property {string} [reading] - 讀音提示（羅馬拼音）
 * @property {string} [meaning] - 翻譯
 * @property {string} [kana] - 該格對應的假名（顯示用）
 */

/**
 * @typedef {Object} GridBoard
 * @property {string} kind - 表格種類（供渲染器使用）
 * @property {string[]} columns - 欄位標題
 * @property {Array<{ label?: string, cells: GridCellSpec[] }>} rows
 */

export const GridTargetState = {
  PENDING: 'pending',
  CURRENT: 'current',
  COMPLETED: 'completed',
};

export class GridSession {
  #board;
  #ordered;
  #targets = [];
  #targetById = new Map();
  #cursor = 0;
  #buffer = '';
  #inner = null;
  #innerUnsubscribers = [];
  #handlers = new Map();
  #startTime;
  #totalKeystrokes = 0;
  #mistakes = 0;
  #finished = false;

  /**
   * @param {GridBoard} board
   * @param {Object} [options]
   * @param {boolean} [options.ordered=false] - 是否只接受依序輸入
   */
  constructor(board, options = {}) {
    this.#board = board;
    this.#ordered = Boolean(options.ordered);
    this.#startTime = new Date();

    board.rows.forEach((row, r) => {
      row.cells.forEach((cell, c) => {
        if (cell?.kind !== 'target') return;
        const target = {
          id: `${r}-${c}`,
          row: r,
          col: c,
          text: cell.text,
          options: this.#ordered ? [] : getRomajiOptions(cell.text),
          completed: false,
        };
        this.#targets.push(target);
        this.#targetById.set(target.id, target);
      });
    });

    if (this.#ordered) {
      this.#startInner();
    }
  }

  /** 識別用（App 依此切換表格渲染） */
  get isGrid() {
    return true;
  }

  get board() {
    return this.#board;
  }

  get ordered() {
    return this.#ordered;
  }

  get startTime() {
    return this.#startTime;
  }

  /** 目前的羅馬字緩衝 */
  get bufferValue() {
    return this.#ordered ? (this.#inner?.inputBuffer.value ?? '') : this.#buffer;
  }

  /** 游標所在格子 ID */
  get currentTargetId() {
    if (this.#finished) return null;
    return this.#targets[this.#cursor]?.id ?? null;
  }

  get totalTargets() {
    return this.#targets.length;
  }

  get completedCount() {
    return this.#targets.filter((t) => t.completed).length;
  }

  /**
   * 取得格子狀態
   * @param {string} id
   * @returns {string}
   */
  getTargetState(id) {
    const target = this.#targetById.get(id);
    if (!target) return GridTargetState.PENDING;
    if (target.completed) return GridTargetState.COMPLETED;
    if (id === this.currentTargetId) return GridTargetState.CURRENT;
    return GridTargetState.PENDING;
  }

  /**
   * 取得游標格子正在輸入中的題目（ordered 模式用於顯示字元進度）
   * @param {string} id
   * @returns {import('./Question.js').Question|null}
   */
  getTargetQuestion(id) {
    if (!this.#ordered || id !== this.currentTargetId) return null;
    return this.#inner?.question ?? null;
  }

  /**
   * 註冊事件處理器
   * @param {string} eventType
   * @param {Function} handler
   * @returns {Function} 取消訂閱函數
   */
  on(eventType, handler) {
    if (!this.#handlers.has(eventType)) {
      this.#handlers.set(eventType, []);
    }
    this.#handlers.get(eventType).push(handler);
    return () => {
      const list = this.#handlers.get(eventType);
      const index = list ? list.indexOf(handler) : -1;
      if (index > -1) list.splice(index, 1);
    };
  }

  #emit(eventType, data) {
    const handlers = this.#handlers.get(eventType);
    if (handlers) {
      [...handlers].forEach((handler) => handler(data));
    }
  }

  /**
   * 處理按鍵輸入
   * @param {string} key
   */
  handleKeyPress(key) {
    if (this.#finished) return;

    this.#totalKeystrokes++;
    this.#emit(SessionEventTypes.KEY_PRESSED, { key, timestamp: Date.now() });

    if (this.#ordered) {
      this.#inner?.handleKeyPress(key);
    } else {
      this.#consumeKey(key);
    }
  }

  /**
   * 處理直接輸入（手機 IME）
   * @param {string} input
   * @returns {{ matchedCount: number, consumedLength: number }}
   */
  handleDirectInput(input) {
    if (!input || this.#finished) {
      return { matchedCount: 0, consumedLength: 0 };
    }

    if (this.#ordered) {
      let matchedCount = 0;
      let consumedLength = 0;
      // 單字完成後游標會換到下一格，繼續消耗剩餘輸入
      while (consumedLength < input.length && !this.#finished && this.#inner) {
        const result = this.#inner.handleDirectInput(input.substring(consumedLength));
        if (result.matchedCount === 0) break;
        matchedCount += result.matchedCount;
        consumedLength += result.consumedLength;
      }
      return { matchedCount, consumedLength };
    }

    let matchedCount = 0;
    let consumedLength = 0;
    while (consumedLength < input.length && !this.#finished) {
      const remaining = input.substring(consumedLength);
      const candidates = this.#pendingTargets().filter((t) => remaining.startsWith(t.text));
      if (candidates.length === 0) break;
      const target = this.#preferCursor(candidates);
      this.#totalKeystrokes++;
      consumedLength += target.text.length;
      matchedCount++;
      this.#completeTarget(target, target.text);
    }
    return { matchedCount, consumedLength };
  }

  /**
   * 將游標移到指定格子（點擊格子）
   * @param {string} id
   * @returns {boolean} 是否成功移動
   */
  selectCell(id) {
    if (this.#finished) return false;
    const index = this.#targets.findIndex((t) => t.id === id);
    if (index === -1 || this.#targets[index].completed) return false;

    this.#cursor = index;
    this.#buffer = '';
    if (this.#ordered) {
      this.#startInner();
    }
    this.#emit(SessionEventTypes.ROMAJI_MATCHED, { romaji: '', isPartial: true });
    return true;
  }

  /**
   * 取得下一步提示羅馬字（扣除已輸入的部分）
   * @returns {string}
   */
  getHintRomaji() {
    if (this.#finished) return '';

    if (this.#ordered) {
      const char = this.#inner?.getCurrentCharacter();
      if (!char) return '';
      const typed = this.#inner.inputBuffer.value;
      const option = char.romaji.find((o) => o.startsWith(typed)) ?? char.romaji[0] ?? '';
      return option.slice(typed.length);
    }

    const pending = this.#pendingTargets();
    const candidates = pending.filter((t) => t.options.some((o) => o.startsWith(this.#buffer)));
    if (candidates.length === 0) return '';
    const target = this.#preferCursor(candidates);
    const option = target.options.find((o) => o.startsWith(this.#buffer)) ?? '';
    return option.slice(this.#buffer.length);
  }

  /**
   * 取得進度（0~1）
   * @returns {number}
   */
  getProgress() {
    if (this.#targets.length === 0) return 1;
    return this.completedCount / this.#targets.length;
  }

  // ---------- 亂序模式（五十音表） ----------

  #consumeKey(key) {
    const next = this.#buffer + key;
    const candidates = this.#candidatesFor(next);

    if (candidates.length === 0) {
      // 例如「n」之後輸入「k」：先以「n」完成「ん」，再處理「k」
      const exact = this.#exactFor(this.#buffer);
      if (this.#buffer && exact.length > 0) {
        this.#completeTarget(this.#preferCursor(exact), this.#buffer);
        if (!this.#finished) this.#consumeKey(key);
        return;
      }

      this.#mistakes++;
      const hintTarget = this.#targets[this.#cursor];
      this.#emit(SessionEventTypes.CHARACTER_MISTAKEN, {
        expected: hintTarget?.options ?? [],
        actual: key,
      });

      // 錯字後若單獨這個鍵可以開始某個假名，保留它
      this.#buffer = this.#buffer && this.#candidatesFor(key).length > 0 ? key : '';
      if (this.#buffer) {
        this.#emit(SessionEventTypes.ROMAJI_MATCHED, { romaji: this.#buffer, isPartial: true });
      }
      return;
    }

    const exact = candidates.filter((t) => t.options.includes(next));
    const hasLonger = candidates.some((t) =>
      t.options.some((o) => o.length > next.length && o.startsWith(next))
    );

    if (exact.length > 0 && !hasLonger) {
      this.#completeTarget(this.#preferCursor(exact), next);
      return;
    }

    this.#buffer = next;
    this.#emit(SessionEventTypes.ROMAJI_MATCHED, { romaji: next, isPartial: true });
  }

  #candidatesFor(input) {
    return this.#pendingTargets().filter((t) => t.options.some((o) => o.startsWith(input)));
  }

  #exactFor(input) {
    if (!input) return [];
    return this.#pendingTargets().filter((t) => t.options.includes(input));
  }

  #pendingTargets() {
    return this.#targets.filter((t) => !t.completed);
  }

  #preferCursor(targets) {
    const cursorTarget = this.#targets[this.#cursor];
    return targets.includes(cursorTarget) ? cursorTarget : targets[0];
  }

  #completeTarget(target, romaji) {
    this.#buffer = '';
    target.completed = true;

    this.#emit(SessionEventTypes.ROMAJI_MATCHED, { romaji, isPartial: false });

    if (this.#targets[this.#cursor] === target) {
      this.#advanceCursor();
    }

    this.#emit(SessionEventTypes.CHARACTER_COMPLETED, {
      character: new Character(target.text).setCompleted(),
      duration: Date.now() - this.#startTime.getTime(),
      targetId: target.id,
    });
    this.#emit(SessionEventTypes.SPEECH_REQUESTED, { text: target.text });

    this.#checkFinished();
  }

  // ---------- 依序模式（五十音進階） ----------

  #startInner() {
    this.#innerUnsubscribers.forEach((off) => off());
    this.#innerUnsubscribers = [];

    const target = this.#targets[this.#cursor];
    if (!target || target.completed) {
      this.#inner = null;
      return;
    }

    const inner = new TypingSession(Question.fromText(target.text));
    this.#inner = inner;

    const forward = (type, transform = (e) => e) => {
      this.#innerUnsubscribers.push(inner.on(type, (e) => this.#emit(type, transform(e))));
    };

    forward(SessionEventTypes.ROMAJI_MATCHED);
    forward(SessionEventTypes.CHARACTER_COMPLETED, (e) => ({ ...e, targetId: target.id }));
    this.#innerUnsubscribers.push(
      inner.on(SessionEventTypes.CHARACTER_MISTAKEN, (e) => {
        this.#mistakes++;
        this.#emit(SessionEventTypes.CHARACTER_MISTAKEN, e);
      })
    );
    // 單字中的每個假名不朗讀，整個單字完成後再朗讀
    this.#innerUnsubscribers.push(
      inner.on(SessionEventTypes.SESSION_COMPLETED, () => {
        target.completed = true;
        this.#emit(SessionEventTypes.SPEECH_REQUESTED, { text: target.text });
        this.#advanceCursor();
        if (!this.#checkFinished()) {
          this.#startInner();
        } else {
          this.#inner = null;
        }
      })
    );
  }

  // ---------- 共用 ----------

  /** 游標移到下一個未完成的格子（循環） */
  #advanceCursor() {
    const total = this.#targets.length;
    for (let step = 1; step <= total; step++) {
      const index = (this.#cursor + step) % total;
      if (!this.#targets[index].completed) {
        this.#cursor = index;
        return;
      }
    }
  }

  /** @returns {boolean} 是否已全部完成 */
  #checkFinished() {
    if (this.#targets.some((t) => !t.completed)) return false;
    this.#finished = true;

    const totalTime = Date.now() - this.#startTime.getTime();
    const correct = this.#totalKeystrokes - this.#mistakes;
    this.#emit(SessionEventTypes.SESSION_COMPLETED, {
      totalTime,
      accuracy: this.#totalKeystrokes > 0 ? Math.max(0, correct) / this.#totalKeystrokes : 1,
      totalKeystrokes: this.#totalKeystrokes,
      mistakes: this.#mistakes,
    });
    return true;
  }
}
