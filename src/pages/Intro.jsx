import { useState } from 'react';
import { useApp } from '../lib/store.jsx';
import { Field, Feedback, QCard, TeacherMemo, PageHead } from '../components/ui.jsx';

function Sky({ id }) {
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#bfe2fa" /><stop offset="1" stopColor="#eef8ff" /></linearGradient>
      </defs>
      <rect width="300" height="260" fill={`url(#${id})`} />
      <g fill="#fff" opacity=".9" className="cloud">
        <ellipse cx="50" cy="40" rx="26" ry="10" /><ellipse cx="68" cy="34" rx="16" ry="10" />
        <ellipse cx="250" cy="60" rx="22" ry="8" /><ellipse cx="236" cy="55" rx="12" ry="8" />
      </g>
      <rect x="0" y="236" width="300" height="24" fill="#cfe3b5" />
      <rect x="0" y="236" width="300" height="3" fill="#9cbf7d" />
    </>
  );
}

function RectBuilding() {
  return (
    <svg viewBox="0 0 300 260" role="img" aria-label="직사각형으로만 된 건물 그림">
      <Sky id="sky1" />
      <rect x="80" y="40" width="140" height="196" fill="#d9cdb4" stroke="#1f2a44" strokeWidth="3" />
      <rect x="80" y="40" width="140" height="10" fill="#c4b698" stroke="#1f2a44" strokeWidth="3" />
      <g fill="#9fd3f0" stroke="#1f2a44" strokeWidth="2">
        {[0, 1, 2].map(r => [0, 1, 2].map(c => (r === 2 && c === 1) ? null :
          <rect key={`${r}${c}`} x={96 + c * 39} y={62 + r * 44} width="30" height="30" />))}
      </g>
      <rect x="132" y="186" width="36" height="50" fill="#8a5a3b" stroke="#1f2a44" strokeWidth="2" />
      <circle cx="161" cy="212" r="2.5" fill="#ffc93c" />
      <rect x="40" y="200" width="22" height="36" rx="11" fill="#7fb069" stroke="#1f2a44" strokeWidth="2" />
    </svg>
  );
}

function TrapBuilding() {
  return (
    <svg viewBox="0 0 300 260" role="img" aria-label="사다리꼴 모양이 들어간 건물 그림">
      <Sky id="sky2" />
      <polygon points="128,6 172,6 186,52 114,52" fill="#e8a33a" stroke="#1f2a44" strokeWidth="3" strokeLinejoin="round" />
      <polygon points="70,92 230,92 252,236 48,236" fill="#f2d7a6" stroke="#1f2a44" strokeWidth="3" strokeLinejoin="round" />
      <polygon points="96,52 204,52 236,92 64,92" fill="#c8553d" stroke="#1f2a44" strokeWidth="3" strokeLinejoin="round" />
      <g fill="#9fd3f0" stroke="#1f2a44" strokeWidth="2">
        <polygon points="88,110 116,110 120,140 84,140" /><polygon points="136,110 164,110 168,140 132,140" /><polygon points="184,110 212,110 216,140 180,140" />
      </g>
      <polygon points="112,176 188,176 176,192 124,192" fill="#2a66d1" stroke="#1f2a44" strokeWidth="2" />
      <rect x="132" y="192" width="36" height="34" fill="#8a5a3b" stroke="#1f2a44" strokeWidth="2" />
      <polygon points="128,226 172,226 182,236 118,236" fill="#b9a27c" stroke="#1f2a44" strokeWidth="2" />
    </svg>
  );
}

