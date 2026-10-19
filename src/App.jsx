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

export default function App() {
  const { state, update, saved, toast, confetti, earned, ask, reset, teacher, setTeacher } = useApp();
  const [welcome, setWelcome] = useState(true);
  const [badges, setBadges] = useState(false);
  const [present, setPresent] = useState(false);
  const [big, setBig] = useState(false);
  const tab = state.tab;

  const goTab = t => { update(d => { d.tab = t; }); window.scrollTo({ top: 0 }); };
  const goSub = id => update(d => { d.sub[id.split(':')[0]] = id; });

  useEffect(() => { document.body.classList.toggle('big', big); }, [big]);
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
      <header className="appbar">
        <div className="hbar">
          <div className="brand"><Logo size={40} /><span>사다리꼴 건축가</span></div>
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
            <button className="starchip" onClick={() => setBadges(true)} aria-label={`내 배지 ${earned.length}개 보기`}>
              <span className="star">⭐</span><b>{earned.length}</b><span className="muted">/{STARS.length}</span>
            </button>
            {teacher && <button className="btn ghost sm" onClick={() => setPresent(true)}>📺 발표</button>}
            {teacher && <button className="btn ghost sm" onClick={() => setBig(b => !b)} aria-pressed={big}>가+</button>}
            <button className="btn ghost sm" onClick={async () => { if (await ask('지금까지 한 활동 기록을 모두 지우고 처음부터 시작할까요?')) { reset(); toast('처음부터 시작해요!'); } }}>↺ 처음부터</button>
          </div>
        </div>
        <div className="meter" aria-hidden="true"><i style={{ width: `${earned.length / STARS.length * 100}%` }} /></div>
      </header>

      <main>
        <Guide text={guideText} />
        {SUBS[tab] && (
          <div className="segmented" role="tablist">
            {SUBS[tab].map(s => <button key={s.id} role="tab" aria-selected={subId === s.id} onClick={() => goSub(s.id)}>{s.label}</button>)}
          </div>
        )}
        <div className="page" key={tab + (subId || '')}>
          <Page sub={subId} goSub={goSub} goTab={goTab} />
        </div>
        <nav className="pager">
          {TABS.findIndex(t => t.id === tab) > 0 && <button className="btn ghost" onClick={() => goTab(TABS[TABS.findIndex(t => t.id === tab) - 1].id)}>← 이전 단계</button>}
          <span />
          {TABS.findIndex(t => t.id === tab) < TABS.length - 1 && <button className="btn primary" onClick={() => goTab(TABS[TABS.findIndex(t => t.id === tab) + 1].id)}>다음 단계 →</button>}
        </nav>
      </main>

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
