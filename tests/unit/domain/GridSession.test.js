import { describe, it, expect } from 'bun:test';
import { GridSession, GridTargetState } from '../../../src/domain/GridSession.js';
import { SessionEventTypes } from '../../../src/domain/EventTypes.js';
import { GojuonMode } from '../../../src/modes/GojuonMode.js';
import { GojuonAdvancedMode } from '../../../src/modes/GojuonAdvancedMode.js';
import { KANA_DICTIONARY } from '../../../src/data/gojuon.js';
import { Question } from '../../../src/domain/Question.js';

const type = (session, keys) => [...keys].forEach((k) => session.handleKeyPress(k));

function board(texts) {
  return {
    kind: 'test',
    columns: texts.map(() => ''),
    rows: [{ cells: texts.map((t) => (t ? { kind: 'target', text: t } : { kind: 'empty' })) }],
  };
}

describe('GridSession（亂序模式 / 五十音表）', () => {
  it('照順序輸入時游標往下一格移動', () => {
    const s = new GridSession(board(['あ', 'い', 'う']));
    expect(s.currentTargetId).toBe('0-0');
    type(s, 'a');
    expect(s.getTargetState('0-0')).toBe(GridTargetState.COMPLETED);
    expect(s.currentTargetId).toBe('0-1');
  });

  it('亂序輸入也會讓對應格子完成，游標不動', () => {
    const s = new GridSession(board(['か', 'き', 'く']));
    type(s, 'ku');
    expect(s.getTargetState('0-2')).toBe(GridTargetState.COMPLETED);
    expect(s.getTargetState('0-0')).toBe(GridTargetState.CURRENT);
    expect(s.completedCount).toBe(1);
  });

  it('接受多種羅馬字寫法（shi / si）', () => {
    const s = new GridSession(board(['し', 'ち']));
    type(s, 'si');
    type(s, 'chi');
    expect(s.completedCount).toBe(2);
  });

  it('「n」會等下一個鍵再決定是ん還是な行', () => {
    const s = new GridSession(board(['な', 'ん', 'か']));
    type(s, 'n');
    expect(s.completedCount).toBe(0);
    type(s, 'k'); // n → ん，再以 k 開始
    expect(s.getTargetState('0-1')).toBe(GridTargetState.COMPLETED);
    type(s, 'a');
    expect(s.getTargetState('0-2')).toBe(GridTargetState.COMPLETED);
    type(s, 'na');
    expect(s.completedCount).toBe(3);
  });

  it('「nn」直接完成ん', () => {
    const s = new GridSession(board(['な', 'ん']));
    type(s, 'nn');
    expect(s.getTargetState('0-1')).toBe(GridTargetState.COMPLETED);
  });

  it('已完成的假名不能再輸入，視為錯誤', () => {
    const s = new GridSession(board(['あ', 'い']));
    const mistakes = [];
    s.on(SessionEventTypes.CHARACTER_MISTAKEN, (e) => mistakes.push(e));
    type(s, 'aa');
    expect(mistakes.length).toBe(1);
    expect(s.completedCount).toBe(1);
  });

  it('錯字後保留可以開始新假名的鍵', () => {
    const s = new GridSession(board(['か', 'さ']));
    type(s, 'ks'); // k 後接 s 錯誤，但 s 可以開始 さ
    type(s, 'a');
    expect(s.getTargetState('0-1')).toBe(GridTargetState.COMPLETED);
  });

  it('全部完成時發出 SESSION_COMPLETED', () => {
    const s = new GridSession(board(['あ', null, 'お']));
    let done = null;
    s.on(SessionEventTypes.SESSION_COMPLETED, (e) => (done = e));
    type(s, 'oa');
    expect(done).not.toBeNull();
    expect(done.totalKeystrokes).toBe(2);
    expect(done.accuracy).toBe(1);
    expect(s.currentTargetId).toBeNull();
  });

  it('提示扣除已輸入的部分，優先游標格子', () => {
    const s = new GridSession(board(['し', 'さ']));
    expect(s.getHintRomaji()).toBe('si');
    type(s, 's');
    expect(s.getHintRomaji()).toBe('i');
  });

  it('點擊格子移動游標', () => {
    const s = new GridSession(board(['あ', 'い', 'う']));
    expect(s.selectCell('0-2')).toBe(true);
    expect(s.currentTargetId).toBe('0-2');
    type(s, 'u');
    expect(s.currentTargetId).toBe('0-0'); // 循環回第一個未完成格子
    expect(s.selectCell('0-2')).toBe(false); // 已完成
  });

  it('直接輸入（手機）可一次完成多格、任意順序', () => {
    const s = new GridSession(board(['あ', 'い', 'う']));
    const result = s.handleDirectInput('うあx');
    expect(result).toEqual({ matchedCount: 2, consumedLength: 2 });
    expect(s.getTargetState('0-1')).toBe(GridTargetState.CURRENT);
  });

  it('完成時朗讀該假名', () => {
    const s = new GridSession(board(['か']));
    const spoken = [];
    s.on(SessionEventTypes.SPEECH_REQUESTED, (e) => spoken.push(e.text));
    type(s, 'ka');
    expect(spoken).toEqual(['か']);
  });
});

