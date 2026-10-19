import { useRef, useState } from 'react';
import { useApp } from '../lib/store.jsx';
import { analyze } from '../lib/geo.js';
import { MISSIONS, RECT0, GW, GH, CELL, LABELS, COL } from '../lib/data.js';
import { ParallelMarks, QuadThumb, pts } from '../components/Shapes.jsx';
import Design from './Design.jsx';
import { Field, QCard, TeacherMemo, PageHead, Feedback, SideTabs } from '../components/ui.jsx';
import { svgPoint, useTouchLock, capture } from '../lib/touch.js';

const isRect = p => { const a = analyze(p); return a.valid && (a.kind === '직사각형' || a.kind === '정사각형'); };

/* ---------- ① 사다리꼴 변신 실험 ---------- */
function Morph() {
  const { state, update, toast, celebrate } = useApp();
  const [dragV, setDragV] = useState(-1);           // 화면 표시용 (노란 꼭짓점)
  const drag = useRef(null);                         // 실제 끌기 상태 — 바로 반영돼서 첫 움직임도 놓치지 않아요
  const [tab, setTab] = useState('mission');
  const svgRef = useRef(null);
  useTouchLock(svgRef);
  const p = state.a2.pts, an = analyze(p);

  /* 꼭짓점 옮기는 두 가지 방법 (마우스·손가락·펜 모두)
     ① 끌기: 꼭짓점을 누른 채 끌어요
     ② 콕콕: 꼭짓점을 톡 누르면 노랗게 고르고 → 옮길 모눈 점을 톡 누르면 그리로 가요
     꼭짓점은 좌표 계산 없이 '누른 그림'으로 바로 찾아서, 기기마다 좌표가 어긋나도 잡혀요. */
  const [selV, setSelV] = useState(-1);
  const toGrid = pt => [Math.max(0, Math.min(GW, Math.round(pt.x / CELL))), Math.max(0, Math.min(GH, Math.round(pt.y / CELL)))];
  const checkMissions = now => {
    const a = analyze(now), m = state.a2.missions, got = {};
    if (a.valid) {
      const moved = now.filter((q, i) => q[0] !== state.a2.base[i][0] || q[1] !== state.a2.base[i][1]).length;
      if (moved === 1 && a.trap && isRect(state.a2.base) && !m.m1) got.m1 = true;
      if (a.count === 2 && !isRect(now) && !m.m2) got.m2 = true;
      if (a.count === 0 && !m.m3) got.m3 = true;
    }
    if (Object.keys(got).length) { update(d => Object.assign(d.a2.missions, got)); toast('🎯 미션 성공!'); celebrate(); }
  };
  const onDown = e => {
    const svg = svgRef.current, pt = svgPoint(svg, e);
    const hit = e.target.closest && e.target.closest('[data-v]');
    let i = hit ? +hit.getAttribute('data-v') : -1;
    if (i < 0) {   /* 꼭짓점 근처를 눌렀을 때 (손가락은 범위를 넓게, 한 칸 = 50) */
      let best = e.pointerType === 'mouse' ? 40 : 60;
      p.forEach((q, k) => { const d = Math.hypot(q[0] * CELL - pt.x, q[1] * CELL - pt.y); if (d < best) { best = d; i = k; } });
    }
    e.preventDefault();
    if (i < 0) {   /* 빈 곳: 골라 둔 꼭짓점이 있으면 그 점으로 옮겨요 */
      if (selV >= 0) {
        const g = toGrid(pt);
        update(d => { d.a2.pts[selV] = g; });
        checkMissions(p.map((q, k) => (k === selV ? g : q)));
        setSelV(-1);
      }
      return;
    }
    drag.current = { i, id: e.pointerId, last: p[i], moved: false };
    setDragV(i); capture(svg, e);
  };
  const onMove = e => {
    const dr = drag.current; if (!dr || e.pointerId !== dr.id) return;
    e.preventDefault();
    const [x, y] = toGrid(svgPoint(svgRef.current, e));
    if (dr.last[0] !== x || dr.last[1] !== y) { dr.last = [x, y]; dr.moved = true; update(d => { d.a2.pts[dr.i] = [x, y]; }); }
  };
  const onUp = e => {
    const dr = drag.current; if (!dr || (e && e.pointerId !== dr.id)) return;
    drag.current = null; setDragV(-1);
    if (!dr.moved) { if (e && e.type === 'pointerup') setSelV(s => (s === dr.i ? -1 : dr.i)); return; }   // 톡 누르기 = 고르기
    setSelV(-1);
    checkMissions(p.map((q, k) => (k === dr.i ? dr.last : q)));
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
        <PageHead kicker="활동2 · 사다리꼴 변신 실험" title="꼭짓점을 끌어서 모양을 바꿔 보세요">
          <span className="morph-help">{selV >= 0
            ? <span className="pick-hint">👆 꼭짓점 {LABELS[selV]}을(를) 골랐어요. 옮길 모눈 점을 눌러요. (다시 누르면 취소)</span>
            : '꼭짓점을 끌거나, 꼭짓점을 톡 누른 뒤 옮길 모눈 점을 톡 눌러도 돼요.'}</span>
        </PageHead>
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
                    <g key={i} className={'vtx' + (selV === i ? ' picked' : '')} data-v={i} style={{ cursor: 'grab' }}>
                      <circle cx={q[0]} cy={q[1]} r="34" fill="#fff" fillOpacity="0.001" />
                      {dragV === i && <circle key={`${q[0]}-${q[1]}`} className="snap-ring" cx={q[0]} cy={q[1]} r="18" fill="none" stroke="#ffc93c" strokeWidth="4" />}
                      {selV === i && <circle className="pick-ring" cx={q[0]} cy={q[1]} r="24" fill="none" stroke="#ffb000" strokeWidth="4" strokeDasharray="6 5" pointerEvents="none" />}
                      <circle cx={q[0]} cy={q[1]} r={dragV === i || selV === i ? 18 : 14} fill={dragV === i || selV === i ? '#ffc93c' : '#fff'} stroke={COL.ink} strokeWidth="4" />
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
