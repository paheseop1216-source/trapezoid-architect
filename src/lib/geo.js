/* 도형 엔진 (정수 격자 좌표 → 오차 없음)
   - 변 i: 꼭짓점 i → i+1
   - 마주 보는 변: (0,2), (1,3)  ← CLAUDE.md의 1-3, 2-4 */

export const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
export const cross = (a, b) => a[0] * b[1] - a[1] * b[0];
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
export const dir = (p, i) => sub(p[(i + 1) % 4], p[i]);
export const parallel = (p, i, j) => cross(dir(p, i), dir(p, j)) === 0;

export function hasCollinear(p) {
  for (let i = 0; i < 4; i++) {
    const a = p[i], b = p[(i + 1) % 4], c = p[(i + 2) % 4];
    if (cross(sub(b, a), sub(c, a)) === 0) return true;
  }
  return false;
}

export function properCross(a, b, c, d) {
  const s = Math.sign;
  const d1 = s(cross(sub(b, a), sub(c, a))), d2 = s(cross(sub(b, a), sub(d, a)));
  const d3 = s(cross(sub(d, c), sub(a, c))), d4 = s(cross(sub(d, c), sub(b, c)));
  return d1 * d2 < 0 && d3 * d4 < 0;
}

export function kind(p, count) {
  if (count < 2) return count === 1 ? '사다리꼴' : '사각형';
  const d0 = dir(p, 0), d1 = dir(p, 1);
  const right = dot(d0, d1) === 0, eq = dot(d0, d0) === dot(d1, d1);
  if (right && eq) return '정사각형';
  if (right) return '직사각형';
  if (eq) return '마름모';
  return '평행사변형';
}

export function analyze(p) {
  if (hasCollinear(p)) return { valid: false, reason: 'line', pairs: [], count: 0, trap: false };
  if (properCross(p[0], p[1], p[2], p[3]) || properCross(p[1], p[2], p[3], p[0]))
    return { valid: false, reason: 'cross', pairs: [], count: 0, trap: false };
  const pairs = [];
  if (parallel(p, 0, 2)) pairs.push([0, 2]);
  if (parallel(p, 1, 3)) pairs.push([1, 3]);
  return { valid: true, pairs, count: pairs.length, trap: pairs.length >= 1, kind: kind(p, pairs.length) };
}

/* 두 직선(무한히 늘인 선)의 교점 — 평행하면 null */
export function lineIntersect(a, b, c, d) {
  const r = sub(b, a), s = sub(d, c), den = cross(r, s);
  if (den === 0) return null;
  const t = cross(sub(c, a), s) / den;
  return [a[0] + r[0] * t, a[1] + r[1] * t];
}

export function extendLine(a, b, len = 2000) {
  const d = sub(b, a), L = Math.hypot(d[0], d[1]), u = [d[0] / L, d[1] / L];
  return [[a[0] - u[0] * len, a[1] - u[1] * len], [b[0] + u[0] * len, b[1] + u[1] * len]];
}

export const SELF_TESTS = [
  ['직사각형', [[0,0],[4,0],[4,2],[0,2]], true, 2],
  ['정사각형', [[0,0],[3,0],[3,3],[0,3]], true, 2],
  ['평행사변형', [[1,0],[5,0],[4,2],[0,2]], true, 2],
  ['마름모', [[2,0],[4,3],[2,6],[0,3]], true, 2],
  ['사다리꼴', [[1,0],[3,0],[4,2],[0,2]], true, 1],
  ['돌린 사다리꼴', [[0,0],[2,1],[2,3],[0,4]], true, 1],
  ['일반 사각형', [[0,0],[5,1],[4,5],[1,4]], false, 0],
  ['꼬인 사각형', [[0,0],[4,2],[4,0],[0,2]], null, 0],
  ['세 점 일직선', [[0,0],[2,0],[4,0],[2,3]], null, 0],
  ['겹친 꼭짓점', [[0,0],[0,0],[4,0],[2,3]], null, 0],
];

export function selfTest() {
  return SELF_TESTS.map(([name, p, trap, cnt]) => {
    const r = analyze(p);
    const ok = trap === null ? !r.valid : (r.valid && r.trap === trap && r.count === cnt);
    return { name, ok, r };
  });
}
