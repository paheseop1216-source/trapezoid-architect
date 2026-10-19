import { useEffect, useState } from 'react';

/* 안내 캐릭터 '사다리 박사' — 사다리꼴 몸에 안전모를 쓴 건축가 */
export function Mascot({ mood = 'happy', size = 76 }) {
  return (
    <svg className="mascot" viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <ellipse cx="50" cy="94" rx="30" ry="4" fill="rgba(31,42,68,.15)" />
      <polygon points="26,34 74,34 88,90 12,90" fill="#ffc93c" stroke="#1f2a44" strokeWidth="4" strokeLinejoin="round" />
      <path d="M48 34 l4 0 M48 90 l4 0" stroke="#1f2a44" strokeWidth="3" />
      <path d="M22 36 Q50 4 78 36 Z" fill="#e46f1f" stroke="#1f2a44" strokeWidth="4" strokeLinejoin="round" />
      <rect x="16" y="33" width="68" height="7" rx="3.5" fill="#e46f1f" stroke="#1f2a44" strokeWidth="4" />
      <rect x="45" y="12" width="10" height="14" rx="3" fill="#ffc93c" stroke="#1f2a44" strokeWidth="3" />
      <g className="eyes">
        <circle cx="38" cy="56" r="5" fill="#1f2a44" /><circle cx="62" cy="56" r="5" fill="#1f2a44" />
        <circle cx="39.5" cy="54.5" r="1.6" fill="#fff" /><circle cx="63.5" cy="54.5" r="1.6" fill="#fff" />
      </g>
      <circle cx="30" cy="66" r="4.5" fill="#ff8fab" opacity=".7" /><circle cx="70" cy="66" r="4.5" fill="#ff8fab" opacity=".7" />
      {mood === 'wow'
        ? <ellipse cx="50" cy="71" rx="6" ry="7" fill="#1f2a44" />
        : <path d="M40 68 Q50 78 60 68" fill="none" stroke="#1f2a44" strokeWidth="4" strokeLinecap="round" />}
    </svg>
  );
}

/* cheer 값이 바뀌면(미션·배지 성공) 박사가 깡충 뛰며 놀라요 */
export default function Guide({ text, cheer }) {
  const [open, setOpen] = useState(true);
  const [jump, setJump] = useState(false);
  useEffect(() => {
    if (!cheer) return;
    setJump(true); const t = setTimeout(() => setJump(false), 1400);
    return () => clearTimeout(t);
  }, [cheer]);
  return (
    <div className={'guide' + (open ? '' : ' closed') + (jump ? ' jump' : '')}>
      <button className="guide-avatar" onClick={() => setOpen(o => !o)} aria-label={open ? '사다리 박사 말 접기' : '사다리 박사 말 보기'}>
        <Mascot size={64} mood={jump ? 'wow' : 'happy'} />
      </button>
      {open && <div className="bubble" key={text}><b>사다리 박사</b><span>{text}</span></div>}
    </div>
  );
}
