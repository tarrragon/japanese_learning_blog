/**
 * StrokeMatcher - 筆畫比對
 *
 * 將使用者的筆畫與標準筆畫各自依弧長重新取樣成相同點數，
 * 計算對應點的平均距離。由於點的順序代表書寫方向，
 * 反方向書寫的距離會很大，因此可以同時檢查筆畫方向。
 */

import { resample, meanDistance, boundingBox, fitToBox } from './strokeGeometry.js';

const SAMPLE_POINTS = 32;

/** 各練習等級的容許誤差（KanjiVG 109 座標單位） */
export const STROKE_TOLERANCE = {
  trace: 13,
  hint: 13,
  blind: 15,
};

/**
 * 比對單一筆畫
 * @param {Array<{x: number, y: number}>} userPoints
 * @param {Array<{x: number, y: number}>} expectedPoints
 * @returns {{ distance: number, reversedDistance: number }}
 */
export function compareStroke(userPoints, expectedPoints) {
  const user = resample(userPoints, SAMPLE_POINTS);
  const expected = resample(expectedPoints, SAMPLE_POINTS);
  return {
    distance: meanDistance(user, expected),
    reversedDistance: meanDistance([...user].reverse(), expected),
  };
}

/**
 * 判斷一筆為何不符合
 * @param {Array<{x: number, y: number}>} userPoints
 * @param {Array<Array<{x: number, y: number}>>} expectedStrokes - 該寫法的所有筆畫
 * @param {number} index - 應該寫的筆畫索引
 * @param {number} tolerance
 * @returns {{ reason: 'reversed'|'order'|'shape', actualIndex: number|null }}
 */
export function diagnoseStroke(userPoints, expectedStrokes, index, tolerance) {
  const target = compareStroke(userPoints, expectedStrokes[index]);
  if (target.reversedDistance <= tolerance) {
    return { reason: 'reversed', actualIndex: null };
  }
  for (let j = 0; j < expectedStrokes.length; j++) {
    if (j === index) continue;
    if (compareStroke(userPoints, expectedStrokes[j]).distance <= tolerance) {
      return { reason: 'order', actualIndex: j };
    }
  }
  return { reason: 'shape', actualIndex: null };
}

/**
 * 默寫模式：整個字寫完後，對齊外框再逐筆比對
 * @param {Array<Array<{x: number, y: number}>>} userStrokes
 * @param {Array<Array<{x: number, y: number}>>} expectedStrokes
 * @param {number} tolerance
 * @returns {{ ok: boolean, failedIndex: number|null, reason: string|null, actualIndex: number|null }}
 */
export function compareCharacter(userStrokes, expectedStrokes, tolerance) {
  if (userStrokes.length !== expectedStrokes.length) {
    return { ok: false, failedIndex: null, reason: 'count', actualIndex: null };
  }
  const fitted = fitToBox(userStrokes, boundingBox(expectedStrokes));
  for (let i = 0; i < fitted.length; i++) {
    if (compareStroke(fitted[i], expectedStrokes[i]).distance > tolerance) {
      const diagnosis = diagnoseStroke(fitted[i], expectedStrokes, i, tolerance);
      return { ok: false, failedIndex: i, ...diagnosis };
    }
  }
  return { ok: true, failedIndex: null, reason: null, actualIndex: null };
}