describe('GridSession（依序模式 / 五十音進階）', () => {
  it('只接受游標所在的單字', () => {
    const s = new GridSession(board(['あめ', 'いぬ']), { ordered: true });
    const mistakes = [];
    s.on(SessionEventTypes.CHARACTER_MISTAKEN, (e) => mistakes.push(e));
    type(s, 'i');
    expect(mistakes.length).toBe(1);
    type(s, 'ame');
    expect(s.getTargetState('0-0')).toBe(GridTargetState.COMPLETED);
    expect(s.currentTargetId).toBe('0-1');
  });

  it('單字輸入中顯示逐字進度', () => {
    const s = new GridSession(board(['がっこう']), { ordered: true });
    type(s, 'ga');
    const q = s.getTargetQuestion('0-0');
    expect(q.characters[0].state).toBe('completed');
    expect(s.getHintRomaji()).toBe('kko');
  });

  it('單字完成後朗讀整個單字（不逐字朗讀）', () => {
    const s = new GridSession(board(['ねこ']), { ordered: true });
    const spoken = [];
    s.on(SessionEventTypes.SPEECH_REQUESTED, (e) => spoken.push(e.text));
    type(s, 'neko');
    expect(spoken).toEqual(['ねこ']);
  });

  it('點擊格子跳到該單字', () => {
    const s = new GridSession(board(['あめ', 'いぬ']), { ordered: true });
    s.selectCell('0-1');
    type(s, 'inu');
    expect(s.getTargetState('0-1')).toBe(GridTargetState.COMPLETED);
    expect(s.currentTargetId).toBe('0-0');
  });

  it('直接輸入可跨越多個單字', () => {
    const s = new GridSession(board(['あめ', 'いぬ']), { ordered: true });
    let done = false;
    s.on(SessionEventTypes.SESSION_COMPLETED, () => (done = true));
    const result = s.handleDirectInput('あめいぬ');
    expect(result.consumedLength).toBe(4);
    expect(done).toBe(true);
  });
});

describe('五十音資料與模式', () => {
  it('五十音表共有 46 個假名，照五十音順序', () => {
    const s = new GridSession(GojuonMode.buildBoard('hiragana'));
    expect(s.totalTargets).toBe(46);
    type(s, 'aiueo');
    expect(s.currentTargetId).toBe('1-0'); // か
  });

  it('片假名表可以完整輸入', () => {
    const s = new GridSession(GojuonMode.buildBoard('katakana'));
    let done = false;
    s.on(SessionEventTypes.SESSION_COMPLETED, () => (done = true));
    type(s, 'aiueokakikukekosashisusesotachitsutetonaninunenohahifuhehomamimumemoyayuyorarirurerowawonn');
    expect(done).toBe(true);
  });

  it('字典表共有 46 列，每個範例單字都能用羅馬字輸入', () => {
    expect(KANA_DICTIONARY.length).toBe(46);
    for (const entry of KANA_DICTIONARY) {
      for (const key of ['hiraganaWord', 'katakanaWord', 'dakuonWord', 'handakuonWord']) {
        const word = entry[key];
        if (!word) continue;
        const q = Question.fromText(word.word);
        for (const ch of q.characters) {
          expect({ word: word.word, kana: ch.kana, ok: ch.romaji.length > 0 })
            .toEqual({ word: word.word, kana: ch.kana, ok: true });
        }
      }
    }
  });

  it('進階表依列順序：平假名單字 → 片假名單字 → 濁音 → 半濁音', () => {
    const s = new GridSession(GojuonAdvancedMode.buildBoard(), { ordered: true });
    const b = s.board;
    const textOf = (id) => {
      const [r, c] = id.split('-').map(Number);
      return b.rows[r].cells[c].text;
    };
    expect(textOf(s.currentTargetId)).toBe('あめ');
    type(s, 'ame');
    expect(textOf(s.currentTargetId)).toBe('アイス');
    type(s, 'aisu');
    expect(textOf(s.currentTargetId)).toBe('いぬ');
    expect(s.totalTargets).toBe(46 + 45 + 20 + 5);
  });
});
