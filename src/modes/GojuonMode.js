/**
 * GojuonMode - 五十音表模式
 *
 * 顯示完整五十音表（行 × 段），使用者可照順序輸入，也可以亂序輸入；
 * 每輸入正確一個假名，該格就會變色。支援平假名 / 片假名切換。
 */

import { PracticeMode } from './PracticeMode.js';
import { GridSession } from '../domain/GridSession.js';
import { GOJUON_COLUMNS, GOJUON_ROWS } from '../data/gojuon.js';
import { getRomajiOptions } from '../domain/RomajiMap.js';
import { actions } from '../store/actions.js';
import { i18n } from '../i18n/index.js';

export class GojuonMode extends PracticeMode {
  #script = 'hiragana';

  static get id() {
    return 'gojuon';
  }

  static get displayName() {
    return '五十音表';
  }

  static get description() {
    return '照順序或亂序輸入五十音表';
  }

  static get isGrid() {
    return true;
  }

  async initialize() {}

  /**
   * 建立五十音表
   * @returns {Promise<import('../domain/GridSession.js').GridBoard>}
   */
  async loadNextQuestion() {
    this.store.dispatch(actions.loadQuestionSuccess({ text: '五十音' }));
    return GojuonMode.buildBoard(this.#script);
  }

  /**
   * @param {'hiragana'|'katakana'} script
   */
  static buildBoard(script = 'hiragana') {
    return {
      kind: 'gojuon',
      columns: ['', ...GOJUON_COLUMNS],
      rows: GOJUON_ROWS.map((row) => ({
        label: row.romaji ? `${row.label} (${row.romaji})` : row.label,
        cells: row[script].map((kana) =>
          kana
            ? { kind: 'target', text: kana, reading: getRomajiOptions(kana).at(-1) }
            : { kind: 'empty' }
        ),
      })),
    };
  }

  createSession(board) {
    this.session = new GridSession(board, { ordered: false });
    return this.session;
  }

  get script() {
    return this.#script;
  }

  /**
   * 表格上方的操作按鈕
   * @returns {Array<{ id: string, label: string }>}
   */
  getGridActions() {
    return [
      {
        id: 'toggle-script',
        label: this.#script === 'hiragana' ? i18n.t('switchToKatakana') : i18n.t('switchToHiragana'),
      },
    ];
  }

  /**
   * @param {string} actionId
   * @returns {boolean} 是否需要重新載入表格
   */
  handleGridAction(actionId) {
    if (actionId === 'toggle-script') {
      this.#script = this.#script === 'hiragana' ? 'katakana' : 'hiragana';
      return true;
    }
    return false;
  }
}
