import { useRef, useState } from 'react';
import { useApp } from '../lib/store.jsx';
import { analyze } from '../lib/geo.js';
import { MISSIONS, RECT0, GW, GH, CELL, LABELS, COL } from '../lib/data.js';
import { ParallelMarks, QuadThumb, pts } from '../components/Shapes.jsx';
import Design from './Design.jsx';
import { Field, QCard, TeacherMemo, PageHead, Feedback, SideTabs } from '../components/ui.jsx';

function svgPoint(svg, e) {
  const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
  return pt.matrixTransform(svg.getScreenCTM().inverse());
}
const isRect = p => { const a = analyze(p); return a.valid && (a.kind === '직사각형' || a.kind === '정사각형'); };

/* ---------- ① 사다리꼴 변신 실험 ---------- */
function Morph() {
  const { state, update, toast, celebrate } = useApp();
  const [dragV, setDragV] = useState(-1);
  const [tab, setTab] = useState('mission');
  const svgRef = useRef(null);
  const p = state.a2.pts, an = analyze(p);

  const onDown = e => {
    const svg = svgRef.current, pt = svgPoint(svg, e);
    let i = -1, best = 40;
    p.forEach((q, k) => { const d = Math.hypot(q[0] * CELL - pt.x, q[1] * CELL - pt.y); if (d < best) { best = d; i = k; } });
    if (i < 0) return;
    setDragV(i); svg.setPointerCapture(e.pointerId); e.preventDefault();
  };
  const onMove = e => {
    if (dragV < 0) return;
    const pt = svgPoint(svgRef.current, e);
    const x = Math.max(0, Math.min(GW, Math.round(pt.x / CELL))), y = Math.max(0, Math.min(GH, Math.round(pt.y / CELL)));
    const q = p[dragV];
    if (q[0] !== x || q[1] !== y) update(d => { d.a2.pts[dragV] = [x, y]; });
  };
  const onUp = () => {
    if (dragV < 0) return; setDragV(-1);
    const a = analyze(p), m = state.a2.missions, got = {};
    if (a.valid) {
      const moved = p.filter((q, i) => q[0] !== state.a2.base[i][0] || q[1] !== state.a2.base[i][1]).length;
      if (moved === 1 && a.trap && isRect(state.a2.base) && !m.m1) got.m1 = true;
      if (a.count === 2 && !isRect(p) && !m.m2) got.m2 = true;
      if (a.count === 0 && !m.m3) got.m3 = true;
    }
    if (Object.keys(got).length) { update(d => Object.assign(d.a2.missions, got)); toast('🎯 미션 성공!'); celebrate(); }
  };
  const record = () => {
    if (!an.valid) return toast('사각형이 아닌 모양은 기록할 수 없어요.');
    if (state.a2.records.length >= 6) return toast('기록은 6개까지예요. ✕로 하나를 지워 주세요.');
    update(d => { d.a2.records.push(d.a2.pts.map(q => q.slice())); d.a2.base = d.a2.pts.map(q => q.slice()); });
    toast('📸 기록했어요!'); setTab('records');
  };

  let fb;
  if (!an.valid) fb = { kind: 'bad', text: an.reason === 'cross' ? '사각형이 아니에요. 변끼리 꼬여서 서로 지나가요. 꼭짓점을 옮겨 보세요.' : '사각형이 아니에요. 세 꼭짓점이 한 직선 위에 있어요(또는 꼭짓점이 겹쳤어요).' };
  else if (an.count === 2) fb = { kind: 'good', text: `평행한 변이 2쌍이에요 (${an.kind}). 한 쌍 이상이니 사다리꼴이에요!` };
  else if (an.count === 1) fb = { kind: 'good', text: '평행한 변이 1쌍 있어요. 사다리꼴이에요!' };
  else fb = { kind: 'hint', text: '평행한 변이 없어요. 사다리꼴이 아닌 사각형이에요.' };

  const P = p.map(q => [q[0] * CELL, q[1] * CELL]);
  const cx = P.reduce((s, q) => s + q[0], 0) / 4, cy = P.reduce((s, q) => s + q[1], 0) / 4;
  const grid = [];
  for (let x = 0; x <= GW; x++) grid.push(<line key={'x' + x} x1={x * CELL} y1={0} x2={x * CELL} y2={GH * CELL} />);
  for (let y = 0; y <= GH; y++) grid.push(<line key={'y' + y} x1={0} y1={y * CELL} x2={GW * CELL} y2={y * CELL} />);
  const dots = [];
  for (let x = 0; x <= GW; x++) for (let y = 0; y <= GH; y++) dots.push(<circle key={`${x}-${y}`} cx={x * CELL} cy={y * CELL} r="4" />);
  const doneM = MISSIONS.filter(m => state.a2.missions[m.id]).length;

  return (
    <>
      <section className="card fit">
        <PageHead kicker="활동2 · 사다리꼴 변신 실험" title="꼭짓점을 끌어서 모양을 바꿔 보세요" />
        <div className="morph">
          <div className="board-col">
            <div className="fitbox" style={{ '--ar': 660 / 460 }}>
              <svg ref={svgRef} className="board" viewBox="-30 -30 660 460" aria-label="모눈 점판"
                onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
                <g stroke="#eee6d2" strokeWidth="1.5">{grid}</g>
                <g fill="#bdb49c">{dots}</g>
                <polygon points={pts(P)} fill={an.valid ? (an.trap ? '#fff0c2' : '#eef1f6') : '#fde8e8'} stroke={an.valid ? COL.ink : COL.red}
                  strokeWidth="6" strokeLinejoin="round" strokeDasharray={an.valid ? undefined : '12 8'} />
                {an.valid && <g className="marks-in" key={an.pairs.map(p => p.join('')).join('|')}><ParallelMarks P={P} pairs={an.pairs} sw={9} size={13} /></g>}
                {P.map((q, i) => {
                  const d = [q[0] - cx, q[1] - cy], L = Math.hypot(...d) || 1;
                  return (
                    <g key={i} className="vtx" style={{ cursor: 'grab' }}>
                      <circle cx={q[0]} cy={q[1]} r="30" fill="transparent" />
                      {dragV === i && <circle key={`${q[0]}-${q[1]}`} className="snap-ring" cx={q[0]} cy={q[1]} r="18" fill="none" stroke="#ffc93c" strokeWidth="4" />}
                      <circle cx={q[0]} cy={q[1]} r={dragV === i ? 18 : 14} fill={dragV === i ? '#ffc93c' : '#fff'} stroke={COL.ink} strokeWidth="4" />
                      <text x={q[0] + d[0] / L * 34} y={q[1] + d[1] / L * 34 + 8} textAnchor="middle" fontSize="22" fill={COL.ink} pointerEvents="none">{LABELS[i]}</text>
                    </g>
                  );
                })}
              </svg>
            </div>
            <div className="tools">
              <button className="btn primary" onClick={record}>📸 변신 기록 <span className="muted-on">({state.a2.records.length}/6)</span></button>
              <button className="btn ghost" onClick={() => update(d => { d.a2.pts = RECT0.map(q => q.slice()); d.a2.base = RECT0.map(q => q.slice()); })}>▭ 직사각형으로</button>
            </div>
          </div>
          <div className="side">
            <div className="stat"><span>평행한 변</span>
              <span className="pills">{[0, 1, 2].map(n => <span key={n} className={'pill' + (an.valid && an.count === n ? ' on' : '')}>{n}쌍</span>)}</span>
            </div>
            <div className={'stat big ' + (!an.valid ? '' : an.trap ? 'yes' : 'no')}><span>사다리꼴인가요?</span><span className="v">{!an.valid ? '—' : an.trap ? '✅ 예' : '❌ 아니요'}</span></div>
            <Feedback fb={fb} />
            <SideTabs value={tab} onChange={setTab} tabs={[
              { id: 'mission', label: `🎯 미션 ${doneM}/3` },
              { id: 'records', label: `📸 기록 ${state.a2.records.length}` },
              { id: 'opinion', label: '✏️ 내 생각' },
            ]} />
            <div className="side-body" key={tab}>
              {tab === 'mission' && MISSIONS.map((m, i) => (
                <div key={m.id} className={'mission' + (state.a2.missions[m.id] ? ' done' : '')}>
                  <span className="ck">{state.a2.missions[m.id] ? '✓' : i + 1}</span><span>{m.t}</span>
                </div>
              ))}
              {tab === 'records' && (state.a2.records.length === 0
                ? <p className="muted">모양을 바꾼 뒤 📸 변신 기록을 눌러 보세요. 나란히 놓고 비교할 수 있어요.</p>
                : <div className="records">{state.a2.records.map((r, i) => {
                  const a = analyze(r);
                  return (
                    <div key={i} className="rec pop">
                      <QuadThumb p={r} />
                      <div className="lab">{i + 1}. {a.count}쌍 {a.trap ? '✅' : '❌'}</div>
                      <button className="x" aria-label={`${i + 1}번 기록 지우기`} onClick={() => update(d => { d.a2.records.splice(i, 1); })}>✕</button>
                    </div>
                  );
                })}</div>)}
              {tab === 'opinion' && <>
                <QCard>모양이 달라졌는데 공통된 수학적 성질은 무엇일까요?</QCard>
                <Field multiline path="a2.opinion" maxLength={200} placeholder="변신 기록을 비교하며 내 생각을 써 보세요." aria-label="공통된 성질에 대한 내 생각" />
              </>}
            </div>
          </div>
        </div>
      </section>
      <TeacherMemo title="변신 실험">
        <p>• 평행한 변이 1쌍이든 2쌍이든 '사다리꼴인가요? ✅'가 유지돼요. 기록을 나란히 놓고 '모양은 달라도 평행한 변이 있다'는 공통점을 끌어내요.</p>
        <p>• 꼭짓점을 겹치거나 변이 꼬이게 만들면 '사각형이 아니에요'라고 안내돼요. 왜 사각형이 아닌지 이야기해 볼 수 있어요.</p>
        <p>• 기대 답: "평행한 변이 한 쌍 이상 있어요."</p>
      </TeacherMemo>
    </>
  );
}

export default function Activity2({ sub }) {
  return sub === 'a2:design' ? <Design /> : <Morph />;
}
