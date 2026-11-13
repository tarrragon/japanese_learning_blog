/**
 * kanaVariants - 假名筆畫與異體寫法
 *
 * 標準寫法來自 KanjiVG（學校教的筆順）；
 * 常見的異體寫法由標準筆畫「合併相鄰筆畫」或「拆開一筆」衍生而來。
 */

import { KANA_STROKES } from '../../data/kanaStrokes.js';
import { parsePathSegments, segmentsToPoints, pathToPoints, pointsToPath } from './strokeGeometry.js';

/**
 * 異體定義（筆畫索引從 0 開始）
 * - merge: [a, b] 把第 a、b 筆連成一筆
 * - split: { stroke, afterSegment } 把某一筆在第 N 段曲線後拆開
 */
export const KANA_VARIANT_RULES = {
  // さ：第 2、3 筆連寫（印刷體常見）
  'さ': [{ merge: [1, 2] }],
  // き：第 3、4 筆連寫
  'き': [{ merge: [2, 3] }],
  // り：兩筆連寫成一筆
  'り': [{ merge: [0, 1] }],
  // ふ：第 1、2 筆連寫
  'ふ': [{ merge: [0, 1] }],
  // そ：開頭的短筆分開寫（兩筆的そ）
  'そ': [{ split: { stroke: 0, afterSegment: 1 } }],
};

/**
 * @typedef {Object} VariantStroke
 * @property {string} d - SVG path
 * @property {Array<{x: number, y: number}>} points - 取樣點
 */

/**
 * @typedef {Object} KanaVariant
 * @property {string} id - 'standard' 或 'variant-N'
 * @property {boolean} standard
 * @property {VariantStroke[]} strokes
 */

const cache = new Map();

/**
 * 取得假名所有可接受的寫法（第一個為標準寫法）
 * @param {string} kana
 * @returns {KanaVariant[]}
 */
export function getKanaVariants(kana) {
  if (cache.has(kana)) return cache.get(kana);

  const paths = KANA_STROKES[kana];
  if (!paths) return [];

  const standard = {
    id: 'standard',
    standard: true,
    strokes: paths.map((d) => ({ d, points: pathToPoints(d) })),
  };

  const variants = [standard];
  (KANA_VARIANT_RULES[kana] ?? []).forEach((rule, index) => {
    const strokes = applyRule(paths, standard.strokes, rule);
    if (strokes) variants.push({ id: `variant-${index + 1}`, standard: false, strokes });
  });

  cache.set(kana, variants);
  return variants;
}

function applyRule(paths, strokes, rule) {
  if (rule.merge) {
    const [a, b] = rule.merge;
    if (b !== a + 1 || !strokes[a] || !strokes[b]) return null;
    const points = [...strokes[a].points, ...strokes[b].points];
    const merged = { d: pointsToPath(points), points };
    return [...strokes.slice(0, a), merged, ...strokes.slice(b + 1)];
  }

  if (rule.split) {
    const { stroke, afterSegment } = rule.split;
    const segments = parsePathSegments(paths[stroke] ?? '');
    if (afterSegment <= 0 || afterSegment >= segments.length) return null;
    const first = segmentsToPoints(segments.slice(0, afterSegment));
    const second = segmentsToPoints(segments.slice(afterSegment));
    return [
      ...strokes.slice(0, stroke),
      { d: pointsToPath(first), points: first },
      { d: pointsToPath(second), points: second },
      ...strokes.slice(stroke + 1),
    ];
  }

  return null;
}
