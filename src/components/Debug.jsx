import { useEffect, useState } from 'react';
import { currentZoom, rectScale } from '../lib/touch.js';

/* 점검 화면 — 주소 뒤에 ?debug=1 을 붙이면 오른쪽 아래에 나와요.
   기기 정보, 기능 지원 여부, 최근 터치·포인터 신호를 보여 줘서 '왜 안 되는지' 찾는 데 써요. */
const feat = () => {
  const ua = navigator.userAgent, ios = ua.match(/OS (\d+)_(\d+)/);
  const cs = window.CSS && CSS.supports;
  return [
    ['기기', /iPad|Macintosh/.test(ua) && navigator.maxTouchPoints > 1 ? 'iPad' : /iPhone/.test(ua) ? 'iPhone' : /Android/.test(ua) ? 'Android' : 'PC'],
    ['iOS', ios ? `${ios[1]}.${ios[2]}` : (/Version\/(\d+\.\d+)/.exec(ua) || [])[1] ? 'Safari ' + /Version\/(\d+\.\d+)/.exec(ua)[1] : '-'],
    ['브라우저', /CriOS/.test(ua) ? 'Chrome(iOS)' : /Chrome/.test(ua) ? 'Chrome' : /Safari/.test(ua) ? 'Safari' : '?'],
    ['화면', `${innerWidth}×${innerHeight} · DPR ${devicePixelRatio}`],
    ['터치점', navigator.maxTouchPoints],
    ['PointerEvent', 'PointerEvent' in window ? 'O' : 'X'],
    ['structuredClone', /native/.test(String(window.structuredClone)) ? 'O' : '대체'],
    ['container 쿼리', cs && CSS.supports('container-type: size') ? 'O' : 'X'],
    ['dvh', cs && CSS.supports('height: 100dvh') ? 'O' : 'X'],
    ['화면 크기', getComputedStyle(document.documentElement).getPropertyValue('--zoom') || '1'],
    ['위치 방식', (() => { const b = document.querySelector('main'); if (!b || !b.offsetWidth) return '-'; const z = currentZoom(); if (z === 1) return '보정 필요 없음(100%)'; return rectScale(b) === 1 ? '표준(보정 없음)' : `옛 방식 → ×${z} 보정`; })()],
  ];
};

export default function Debug() {
  const [log, setLog] = useState([]);
  const [info, setInfo] = useState(feat);
  const [open, setOpen] = useState(true);
  useEffect(() => {
    let moves = 0;
    const desc = t => (t && t.getAttribute ? `${t.tagName.toLowerCase()}${t.getAttribute('class') ? '.' + String(t.getAttribute('class')).split(' ')[0] : ''}${t.getAttribute('data-v') ? '[v' + t.getAttribute('data-v') + ']' : ''}` : '?');
    const add = s => setLog(l => [`${new Date().toLocaleTimeString().slice(-8)} ${s}`, ...l].slice(0, 12));
    const h = e => {
      if (e.target.closest && e.target.closest('.dbg')) return;
      if (e.type === 'pointermove' || e.type === 'touchmove') { if (++moves % 10) return; add(`${e.type} ×10`); return; }
      add(`${e.type}${e.pointerType ? '(' + e.pointerType + ')' : ''} ${desc(e.target)} ${e.clientX != null ? Math.round(e.clientX) + ',' + Math.round(e.clientY) : ''}${e.defaultPrevented ? ' prevented' : ''}`);
    };
    const err = e => add('⚠️ 오류: ' + (e.message || e.reason));
    const types = ['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'touchstart', 'touchmove', 'touchend', 'touchcancel', 'click'];
    types.forEach(t => document.addEventListener(t, h, true));
    window.addEventListener('error', err); window.addEventListener('unhandledrejection', err);
    const iv = setInterval(() => setInfo(feat()), 2000);
    return () => { types.forEach(t => document.removeEventListener(t, h, true)); window.removeEventListener('error', err); window.removeEventListener('unhandledrejection', err); clearInterval(iv); };
  }, []);
  return (
    <div className="dbg">
      <button onClick={() => setOpen(o => !o)}>🔧 점검 {open ? '접기' : '펴기'}</button>
      {open && <>
        <table><tbody>{info.map(([k, v]) => <tr key={k}><th>{k}</th><td>{String(v)}</td></tr>)}</tbody></table>
        <div className="dbg-log">{log.length ? log.map((s, i) => <div key={i}>{s}</div>) : <div>화면을 눌러 보세요…</div>}</div>
      </>}
    </div>
  );
}
