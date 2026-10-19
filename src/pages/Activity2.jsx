import { useRef, useState } from 'react';
import { useApp } from '../lib/store.jsx';
import { analyze } from '../lib/geo.js';
import { MISSIONS, RECT0, GW, GH, CELL, LABELS, COL, PARTS, DEFAULT_POS, SWATCH, SCENES } from '../lib/data.js';
import { ParallelMarks, QuadThumb, pts } from '../components/Shapes.jsx';
import StageSvg, { worldToLocal } from '../components/StageSvg.jsx';
import { Field, QCard, TeacherMemo, PageHead, Feedback } from '../components/ui.jsx';
import { designPng, downloadBlob, fileName } from '../lib/exportImage.jsx';

function svgPoint(svg, e) {
  const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
  return pt.matrixTransform(svg.getScreenCTM().inverse());
}
const isRect = p => { const a = analyze(p); return a.valid && (a.kind === '직사각형' || a.kind === '정사각형'); };

/* ---------- ① 사다리꼴 변신 실험 ---------- */
function Morph() {
  const { state, update, toast, celebrate } = useApp();
  const [dragV, setDragV] = useState(-1);
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
    toast('📸 기록했어요!');
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
      <section className="card">
        <PageHead kicker="활동2 · 사다리꼴 변신 실험" title="꼭짓점을 끌어서 모양을 바꿔 보세요" />
        <div className="morph">
          <div>
            <svg ref={svgRef} className="board" viewBox="-30 -30 660 460" aria-label="모눈 점판"
              onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
              <g stroke="#eee6d2" strokeWidth="1.5">{grid}</g>
              <g fill="#bdb49c">{dots}</g>
              <polygon points={pts(P)} fill={an.valid ? (an.trap ? '#fff0c2' : '#eef1f6') : '#fde8e8'} stroke={an.valid ? COL.ink : COL.red}
                strokeWidth="6" strokeLinejoin="round" strokeDasharray={an.valid ? undefined : '12 8'} />
              {an.valid && <ParallelMarks P={P} pairs={an.pairs} sw={9} size={13} />}
              {P.map((q, i) => {
                const d = [q[0] - cx, q[1] - cy], L = Math.hypot(...d) || 1;
                return (
                  <g key={i} className="vtx" style={{ cursor: 'grab' }}>
                    <circle cx={q[0]} cy={q[1]} r="30" fill="transparent" />
                    <circle cx={q[0]} cy={q[1]} r={dragV === i ? 18 : 14} fill={dragV === i ? '#ffc93c' : '#fff'} stroke={COL.ink} strokeWidth="4" />
                    <text x={q[0] + d[0] / L * 34} y={q[1] + d[1] / L * 34 + 8} textAnchor="middle" fontSize="22" fill={COL.ink} pointerEvents="none">{LABELS[i]}</text>
                  </g>
                );
              })}
            </svg>
            <div className="tools">
              <button className="btn primary" onClick={record}>📸 변신 기록</button>
              <button className="btn ghost" onClick={() => update(d => { d.a2.pts = RECT0.map(q => q.slice()); d.a2.base = RECT0.map(q => q.slice()); })}>▭ 직사각형으로 되돌리기</button>
            </div>
          </div>
          <div className="stack">
            <div className="stat"><span>평행한 변</span>
              <span className="pills">{[0, 1, 2].map(n => <span key={n} className={'pill' + (an.valid && an.count === n ? ' on' : '')}>{n}쌍</span>)}</span>
            </div>
            <div className={'stat big ' + (!an.valid ? '' : an.trap ? 'yes' : 'no')}><span>사다리꼴인가요?</span><span className="v">{!an.valid ? '—' : an.trap ? '✅ 예' : '❌ 아니요'}</span></div>
            <Feedback fb={fb} />
            <div>
              <h3 className="row-h">🎯 미션 <span className="muted">{doneM}/3</span></h3>
              {MISSIONS.map((m, i) => (
                <div key={m.id} className={'mission' + (state.a2.missions[m.id] ? ' done' : '')}>
                  <span className="ck">{state.a2.missions[m.id] ? '✓' : i + 1}</span><span>{m.t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <h3 className="row-h">📸 변신 기록 <span className="muted">({state.a2.records.length}/6)</span></h3>
        <div className="records">
          {state.a2.records.length === 0
            ? <p className="muted">모양을 바꾼 뒤 📸 변신 기록을 눌러 보세요. 나란히 놓고 비교할 수 있어요.</p>
            : state.a2.records.map((r, i) => {
              const a = analyze(r);
              return (
                <div key={i} className="rec pop">
                  <QuadThumb p={r} />
                  <div className="lab">{i + 1}. 평행 {a.count}쌍 {a.trap ? '✅' : '❌'}</div>
                  <button className="x" aria-label={`${i + 1}번 기록 지우기`} onClick={() => update(d => { d.a2.records.splice(i, 1); })}>✕</button>
                </div>
              );
            })}
        </div>
        <QCard>모양이 달라졌는데 공통된 수학적 성질은 무엇일까요?</QCard>
        <Field multiline path="a2.opinion" maxLength={200} placeholder="내 생각을 써 보세요." aria-label="공통된 성질에 대한 내 생각" />
      </section>
      <TeacherMemo title="변신 실험">
        <p>• 평행한 변이 1쌍이든 2쌍이든 '사다리꼴인가요? ✅'가 유지돼요. 기록을 나란히 놓고 '모양은 달라도 평행한 변이 있다'는 공통점을 끌어내요.</p>
        <p>• 꼭짓점을 겹치거나 변이 꼬이게 만들면 '사각형이 아니에요'라고 안내돼요. 왜 사각형이 아닌지 이야기해 볼 수 있어요.</p>
        <p>• 기대 답: "평행한 변이 한 쌍 이상 있어요."</p>
      </TeacherMemo>
    </>
  );
}

/* ---------- ② 사다리꼴 건물 디자인 ---------- */
function PaletteIcon({ d }) {
  const sc = Math.min(100 / d.w, 70 / d.h);
  const P = d.u.map(([u, v]) => [50 + (u / 20 - .5) * d.w * sc, 35 + (v / 20 - .5) * d.h * sc]);
  return <svg viewBox="-4 -4 108 78" aria-hidden="true"><polygon points={pts(P)} fill={d.color} stroke={COL.ink} strokeWidth="3" strokeLinejoin="round" /></svg>;
}

function Design() {
  const { state, update, toast } = useApp();
  const D = state.design;
  const [selId, setSelId] = useState(null);
  const [checkOn, setCheckOn] = useState(false);
  const [fb, setFb] = useState(null);
  const svgRef = useRef(null);
  const drag = useRef(null);
  const sel = D.parts.find(p => p.id === selId);

  const addPart = type => {
    const d = PARTS[type], [cx, cy] = DEFAULT_POS[type] || [400, 300];
    const off = D.parts.filter(p => p.type === type).length * 18, id = 'p' + D.nextId;
    update(s => { s.design.parts.push({ id, type, cx: cx + off, cy: cy + off * .5, w: d.w, h: d.h, color: d.color, flip: false, rot: 0 }); s.design.nextId++; });
    setSelId(id); setCheckOn(false);
  };
  const edit = fn => update(s => { const p = s.design.parts.find(x => x.id === selId); if (p) fn(p, s.design); });

  const onDown = e => {
    const pt = svgPoint(svgRef.current, e);
    if (e.target.dataset.resize && sel) { drag.current = { mode: 'resize' }; svgRef.current.setPointerCapture(e.pointerId); e.preventDefault(); return; }
    const id = e.target.dataset && e.target.dataset.id;
    if (checkOn) {
      if (!id) return;
      const p = D.parts.find(x => x.id === id), on = !D.marked[id];
      const all = D.parts.every(x => x.id === id ? on : D.marked[x.id]);
      update(s => { s.design.marked[id] = on; if (all) s.design.checkDone = true; });
      if (all) setFb({ kind: 'good', text: '🎉 모든 조각을 찾았어요! 내 건물의 조각은 모두 평행한 변이 있어서 전부 사다리꼴이에요.' });
      else if (on) setFb({ kind: 'good', text: p.type === 'rect' ? `${PARTS[p.type].label} 조각도 사다리꼴이 맞아요! 평행한 변이 2쌍이거든요. 👏` : `${PARTS[p.type].label} 조각은 평행한 변이 ${analyze(PARTS[p.type].u).count}쌍 있어요. 사다리꼴이에요!` });
      else setFb(null);
      return;
    }
    if (!id) { setSelId(null); return; }
    const p = D.parts.find(x => x.id === id);
    setSelId(id); drag.current = { mode: 'move', off: [p.cx - pt.x, p.cy - pt.y], id };
    svgRef.current.setPointerCapture(e.pointerId); e.preventDefault();
  };
  const onMove = e => {
    const dr = drag.current; if (!dr) return;
    const pt = svgPoint(svgRef.current, e);
    update(s => {
      const p = s.design.parts.find(x => x.id === (dr.id || selId)); if (!p) return;
      if (dr.mode === 'move') {
        p.cx = Math.max(0, Math.min(800, Math.round((pt.x + dr.off[0]) / 5) * 5));
        p.cy = Math.max(0, Math.min(600, Math.round((pt.y + dr.off[1]) / 5) * 5));
      } else {
        const [lx, ly] = worldToLocal(p, pt.x, pt.y);
        p.w = Math.max(30, Math.min(780, Math.round(Math.abs(lx)) * 2)); p.h = Math.max(20, Math.min(580, Math.round(Math.abs(ly)) * 2));
      }
    });
  };
  const onUp = () => { drag.current = null; };

  const act = a => {
    if (a === 'del') { update(s => { s.design.parts = s.design.parts.filter(x => x.id !== selId); delete s.design.marked[selId]; }); setSelId(null); return; }
    if (a === 'dup') { const id = 'p' + D.nextId; update(s => { const p = s.design.parts.find(x => x.id === selId); s.design.parts.push({ ...p, id, cx: p.cx + 20, cy: p.cy + 20 }); s.design.nextId++; }); setSelId(id); return; }
    if (a === 'front') { update(s => { const p = s.design.parts.find(x => x.id === selId); s.design.parts = s.design.parts.filter(x => x !== p).concat([p]); }); return; }
    edit(p => {
      if (a === 'flip') p.flip = !p.flip;
      if (a === 'rot') p.rot = ((p.rot || 0) + 1) % 4;
      if (a === 'bigger') { p.w = Math.min(780, Math.round(p.w * 1.15)); p.h = Math.min(580, Math.round(p.h * 1.15)); }
      if (a === 'smaller') { p.w = Math.max(30, Math.round(p.w / 1.15)); p.h = Math.max(20, Math.round(p.h / 1.15)); }
    });
  };
  const savePng = async () => {
    try { downloadBlob(await designPng(D), fileName('내건물')); toast('💾 PNG로 저장했어요!'); }
    catch (e) { toast('저장하지 못했어요. 다시 눌러 주세요.'); }
  };
  const marked = D.parts.filter(p => D.marked[p.id]).length;
  const disabled = !sel || checkOn;

  return (
    <>
      <section className="card">
        <PageHead kicker="활동2 · 직사각형 건물에 사다리꼴 더하기" title="사다리꼴 조각으로 나만의 건물을 꾸며요">
          조각을 누르면 건물에 놓여요. 끌어서 옮기고, 노란 동그라미를 끌면 크기가 바뀌어요.
        </PageHead>
        <div className="designwrap">
          <div className="palette">
            {Object.entries(PARTS).map(([k, d]) => (
              <button key={k} className="pbtn" onClick={() => addPart(k)} aria-label={d.label + ' 조각 놓기'}><PaletteIcon d={d} />{d.label}</button>
            ))}
          </div>
          <div className="stage-col">
            <StageSvg design={D} showMarks={checkOn || D.checkDone} selId={checkOn ? null : selId} svgRef={svgRef}
              className={'stage' + (checkOn ? ' checking' : '')} aria-label="건물 디자인 캔버스"
              onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} />
            <div className="scenes" role="group" aria-label="배경">
              {SCENES.map(s => <button key={s.id} className="chipbtn" aria-pressed={D.scene === s.id} onClick={() => update(d => { d.design.scene = s.id; })}>{s.label}</button>)}
            </div>
          </div>
          <div className="dside">
            <div className="ctitle">✋ 고른 조각</div>
            <div className="ptools">
              {[['flip', '↔ 좌우 반전'], ['rot', '⟳ 90° 돌리기'], ['bigger', '＋ 크게'], ['smaller', '－ 작게'], ['front', '⬆ 맨 앞으로'], ['dup', '⧉ 복사'], ['del', '🗑 지우기']].map(([a, t]) => (
                <button key={a} className={'btn sm' + (['flip', 'rot', 'front'].includes(a) ? ' span2' : '')} disabled={disabled} onClick={() => act(a)}>{t}</button>
              ))}
            </div>
            <div className="ctitle">🎨 색 칠하기</div>
            <div className="colors">
              {SWATCH.map(c => <button key={c} className="sw" style={{ background: c }} aria-label={'색 ' + c} aria-pressed={!!sel && sel.color === c}
                onClick={() => (sel ? edit(p => { p.color = c; }) : toast('먼저 색칠할 조각을 눌러요.'))} />)}
            </div>
          </div>
        </div>
        <div className="row2">
          <div>
            <label className="lbl" htmlFor="bname">건물 이름</label>
            <Field id="bname" path="design.name" maxLength={20} placeholder="예) 튼튼 사다리 도서관" />
          </div>
        </div>
        <QCard>내 건물에서 사다리꼴은 어디에 있나요? 평행한 변을 표시해 보세요.</QCard>
        <div className="tools">
          <button className={'btn' + (checkOn ? ' on' : '')} onClick={() => { setCheckOn(c => !c); setSelId(null); if (checkOn) setFb(null); }}>
            {checkOn ? '✔ 사다리꼴 찾기 끝내기' : '🔍 사다리꼴 찾기 켜기'}
          </button>
          <span className="muted">{checkOn ? `사다리꼴이라고 생각하는 조각을 눌러요. 표시한 조각: ${marked}개 / 전체 ${D.parts.length}개` : (marked ? `표시한 사다리꼴: ${marked}개` : '')}</span>
          <span className="grow" />
          <button className="btn" onClick={savePng}>💾 PNG로 저장</button>
        </div>
        <Feedback fb={fb} />
      </section>
      <TeacherMemo title="건물 디자인">
        <p>• 팔레트의 모든 조각(직사각형·평행사변형 포함)은 평행한 변이 있어 <b>모두 사다리꼴</b>이에요. '찾기' 단계에서 직사각형 조각을 누른 학생을 칭찬해 주세요.</p>
        <p>• 건물을 다 꾸민 뒤 '아래가 넓은 사다리꼴'을 어디에 썼는지, 왜 그렇게 놓았는지 발표하게 해요.</p>
      </TeacherMemo>
    </>
  );
}

export default function Activity2({ sub }) {
  return sub === 'a2:design' ? <Design /> : <Morph />;
}
