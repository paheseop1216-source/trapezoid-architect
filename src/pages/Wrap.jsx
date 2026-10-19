import { useState } from 'react';
import { useApp } from '../lib/store.jsx';
import { MCQ, WORD, VOTE, sliderWord } from '../lib/data.js';
import { STARS, rankTitle } from '../lib/stars.js';
import { Field, QCard, TeacherMemo, PageHead } from '../components/ui.jsx';
import { buildSquare, downloadBlob, fileName } from '../lib/exportImage.jsx';

const SUMMARY = [
  ['📐', '사다리꼴의 뜻', '평행한 변이 한 쌍이라도 있는 사각형을 사다리꼴이라고 합니다.'],
  ['🔄', '모양이 바뀌어도', '평행한 변이 한 쌍 이상 있으면 사다리꼴이에요. 직사각형, 정사각형, 평행사변형, 마름모도 사다리꼴이에요.'],
  ['🏛️', '건축 속 사다리꼴', '아래가 넓으면 안정감이 있어요. 지붕, 차양, 계단, 탑 꼭대기에 쓰여요.'],
];

/* ① 배운 내용 + 배움 확인 */
function Summary() {
  const { state, update } = useApp();
  return (
    <section className="card fit">
      <PageHead kicker="정리 · 배운 내용 모으기" title="오늘 배운 사다리꼴" />
      <div className="wrap-grid">
        <div className="sumcards">
          {SUMMARY.map(([e, t, d], i) => (
            <div key={t} className="sum" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="sum-ic">{e}</div><span className="num">{i + 1}</span><b>{t}</b><p>{d}</p>
            </div>
          ))}
        </div>
        <div className="mcq-col">
          <h3>✅ 배움 확인</h3>
          {MCQ.map((m, i) => {
            const ans = state.wrap.mcq[i];
            return (
              <div key={i} className="mcq">
                {/* 문제: 번호 동그라미 + 크고 진한 글씨 / 보기: 작고 연한 글씨 버튼 */}
                <div className="mcq-q" id={`mcq-q${i}`}>
                  <span className="qnum">{i + 1}</span>
                  <span className="qtext">{m.q.replace(/^\d+\.\s*/, '')}</span>
                  {ans != null && <span className={'qmark-res ' + (ans === m.a ? 'ok' : 'no')}>{ans === m.a ? '⭕ 맞았어요' : '다시 살펴볼까요?'}</span>}
                </div>
                <div className="opts" role="group" aria-labelledby={`mcq-q${i}`}>
                  {m.o.map((t, j) => (
                    <button key={j} aria-pressed={ans === j} className={ans === j ? (j === m.a ? 'ok' : 'no') : ''}
                      onClick={() => update(d => { d.wrap.mcq[i] = j; })}>
                      <span className="opt-n">{j + 1}</span><span className="opt-t">{t}</span>{ans === j && j === m.a && <span className="opt-ok">⭕</span>}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ② 생각 정리하기 */
function Talk() {
  const { state, update } = useApp();
  const v = +state.wrap.slider, now = sliderWord(v), was = state.intro.vote;
  const msg = !was ? '' : now === 'both' ? '두 가지를 함께 생각하게 되었네요!' : now === was ? '처음 생각을 그대로 지켰어요.' : '생각이 바뀌었어요! 무엇 때문에 바뀌었나요?';
  return (
    <section className="card fit">
      <PageHead kicker="정리 · 나의 생각" title="디자인과 구조, 무엇이 더 중요할까?" />
      <QCard>건축물을 만들 때 아름다운 디자인과 튼튼하고 편리한 구조 중 무엇을 더 중요하게 생각해야 할까?</QCard>
      <div className="talk-grid">
        <div>
          <div className="sl-ends"><span>🎨 디자인</span><span>🏗️ 구조</span></div>
          <input type="range" className="slider" min="0" max="100" step="5" value={v} aria-label="디자인과 구조 중 내 생각의 위치"
            onChange={e => { const n = +e.target.value; update(d => { d.wrap.slider = n; d.wrap.touched = true; }); }} />
          <p className="sl-label">{state.wrap.touched ? WORD[now] : '슬라이더를 움직여 내 생각의 위치를 정해요.'}</p>
          <div className="compare">
            <span>도입 때 <span className="bx">{VOTE[was]}</span></span>
            {state.wrap.touched && <><span className="arrow">→</span><span>지금 <span className="bx">{WORD[now]}</span></span>
              {msg && <span className="cmsg">{msg}</span>}</>}
          </div>
        </div>
        <div>
          <label className="lbl" htmlFor="wrapReason">그렇게 생각하는 까닭</label>
          <Field multiline id="wrapReason" path="wrap.reason" maxLength={200} />
          <label className="lbl" htmlFor="wrapIdea">💡 둘 다 살리는 아이디어</label>
          <Field multiline id="wrapIdea" path="wrap.idea" maxLength={200} placeholder="예) 아래는 넓은 사다리꼴로 튼튼하게, 지붕은 알록달록한 사다리꼴로 멋지게!" />
        </div>
      </div>
    </section>
  );
}

/* ③ 결과물 저장 */
function Done() {
  const { state, toast, earned } = useApp();
  const [busy, setBusy] = useState(false);
  const rank = rankTitle(earned.length);
  const saveAll = async () => {
    setBusy(true);
    try { downloadBlob(await buildSquare(state, earned), fileName('오늘결과물')); toast('🖼️ 그림 파일로 저장했어요! 패들렛에 올려 주세요.'); }
    catch (e) { console.error(e); toast('저장하지 못했어요. 다시 눌러 주세요.'); }
    finally { setBusy(false); }
  };
  return (
    <section className="card fit">
      <PageHead kicker="정리 · 결과물 저장" title="오늘 수업을 마무리해요" />
      <label className="lbl" htmlFor="reflect">✏️ 한 줄 소감</label>
      <Field id="reflect" path="wrap.reflect" maxLength={80} placeholder="오늘 수업에서 새롭게 안 점이나 느낀 점" />
      <div className="finale">
        <div className="rank">
          <div className="rank-icon">{rank.icon}</div>
          <div>
            <div className="rank-k">나의 칭호 · 배지 {earned.length} / {STARS.length}</div>
            <div className="rank-t">{rank.title}</div>
          </div>
        </div>
        <button className="btn padlet lg" disabled={busy} onClick={saveAll}>{busy ? '그림을 만드는 중이에요…' : '🖼️ 오늘 결과물 그림 파일로 저장하기'}</button>
      </div>
      <div className="got-badges">
        {STARS.map(s => {
          const on = earned.includes(s.id);
          return <span key={s.id} className={'gb' + (on ? ' on' : '')} title={s.desc}>{on ? s.icon : '🔒'} {s.title}</span>;
        })}
      </div>
      <p className="muted">저장한 그림에는 나의 칭호와 받은 배지, 내 건물, 변신 기록, 토론 내용, 소감이 한 장에 담겨요.</p>
    </section>
  );
}

export default function Wrap({ sub }) {
  return (
    <>
      {sub === 'wrap:talk' ? <Talk /> : sub === 'wrap:done' ? <Done /> : <Summary />}
      <TeacherMemo title="정리">
        <p>• 배움 확인 정답: 1-①, 2-③, 3-①</p>
        <p>• ② 생각 정리하기에서 도입 투표와 지금 생각을 비교한 결과가 나와요. 생각이 바뀐 학생에게 까닭을 물어보세요.</p>
        <p>• 패들렛: ③ 결과물 저장에서 버튼을 누르면 오늘 결과물이 1080×1080 그림 파일(PNG)로 저장돼요.</p>
      </TeacherMemo>
    </>
  );
}
