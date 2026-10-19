import { analyze } from '../lib/geo.js';
import { PARTS, SCENES, COL } from '../lib/data.js';
import { ParallelMarks, pts } from './Shapes.jsx';

/* 조각의 실제 좌표 (좌우 반전 → 90° 회전) */
export function partWorld(pt) {
  return PARTS[pt.type].u.map(([u, v]) => localToWorld(pt, (u / 20 - .5) * pt.w, (v / 20 - .5) * pt.h));
}
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

/* 건물 캔버스 그림 — 화면과 PNG 저장에 함께 써요 */
export default function StageSvg({ design, showMarks, selId, svgRef, exportMode, ...rest }) {
  const sc = SCENES.find(s => s.id === design.scene) || SCENES[0];
  const sel = !exportMode && design.parts.find(p => p.id === selId);
  return (
    <svg ref={svgRef} viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg" {...rest}>
      <defs>
        <linearGradient id="skyg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={sc.sky[0]} /><stop offset="1" stopColor={sc.sky[1]} /></linearGradient>
      </defs>
      <rect width="800" height="600" fill="url(#skyg)" />
      {sc.id === 'night' && <g fill="#fff">{[[80, 60], [200, 120], [330, 50], [520, 90], [610, 160], [140, 200], [450, 180]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="2.5" />)}</g>}
      <circle cx="700" cy="90" r="40" fill={sc.sun} opacity=".85" />
      {sc.id !== 'night' && <g fill="#fff" opacity=".85"><ellipse cx="150" cy="90" rx="50" ry="16" /><ellipse cx="180" cy="80" rx="30" ry="18" /><ellipse cx="520" cy="60" rx="40" ry="12" /></g>}
      <rect x="0" y="540" width="800" height="60" fill={sc.ground} />
      <line x1="0" y1="540" x2="800" y2="540" stroke={sc.line} strokeWidth="3" />
      <g>
        {design.parts.map(pt => (
          <polygon key={pt.id} className="part" data-id={pt.id} points={pts(partWorld(pt).map(q => q.map(n => +n.toFixed(1))))}
            fill={pt.color} stroke={COL.ink} strokeWidth="3" strokeLinejoin="round" />
        ))}
      </g>
      {showMarks && design.parts.map(pt => design.marked[pt.id] &&
        <ParallelMarks key={'m' + pt.id} P={partWorld(pt)} pairs={analyze(PARTS[pt.type].u).pairs} sw={6} size={9} />)}
      {sel && (() => {
        const W = partWorld(sel), h = localToWorld(sel, sel.w / 2, sel.h / 2);
        return (
          <g>
            <polygon points={pts(W)} fill="none" stroke="#ffb000" strokeWidth="4" strokeDasharray="8 6" pointerEvents="none" />
            <circle cx={h[0]} cy={h[1]} r="16" fill="#ffc93c" stroke={COL.ink} strokeWidth="3" data-resize="1" style={{ cursor: 'nwse-resize' }} />
            <circle cx={h[0]} cy={h[1]} r="28" fill="transparent" data-resize="1" />
          </g>
        );
      })()}
    </svg>
  );
}
