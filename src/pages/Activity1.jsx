import { useRef, useState } from 'react';
import { useApp } from '../lib/store.jsx';
import { analyze, parallel, extendLine, lineIntersect } from '../lib/geo.js';
import { SHAPES, OX, FILLS, LABELS, COL } from '../lib/data.js';
import { shapeDone } from '../lib/stars.js';
import { MiniQuad, ParallelMarks, pts } from '../components/Shapes.jsx';
import { Field, Feedback, TeacherMemo, PageHead } from '../components/ui.jsx';

const shapeById = id => SHAPES.find(s => s.id === id);

function ShapeCard({ sh, i, cls = '', children, ...rest }) {
  return (
    <div className={'shape ' + cls} role="button" tabIndex={0} aria-label={`${sh.tag} 카드`} {...rest}>
      <MiniQuad p={sh.p} fill={FILLS[i % FILLS.length]} />
      <div className="tag">{sh.tag}</div>
      {children}
    </div>
  );
}

/* ---------- ① 사각형 나누기 ---------- */
function Sort({ goSub }) {
  const { state, update } = useApp();
  const st = state.a1.stage, g = st === 1 ? state.a1.g1 : state.a1.g2;
  const [sel, setSel] = useState(null);
  const [ghost, setGhost] = useState(null);
  const [over, setOver] = useState(null);
  const [fb, setFb] = useState(null);
  const [checked, setChecked] = useState(false);
  const drag = useRef(null);

  const bins = st === 1
    ? [{ k: 'A', t: '🟣 가 무리' }, { k: 'B', t: '🟠 나 무리' }]
    : [{ k: 'Y', t: '✅ 평행한 변이 있어요' }, { k: 'N', t: '⬜ 평행한 변이 없어요' }];

  const move = (id, bin) => {
    update(d => { const gg = d.a1.stage === 1 ? d.a1.g1 : d.a1.g2; if (bin === 'pool') delete gg[id]; else gg[id] = bin; });
    setSel(null); setFb(null); setChecked(false);
  };
  const binAt = (x, y) => { const t = document.elementFromPoint(x, y); const b = t && t.closest('[data-bin]'); return b ? b.dataset.bin : null; };

  const handlers = id => ({
    onPointerDown: e => { if (e.button > 0) return; drag.current = { id, sx: e.clientX, sy: e.clientY, moving: false, w: e.currentTarget.offsetWidth, h: e.currentTarget.offsetHeight }; e.currentTarget.setPointerCapture(e.pointerId); },
    onPointerMove: e => {
      const d = drag.current; if (!d) return;
      if (!d.moving && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 8) d.moving = true;
      if (d.moving) { setGhost({ id, x: e.clientX, y: e.clientY, w: d.w, h: d.h }); setOver(binAt(e.clientX, e.clientY)); }
    },
    onPointerUp: e => {
      const d = drag.current; drag.current = null; setGhost(null); setOver(null);
      if (!d) return;
      if (d.moving) { const b = binAt(e.clientX, e.clientY); if (b) move(id, b); }
      else setSel(s => (s === id ? null : id));
    },
    onPointerCancel: () => { drag.current = null; setGhost(null); setOver(null); },
    onKeyDown: e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSel(id); } },
  });

  const cardsIn = where => SHAPES.map((sh, i) => ({ sh, i })).filter(({ sh }) => (g[sh.id] || 'pool') === where);
  const renderCard = ({ sh, i }) => {
    let cls = sel === sh.id ? 'sel' : '';
    if (ghost && ghost.id === sh.id) cls += ' src';
    if (checked && st === 2 && g[sh.id]) cls += (g[sh.id] === (analyze(sh.p).trap ? 'Y' : 'N')) ? ' right' : ' wrong';
    return <ShapeCard key={sh.id} sh={sh} i={i} cls={cls} {...handlers(sh.id)} />;
  };
  const clickBin = (k, e) => { if (sel && !e.target.closest('.shape')) move(sel, k); };

  const toStage2 = () => {
    const n = Object.keys(state.a1.g1).length;
    if (n < SHAPES.length) return setFb({ kind: 'hint', text: `아직 나누지 않은 카드가 ${SHAPES.length - n}장 있어요. 먼저 모두 나눠 볼까요?` });
    if (!state.a1.criterion.trim()) { document.getElementById('criterion').focus(); return setFb({ kind: 'hint', text: '어떤 기준으로 나누었는지 먼저 써 볼까요?' }); }
    update(d => { d.a1.stage = 2; }); setSel(null); setFb(null);
  };
  const check = () => {
    const left = SHAPES.filter(s => !g[s.id]).length;
    const wrong = SHAPES.filter(s => g[s.id] && g[s.id] !== (analyze(s.p).trap ? 'Y' : 'N')).length;
    setChecked(true);
    if (left) setFb({ kind: 'hint', text: `아직 상자에 넣지 않은 카드가 ${left}장 있어요.` });
    else if (wrong) setFb({ kind: 'hint', text: `다시 살펴볼까요? 빨간 테두리 카드 ${wrong}장은 평행한 변을 먼저 찾아보세요. 마주 보는 변을 쭉 늘였을 때 만나는지 생각해 봐요.` });
    else { setFb({ kind: 'good', text: '🎉 모두 맞았어요! 평행한 변이 있는 상자의 사각형들을 사다리꼴이라고 해요.' }); update(d => { d.a1.sortDone = true; }); }
  };

  const pool = cardsIn('pool');
  return (
    <>
      <section className="card">
        <div className="stage-tag">{st === 1 ? '1단계 · 자유롭게' : '2단계 · 평행한 변으로'}</div>
        <PageHead kicker="활동1 · 사다리꼴의 개념 알아보기" title={st === 1 ? '사각형을 내 마음대로 두 무리로 나누어 보세요' : '평행한 변이 있는 것과 없는 것으로 나누어 보세요'}>
          {sel ? `${shapeById(sel).tag} 카드를 골랐어요. 넣을 상자를 눌러요.` : '카드를 끌어서 상자에 넣어요. (카드를 누른 뒤 상자를 눌러도 돼요.)'}
        </PageHead>
        <div className={'pool' + (over === 'pool' ? ' over' : '')} data-bin="pool" onClick={e => clickBin('pool', e)}>
          {pool.length ? pool.map(renderCard) : <p className="muted empty">모든 카드를 나누었어요! 👏</p>}
        </div>
        <div className="bins">
          {bins.map(b => (
            <div key={b.k} className={`bin ${b.k}` + (over === b.k ? ' over' : '') + (cardsIn(b.k).length > 4 ? ' many' : '')} data-bin={b.k} onClick={e => clickBin(b.k, e)}>
              <h3>{b.t} <span className="muted">({cardsIn(b.k).length}장)</span></h3>
              <div className="cards">{cardsIn(b.k).map(renderCard)}</div>
            </div>
          ))}
        </div>
        {st === 1 ? (
          <>
            <div className="inline-field">
              <label className="lbl" htmlFor="criterion">어떤 기준으로 나누었나요?</label>
              <Field id="criterion" path="a1.criterion" maxLength={80} placeholder="예) 마주 보는 변이 나란한 것과 아닌 것" />
              <button className="btn primary" onClick={toStage2}>다음: 평행한 변으로 나누기 →</button>
            </div>
          </>
        ) : (
          <div className="tools">
            <button className="btn primary" onClick={check}>✔ 확인하기</button>
            <button className="btn ghost" onClick={() => { update(d => { d.a1.stage = 1; }); setSel(null); setFb(null); setChecked(false); }}>← 1단계로</button>
            {state.a1.sortDone && <button className="btn" onClick={() => goSub('a1:find')}>② 평행한 변 찾기로 →</button>}
          </div>
        )}
        <Feedback fb={fb} />
      </section>
      {ghost && (() => { const sh = shapeById(ghost.id); return (
        <div className="shape ghost" style={{ left: ghost.x - ghost.w / 2, top: ghost.y - ghost.h / 2, width: ghost.w, height: ghost.h }}>
          <MiniQuad p={sh.p} fill={FILLS[SHAPES.indexOf(sh) % FILLS.length]} /><div className="tag">{sh.tag}</div>
        </div>); })()}
      <TeacherMemo title="분류하기">
        <p>• 1단계는 자유 분류예요. 각이 직각인지, 변의 길이, 뾰족한 정도 등 다양한 기준을 인정하고 발표하게 해요.</p>
        <p>• 2단계 정답: 평행한 변이 <b>있는</b> 카드 — 가(직사각형), 다, 마, 바, 아, 자, 차 / <b>없는</b> 카드 — 나, 라, 사.</p>
      </TeacherMemo>
    </>
  );
}

