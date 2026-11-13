/**
 * GojuonAdvancedMode - 五十音進階模式
 *
 * 依假名字典表（46 列）順序，逐列輸入範例單字：
 * 平假名單字 → 片假名單字 → 濁音單字 → 半濁音單字。
 * 翻譯與羅馬拼音作為提示顯示。
 */

import { PracticeMode } from './PracticeMode.js';
import { GridSession } from '../domain/GridSession.js';
import { KANA_DICTIONARY } from '../data/gojuon.js';
import { actions } from '../store/actions.js';
import { i18n } from '../i18n/index.js';

export class GojuonAdvancedMode extends PracticeMode {
  static get id() {
    return 'gojuon-advanced';
  }

  static get displayName() {
    return '五十音進階';
  }

  static get description() {
    return '依字典表順序輸入範例單字';
  }

  static get isGrid() {
    return true;
  }

  async initialize() {}

  async loadNextQuestion() {
    this.store.dispatch(actions.loadQuestionSuccess({ text: '五十音進階' }));
    return GojuonAdvancedMode.buildBoard();
  }

  static buildBoard() {
    const label = (text) => ({ kind: 'label', text: text ?? '' });
    const word = (kana, entry) =>
      entry
        ? { kind: 'target', text: entry.word, kana, reading: entry.romaji, meaning: entry.meaning }
        : { kind: 'empty' };

    return {
      kind: 'dictionary',
      columns: [
        i18n.t('dictNumber'),
        i18n.t('dictHiragana'),
        i18n.t('dictWord'),
        i18n.t('dictKatakana'),
        i18n.t('dictWord'),
        i18n.t('dictDakuon'),
        i18n.t('dictWord'),
        i18n.t('dictHandakuon'),
        i18n.t('dictWord'),
      ],
      rows: KANA_DICTIONARY.map((entry, index) => ({
        cells: [
          label(String(index + 1)),
          { kind: 'label', text: entry.hiragana, reading: entry.romaji, emphasis: true },
          word(entry.hiragana, entry.hiraganaWord),
          { kind: 'label', text: entry.katakana, emphasis: true },
          word(entry.katakana, entry.katakanaWord),
          entry.dakuon ? { kind: 'label', text: entry.dakuon, emphasis: true } : { kind: 'empty' },
          word(entry.dakuon, entry.dakuonWord),
          entry.handakuon ? { kind: 'label', text: entry.handakuon, emphasis: true } : { kind: 'empty' },
          word(entry.handakuon, entry.handakuonWord),
        ],
      })),
    };
  }

  createSession(board) {
    this.session = new GridSession(board, { ordered: true });
    return this.session;
  }

  getGridActions() {
    return [];
  }

  handleGridAction() {
    return false;
  }
}
