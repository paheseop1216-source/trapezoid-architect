import { PARTS } from './data.js';

/* 조각의 실제 좌표 (좌우 반전 → 90° 회전) */
export function localToWorld(pt, x, y) {
  if (pt.flip) x = -x;
  for (let r = 0; r < (pt.rot || 0); r++) { const t = x; x = -y; y = t; }
  return [pt.cx + x, pt.cy + y];
}
export function worldToLocal(pt, X, Y) {
  let x = X - pt.cx, y = Y - pt.cy;
  for (let r = 0; r < (pt.rot || 0); r++) { const t = x; x = y; y = -t; }
  if (pt.flip) x = -x;
  return [x, y];
}
export function partWorld(pt) {
  return PARTS[pt.type].u.map(([u, v]) => localToWorld(pt, (u / 20 - .5) * pt.w, (v / 20 - .5) * pt.h));
}

export const GROUND = 540;

/* 높이 y에서 건물의 가장 왼쪽·오른쪽 끝 */
function spanAt(polys, y) {
  let lo = Infinity, hi = -Infinity;
  for (const W of polys) for (let i = 0; i < 4; i++) {
    const a = W[i], b = W[(i + 1) % 4];
    if ((a[1] - y) * (b[1] - y) > 0 || a[1] === b[1]) {
      if (a[1] === y && b[1] === y) { lo = Math.min(lo, a[0], b[0]); hi = Math.max(hi, a[0], b[0]); }
      continue;
    }
    const x = a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]);
    lo = Math.min(lo, x); hi = Math.max(hi, x);
  }
  return hi > lo ? [lo, hi] : null;
}
const avgWidth = (polys, y0, y1) => {
  let s = 0, n = 0;
  for (let k = 0; k <= 8; k++) { const sp = spanAt(polys, y0 + (y1 - y0) * k / 8); if (sp) { s += sp[1] - sp[0]; n++; } }
  return n ? s / n : 0;
};
function areaCentroid(W) {
  let A = 0, cx = 0;
  for (let i = 0; i < 4; i++) { const [x0, y0] = W[i], [x1, y1] = W[(i + 1) % 4], c = x0 * y1 - x1 * y0; A += c; cx += (x0 + x1) * c; }
  A /= 2; return A ? { a: Math.abs(A), x: cx / (6 * A) } : { a: 0, x: W[0][0] };
}

/* 지진 시험: 아래가 넓을수록 튼튼해요 (4학년 수준의 간단한 규칙)
   - 땅에 닿지 않으면 → 떨어져요
   - 건물 전체의 가운데가 바닥 너비 밖으로 나가면 → 넘어져요
   - 아래 너비 ÷ 위 너비가 클수록 별이 많아요 */
export function stability(parts) {
  const polys = parts.map(partWorld);
  if (!polys.length) return null;
  const ys = polys.flat().map(q => q[1]);
  const top = Math.min(...ys), bottom = Math.max(...ys), h = bottom - top;
  if (h < 20) return null;
  const pivot = (spanAt(polys, bottom - 1) || [400, 400]).map(v => v);
  if (GROUND - bottom > 12) return { grade: 0, kind: 'float', top, bottom, pivotX: (pivot[0] + pivot[1]) / 2, text: '건물이 땅에 닿지 않았어요! 가장 아래 조각을 땅까지 내려 보세요.' };
  const bw = avgWidth(polys, bottom - h * .2, bottom - 1), tw = avgWidth(polys, top + 1, top + h * .2);
  const base = spanAt(polys, bottom - Math.min(6, h * .05)) || pivot;
  let A = 0, X = 0; polys.forEach(W => { const c = areaCentroid(W); A += c.a; X += c.a * c.x; });
  const mid = A ? X / A : (base[0] + base[1]) / 2;
  const ratio = tw ? bw / tw : 3;
  const res = { top, bottom, ratio, base, pivotX: mid };
  if (mid < base[0] || mid > base[1]) return { ...res, grade: 0, kind: 'fall', dir: mid < base[0] ? -1 : 1, text: '건물이 한쪽으로 기울어져 넘어졌어요. 아래를 더 넓게 받쳐 볼까요?' };
  if (ratio >= 1.15) return { ...res, grade: 3, kind: 'strong', text: '아래가 위보다 넓어서 흔들려도 끄떡없어요! 사다리꼴의 힘이에요. 🏆' };
  if (ratio >= .85) return { ...res, grade: 2, kind: 'ok', text: '조금 흔들렸지만 잘 버텼어요. 아래를 더 넓게 하면 더 튼튼해질 거예요.' };
  return { ...res, grade: 1, kind: 'wobble', text: '위가 아래보다 넓어서 많이 흔들렸어요! 아래가 넓은 사다리꼴 조각을 써 볼까요?' };
}