/* ---------- ② 평행한 변 찾기 ---------- */
const sideName = i => `변 ${LABELS[i]}${LABELS[(i + 1) % 4]}`;

function Find() {
  const { state, update } = useApp();
  const [pick, setPick] = useState([]);
  const [temp, setTemp] = useState(null);
  const [fb, setFb] = useState(null);
  const sh = shapeById(state.a1.cur), s = 50, P = sh.p.map(q => [q[0] * s, q[1] * s]);
  const found = (state.a1.found[sh.id] || []).filter(Array.isArray);
  const total = analyze(sh.p).count;
  const doneCount = SHAPES.filter(x => shapeDone(state, x)).length;

  const choose = id => { update(d => { d.a1.cur = id; }); setPick([]); setTemp(null); setFb(null); };
  const pickSide = i => {
    if (pick.includes(i)) return setPick(pick.filter(x => x !== i));
    const np = [...pick, i]; setTemp(null);
    if (np.length < 2) { setPick(np); return setFb({ kind: 'hint', text: `${sideName(i)}을(를) 골랐어요. 한 변을 더 골라요.` }); }
    setPick([]);
    const [a, b] = np;
    if ((a + 2) % 4 !== b) return setFb({ kind: 'hint', text: `${sideName(a)}과 ${sideName(b)}은 꼭짓점에서 만나요. 마주 보는 두 변을 골라 보세요.` });
    const pr = [Math.min(a, b), Math.max(a, b)];
    if (parallel(sh.p, pr[0], pr[1])) {
      const already = found.some(x => x[0] === pr[0]);
      const n = found.length + (already ? 0 : 1);
      if (!already) update(d => { d.a1.found[sh.id] = [...found, pr]; });
      setFb({ kind: 'good', text: '평행해요! 두 변을 아무리 길게 늘여도 서로 만나지 않아요.' + (n === total ? ` 이 사각형은 평행한 변이 ${total}쌍 → 사다리꼴이에요!` : ' 다른 평행한 변도 있을까요?') });
    } else {
      setTemp(pr);
      setFb({ kind: 'hint', text: '두 변을 길게 늘이면 빨간 점에서 만나요. 그래서 평행하지 않아요.' });
    }
  };
  const noParallel = () => {
    if (total === 0) { update(d => { d.a1.foundNone[sh.id] = true; }); setFb({ kind: 'good', text: '맞아요! 마주 보는 변을 늘이면 모두 만나요. 평행한 변이 없으니 사다리꼴이 아니에요.' }); }
    else setFb({ kind: 'hint', text: '다시 살펴볼까요? 마주 보는 두 변을 골라서 늘여 보세요.' });
  };

  let viewBox = '-90 -90 480 480', X = null;
  if (temp) {
    X = lineIntersect(P[temp[0]], P[(temp[0] + 1) % 4], P[temp[1]], P[(temp[1] + 1) % 4]);
    if (X) {
      const xs = P.map(q => q[0]).concat(X[0]), ys = P.map(q => q[1]).concat(X[1]);
      const x0 = Math.min(...xs, -90) - 50, y0 = Math.min(...ys, -90) - 50, x1 = Math.max(...xs, 390) + 50, y1 = Math.max(...ys, 390) + 50;
      const m = Math.max(x1 - x0, y1 - y0);
      if (m <= 1400) viewBox = `${(x0 + x1) / 2 - m / 2} ${(y0 + y1) / 2 - m / 2} ${m} ${m}`;
    }
  }
  const cx = P.reduce((a, q) => a + q[0], 0) / 4, cy = P.reduce((a, q) => a + q[1], 0) / 4;
  const dots = [];
  for (let x = -1; x <= 7; x++) for (let y = -1; y <= 7; y++) dots.push(<circle key={`${x}-${y}`} cx={x * s} cy={y * s} r={3} />);

  return (
    <>
      <section className="card">
        <PageHead kicker="활동1 · 평행한 변 찾기" title="변 두 개를 차례로 눌러 보세요">마주 보는 두 변을 고르면 길게 늘여서 만나는지 보여 줘요.</PageHead>
        <div className="find-grid">
          <div className="strip-col">
            <div className="strip-head"><span>카드를 골라요</span><span className="muted">✅ {doneCount}/{SHAPES.length}</span></div>
            <div className="strip">
              {SHAPES.map((x, i) => (
                <ShapeCard key={x.id} sh={x} i={i} cls={state.a1.cur === x.id ? 'sel' : ''} onClick={() => choose(x.id)}
                  onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && choose(x.id)}>
                  {shapeDone(state, x) && <span className="done">✅</span>}
                </ShapeCard>
              ))}
            </div>
          </div>
          <div className="fitbox square">
          <svg className="bigview" viewBox={viewBox} aria-label={`${sh.tag} 카드 크게 보기`}>
            <g fill="#d6cfba">{dots}</g>
            {found.map((pr, k) => pr.map(i => { const [a, b] = extendLine(P[i], P[(i + 1) % 4]); return <line key={`e${k}${i}`} className="extend" x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={k === 0 ? COL.o : COL.b} strokeWidth="3" strokeDasharray="10 8" opacity=".8" />; }))}
            {temp && temp.map(i => { const [a, b] = extendLine(P[i], P[(i + 1) % 4]); return <line key={`t${i}`} className="extend" x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={COL.gray} strokeWidth="3" strokeDasharray="10 8" />; })}
            {X && <circle className="meet" cx={X[0]} cy={X[1]} r="11" fill={COL.red} stroke="#fff" strokeWidth="3" />}
            <polygon points={pts(P)} fill="#fff3c4" />
            {[0, 1, 2, 3].map(i => {
              const a = P[i], b = P[(i + 1) % 4], inPair = found.findIndex(pr => pr.includes(i)), on = pick.includes(i);
              const color = on ? '#ffb000' : inPair === 0 ? COL.o : inPair === 1 ? COL.b : COL.ink;
              return (
                <g key={i} className="side" onClick={() => pickSide(i)}>
                  <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={color} strokeWidth={on ? 12 : 8} strokeLinecap="round" />
                  <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="transparent" strokeWidth="44" strokeLinecap="round" />
                </g>
              );
            })}
            <ParallelMarks P={P} pairs={found} sw={0.1} size={13} />
            {P.map((q, i) => {
              const d = [q[0] - cx, q[1] - cy], L = Math.hypot(...d) || 1;
              return <g key={i} pointerEvents="none"><circle cx={q[0]} cy={q[1]} r="6" fill={COL.ink} />
                <text x={q[0] + d[0] / L * 26} y={q[1] + d[1] / L * 26 + 8} textAnchor="middle" fontSize="24" fill={COL.ink}>{LABELS[i]}</text></g>;
            })}
          </svg>
          </div>
          <div className="stack side">
            <div className="stat"><span>찾은 평행한 변</span><span className="v">{found.length}쌍</span></div>
            <Feedback fb={fb} />
            <div className="tools">
              <button className="btn ghost" onClick={noParallel}>평행한 변이 없어요</button>
              <button className="btn ghost" onClick={() => { setPick([]); setTemp(null); setFb(null); }}>다시 고르기</button>
            </div>
            <div className="def">📌 평행한 변이 <b>한 쌍이라도</b> 있는 사각형을 <b>사다리꼴</b>이라고 합니다.</div>
            <p className="muted">그러면 직사각형, 정사각형도 사다리꼴일까요? 평행한 변이 몇 쌍인지 찾아보세요.</p>
          </div>
        </div>
      </section>
      <TeacherMemo title="평행한 변 찾기">
        <p>• 이웃한 두 변을 고르면 '꼭짓점에서 만나요'라고 안내해요. 평행은 <b>마주 보는</b> 두 변에서만 찾을 수 있음을 짚어 주세요.</p>
        <p>• 직사각형·정사각형·평행사변형·마름모는 평행한 변이 2쌍 → 모두 사다리꼴이에요. '정확히 한 쌍'이라는 생각을 바로잡아 주세요.</p>
      </TeacherMemo>
    </>
  );
}

