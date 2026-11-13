/**
 * HandwritingRenderer - 手寫板渲染器
 *
 * 版面：左側手寫板（SVG 範本層 + canvas 筆跡層），右側五十音進度表。
 * - 以 Pointer Events 處理觸控、滑鼠與觸控筆
 * - 座標換算為 KanjiVG 的 109 × 109 座標系後交給 Session 判定
 * - 通過的筆畫以標準筆形顯示；錯誤時以紅色筆跡與正確筆畫提示
 */

import { i18n } from '../i18n/index.js';
import { GridRenderer } from './GridRenderer.js';
import { pathToPoints } from '../domain/handwriting/strokeGeometry.js';
import { StrokeResultStatus, HandwritingLevel } from '../domain/HandwritingSession.js';

const VIEWBOX = 109;
const SVG_NS = 'http://www.w3.org/2000/svg';
const COMPLETE_DISPLAY_MS = 700;
const FEEDBACK_MS = 1400;

export class HandwritingRenderer {
  #container;
  #session = null;
  #els = null;
  #grid = null;
  #callbacks = {};
  #lastOptions = {};

  #drawing = null;
  #feedbackTimer = null;
  #completeTimer = null;
  #demoTimer = null;
  #shownCompleteAt = 0;

  /**
   * @param {HTMLElement} container
   */
  constructor(container) {
    this.#container = container;
  }

  /**
   * @param {Object} callbacks
   * @param {(points: Array<{x: number, y: number}>) => Object} [callbacks.onStroke] - 回傳判定結果
   * @param {() => void} [callbacks.onClear]
   * @param {(id: string) => void} [callbacks.onSelect]
   * @param {(id: string) => void} [callbacks.onAction]
   */
  setCallbacks(callbacks = {}) {
    this.#callbacks = callbacks;
    this.#grid?.setCallbacks({ onSelect: callbacks.onSelect, onAction: callbacks.onAction });
  }

