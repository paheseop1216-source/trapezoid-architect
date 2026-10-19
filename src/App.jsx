import { useEffect, useRef, useState } from 'react';
import { useApp } from './lib/store.jsx';
import { TABS, SUBS, GUIDE } from './lib/data.js';
import { STARS } from './lib/stars.js';
import { Logo } from './components/Shapes.jsx';
import Guide from './components/Guide.jsx';
import Confetti from './components/Confetti.jsx';
import { Toast, AskDialog, BadgePopup, BadgesModal, Welcome, Present } from './components/ui.jsx';
import Intro from './pages/Intro.jsx';
import Activity1 from './pages/Activity1.jsx';
import Activity2 from './pages/Activity2.jsx';
import Wrap from './pages/Wrap.jsx';

const PAGES = { intro: Intro, a1: Activity1, a2: Activity2, wrap: Wrap };
const ZOOMS = [.8, .9, 1, 1.1, 1.25];
/* 수업 순서대로 늘어놓은 화면 9개 (이전·다음 버튼이 이 순서로 움직여요) */
const SEQ = TABS.flatMap(t => (SUBS[t.id]
  ? SUBS[t.id].map(s => ({ tab: t.id, sub: s.id, name: `${t.label} ${s.label}` }))
  : [{ tab: t.id, name: t.label }]));
const ZOOM_KEY = 'trapezoid-architect-zoom';
/* 배경에 천천히 떠다니는 사다리꼴 장식 */
const BG_SHAPES = [
  { x: '4%', y: '22%', s: 70, c: '#ffc93c', r: -12 }, { x: '90%', y: '30%', s: 54, c: '#9fd3f0', r: 18 },
  { x: '8%', y: '78%', s: 46, c: '#ff8fab', r: 8 }, { x: '86%', y: '82%', s: 80, c: '#a6cf8f', r: -20 },
  { x: '48%', y: '94%', s: 40, c: '#a78bd4', r: 30 },
];

