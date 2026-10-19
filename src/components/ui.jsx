import { useEffect, useRef, useState } from 'react';
import { useApp, hasSaved } from '../lib/store.jsx';
import { STARS } from '../lib/stars.js';
import { TABS, PQ, MISSIONS } from '../lib/data.js';
import { Mascot } from './Guide.jsx';
import { Logo } from './Shapes.jsx';

const getPath = (o, path) => path.split('.').reduce((x, k) => x[k], o);
const setPath = (o, path, v) => { const ks = path.split('.'); const last = ks.pop(); ks.reduce((x, k) => x[k], o)[last] = v; };

/* 상태에 바로 묶인 입력칸 (자동 저장) */
export function Field({ path, multiline, ...rest }) {
  const { state, update } = useApp();
  const props = { value: getPath(state, path) || '', onChange: e => { const v = e.target.value; update(d => setPath(d, path, v)); }, ...rest };
  return multiline ? <textarea {...props} /> : <input type="text" {...props} />;
}

export function Feedback({ fb }) {
  if (!fb || !fb.text) return null;
  return <div className={'feedback ' + fb.kind} role="status">{fb.text}</div>;
}

export const QCard = ({ children }) => <div className="qcard"><span className="qmark">?</span><div>{children}</div></div>;

export function TeacherMemo({ title, children }) {
  const { teacher } = useApp();
  if (!teacher) return null;
  return <details className="tmemo"><summary>👩‍🏫 선생님 메모 — {title}</summary><div>{children}</div></details>;
}

export function PageHead({ kicker, title, children }) {
  return (
    <div className="pagehead">
      <div className="kicker">{kicker}</div>
      <h2>{title}</h2>
      {children && <p className="muted">{children}</p>}
    </div>
  );
}

export function Toast() {
  const { toastMsg } = useApp();
  return <div className={'toast' + (toastMsg ? ' show' : '')} role="status">{toastMsg && toastMsg.msg}</div>;
}

export function AskDialog() {
  const { askState, setAskState } = useApp();
  const noRef = useRef(null);
  useEffect(() => { if (askState) noRef.current && noRef.current.focus(); }, [askState]);
  if (!askState) return null;
  const done = v => { askState.res(v); setAskState(null); };
  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && done(false)}>
      <div className="dialog pop" role="alertdialog" aria-modal="true" aria-labelledby="askMsg">
        <div className="aicon">↺</div>
        <p id="askMsg" className="dtitle">{askState.msg}</p>
        <div className="muted">지운 기록은 되돌릴 수 없어요.</div>
        <div className="dbtns"><button ref={noRef} className="btn" onClick={() => done(false)}>아니요</button><button className="btn danger" onClick={() => done(true)}>네, 처음부터</button></div>
      </div>
    </div>
  );
}

export function BadgePopup() {
  const { badge, setBadge } = useApp();
  useEffect(() => { if (!badge) return; const t = setTimeout(() => setBadge(null), 3800); return () => clearTimeout(t); }, [badge, setBadge]);
  if (!badge) return null;
  return (
    <div className="badgepop pop" role="status" onClick={() => setBadge(null)}>
      <div className="medal">{badge.icon}</div>
      <div><div className="bp-k">⭐ 새 배지를 받았어요!</div><div className="bp-t">{badge.title}</div><div className="bp-d">{badge.desc}</div></div>
    </div>
  );
}