export default function Intro() {
  const { state, update } = useApp();
  const [shake, setShake] = useState(0);
  const [fb, setFb] = useState(null);

  const doShake = () => {
    setFb(null); setShake(s => s + 1);
    setTimeout(() => setFb({ kind: 'good', text: '아래가 넓은 탑은 흔들려도 제자리로 돌아왔어요. 위가 넓은 탑은 넘어졌어요! 왜 그럴까요?' }), 1600);
  };

  return (
    <>
      <div className="grid-intro">
        <section className="card">
          <PageHead kicker="도입 · 생각 열기" title="모든 건물은 직사각형이어야 할까?" />
          <div className="buildings">
            <figure><RectBuilding /><figcaption><span className="chip">①</span> 직사각형으로만 지은 건물</figcaption></figure>
            <figure><TrapBuilding /><figcaption><span className="chip">②</span> 사다리꼴이 들어간 건물</figcaption></figure>
          </div>
          <QCard>왜 직사각형으로 만들지 않고 사다리꼴 모양을 사용했을까?</QCard>
        </section>

        <div className="stack">
          <section className="card">
            <h3>🗳️ 내 생각에 투표해요</h3>
            <p className="muted">②번 건물에 사다리꼴을 쓴 까닭은 무엇일까요? 더 큰 까닭 하나를 골라요.</p>
            <div className="vote">
              {[['stable', '🏗️', '튼튼함 · 안정성'], ['design', '🎨', '아름다움 · 디자인']].map(([v, e, t]) => (
                <button key={v} className="vbtn" aria-pressed={state.intro.vote === v} onClick={() => update(d => { d.intro.vote = v; })}>
                  <span className="e">{e}</span>{t}
                </button>
              ))}
            </div>
            <label className="lbl" htmlFor="introReason">그렇게 생각한 까닭을 한 줄로 써요.</label>
            <Field id="introReason" path="intro.reason" maxLength={80} placeholder="예) 아래가 넓으면 잘 안 넘어질 것 같아서요." />
          </section>

          <section className="card">
            <h3>🌬️ 탑을 흔들어 봐요</h3>
            <div className="towers">
              <svg viewBox="0 0 160 230" aria-label="아래가 넓은 사다리꼴 탑">
                <g className={'tw' + (shake ? ' stable' : '')} key={'a' + shake}>
                  <polygon points="20,220 140,220 120,150 40,150" fill="#7fb069" stroke="#1f2a44" strokeWidth="3" strokeLinejoin="round" />
                  <polygon points="40,150 120,150 106,90 54,90" fill="#a6cf8f" stroke="#1f2a44" strokeWidth="3" strokeLinejoin="round" />
                  <polygon points="54,90 106,90 94,40 66,40" fill="#cfe7bf" stroke="#1f2a44" strokeWidth="3" strokeLinejoin="round" />
                </g>
                <text x="80" y="20" textAnchor="middle" fontSize="19" fill="#1f2a44">아래가 넓은 탑</text>
              </svg>
              <svg viewBox="0 0 160 230" aria-label="위가 넓은 사다리꼴 탑">
                <g className={'tw' + (shake ? ' tip' : '')} key={'b' + shake}>
                  <polygon points="66,220 94,220 106,170 54,170" fill="#e47b5b" stroke="#1f2a44" strokeWidth="3" strokeLinejoin="round" />
                  <polygon points="54,170 106,170 120,110 40,110" fill="#ee9f86" stroke="#1f2a44" strokeWidth="3" strokeLinejoin="round" />
                  <polygon points="40,110 120,110 140,50 20,50" fill="#f6c6b6" stroke="#1f2a44" strokeWidth="3" strokeLinejoin="round" />
                </g>
                <text x="80" y="20" textAnchor="middle" fontSize="19" fill="#1f2a44">위가 넓은 탑</text>
              </svg>
            </div>
            <div className="tools">
              <button className="btn primary" onClick={doShake}>🌬️ 흔들기</button>
              <button className="btn ghost" onClick={() => { setShake(0); setFb(null); }}>제자리</button>
            </div>
            <Feedback fb={fb} />
          </section>
        </div>
      </div>
      <TeacherMemo title="도입">
        <p>• 정답이 정해진 질문이 아니에요. 투표 결과를 칠판에 모아 두었다가 <b>정리</b> 단계에서 다시 비교해요.</p>
        <p>• 흔들기 시뮬레이션은 '아래가 넓으면 덜 넘어진다'는 느낌을 주는 정도로만 다뤄요(무게중심 용어는 쓰지 않아요).</p>
        <p>• 실제 건축물 사진이 필요하면 교사가 따로 준비해 보여 주세요(앱에는 저작권 문제로 넣지 않았어요).</p>
      </TeacherMemo>
    </>
  );
}