  /**
   * @param {import('../domain/HandwritingSession.js').HandwritingSession} session
   * @param {Object} [options]
   * @param {Array} [options.actions]
   */
  render(session, options = {}) {
    if (!this.#container || !session || typeof document === 'undefined') return;
    this.#lastOptions = options;

    if (!this.#els) this.#build();
    if (session !== this.#session) {
      this.#session = session;
      this.#cancelTimers();
      this.#clearInk();
      this.#els.feedback.replaceChildren();
      this.#setMessage('');
    }

    this.#grid.render(session, { actions: options.actions ?? [], hint: i18n.t('hwHint') });

    // 剛完成一個字：短暫顯示完成的字，再換下一個
    const done = session.lastCompleted;
    if (done && done.at !== this.#shownCompleteAt && Date.now() - done.at < COMPLETE_DISPLAY_MS) {
      this.#shownCompleteAt = done.at;
      this.#showCompleted(done);
      return;
    }
    if (this.#completeTimer) return;

    this.#renderPad();
  }

  // ---------- 建立 DOM ----------

  #build() {
    this.#container.innerHTML = `
      <div class="hw-layout">
        <div class="hw-pad-area">
          <div class="hw-info">
            <span class="hw-kana"></span>
            <span class="hw-romaji"></span>
            <span class="hw-progress"></span>
          </div>
          <div class="hw-pad">
            <svg class="hw-svg" viewBox="0 0 ${VIEWBOX} ${VIEWBOX}" aria-hidden="true">
              <g class="hw-guides">
                <line x1="54.5" y1="2" x2="54.5" y2="107" />
                <line x1="2" y1="54.5" x2="107" y2="54.5" />
              </g>
              <g class="hw-template"></g>
              <g class="hw-accepted"></g>
              <g class="hw-next"></g>
              <g class="hw-feedback"></g>
              <g class="hw-demo"></g>
            </svg>
            <canvas class="hw-canvas"></canvas>
          </div>
          <div class="hw-message" role="status" aria-live="polite"></div>
          <div class="hw-buttons">
            <button type="button" class="control-btn secondary" data-hw="clear">${i18n.t('hwClear')}</button>
            <button type="button" class="control-btn secondary" data-hw="demo">${i18n.t('hwDemo')}</button>
          </div>
          <p class="hw-attribution">${i18n.t('hwAttribution')}</p>
        </div>
        <div class="hw-grid"></div>
      </div>`;

    const q = (sel) => this.#container.querySelector(sel);
    this.#els = {
      kana: q('.hw-kana'),
      romaji: q('.hw-romaji'),
      progress: q('.hw-progress'),
      pad: q('.hw-pad'),
      template: q('.hw-template'),
      accepted: q('.hw-accepted'),
      next: q('.hw-next'),
      feedback: q('.hw-feedback'),
      demo: q('.hw-demo'),
      canvas: q('.hw-canvas'),
      message: q('.hw-message'),
    };

    this.#grid = new GridRenderer(q('.hw-grid'));
    this.#grid.setCallbacks({ onSelect: this.#callbacks.onSelect, onAction: this.#callbacks.onAction });

    this.#container.querySelector('.hw-buttons').addEventListener('click', (e) => {
      const button = e.target.closest?.('[data-hw]');
      if (!button) return;
      button.blur();
      if (button.dataset.hw === 'clear') {
        this.#cancelTimers();
        this.#clearInk();
        this.#callbacks.onClear?.();
      } else if (button.dataset.hw === 'demo') {
        this.#playDemo();
      }
    });

    this.#bindPointer();
  }

  // ---------- 手寫板內容 ----------

  #renderPad() {
    const s = this.#session;
    const els = this.#els;
    const blind = s.level === HandwritingLevel.BLIND;
    this.#syncCanvasSize();

    els.pad.classList.toggle('is-finished', s.finished);
    els.kana.textContent = blind ? '？' : (s.currentKana ?? '');
    els.romaji.textContent = s.currentRomaji;
    els.progress.textContent = s.finished
      ? ''
      : blind
        ? i18n.t('hwBlindProgress', { n: s.strokeIndex })
        : i18n.t('hwStrokeProgress', { n: Math.min(s.strokeIndex + 1, s.strokeCount), total: s.strokeCount });

    // 描紅：整個字的淡色範本
    els.template.replaceChildren(
      ...(s.level === HandwritingLevel.TRACE ? s.templatePaths.map((d) => this.#path(d)) : [])
    );

    // 已通過的筆畫
    els.accepted.replaceChildren(...s.acceptedPaths.map((d) => this.#path(d)));

    // 下一筆：起點與方向
    const next = !blind ? s.nextStrokePath : null;
    if (next) {
      const start = pathToPoints(next)[0];
      const line = this.#path(next, { pathLength: 1 });
      const dot = document.createElementNS(SVG_NS, 'circle');
      dot.setAttribute('cx', start.x);
      dot.setAttribute('cy', start.y);
      dot.setAttribute('r', 3.2);
      els.next.replaceChildren(line, dot);
    } else {
      els.next.replaceChildren();
    }

    // 默寫：保留尚未判定的筆跡
    if (!this.#feedbackTimer) {
      this.#clearInk();
      if (blind) s.pendingStrokes.forEach((stroke) => this.#drawStroke(stroke, '#E5E7EB'));
    }
  }

  #path(d, attrs = {}) {
    const el = document.createElementNS(SVG_NS, 'path');
    el.setAttribute('d', d);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
  }

  #showCompleted(done) {
    const els = this.#els;
    this.#clearInk();
    els.template.replaceChildren();
    els.next.replaceChildren();
    els.feedback.replaceChildren();
    els.accepted.replaceChildren(...done.paths.map((d) => this.#path(d)));
    els.pad.classList.add('is-complete');
    els.kana.textContent = done.kana;
    this.#setMessage(i18n.t('hwGood'), 'good');

    this.#completeTimer = setTimeout(() => {
      this.#completeTimer = null;
      els.pad.classList.remove('is-complete');
      this.#setMessage('');
      if (this.#session) this.#renderPad();
    }, COMPLETE_DISPLAY_MS);
  }

  #showRejected(result, points) {
    const els = this.#els;
    this.#clearInk();
    this.#session.pendingStrokes.forEach((stroke) => this.#drawStroke(stroke, '#E5E7EB'));
    this.#drawStroke(points, '#EF4444');

    els.feedback.replaceChildren(
      ...(result.correctPaths ?? []).map((d, i) => {
        const el = this.#path(d, { pathLength: 1 });
        el.style.animationDelay = `${i * 0.35}s`;
        return el;
      })
    );

    const n = (result.expectedIndex ?? 0) + 1;
    const message = {
      reversed: i18n.t('hwReasonReversed'),
      order: i18n.t('hwReasonOrder', { n: (result.actualIndex ?? 0) + 1, expected: n }),
      shape: i18n.t('hwReasonShape', { n }),
      count: i18n.t('hwReasonCount'),
    }[result.reason] ?? i18n.t('hwReasonShape', { n });
    this.#setMessage(message, 'error');

    clearTimeout(this.#feedbackTimer);
    this.#feedbackTimer = setTimeout(() => {
      this.#feedbackTimer = null;
      els.feedback.replaceChildren();
      this.#setMessage('');
      if (this.#session) this.#renderPad();
    }, FEEDBACK_MS + (result.correctPaths?.length ?? 1) * 350);
  }

  #playDemo() {
    const paths = this.#session?.templatePaths ?? [];
    const els = this.#els;
    clearTimeout(this.#demoTimer);
    els.demo.replaceChildren(
      ...paths.map((d, i) => {
        const el = this.#path(d, { pathLength: 1 });
        el.style.animationDelay = `${i * 0.6}s`;
        return el;
      })
    );
    this.#demoTimer = setTimeout(() => els.demo.replaceChildren(), paths.length * 600 + 900);
  }

  #setMessage(text, kind = '') {
    const el = this.#els?.message;
    if (!el) return;
    el.textContent = text;
    el.className = `hw-message${kind ? ` is-${kind}` : ''}`;
  }

  // ---------- 筆跡 ----------

  #bindPointer() {
    const canvas = this.#els.canvas;

    canvas.addEventListener('pointerdown', (e) => {
      if (!this.#session || this.#session.finished || this.#completeTimer) return;
      if (e.button !== undefined && e.button !== 0) return;
      e.preventDefault();
      try {
        canvas.setPointerCapture?.(e.pointerId);
      } catch {
        // 部分瀏覽器或合成事件不支援，忽略即可
      }
      this.#syncCanvasSize();

      // 錯誤提示顯示中開始下一筆：立即結束提示
      if (this.#feedbackTimer) {
        clearTimeout(this.#feedbackTimer);
        this.#feedbackTimer = null;
        this.#els.feedback.replaceChildren();
        this.#renderPad();
      }

      this.#drawing = { id: e.pointerId, points: [this.#toLocal(e)] };
    });

    canvas.addEventListener('pointermove', (e) => {
      if (!this.#drawing || e.pointerId !== this.#drawing.id) return;
      e.preventDefault();
      // 部分瀏覽器（或合成事件）回傳空陣列，此時退回使用事件本身
      const coalesced = e.getCoalescedEvents?.() ?? [];
      const events = coalesced.length > 0 ? coalesced : [e];
      for (const ev of events) {
        const p = this.#toLocal(ev);
        const prev = this.#drawing.points.at(-1);
        this.#drawing.points.push(p);
        this.#drawSegment(prev, p, '#F9FAFB');
      }
    });

    const finish = (e) => {
      if (!this.#drawing || e.pointerId !== this.#drawing.id) return;
      const points = this.#drawing.points;
      this.#drawing = null;
      this.#submit(points);
    };
    canvas.addEventListener('pointerup', finish);
    canvas.addEventListener('pointercancel', finish);
  }

  #submit(points) {
    const result = this.#callbacks.onStroke?.(points);
    if (!result) return;

    switch (result.status) {
      case StrokeResultStatus.REJECTED:
        this.#showRejected(result, points);
        break;
      case StrokeResultStatus.IGNORED:
        this.#renderPad();
        break;
      default:
        // accepted / pending / completed：App 會重新渲染
        if (result.status !== StrokeResultStatus.COMPLETED) this.#renderPad();
    }
  }

  #toLocal(e) {
    const rect = this.#els.canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * VIEWBOX,
      y: ((e.clientY - rect.top) / rect.height) * VIEWBOX,
    };
  }

  #syncCanvasSize() {
    const canvas = this.#els.canvas;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.round(rect.width * dpr);
    const h = Math.round(rect.height * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      this.#session?.pendingStrokes.forEach((stroke) => this.#drawStroke(stroke, '#E5E7EB'));
    }
  }

  #context() {
    const canvas = this.#els.canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const scale = canvas.width / VIEWBOX;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 4.5;
    return ctx;
  }

  #drawSegment(a, b, color) {
    const ctx = this.#context();
    if (!ctx) return;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  #drawStroke(points, color) {
    const ctx = this.#context();
    if (!ctx || points.length === 0) return;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.stroke();
  }

  #clearInk() {
    const canvas = this.#els?.canvas;
    const ctx = canvas?.getContext?.('2d');
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  #cancelTimers() {
    clearTimeout(this.#feedbackTimer);
    clearTimeout(this.#completeTimer);
    clearTimeout(this.#demoTimer);
    this.#feedbackTimer = null;
    this.#completeTimer = null;
    this.#demoTimer = null;
    this.#els?.pad.classList.remove('is-complete');
    this.#els?.demo.replaceChildren();
  }

  /** 離開手寫模式時清空 */
  clear() {
    this.#cancelTimers();
    this.#session = null;
    this.#els = null;
    this.#grid?.dispose();
    this.#grid = null;
    if (this.#container) this.#container.innerHTML = '';
  }

  dispose() {
    this.clear();
  }
}
