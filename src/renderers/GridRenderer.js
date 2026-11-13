/**
 * GridRenderer - 表格練習渲染器
 *
 * 渲染五十音表 / 假名字典表，依 GridSession 的狀態為每一格上色。
 * 點擊格子會呼叫 onSelect，點擊上方按鈕會呼叫 onAction。
 */

import { i18n } from '../i18n/index.js';

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export class GridRenderer {
  #container;
  #onSelect = null;
  #onAction = null;
  #boundClick = null;
  #lastCurrentId = null;

  /**
   * @param {HTMLElement} container - 表格容器元素
   */
  constructor(container) {
    this.#container = container;
    if (container && typeof container.addEventListener === 'function') {
      this.#boundClick = this.#handleClick.bind(this);
      container.addEventListener('click', this.#boundClick);
    }
  }

  /**
   * @param {Object} callbacks
   * @param {(id: string) => void} [callbacks.onSelect]
   * @param {(id: string) => void} [callbacks.onAction]
   */
  setCallbacks({ onSelect, onAction } = {}) {
    this.#onSelect = onSelect ?? null;
    this.#onAction = onAction ?? null;
  }

  /**
   * 渲染表格
   * @param {import('../domain/GridSession.js').GridSession} session
   * @param {Object} [options]
   * @param {Array<{ id: string, label: string }>} [options.actions] - 上方按鈕
   */
  render(session, options = {}) {
    if (!this.#container || !session) return;

    const board = session.board;
    const actions = options.actions ?? [];
    const hint = session.ordered ? i18n.t('gridHintOrdered') : i18n.t('gridHintFree');

    const toolbar = `
      <div class="grid-toolbar">
        <span class="grid-progress">${i18n.t('gridProgress')} ${session.completedCount} / ${session.totalTargets}</span>
        <span class="grid-hint">${escapeHtml(hint)}</span>
        <span class="grid-actions">
          ${actions
            .map((a) => `<button type="button" class="control-btn secondary grid-action" data-action="${escapeHtml(a.id)}">${escapeHtml(a.label)}</button>`)
            .join('')}
        </span>
      </div>`;

    const head = `<tr>${board.columns.map((c) => `<th>${escapeHtml(c)}</th>`).join('')}</tr>`;

    const body = board.rows
      .map((row, r) => {
        const rowLabel = row.label !== undefined ? `<th class="grid-row-label">${escapeHtml(row.label)}</th>` : '';
        const cells = row.cells.map((cell, c) => this.#renderCell(session, cell, `${r}-${c}`)).join('');
        return `<tr>${rowLabel}${cells}</tr>`;
      })
      .join('');

    this.#container.innerHTML = `
      ${toolbar}
      <div class="grid-scroll">
        <table class="grid-table grid-${escapeHtml(board.kind)}">
          <thead>${head}</thead>
          <tbody>${body}</tbody>
        </table>
      </div>`;

    this.#scrollToCurrent(session.currentTargetId);
  }

  #renderCell(session, cell, id) {
    if (!cell || cell.kind === 'empty') {
      return '<td class="grid-cell grid-empty"></td>';
    }

    if (cell.kind === 'label') {
      const cls = cell.emphasis ? 'grid-cell grid-label grid-label-kana' : 'grid-cell grid-label';
      const reading = cell.reading ? `<span class="grid-reading">${escapeHtml(cell.reading)}</span>` : '';
      return `<td class="${cls}"><span class="grid-text">${escapeHtml(cell.text)}</span>${reading}</td>`;
    }

    const state = session.getTargetState(id);
    const question = session.getTargetQuestion(id);

    // 正在輸入的單字：逐字上色
    const text = question
      ? question.characters
          .map((ch) => `<span class="char char-${ch.state}">${escapeHtml(ch.kana)}</span>`)
          .join('')
      : escapeHtml(cell.text);

    const meaning = cell.meaning ? `<span class="grid-meaning">${escapeHtml(cell.meaning)}</span>` : '';
    const reading = cell.reading ? `<span class="grid-reading">${escapeHtml(cell.reading)}</span>` : '';

    return `<td class="grid-cell grid-target cell-${state}" data-target-id="${id}">
      <span class="grid-text">${text}</span>${meaning}${reading}
    </td>`;
  }

  #scrollToCurrent(currentId) {
    if (!currentId || currentId === this.#lastCurrentId) return;
    this.#lastCurrentId = currentId;
    const el = this.#container.querySelector?.(`[data-target-id="${currentId}"]`);
    el?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }

  #handleClick(event) {
    const target = event.target;
    if (!target || typeof target.closest !== 'function') return;

    const actionEl = target.closest('[data-action]');
    if (actionEl) {
      actionEl.blur?.();
      this.#onAction?.(actionEl.dataset.action);
      return;
    }

    const cellEl = target.closest('[data-target-id]');
    if (cellEl) {
      this.#onSelect?.(cellEl.dataset.targetId);
    }
  }

  /** 清空內容 */
  clear() {
    if (this.#container) {
      this.#container.innerHTML = '';
    }
    this.#lastCurrentId = null;
  }

  dispose() {
    if (this.#container && this.#boundClick) {
      this.#container.removeEventListener('click', this.#boundClick);
    }
    this.#boundClick = null;
  }

  getContainer() {
    return this.#container;
  }
}
