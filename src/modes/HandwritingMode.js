/**
 * HandwritingMode - 五十音手寫模式
 *
 * 在手寫板上依筆順書寫五十音，支援觸控、滑鼠與觸控筆。
 * 三個等級（描紅 / 提示 / 默寫）共用同一套筆順比對引擎。
 */

import { PracticeMode } from './PracticeMode.js';
import { GojuonMode } from './GojuonMode.js';
import { HandwritingSession, HandwritingLevel } from '../domain/HandwritingSession.js';
import { actions } from '../store/actions.js';
import { i18n } from '../i18n/index.js';

export class HandwritingMode extends PracticeMode {
  #script = 'hiragana';
  #level = HandwritingLevel.TRACE;
  #order = 'sequential';

  static get id() {
    return 'handwriting';
  }

  static get displayName() {
    return '五十音手寫';
  }

  static get description() {
    return '依筆順手寫五十音';
  }

  static get isGrid() {
    return true;
  }

  static get isHandwriting() {
    return true;
  }

  async initialize() {}

  async loadNextQuestion() {
    this.store.dispatch(actions.loadQuestionSuccess({ text: '五十音手寫' }));
    return GojuonMode.buildBoard(this.#script);
  }

  createSession(board) {
    this.session = new HandwritingSession(board, { level: this.#level, order: this.#order });
    return this.session;
  }

  getGridActions() {
    const level = (id, key) => ({ id: `level-${id}`, label: i18n.t(key), active: this.#level === id, group: 'level' });
    return [
      level(HandwritingLevel.TRACE, 'hwLevelTrace'),
      level(HandwritingLevel.HINT, 'hwLevelHint'),
      level(HandwritingLevel.BLIND, 'hwLevelBlind'),
      {
        id: 'toggle-order',
        label: this.#order === 'sequential' ? i18n.t('hwOrderRandom') : i18n.t('hwOrderSequential'),
      },
      {
        id: 'toggle-script',
        label: this.#script === 'hiragana' ? i18n.t('switchToKatakana') : i18n.t('switchToHiragana'),
      },
    ];
  }

  /**
   * @param {string} actionId
   * @returns {'reload'|'render'|false}
   */
  handleGridAction(actionId) {
    if (actionId.startsWith('level-')) {
      this.#level = actionId.slice('level-'.length);
      this.session?.setLevel(this.#level);
      return 'render';
    }
    if (actionId === 'toggle-order') {
      this.#order = this.#order === 'sequential' ? 'random' : 'sequential';
      this.session?.setOrder(this.#order);
      return 'render';
    }
    if (actionId === 'toggle-script') {
      this.#script = this.#script === 'hiragana' ? 'katakana' : 'hiragana';
      return 'reload';
    }
    return false;
  }
}
