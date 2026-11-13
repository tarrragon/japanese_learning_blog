/**
 * HandwritingSession - 五十音手寫練習 Session
 *
 * 以五十音表為題目，逐字手寫並比對筆順。
 * 三個練習等級共用同一套比對引擎：
 * - trace（描紅）：顯示整個字與下一筆，逐筆判定
 * - hint（提示）：只顯示下一筆的位置，逐筆判定
 * - blind（默寫）：只顯示羅馬字，整個字寫完後對齊外框再逐筆判定
 *
 * 提供與 GridSession 相同的表格介面（board / getTargetState / currentTargetId ...），
 * 因此可沿用 GridRenderer 顯示進度表。
 */

import { SessionEventTypes } from './EventTypes.js';
import { Character } from './Character.js';
import { getRomajiOptions } from './RomajiMap.js';
import { getKanaVariants } from './handwriting/kanaVariants.js';
import {
  compareStroke,
  diagnoseStroke,
  compareCharacter,
  STROKE_TOLERANCE,
} from './handwriting/StrokeMatcher.js';
import { pathLength } from './handwriting/strokeGeometry.js';
import { GridTargetState } from './GridSession.js';

export const HandwritingLevel = {
  TRACE: 'trace',
  HINT: 'hint',
  BLIND: 'blind',
};

export const StrokeResultStatus = {
  ACCEPTED: 'accepted',
  PENDING: 'pending',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
  IGNORED: 'ignored',
};

/** 太短的筆畫（誤觸）不列入判定 */
const MIN_STROKE_LENGTH = 1.5;

export class HandwritingSession {
  #board;
  #targets = [];
  #targetById = new Map();
  #cursor = 0;
  #level;
  #order;
  #random;
  #handlers = new Map();
  #startTime = new Date();
  #totalStrokes = 0;
  #mistakes = 0;
  #finished = false;

  // 目前這個字的書寫狀態
  #candidates = [];
  #acceptedPaths = [];
  #pendingStrokes = [];
  #lastCompleted = null;

  /**
   * @param {import('./GridSession.js').GridBoard} board
   * @param {Object} [options]
   * @param {'trace'|'hint'|'blind'} [options.level='trace']
   * @param {'sequential'|'random'} [options.order='sequential']
   * @param {() => number} [options.random=Math.random] - 亂數來源（測試用）
   */
  constructor(board, options = {}) {
    this.#board = board;
    this.#level = options.level ?? HandwritingLevel.TRACE;
    this.#order = options.order ?? 'sequential';
    this.#random = options.random ?? Math.random;

    board.rows.forEach((row, r) => {
      row.cells.forEach((cell, c) => {
        if (cell?.kind !== 'target') return;
        const target = { id: `${r}-${c}`, text: cell.text, completed: false };
        this.#targets.push(target);
        this.#targetById.set(target.id, target);
      });
    });

    if (this.#order === 'random') {
      this.#cursor = this.#pickRandomPending();
    }
    this.#resetCharacter();
  }

  // ---------- 識別與表格介面 ----------

  get isHandwriting() {
    return true;
  }

  /** 不使用鍵盤輸入 */
  get inputless() {
    return true;
  }

  get board() {
    return this.#board;
  }

  get ordered() {
    return this.#order === 'sequential';
  }

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

  getTargetState(id) {
    const target = this.#targetById.get(id);
    if (!target) return GridTargetState.PENDING;
    if (target.completed) return GridTargetState.COMPLETED;
    if (id === this.currentTargetId) return GridTargetState.CURRENT;
    return GridTargetState.PENDING;
  }

  getTargetQuestion() {
    return null;
  }

  getProgress() {
    return this.#targets.length === 0 ? 1 : this.completedCount / this.#targets.length;
  }

  // ---------- 目前字的狀態（供渲染） ----------

  get level() {
    return this.#level;
  }

  get order() {
    return this.#order;
  }

  get finished() {
    return this.#finished;
  }