export function BadgesModal({ onClose }) {
  const { earned } = useApp();
  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="dialog wide pop" role="dialog" aria-modal="true" aria-labelledby="bdTitle">
        <div className="dhead"><h2 id="bdTitle">⭐ 내 배지 모음 <span className="muted">{earned.length} / {STARS.length}</span></h2><button className="btn ghost sm" onClick={onClose}>✕ 닫기</button></div>
        <div className="meter big"><i style={{ width: `${earned.length / STARS.length * 100}%` }} /></div>
        <div className="badges">
          {STARS.map(s => {
            const on = earned.includes(s.id);
            return (
              <div key={s.id} className={'badge' + (on ? ' on' : '')}>
                <div className="medal">{on ? s.icon : '🔒'}</div>
                <b>{s.title}</b>
                <span>{s.desc}</span>
                <em>{TABS.find(t => t.id === s.tab).label}</em>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function Welcome({ onStart }) {
  const { state, ask, reset, earned } = useApp();
  const has = hasSaved() && (earned.length > 0 || state.tab !== 'intro' || !!state.intro.vote);
  const L = [];
  if (has) {
    if (state.intro.vote) L.push('도입 투표를 했어요');
    const answers = [state.intro.reason, state.a1.criterion, state.a2.opinion, state.design.name, state.wrap.reason, state.wrap.idea, state.wrap.reflect].filter(t => t && t.trim()).length;
    if (answers) L.push(`답변 ${answers}개를 썼어요`);
    const ms = MISSIONS.filter(m => state.a2.missions[m.id]).length; if (ms) L.push(`미션 ${ms}/3 성공했어요`);
    if (state.a2.records.length) L.push(`변신 기록 ${state.a2.records.length}개를 남겼어요`);
    if (earned.length) L.push(`배지 ${earned.length}개를 모았어요`);
  }
  const tabName = (TABS.find(t => t.id === state.tab) || TABS[0]).label;
  return (
    <div className="welcome">
      <div className="wbox pop" role="dialog" aria-modal="true" aria-labelledby="wTitle">
        <div className="whero">
          <svg viewBox="0 0 360 120" className="wcity" aria-hidden="true">
            <rect x="0" y="104" width="360" height="16" rx="4" fill="#cfe3b5" />
            <rect x="20" y="40" width="54" height="64" fill="#d9cdb4" stroke="#1f2a44" strokeWidth="3" />
            <polygon points="30,40 64,40 74,24 20,24" fill="#c8553d" stroke="#1f2a44" strokeWidth="3" strokeLinejoin="round" />
            <polygon points="100,104 160,104 150,30 110,30" fill="#a6cf8f" stroke="#1f2a44" strokeWidth="3" strokeLinejoin="round" />
            <polygon points="115,30 145,30 138,12 122,12" fill="#e8a33a" stroke="#1f2a44" strokeWidth="3" strokeLinejoin="round" />
            <rect x="250" y="50" width="80" height="54" fill="#cde8ff" stroke="#1f2a44" strokeWidth="3" />
            <polygon points="240,50 340,50 325,28 255,28" fill="#2a66d1" stroke="#1f2a44" strokeWidth="3" strokeLinejoin="round" />
            <polygon points="275,104 305,104 300,84 280,84" fill="#8a5a3b" stroke="#1f2a44" strokeWidth="2" strokeLinejoin="round" />
          </svg>
          <div className="wmascot"><Mascot size={96} /></div>
        </div>
        <div className="wtitle"><Logo size={44} /><h1 id="wTitle">사다리꼴 건축가</h1></div>
        <p className="wq">모든 건물은 직사각형이어야 할까?</p>
        {has && (
          <div className="wsum">📌 지난번에 <b>{tabName}</b>까지 했어요.
            {L.length > 0 && <ul>{L.map(t => <li key={t}>{t}</li>)}</ul>}
          </div>
        )}
        <div className="wbtns">
          {has ? <>
            <button className="btn primary lg" autoFocus onClick={() => onStart(state.tab, '▶ 하던 활동을 이어서 해요!')}>▶ 이어서 하기</button>
            <button className="btn lg" onClick={async () => { if (await ask('저장된 활동 기록을 모두 지우고 처음부터 시작할까요?')) { reset(); onStart('intro', '처음부터 시작해요!'); } }}>↺ 처음부터 시작</button>
          </> : <button className="btn primary lg" autoFocus onClick={() => onStart('intro')}>▶ 시작하기</button>}
        </div>
      </div>
    </div>
  );
}

export function Present({ tab, goTab, onClose }) {
  const [i, setI] = useState(0);
  const order = Object.keys(PQ), list = PQ[tab], idx = Math.min(i, list.length - 1);
  const prev = () => { if (idx > 0) setI(idx - 1); else { const k = order.indexOf(tab); if (k > 0) { goTab(order[k - 1]); setI(PQ[order[k - 1]].length - 1); } } };
  const next = () => { if (idx < list.length - 1) setI(idx + 1); else { const k = order.indexOf(tab); if (k < order.length - 1) { goTab(order[k + 1]); setI(0); } } };
  const nav = useRef({}); nav.current = { prev, next };
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose(); if (e.key === 'ArrowRight') nav.current.next(); if (e.key === 'ArrowLeft') nav.current.prev(); };
    document.addEventListener('keydown', h); return () => document.removeEventListener('keydown', h);
  }, [onClose]);
  const tabInfo = TABS.find(t => t.id === tab);
  return (
    <div className="present">
      <div className="ptop"><span>📺 {tabInfo.label} · {tabInfo.sub}</span><button className="btn" onClick={onClose}>✕ 닫기</button></div>
      <div className="pq" key={tab + idx}>{list[idx]}</div>
      <div className="pnav">
        <button className="btn" onClick={prev}>◀ 이전</button>
        <span className="pidx">{idx + 1} / {list.length}</span>
        <button className="btn primary" onClick={next}>다음 ▶</button>
      </div>
    </div>
  );
}
