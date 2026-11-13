/**
 * strokeGeometry - 筆畫幾何運算
 *
 * 純函數，不依賴 DOM：解析 SVG path、取樣、重新取樣、距離與外框計算。
 * 座標系統與 KanjiVG 相同（109 × 109）。
 */

const CURVE_STEPS = 10;

/**
 * 將 SVG path 解析成「段」：每段是一組取樣點（第一點為該段起點）
 * 支援 M/m、L/l、C/c、S/s、Z/z
 * @param {string} d
 * @returns {Array<Array<{x: number, y: number}>>}
 */
export function parsePathSegments(d) {
  const tokens = d.match(/[MmLlCcSsZz]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g) ?? [];
  const segments = [];
  let i = 0;
  let cmd = null;
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  let lastCtrl = null;

  const num = () => parseFloat(tokens[i++]);
  const isCmd = (t) => /^[A-Za-z]$/.test(t);

  while (i < tokens.length) {
    if (isCmd(tokens[i])) {
      cmd = tokens[i++];
    }
    const rel = cmd === cmd.toLowerCase();
    const ox = rel ? x : 0;
    const oy = rel ? y : 0;

    switch (cmd.toUpperCase()) {
      case 'M': {
        x = ox + num();
        y = oy + num();
        startX = x;
        startY = y;
        lastCtrl = null;
        // 後續的座標視為 L
        cmd = rel ? 'l' : 'L';
        break;
      }
      case 'L': {
        const nx = ox + num();
        const ny = oy + num();
        segments.push([{ x, y }, { x: nx, y: ny }]);
        x = nx;
        y = ny;
        lastCtrl = null;
        break;
      }
      case 'C':
      case 'S': {
        let c1;
        if (cmd.toUpperCase() === 'C') {
          c1 = { x: ox + num(), y: oy + num() };
        } else {
          c1 = lastCtrl ? { x: 2 * x - lastCtrl.x, y: 2 * y - lastCtrl.y } : { x, y };
        }
        const c2 = { x: ox + num(), y: oy + num() };
        const end = { x: ox + num(), y: oy + num() };
        segments.push(sampleCubic({ x, y }, c1, c2, end));
        lastCtrl = c2;
        x = end.x;
        y = end.y;
        break;
      }
      case 'Z': {
        segments.push([{ x, y }, { x: startX, y: startY }]);
        x = startX;
        y = startY;
        lastCtrl = null;
        break;
      }
      default:
        i++;
    }
  }
  return segments;
}

function sampleCubic(p0, p1, p2, p3) {
  const points = [];
  for (let s = 0; s <= CURVE_STEPS; s++) {
    const t = s / CURVE_STEPS;
    const mt = 1 - t;
    points.push({
      x: mt * mt * mt * p0.x + 3 * mt * mt * t * p1.x + 3 * mt * t * t * p2.x + t * t * t * p3.x,
      y: mt * mt * mt * p0.y + 3 * mt * mt * t * p1.y + 3 * mt * t * t * p2.y + t * t * t * p3.y,
    });
  }
  return points;
}

/**
 * 將段落串接成一條折線
 * @param {Array<Array<{x: number, y: number}>>} segments
 */
export function segmentsToPoints(segments) {
  const points = [];
  segments.forEach((seg, index) => {
    points.push(...(index === 0 ? seg : seg.slice(1)));
  });
  return points;
}

/** @param {string} d */
export function pathToPoints(d) {
  return segmentsToPoints(parsePathSegments(d));
}

/** 折線轉回 SVG path（用於衍生出的異體筆畫） */
export function pointsToPath(points) {
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join('');
}

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export function pathLength(points) {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += dist(points[i - 1], points[i]);
  return total;
}

/**
 * 依弧長等距重新取樣
 * @param {Array<{x: number, y: number}>} points
 * @param {number} n
 */
export function resample(points, n) {
  if (points.length === 0) return [];
  const total = pathLength(points);
  if (total === 0) return Array.from({ length: n }, () => ({ ...points[0] }));

  const step = total / (n - 1);
  const result = [{ ...points[0] }];
  let acc = 0;
  let prev = points[0];
  let i = 1;

  while (i < points.length && result.length < n) {
    const curr = points[i];
    const d = dist(prev, curr);
    if (d > 0 && acc + d >= step) {
      const t = (step - acc) / d;
      const q = { x: prev.x + t * (curr.x - prev.x), y: prev.y + t * (curr.y - prev.y) };
      result.push(q);
      prev = q;
      acc = 0;
    } else {
      acc += d;
      prev = curr;
      i++;
    }
  }
  while (result.length < n) result.push({ ...points[points.length - 1] });
  return result;
}

/** 對應點的平均距離（長度須相同） */
export function meanDistance(a, b) {
  let total = 0;
  for (let i = 0; i < a.length; i++) total += dist(a[i], b[i]);
  return total / a.length;
}

/**
 * 多條筆畫的外框
 * @param {Array<Array<{x: number, y: number}>>} strokes
 */
export function boundingBox(strokes) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const stroke of strokes) {
    for (const p of stroke) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
  }
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

/**
 * 將筆畫的外框對齊到目標外框（等比例縮放、置中）
 * @param {Array<Array<{x: number, y: number}>>} strokes
 * @param {ReturnType<typeof boundingBox>} target
 */
export function fitToBox(strokes, target) {
  const box = boundingBox(strokes);
  const size = Math.max(box.width, box.height);
  const targetSize = Math.max(target.width, target.height);
  const scale = size > 0 ? targetSize / size : 1;
  const cx = (box.minX + box.maxX) / 2;
  const cy = (box.minY + box.maxY) / 2;
  const tx = (target.minX + target.maxX) / 2;
  const ty = (target.minY + target.maxY) / 2;
  return strokes.map((stroke) =>
    stroke.map((p) => ({ x: tx + (p.x - cx) * scale, y: ty + (p.y - cy) * scale }))
  );
}
