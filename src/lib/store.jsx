import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { RECT0 } from './data.js';
import { STARS, earnedIds } from './stars.js';

/* 저장은 localStorage만 사용해요 (학생 이름·개인정보는 받지 않아요) */
export const KEY = 'trapezoid-architect-v1';

export function defaultState() {
  return {
    tab: 'intro', sub: { a1: 'a1:sort', a2: 'a2:morph' },
    intro: { vote: '', reason: '' },
    a1: { stage: 1, g1: {}, g2: {}, criterion: '', found: {}, foundNone: {}, cur: 's5', ox: {}, sortDone: false },
    a2: { pts: RECT0.map(p => p.slice()), base: RECT0.map(p => p.slice()), records: [], opinion: '', missions: {} },
    design: {
      parts: [{ id: 'p1', type: 'rect', cx: 400, cy: 405, w: 300, h: 270, color: '#f2d7a6', flip: false, rot: 0 }],
      name: '', marked: {}, nextId: 2, scene: 'day', checkDone: false,
    },
    wrap: { slider: 50, touched: false, reason: '', idea: '', mcq: {}, reflect: '' },
  };
}
function merge(base, saved) {
  for (const k in saved) {
    const b = base[k], v = saved[k];
    if (v && typeof v === 'object' && !Array.isArray(v) && b && typeof b === 'object' && !Array.isArray(b)) merge(b, v);
    else base[k] = v;
  }
  return base;
}
function load() {
  try { return merge(defaultState(), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { return defaultState(); }
}
export function hasSaved() { try { return !!localStorage.getItem(KEY); } catch (e) { return false; } }

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }) {
  const [state, setState] = useState(load);
  const [saved, setSaved] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [confetti, setConfetti] = useState(0);
  const [badge, setBadge] = useState(null);
  const [askState, setAskState] = useState(null);
  const [teacher, setTeacher] = useState(() => new URLSearchParams(location.search).get('teacher') === '1');
  const stateRef = useRef(state); stateRef.current = state;
  const dirty = useRef(false);

  /* update(d => { d.x = 1 }) — 복사본을 고쳐서 바꿔요 */
  const update = useCallback(fn => {
    dirty.current = true;
    setState(s => { const d = structuredClone(s); fn(d); return d; });
  }, []);

  const saveNow = useCallback(() => {
    try { localStorage.setItem(KEY, JSON.stringify({ ...stateRef.current, savedAt: Date.now() })); dirty.current = false; return true; }
    catch (e) { return false; }
  }, []);

  useEffect(() => {
    if (!dirty.current) return;
    const t = setTimeout(() => { if (saveNow()) { setSaved(true); setTimeout(() => setSaved(false), 900); } }, 250);
    return () => clearTimeout(t);
  }, [state, saveNow]);

  useEffect(() => {
    const flush = () => { if (dirty.current) saveNow(); };
    const vis = () => document.visibilityState === 'hidden' && flush();
    window.addEventListener('pagehide', flush); document.addEventListener('visibilitychange', vis);
    return () => { window.removeEventListener('pagehide', flush); document.removeEventListener('visibilitychange', vis); };
  }, [saveNow]);

  const toast = useCallback(msg => setToastMsg({ msg, k: Date.now() }), []);
  useEffect(() => { if (!toastMsg) return; const t = setTimeout(() => setToastMsg(null), 2400); return () => clearTimeout(t); }, [toastMsg]);
  const celebrate = useCallback(() => setConfetti(c => c + 1), []);

  /* 새 배지를 받으면 축하해요 (처음 불러올 때는 조용히) */
  const earned = useMemo(() => earnedIds(state), [state]);
  const prevEarned = useRef(null);
  useEffect(() => {
    if (prevEarned.current) {
      const fresh = earned.find(id => !prevEarned.current.includes(id));
      if (fresh) { setBadge(STARS.find(s => s.id === fresh)); setConfetti(c => c + 1); }
    }
    prevEarned.current = earned;
  }, [earned]);

  const ask = useCallback(msg => new Promise(res => setAskState({ msg, res })), []);

  const reset = useCallback(() => {
    try { localStorage.removeItem(KEY); } catch (e) {}
    dirty.current = false; prevEarned.current = []; setState(defaultState());
  }, []);

  const value = {
    state, update, saved, toast, toastMsg, celebrate, confetti, badge, setBadge,
    ask, askState, setAskState, teacher, setTeacher, earned, reset,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
