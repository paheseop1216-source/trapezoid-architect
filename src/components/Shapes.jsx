import { analyze, sub, dot } from '../lib/geo.js';
import { COL } from '../lib/data.js';

/* 평행 표시: 쌍마다 다른 색 굵은 선 + 화살 기호(>, >>) — 색만으로 구분하지 않아요 */
export function ParallelMarks({ P, pairs, sw = 7, size = 9 }) {
  const out = [];
  pairs.forEach((pr, k) => {
    const color = k === 0 ? COL.o : COL.b;
    const ref = sub(P[(pr[0] + 1) % 4], P[pr[0]]);
    pr.forEach(i => {
      const a = P[i], b = P[(i + 1) % 4];
      if (sw > 0.5) out.push(<line key={`l${k}${i}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={color} strokeWidth={sw} strokeLinecap="round" />);
      let d = sub(b, a); if (dot(d, ref) < 0) d = [-d[0], -d[1]];
      const L = Math.hypot(d[0], d[1]) || 1, u = [d[0] / L, d[1] / L], n = [-u[1], u[0]];
      const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      for (let c = 0; c <= k; c++) {
        const off = (c - k / 2) * size * 1.1;
        const tip = [m[0] + u[0] * (size * .6 + off), m[1] + u[1] * (size * .6 + off)];
        const back = [tip[0] - u[0] * size, tip[1] - u[1] * size];
        out.push(<polyline key={`a${k}${i}${c}`}
          points={`${back[0] + n[0] * size * .8},${back[1] + n[1] * size * .8} ${tip[0]},${tip[1]} ${back[0] - n[0] * size * .8},${back[1] - n[1] * size * .8}`}
          fill="none" stroke={sw > 0.5 ? '#fff' : color} strokeWidth={size * .55} strokeLinecap="round" strokeLinejoin="round" />);
      }
    });
  });
  return <g pointerEvents="none">{out}</g>;
}

export const pts = P => P.map(q => q.join(',')).join(' ');

/* 카드용 작은 도형 (격자 6×6) */
export function MiniQuad({ p, fill = '#ffe7a3', scale: s = 20, dots = true, marks = false }) {
  const P = p.map(q => [q[0] * s, q[1] * s]);
  const dotEls = [];
  if (dots) for (let x = 0; x <= 6; x++) for (let y = 0; y <= 6; y++) dotEls.push(<circle key={`${x}-${y}`} cx={x * s} cy={y * s} r={s * .07} />);
  return (
    <svg viewBox="-14 -14 148 148" aria-hidden="true">
      <g fill="#cfc7b0">{dotEls}</g>
      <polygon points={pts(P)} fill={fill} stroke={COL.ink} strokeWidth={s * .16} strokeLinejoin="round" />
      {marks && <ParallelMarks P={P} pairs={analyze(p).pairs} sw={s * .22} size={s * .38} />}
    </svg>
  );
}

/* 변신 기록 썸네일: 모양을 가운데에 맞춰 그려요 */
export function QuadThumb({ p }) {
  const xs = p.map(q => q[0]), ys = p.map(q => q[1]);
  const minx = Math.min(...xs), miny = Math.min(...ys), w = Math.max(...xs) - minx, h = Math.max(...ys) - miny, m = Math.max(w, h, 1);
  const s = 100 / m, P = p.map(q => [(q[0] - minx) * s + (100 - w * s) / 2, (q[1] - miny) * s + (100 - h * s) / 2]);
  const an = analyze(p);
  return (
    <svg viewBox="-14 -14 128 128" aria-hidden="true">
      <polygon points={pts(P)} fill={an.trap ? '#fff0c2' : '#eef1f6'} stroke={COL.ink} strokeWidth="4" strokeLinejoin="round" />
      <ParallelMarks P={P} pairs={an.pairs} sw={6} size={9} />
    </svg>
  );
}

/* 로고: 사다리꼴 + 평행 표시 */
export function Logo({ size = 40 }) {
  return (
    <svg viewBox="0 0 40 32" width={size} height={size * .8} aria-hidden="true">
      <polygon points="10,4 30,4 38,28 2,28" fill="#ffc93c" stroke="#1f2a44" strokeWidth="3" strokeLinejoin="round" />
      <path d="M17 4 l3 0 M17 28 l3 0" stroke="#1f2a44" strokeWidth="2" />
    </svg>
  );
}
