import { SCENES, COL } from '../lib/data.js';
import { partWorld, localToWorld, GROUND } from '../lib/parts.js';
import { pts } from './Shapes.jsx';

export { partWorld, localToWorld, worldToLocal } from '../lib/parts.js';

/* 조각 무늬 — 어떤 색 위에도 보이도록 반투명 선으로 그려요 */
function PatternDefs({ id }) {
  const ink = 'rgba(31,42,68,.28)', light = 'rgba(255,255,255,.45)';
  return (
    <defs>
      <pattern id={`${id}-brick`} width="28" height="16" patternUnits="userSpaceOnUse">
        <path d="M0 .5H28M0 8.5H28M.5 0V8M14.5 8V16" stroke={ink} strokeWidth="1.5" fill="none" />
      </pattern>
      <pattern id={`${id}-stripe`} width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="7" height="14" fill={light} />
      </pattern>
      <pattern id={`${id}-dot`} width="16" height="16" patternUnits="userSpaceOnUse">
        <circle cx="8" cy="8" r="3" fill={light} /><circle cx="8" cy="8" r="3" fill="none" stroke={ink} strokeWidth=".8" />
      </pattern>
      <pattern id={`${id}-tile`} width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M0 .5H20M.5 0V20" stroke={ink} strokeWidth="1.5" fill="none" /><rect x="3" y="3" width="6" height="6" fill={light} />
      </pattern>
    </defs>
  );
}

/* 건물 캔버스 그림 — 화면과 PNG 저장에 함께 써요
   quake: 지진 시험 결과({kind, pivotX, bottom, dir})가 있으면 건물이 흔들려요 */
export default function StageSvg({ design, selId, showGrid, quake, quakeKey, svgRef, exportMode, ...rest }) {
  const sc = SCENES.find(s => s.id === design.scene) || SCENES[0];
  const sel = !exportMode && design.parts.find(p => p.id === selId);
  const pid = exportMode ? 'xp' : 'pt';
  const grid = [];
  if (showGrid && !exportMode) {
    for (let x = 0; x <= 800; x += 20) grid.push(<line key={'x' + x} x1={x} y1="0" x2={x} y2={GROUND} strokeWidth={x % 100 ? .6 : 1.4} />);
    for (let y = 0; y <= GROUND; y += 20) grid.push(<line key={'y' + y} x1="0" y1={y} x2="800" y2={y} strokeWidth={y % 100 ? .6 : 1.4} />);
  }
  const shaking = quake && !exportMode;
  return (
    <svg ref={svgRef} viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg" {...rest}>
      <PatternDefs id={pid} />
      <defs>
        <linearGradient id={`${pid}-sky`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={sc.sky[0]} /><stop offset="1" stopColor={sc.sky[1]} /></linearGradient>
      </defs>
      <g className={shaking ? 'quake-world' : undefined} key={shaking ? 'q' + quakeKey : 'still'}>
        <rect width="800" height="600" fill={`url(#${pid}-sky)`} />
        {sc.id === 'night' && <g fill="#fff">{[[80, 60], [200, 120], [330, 50], [520, 90], [610, 160], [140, 200], [450, 180]].map(([x, y], i) =>
          <circle key={x} className={exportMode ? undefined : 'twinkle'} style={exportMode ? undefined : { animationDelay: `${i * .45}s` }} cx={x} cy={y} r="2.5" />)}</g>}
        {!exportMode && <circle className="sunglow" cx="700" cy="90" r="40" fill={sc.sun} opacity=".35" />}
        <circle cx="700" cy="90" r="40" fill={sc.sun} opacity=".85" />
        {sc.id !== 'night' && <g fill="#fff" opacity=".85" className={exportMode ? undefined : 'cloud'}><ellipse cx="150" cy="90" rx="50" ry="16" /><ellipse cx="180" cy="80" rx="30" ry="18" /><ellipse cx="520" cy="60" rx="40" ry="12" /></g>}
        <rect x="0" y={GROUND} width="800" height={600 - GROUND} fill={sc.ground} />
        <line x1="0" y1={GROUND} x2="800" y2={GROUND} stroke={sc.line} strokeWidth="3" />
        {grid.length > 0 && <g stroke={sc.id === 'night' ? 'rgba(255,255,255,.25)' : 'rgba(31,42,68,.14)'} pointerEvents="none">{grid}</g>}
        <g className={shaking ? `quake-bld ${quake.kind}` : undefined}
          style={shaking ? { transformOrigin: `${quake.kind === 'fall' ? (quake.dir < 0 ? quake.base[0] : quake.base[1]) : quake.pivotX}px ${quake.bottom}px`, '--dir': quake.dir || 1, '--drop': `${GROUND - quake.bottom}px` } : undefined}>
          {design.parts.map(pt => {
            const P = pts(partWorld(pt).map(q => q.map(n => +n.toFixed(1))));
            return (
              <g key={pt.id} className={exportMode ? undefined : 'part'} data-id={pt.id}>
                <polygon points={P} fill={pt.color} data-id={pt.id} />
                {pt.pattern && pt.pattern !== 'none' && <polygon points={P} fill={`url(#${pid}-${pt.pattern})`} data-id={pt.id} />}
                <polygon points={P} fill="none" stroke={COL.ink} strokeWidth="3" strokeLinejoin="round" pointerEvents="none" />
              </g>
            );
          })}
        </g>
      </g>
      {sel && (() => {
        const W = partWorld(sel), h = localToWorld(sel, sel.w / 2, sel.h / 2);
        return (
          <g>
            <polygon className="sel-ring" points={pts(W)} fill="none" stroke="#ffb000" strokeWidth="4" strokeDasharray="8 6" pointerEvents="none" />
            <circle cx={h[0]} cy={h[1]} r="16" fill="#ffc93c" stroke={COL.ink} strokeWidth="3" data-resize="1" style={{ cursor: 'nwse-resize' }} />
            <circle cx={h[0]} cy={h[1]} r="28" fill="transparent" data-resize="1" />
          </g>
        );
      })()}
    </svg>
  );
}
