import { describe, it, expect } from 'bun:test';
import { KANA_STROKES } from '../../../../src/data/kanaStrokes.js';
import { getKanaVariants } from '../../../../src/domain/handwriting/kanaVariants.js';
import {
  parsePathSegments,
  pathToPoints,
  resample,
} from '../../../../src/domain/handwriting/strokeGeometry.js';
import { compareStroke, compareCharacter, STROKE_TOLERANCE } from '../../../../src/domain/handwriting/StrokeMatcher.js';
import {
  HandwritingSession,
  HandwritingLevel,
  StrokeResultStatus,
} from '../../../../src/domain/HandwritingSession.js';
import { SessionEventTypes } from '../../../../src/domain/EventTypes.js';
import { GojuonMode } from '../../../../src/modes/GojuonMode.js';

// 固定亂數種子，讓模擬手寫可重現
function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/** 模擬手寫：重新取樣、加上抖動、位移與縮放 */
function handwrite(points, { jitter = 2, dx = 0, dy = 0, scale = 1, rand = seeded(1) } = {}) {
  return resample(points, 40).map((p) => ({
    x: 54.5 + (p.x - 54.5) * scale + dx + (rand() - 0.5) * 2 * jitter,
    y: 54.5 + (p.y - 54.5) * scale + dy + (rand() - 0.5) * 2 * jitter,
  }));
}

function boardOf(kanaList) {
  return { kind: 'test', columns: [], rows: [{ cells: kanaList.map((k) => ({ kind: 'target', text: k })) }] };
}

const strokesOf = (kana, variant = 0) => getKanaVariants(kana)[variant].strokes.map((s) => s.points);

describe('strokeGeometry', () => {
  it('解析 KanjiVG 的相對三次貝茲曲線', () => {
    const segments = parsePathSegments('M10,10c0,0,10,0,10,0c0,0,0,10,0,10');
    expect(segments.length).toBe(2);
    const points = pathToPoints('M10,10c0,0,10,0,10,0c0,0,0,10,0,10');
    expect(points[0]).toEqual({ x: 10, y: 10 });
    expect(points.at(-1).x).toBeCloseTo(20);
    expect(points.at(-1).y).toBeCloseTo(20);
  });

  it('92 個假名都有筆畫資料且能解析', () => {
    expect(Object.keys(KANA_STROKES).length).toBe(92);
    for (const kana of Object.keys(KANA_STROKES)) {
      for (const stroke of strokesOf(kana)) {
        expect(stroke.length).toBeGreaterThan(1);
      }
    }
  });
});

describe('異體寫法', () => {
  it.each([
    ['さ', [3, 2]],
    ['き', [4, 3]],
    ['り', [2, 1]],
    ['ふ', [4, 3]],
    ['そ', [1, 2]],
    ['あ', [3]],
  ])('%s 的筆畫數', (kana, counts) => {
    expect(getKanaVariants(kana).map((v) => v.strokes.length)).toEqual(counts);
  });
});

describe('StrokeMatcher', () => {
  it('所有假名的每一筆，加上抖動與小位移後都能通過', () => {
    const rand = seeded(42);
    for (const kana of Object.keys(KANA_STROKES)) {
      strokesOf(kana).forEach((stroke) => {
        const user = handwrite(stroke, { jitter: 3, dx: (rand() - 0.5) * 8, dy: (rand() - 0.5) * 8, rand });
        expect({ kana, ok: compareStroke(user, stroke).distance <= STROKE_TOLERANCE.trace })
          .toEqual({ kana, ok: true });
      });
    }
  });

  it('反方向書寫不會通過（不含很短的點）', () => {
    const stroke = strokesOf('し')[0];
    const reversed = [...handwrite(stroke)].reverse();
    expect(compareStroke(reversed, stroke).distance).toBeGreaterThan(STROKE_TOLERANCE.trace);
  });

  it('寫成別的筆畫不會通過', () => {
    const [first, second] = strokesOf('き');
    expect(compareStroke(handwrite(second), first).distance).toBeGreaterThan(STROKE_TOLERANCE.trace);
  });

  it('默寫：整個字縮小、偏移後仍可通過', () => {
    for (const kana of ['あ', 'ね', 'ホ', 'を']) {
      const strokes = strokesOf(kana);
      const user = strokes.map((s, i) => handwrite(s, { scale: 0.6, dx: -15, dy: 10, rand: seeded(i + 7) }));
      expect(compareCharacter(user, strokes, STROKE_TOLERANCE.blind).ok).toBe(true);
    }
  });
});