export default function App() {
  const { state, update, saved, toast, confetti, earned, ask, reset, teacher, setTeacher } = useApp();
  const [welcome, setWelcome] = useState(true);
  const [badges, setBadges] = useState(false);
  const [present, setPresent] = useState(false);
  const tab = state.tab;

  /* 화면 크기(확대·축소) — 기기마다 따로 기억해요 */
  const [zi, setZi] = useState(() => { try { const v = +localStorage.getItem(ZOOM_KEY); return ZOOMS[v] ? v : 2; } catch (e) { return 2; } });
  useEffect(() => {
    document.documentElement.style.setProperty('--zoom', ZOOMS[zi]);
    try { localStorage.setItem(ZOOM_KEY, zi); } catch (e) {}
  }, [zi]);

  /* 앞 단계로 가면 오른쪽에서, 뒤 단계로 가면 왼쪽에서 들어와요 */
  const [dir, setDir] = useState('fwd');
  const order = id => { const [t, s] = id.split(':'); return TABS.findIndex(x => x.id === t) * 10 + (s ? SUBS[t].findIndex(x => x.id === id) : 0); };
  const curOrder = order(state.sub[tab] || tab);
  const goTab = t => { setDir(order(state.sub[t] || t) >= curOrder ? 'fwd' : 'back'); update(d => { d.tab = t; }); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const goSub = id => { setDir(order(id) >= curOrder ? 'fwd' : 'back'); update(d => { d.sub[id.split(':')[0]] = id; }); };
  const seqIdx = Math.max(0, SEQ.findIndex(x => x.tab === tab && (!x.sub || x.sub === state.sub[tab])));
  const goSeq = i => {
    const x = SEQ[i]; if (!x) return;
    setDir(i >= seqIdx ? 'fwd' : 'back');
    update(d => { d.tab = x.tab; if (x.sub) d.sub[x.tab] = x.sub; });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => { document.body.classList.toggle('teacher', teacher); }, [teacher]);

  /* 화면 오른쪽 아래 구석을 길게 누르면 선생님 모드 */
  const hot = useRef();
  const teacherRef = useRef(teacher); teacherRef.current = teacher;
  const hotDown = () => {
    hot.current = setTimeout(() => {
      const on = !teacherRef.current; setTeacher(on);
      toast(on ? '👩‍🏫 선생님 모드를 켰어요' : '선생님 모드를 껐어요');
    }, 900);
  };
  const hotUp = () => clearTimeout(hot.current);

  const Page = PAGES[tab] || Intro;
  const subId = state.sub[tab];
  const guideText = GUIDE[subId] || GUIDE[tab];
  const tabStars = t => STARS.filter(s => s.tab === t);

  return (
    <>
      <div className="bgdeco" aria-hidden="true">
        {BG_SHAPES.map((b, i) => (
          <svg key={i} viewBox="0 0 40 32" style={{ left: b.x, top: b.y, width: b.s, animationDelay: `${-i * 2.3}s`, animationDuration: `${14 + i * 2}s`, '--r': `${b.r}deg` }}>
            <polygon points="10,4 30,4 38,28 2,28" fill={b.c} />
          </svg>
        ))}
      </div>
      <div className="shell">
      <header className="appbar">
        <div className="hbar">
          <button className="brand" onClick={() => setWelcome(true)} aria-label="사다리꼴 건축가 — 시작 화면 보기">
            <Logo size={40} />
            <span className="brand-name" aria-hidden="true">{[...'사다리꼴 건축가'].map((ch, k) => <i key={k} style={{ '--k': k }}>{ch === ' ' ? ' ' : ch}</i>)}</span>
          </button>
          <nav className="stepper" role="tablist" aria-label="수업 단계">
            {TABS.map((t, i) => {
              const st = tabStars(t.id), got = st.filter(s => earned.includes(s.id)).length;
              const done = got === st.length;
              return (
                <button key={t.id} role="tab" aria-selected={tab === t.id} className={'step' + (done ? ' done' : '')} onClick={() => goTab(t.id)}>
                  <span className="n">{done ? '✓' : t.n}</span>
                  <span className="st-txt"><b>{t.label}</b><small>{t.sub}</small></span>
                  <span className="st-dots" aria-label={`별 ${got}/${st.length}`}>{st.map(s => <i key={s.id} className={earned.includes(s.id) ? 'on' : ''} />)}</span>
                  {i < TABS.length - 1 && <span className="st-line" aria-hidden="true" />}
                </button>
              );
            })}
          </nav>
          <div className="hact">
            <span className={'saved' + (saved ? ' show' : '')}>✓ 저장됨</span>
            <button className="starchip" key={'sc' + earned.length} onClick={() => setBadges(true)} aria-label={`내 배지 ${earned.length}개 보기`}>
              <span className="star">⭐</span><b>{earned.length}</b><span className="muted">/{STARS.length}</span>
            </button>
            <div className="zoomctl" role="group" aria-label="화면 크기">
              <button onClick={() => setZi(z => Math.max(0, z - 1))} disabled={zi === 0} aria-label="화면 작게">가−</button>
              <span>{Math.round(ZOOMS[zi] * 100)}%</span>
              <button onClick={() => setZi(z => Math.min(ZOOMS.length - 1, z + 1))} disabled={zi === ZOOMS.length - 1} aria-label="화면 크게">가+</button>
            </div>
            {teacher && <button className="btn ghost sm" onClick={() => setPresent(true)}>📺 발표</button>}
            <button className="btn ghost sm" onClick={async () => { if (await ask('지금까지 한 활동 기록을 모두 지우고 처음부터 시작할까요?')) { reset(); toast('처음부터 시작해요!'); } }} aria-label="처음부터 시작">↺<span className="hide-s"> 처음부터</span></button>
          </div>
        </div>
        <div className="meter" aria-hidden="true"><i style={{ width: `${earned.length / STARS.length * 100}%` }} /></div>
      </header>

      <main>
        <div className="subbar">
          {SUBS[tab] && (
            <div className="segmented" role="tablist" style={{ '--n': SUBS[tab].length, '--i': Math.max(0, SUBS[tab].findIndex(s => s.id === subId)) }}>
              <span className="seg-ind" aria-hidden="true" />
              {SUBS[tab].map(s => <button key={s.id} role="tab" aria-selected={subId === s.id} onClick={() => goSub(s.id)}>{s.label}</button>)}
            </div>
          )}
          <Guide text={guideText} cheer={confetti} />
          <nav className="stepnav" aria-label="이전·다음 화면">
            <button className="btn ghost sm" onClick={() => goSeq(seqIdx - 1)} disabled={seqIdx === 0}
              title={seqIdx > 0 ? `이전: ${SEQ[seqIdx - 1].name}` : undefined} aria-label={seqIdx > 0 ? `이전 화면: ${SEQ[seqIdx - 1].name}` : '이전 화면 없음'}>◀<span className="hide-s"> 이전</span></button>
            <span className="stepnav-n" aria-label={`${SEQ.length}개 중 ${seqIdx + 1}번째 화면`}>{seqIdx + 1}<small>/{SEQ.length}</small></span>
            <button className="btn primary sm" onClick={() => goSeq(seqIdx + 1)} disabled={seqIdx === SEQ.length - 1}
              title={seqIdx < SEQ.length - 1 ? `다음: ${SEQ[seqIdx + 1].name}` : undefined} aria-label={seqIdx < SEQ.length - 1 ? `다음 화면: ${SEQ[seqIdx + 1].name}` : '마지막 화면'}>다음 ▶</button>
          </nav>
        </div>
        <div className={'page ' + dir} key={tab + (subId || '')}>
          <Page sub={subId} goSub={goSub} goTab={goTab} />
        </div>
      </main>
      </div>

      <div className="hot" aria-hidden="true" onPointerDown={hotDown} onPointerUp={hotUp} onPointerLeave={hotUp} onPointerCancel={hotUp} />
      <Confetti fire={confetti} />
      <BadgePopup />
      <Toast />
      {badges && <BadgesModal onClose={() => setBadges(false)} />}
      {present && <Present tab={tab} goTab={goTab} onClose={() => setPresent(false)} />}
      {welcome && <Welcome onStart={(t, msg) => { setWelcome(false); goTab(t); if (msg) toast(msg); }} />}
      <AskDialog />
    </>
  );
}