  /** 目前要寫的假名 */
  get currentKana() {
    if (this.#finished) return null;
    return this.#targets[this.#cursor]?.text ?? null;
  }

  get currentRomaji() {
    const kana = this.currentKana;
    return kana ? (getRomajiOptions(kana).at(-1) ?? '') : '';
  }

  /** 標準寫法的所有筆畫 path（描紅範本、示範筆順用） */
  get templatePaths() {
    const kana = this.currentKana;
    if (!kana) return [];
    return getKanaVariants(kana)[0]?.strokes.map((s) => s.d) ?? [];
  }

  /** 已通過的筆畫 path */
  get acceptedPaths() {
    return [...this.#acceptedPaths];
  }

  /** 默寫模式中尚未判定的筆畫（使用者原始筆跡） */
  get pendingStrokes() {
    return this.#pendingStrokes.map((s) => [...s]);
  }

  /** 已寫的筆數 */
  get strokeIndex() {
    return this.#level === HandwritingLevel.BLIND
      ? this.#pendingStrokes.length
      : this.#acceptedPaths.length;
  }

  /** 標準寫法的筆數 */
  get strokeCount() {
    return this.templatePaths.length;
  }

  /** 下一筆的 path（描紅 / 提示用） */
  get nextStrokePath() {
    const k = this.#acceptedPaths.length;
    const variant = this.#candidates.find((v) => v.strokes.length > k);
    return variant?.strokes[k]?.d ?? null;
  }

  /** 剛完成的字（供渲染器短暫顯示完成畫面） */
  get lastCompleted() {
    return this.#lastCompleted;
  }

  // ---------- 事件 ----------

  on(eventType, handler) {
    if (!this.#handlers.has(eventType)) this.#handlers.set(eventType, []);
    this.#handlers.get(eventType).push(handler);
    return () => {
      const list = this.#handlers.get(eventType);
      const index = list ? list.indexOf(handler) : -1;
      if (index > -1) list.splice(index, 1);
    };
  }

  #emit(eventType, data) {
    const handlers = this.#handlers.get(eventType);
    if (handlers) [...handlers].forEach((h) => h(data));
  }

  // 與 TypingSession 相容的鍵盤介面（手寫模式不使用）
  handleKeyPress() {}

  handleDirectInput() {
    return { matchedCount: 0, consumedLength: 0 };
  }

  getHintRomaji() {
    return '';
  }

  // ---------- 操作 ----------

  /**
   * 送出一筆
   * @param {Array<{x: number, y: number}>} points - 109 × 109 座標
   * @returns {{
   *   status: string,
   *   reason?: 'reversed'|'order'|'shape'|'count',
   *   expectedIndex?: number,
   *   actualIndex?: number|null,
   *   correctPaths?: string[],
   * }}
   */
  submitStroke(points) {
    if (this.#finished || !this.currentKana) {
      return { status: StrokeResultStatus.IGNORED };
    }
    // 點一下或極短的誤觸不列入判定（假名中最短的點也遠長於此）
    if (!points || points.length < 2 || pathLength(points) < MIN_STROKE_LENGTH) {
      return { status: StrokeResultStatus.IGNORED };
    }

    this.#totalStrokes++;
    return this.#level === HandwritingLevel.BLIND
      ? this.#submitBlind(points)
      : this.#submitIncremental(points);
  }

  /** 清除目前這個字已寫的筆畫 */
  clearCurrent() {
    this.#resetCharacter();
  }

  /**
   * 移到指定的字
   * @param {string} id
   * @returns {boolean}
   */
  selectCell(id) {
    if (this.#finished) return false;
    const index = this.#targets.findIndex((t) => t.id === id);
    if (index === -1 || this.#targets[index].completed) return false;
    this.#cursor = index;
    this.#resetCharacter();
    return true;
  }

  /** @param {'trace'|'hint'|'blind'} level */
  setLevel(level) {
    if (!Object.values(HandwritingLevel).includes(level)) return;
    this.#level = level;
    this.#resetCharacter();
  }

  /** @param {'sequential'|'random'} order */
  setOrder(order) {
    this.#order = order === 'random' ? 'random' : 'sequential';
  }

  // ---------- 內部 ----------

  #tolerance() {
    return STROKE_TOLERANCE[this.#level] ?? STROKE_TOLERANCE.trace;
  }

  #resetCharacter() {
    const kana = this.currentKana;
    this.#candidates = kana ? getKanaVariants(kana) : [];
    this.#acceptedPaths = [];
    this.#pendingStrokes = [];
  }

  #submitIncremental(points) {
    const k = this.#acceptedPaths.length;
    const tolerance = this.#tolerance();
    const live = this.#candidates.filter((v) => v.strokes.length > k);

    const matched = live.filter(
      (v) => compareStroke(points, v.strokes[k].points).distance <= tolerance
    );

    if (matched.length === 0) {
      const primary = live[0];
      const diagnosis = diagnoseStroke(
        points,
        primary.strokes.map((s) => s.points),
        k,
        tolerance
      );
      return this.#reject({
        ...diagnosis,
        expectedIndex: k,
        correctPaths: [primary.strokes[k].d],
      });
    }

    this.#candidates = matched;
    this.#acceptedPaths.push(matched[0].strokes[k].d);

    const finished = matched.find((v) => v.strokes.length === k + 1);
    if (finished) {
      this.#completeCharacter(finished.strokes.map((s) => s.d));
      return { status: StrokeResultStatus.COMPLETED, expectedIndex: k };
    }

    return { status: StrokeResultStatus.ACCEPTED, expectedIndex: k };
  }