describe('HandwritingSession', () => {
  const writeAll = (session, kana, variant = 0, opts = {}) =>
    strokesOf(kana, variant).map((s, i) => session.submitStroke(handwrite(s, { rand: seeded(i + 3), ...opts })));

  it('描紅：逐筆通過，最後一筆完成整個字並朗讀', () => {
    const s = new HandwritingSession(boardOf(['あ', 'い']));
    const spoken = [];
    s.on(SessionEventTypes.SPEECH_REQUESTED, (e) => spoken.push(e.text));
    const results = writeAll(s, 'あ');
    expect(results.map((r) => r.status)).toEqual(['accepted', 'accepted', 'completed']);
    expect(spoken).toEqual(['あ']);
    expect(s.currentKana).toBe('い');
    expect(s.lastCompleted.kana).toBe('あ');
  });

  it('筆順錯誤會被指出是第幾筆', () => {
    const s = new HandwritingSession(boardOf(['き']));
    const result = s.submitStroke(handwrite(strokesOf('き')[2]));
    expect(result.status).toBe(StrokeResultStatus.REJECTED);
    expect(result.reason).toBe('order');
    expect(result.actualIndex).toBe(2);
    expect(result.correctPaths.length).toBe(1);
  });

  it('方向相反會被指出', () => {
    const s = new HandwritingSession(boardOf(['し']));
    const result = s.submitStroke([...handwrite(strokesOf('し')[0])].reverse());
    expect(result.reason).toBe('reversed');
  });

  it('異體寫法也能完成（連寫的さ）', () => {
    const s = new HandwritingSession(boardOf(['さ']));
    const results = writeAll(s, 'さ', 1);
    expect(results.at(-1).status).toBe('completed');
  });

  it('異體寫法也能完成（兩筆的そ）', () => {
    const s = new HandwritingSession(boardOf(['そ']));
    expect(writeAll(s, 'そ', 1).map((r) => r.status)).toEqual(['accepted', 'completed']);
  });

  it('提示等級使用相同的逐筆判定', () => {
    const s = new HandwritingSession(boardOf(['た']), { level: HandwritingLevel.HINT });
    expect(writeAll(s, 'た').at(-1).status).toBe('completed');
  });

  it('默寫：寫完才判定，標準與異體都接受', () => {
    const s = new HandwritingSession(boardOf(['き', 'き']), { level: HandwritingLevel.BLIND });
    const standard = writeAll(s, 'き', 0, { scale: 0.7, dx: 8 });
    expect(standard.map((r) => r.status)).toEqual(['pending', 'pending', 'pending', 'completed']);
    const variant = writeAll(s, 'き', 1, { scale: 1.1 });
    expect(variant.map((r) => r.status)).toEqual(['pending', 'pending', 'completed']);
  });

  it('默寫：寫錯會在寫滿筆數後指出錯誤並清空', () => {
    const s = new HandwritingSession(boardOf(['い']), { level: HandwritingLevel.BLIND });
    const [first, second] = strokesOf('い');
    s.submitStroke(handwrite(second));
    const result = s.submitStroke(handwrite(first));
    expect(result.status).toBe('rejected');
    expect(result.correctPaths.length).toBe(2);
    expect(s.pendingStrokes.length).toBe(0);
  });

  it('誤觸（極短的筆畫）被忽略', () => {
    const s = new HandwritingSession(boardOf(['あ']));
    expect(s.submitStroke([{ x: 10, y: 10 }, { x: 10.5, y: 10 }]).status).toBe('ignored');
    expect(s.strokeIndex).toBe(0);
  });

  it('清除、點選格子、切換等級都會重設目前的字', () => {
    const s = new HandwritingSession(boardOf(['あ', 'い']));
    s.submitStroke(handwrite(strokesOf('あ')[0]));
    expect(s.strokeIndex).toBe(1);
    s.clearCurrent();
    expect(s.strokeIndex).toBe(0);
    expect(s.selectCell('0-1')).toBe(true);
    expect(s.currentKana).toBe('い');
    s.setLevel(HandwritingLevel.BLIND);
    expect(s.level).toBe('blind');
  });

  it('隨機順序：完成後跳到隨機的未完成假名', () => {
    const s = new HandwritingSession(boardOf(['あ', 'い', 'う']), { order: 'random', random: () => 0.99 });
    expect(s.currentKana).toBe('う');
    writeAll(s, 'う');
    expect(s.currentKana).toBe('い');
  });

  it('寫完整張表發出 SESSION_COMPLETED', () => {
    const s = new HandwritingSession(boardOf(['く', 'し']));
    let done = null;
    s.on(SessionEventTypes.SESSION_COMPLETED, (e) => (done = e));
    writeAll(s, 'く');
    s.submitStroke([...handwrite(strokesOf('し')[0])].reverse()); // 一次錯誤
    writeAll(s, 'し');
    expect(done.mistakes).toBe(1);
    expect(done.totalKeystrokes).toBe(3);
    expect(s.finished).toBe(true);
  });

  it('五十音表（平假名、片假名）每個字都能依標準筆順寫完', () => {
    for (const script of ['hiragana', 'katakana']) {
      const s = new HandwritingSession(GojuonMode.buildBoard(script));
      let guard = 0;
      while (!s.finished && guard++ < 100) {
        const kana = s.currentKana;
        const results = writeAll(s, kana);
        expect({ kana, status: results.at(-1).status }).toEqual({ kana, status: 'completed' });
      }
      expect(s.completedCount).toBe(46);
    }
  });
});
