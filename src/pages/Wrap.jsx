import { useState } from 'react';
import { useApp } from '../lib/store.jsx';
import { MCQ, WORD, VOTE, sliderWord } from '../lib/data.js';
import { STARS } from '../lib/stars.js';
import { Field, QCard, TeacherMemo, PageHead } from '../components/ui.jsx';
import { buildSquare, downloadBlob, fileName } from '../lib/exportImage.jsx';

const SUMMARY = [
  ['📐', '사다리꼴의 뜻', '평행한 변이 한 쌍이라도 있는 사각형을 사다리꼴이라고 합니다.'],
  ['🔄', '모양이 바뀌어도', '평행한 변이 한 쌍 이상 있으면 사다리꼴이에요. 직사각형, 정사각형, 평행사변형, 마름모도 사다리꼴이에요.'],
  ['🏛️', '건축 속 사다리꼴', '아래가 넓으면 안정감이 있어요. 지붕, 차양, 계단, 탑 꼭대기에 쓰여요.'],
];

export default function Wrap() {
  const { state, update, toast, earned } = useApp();
  const [busy, setBusy] = useState(false);
  const v = +state.wrap.slider, now = sliderWord(v), was = state.intro.vote;
  const msg = !was ? '' : now === 'both' ? '두 가지를 함께 생각하게 되었네요!' : now === was ? '처음 생각을 그대로 지켰어요.' : '생각이 바뀌었어요! 무엇 때문에 바뀌었나요?';

  const saveAll = async () => {
    setBusy(true);
    try { downloadBlob(await buildSquare(state, earned.length, STARS.length), fileName('오늘결과물')); toast('🖼️ 그림 파일로 저장했어요! 패들렛에 올려 주세요.'); }
    catch (e) { console.error(e); toast('저장하지 못했어요. 다시 눌러 주세요.'); }
    finally { setBusy(false); }
  };

  return (
    <>
      <section className="card">
        <PageHead kicker="정리 · 배운 내용 모으기" title="오늘 배운 사다리꼴" />
        <div className="sumcards">
          {SUMMARY.map(([e, t, d], i) => (
            <div key={t} className="sum" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="sum-ic">{e}</div><span className="num">{i + 1}</span><b>{t}</b><p>{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h3>💬 토론해요</h3>
        <QCard>건축물을 만들 때 아름다운 디자인과 튼튼하고 편리한 구조 중 무엇을 더 중요하게 생각해야 할까?</QCard>
        <div className="sl-ends"><span>🎨 디자인</span><span>🏗️ 구조</span></div>
        <input type="range" className="slider" min="0" max="100" step="5" value={v} aria-label="디자인과 구조 중 내 생각의 위치"
          style={{ '--v': `${v}%` }} onChange={e => { const n = +e.target.value; update(d => { d.wrap.slider = n; d.wrap.touched = true; }); }} />
        <p className="sl-label">{state.wrap.touched ? WORD[now] : '슬라이더를 움직여 내 생각의 위치를 정해요.'}</p>
        <div className="compare">
          <span>도입 때 <span className="bx">{VOTE[was]}</span></span>
          {state.wrap.touched && <><span className="arrow">→</span><span>지금 <span className="bx">{WORD[now]}</span></span>
            {msg && <span className="cmsg">{msg}</span>}</>}
        </div>
        <label className="lbl" htmlFor="wrapReason">그렇게 생각하는 까닭</label>
        <Field multiline id="wrapReason" path="wrap.reason" maxLength={200} />
        <label className="lbl" htmlFor="wrapIdea">💡 둘 다 살리는 아이디어</label>
        <Field multiline id="wrapIdea" path="wrap.idea" maxLength={200} placeholder="예) 아래는 넓은 사다리꼴로 튼튼하게, 지붕은 알록달록한 사다리꼴로 멋지게!" />
      </section>

      <section className="card">
        <h3>✅ 배움 확인</h3>
        {MCQ.map((m, i) => {
          const ans = state.wrap.mcq[i];
          return (
            <div key={i} className="mcq">
              <b>{m.q}</b>
              <div className="opts">
                {m.o.map((t, j) => (
                  <button key={j} aria-pressed={ans === j} className={ans === j ? (j === m.a ? 'ok' : 'no') : ''}
                    onClick={() => update(d => { d.wrap.mcq[i] = j; })}>{'①②③'[j]} {t}</button>
                ))}
              </div>
              {ans != null && <div className={'feedback ' + (ans === m.a ? 'good' : 'hint')}>{ans === m.a ? '⭕ 맞았어요!' : '다시 살펴볼까요? 정리 카드를 한 번 더 읽어 보세요.'}</div>}
            </div>
          );
        })}
        <label className="lbl" htmlFor="reflect">✏️ 한 줄 소감</label>
        <Field id="reflect" path="wrap.reflect" maxLength={80} placeholder="오늘 수업에서 새롭게 안 점이나 느낀 점" />
      </section>

      <section className="card finale">
        <div>
          <h3>🏅 오늘 모은 배지 {earned.length} / {STARS.length}</h3>
          <div className="mini-badges">{STARS.map(s => <span key={s.id} className={earned.includes(s.id) ? 'on' : ''} title={s.title}>{earned.includes(s.id) ? s.icon : '🔒'}</span>)}</div>
        </div>
        <button className="btn padlet lg" disabled={busy} onClick={saveAll}>{busy ? '그림을 만드는 중이에요…' : '🖼️ 오늘 결과물 그림 파일로 저장하기'}</button>
      </section>

      <TeacherMemo title="정리">
        <p>• 배움 확인 정답: 1-①, 2-③, 3-①</p>
        <p>• 도입 투표와 지금 생각을 비교한 결과가 화면에 나와요. 생각이 바뀐 학생에게 까닭을 물어보세요.</p>
        <p>• 패들렛: 맨 아래 버튼을 누르면 오늘 결과물이 1080×1080 그림 파일(PNG)로 저장돼요. 저장한 그림을 패들렛에 올리게 해요.</p>
      </TeacherMemo>
    </>
  );
}