/* ---------- ③ 확인 문제 ---------- */
function Quiz() {
  const { state, update } = useApp();
  const done = OX.filter((q, i) => state.a1.ox[i]).length, right = OX.filter((q, i) => state.a1.ox[i] === q.a).length;
  let fb = null;
  if (done === OX.length) fb = right === OX.length
    ? { kind: 'good', text: '🎉 5문제 모두 맞았어요! 직사각형과 정사각형도 사다리꼴이라는 것, 잊지 마세요.' }
    : { kind: 'hint', text: `${right}문제 맞았어요. 틀린 문제는 다시 골라 볼까요?` };
  return (
    <>
      <section className="card">
        <PageHead kicker="활동1 · 확인 문제" title="사다리꼴인가요? O 또는 X를 골라요" />
        <div className="quiz">
          {OX.map((q, i) => {
            const ans = state.a1.ox[i], ok = ans === q.a;
            return (
              <div key={i} className={'qitem' + (ans ? (ok ? ' ok' : ' no') : '')}>
                <b>{i + 1}번</b>
                <MiniQuad p={q.p} fill={FILLS[(i + 2) % 5]} marks={ans && ok} />
                <div className="ox">
                  {['O', 'X'].map(v => <button key={v} aria-pressed={ans === v} aria-label={`${i + 1}번 ${v}`} onClick={() => update(d => { d.a1.ox[i] = v; })}>{v}</button>)}
                </div>
                {ans && <div className="fb">{ok ? '⭕ ' + q.why : '다시 살펴볼까요? 평행한 변을 먼저 찾아보세요.'}</div>}
              </div>
            );
          })}
        </div>
        <div className="quiz-meter"><span>맞힌 문제</span><div className="meter"><i style={{ width: `${right / OX.length * 100}%` }} /></div><b>{right}/{OX.length}</b></div>
        <Feedback fb={fb} />
      </section>
      <TeacherMemo title="확인 문제">
        <p>• 정답: 1 O(직사각형) · 2 X · 3 O(정사각형) · 4 O(돌려 놓은 사다리꼴) · 5 O(평행사변형)</p>
        <p>• 돌려 놓아도 평행한 변은 그대로예요. 방향이 바뀌어도 사다리꼴이라는 점을 강조해요.</p>
      </TeacherMemo>
    </>
  );
}

export default function Activity1({ sub, goSub }) {
  if (sub === 'a1:find') return <Find />;
  if (sub === 'a1:quiz') return <Quiz />;
  return <Sort goSub={goSub} />;
}