  #submitBlind(points) {
    this.#pendingStrokes.push(points);
    const n = this.#pendingStrokes.length;
    const tolerance = this.#tolerance();

    const sameCount = this.#candidates.filter((v) => v.strokes.length === n);
    for (const variant of sameCount) {
      const result = compareCharacter(
        this.#pendingStrokes,
        variant.strokes.map((s) => s.points),
        tolerance
      );
      if (result.ok) {
        this.#completeCharacter(variant.strokes.map((s) => s.d));
        return { status: StrokeResultStatus.COMPLETED, expectedIndex: n - 1 };
      }
    }

    // 還有筆畫更多的寫法：繼續等待
    if (this.#candidates.some((v) => v.strokes.length > n)) {
      return { status: StrokeResultStatus.PENDING, expectedIndex: n - 1 };
    }

    // 所有寫法都不符合：找出第一個錯的筆畫
    const reference = sameCount[0] ?? this.#candidates[0];
    const result = compareCharacter(
      this.#pendingStrokes,
      reference.strokes.map((s) => s.points),
      tolerance
    );
    const correctPaths = reference.strokes.map((s) => s.d);
    this.#pendingStrokes = [];
    return this.#reject({
      reason: result.reason ?? 'shape',
      actualIndex: result.actualIndex,
      expectedIndex: result.failedIndex ?? 0,
      correctPaths,
    });
  }

  #reject(details) {
    this.#mistakes++;
    this.#emit(SessionEventTypes.CHARACTER_MISTAKEN, {
      expected: [this.currentKana],
      actual: details.reason,
    });
    return { status: StrokeResultStatus.REJECTED, ...details };
  }

  #completeCharacter(paths) {
    const target = this.#targets[this.#cursor];
    target.completed = true;
    this.#lastCompleted = { id: target.id, kana: target.text, paths, at: Date.now() };

    this.#advanceCursor();
    this.#resetCharacter();

    this.#emit(SessionEventTypes.CHARACTER_COMPLETED, {
      character: new Character(target.text).setCompleted(),
      duration: Date.now() - this.#startTime.getTime(),
      targetId: target.id,
    });
    this.#emit(SessionEventTypes.SPEECH_REQUESTED, { text: target.text });

    if (this.#targets.every((t) => t.completed)) {
      this.#finished = true;
      this.#candidates = [];
      const correct = Math.max(0, this.#totalStrokes - this.#mistakes);
      this.#emit(SessionEventTypes.SESSION_COMPLETED, {
        totalTime: Date.now() - this.#startTime.getTime(),
        accuracy: this.#totalStrokes > 0 ? correct / this.#totalStrokes : 1,
        totalKeystrokes: this.#totalStrokes,
        mistakes: this.#mistakes,
      });
    }
  }

  #advanceCursor() {
    if (this.#order === 'random') {
      const next = this.#pickRandomPending();
      if (next !== -1) this.#cursor = next;
      return;
    }
    const total = this.#targets.length;
    for (let step = 1; step <= total; step++) {
      const index = (this.#cursor + step) % total;
      if (!this.#targets[index].completed) {
        this.#cursor = index;
        return;
      }
    }
  }

  #pickRandomPending() {
    const pending = this.#targets
      .map((t, i) => (t.completed ? -1 : i))
      .filter((i) => i !== -1);
    if (pending.length === 0) return -1;
    return pending[Math.floor(this.#random() * pending.length)];
  }
}
