import { useEffect, useRef, useState } from 'react';
import { useApp } from '../lib/store.jsx';
import { PARTS, PART_CATS, DEFAULT_POS, SWATCH, SCENES, PATTERNS, TEMPLATES, COL } from '../lib/data.js';
import { worldToLocal, stability } from '../lib/parts.js';
import { analyze } from '../lib/geo.js';
import { pts } from '../components/Shapes.jsx';
import StageSvg from '../components/StageSvg.jsx';
import { Field, TeacherMemo, PageHead, SideTabs, SoundToggle } from '../components/ui.jsx';
import { rumble, resultSound } from '../lib/sound.js';
import { designPng, downloadBlob, fileName } from '../lib/exportImage.jsx';

import { svgPoint, useTouchLock, capture } from '../lib/touch.js';
function PaletteIcon({ d }) {
  const sc = Math.min(100 / d.w, 64 / d.h);
  const P = d.u.map(([u, v]) => [50 + (u / 20 - .5) * d.w * sc, 35 + (v / 20 - .5) * d.h * sc]);
  return <svg viewBox="-4 -4 108 78" aria-hidden="true"><polygon points={pts(P)} fill={d.color} stroke={COL.ink} strokeWidth="3" strokeLinejoin="round" /></svg>;
}

function PatternIcon({ id, color }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <defs>
        <pattern id={`pi-${id}`} width={id === 'brick' ? 20 : 12} height={id === 'brick' ? 11 : 12} patternUnits="userSpaceOnUse" patternTransform={id === 'stripe' ? 'rotate(45)' : undefined}>
          {id === 'brick' && <path d="M0 .5H20M0 5.5H20M.5 0V5M10.5 5V11" stroke="rgba(31,42,68,.4)" strokeWidth="1.2" fill="none" />}
          {id === 'stripe' && <rect width="6" height="12" fill="rgba(255,255,255,.6)" />}
          {id === 'dot' && <circle cx="6" cy="6" r="2.4" fill="rgba(255,255,255,.75)" stroke="rgba(31,42,68,.35)" strokeWidth=".6" />}
          {id === 'tile' && <><path d="M0 .5H12M.5 0V12" stroke="rgba(31,42,68,.4)" strokeWidth="1.2" /><rect x="2" y="2" width="4" height="4" fill="rgba(255,255,255,.6)" /></>}
        </pattern>
      </defs>
      <rect x="2" y="2" width="36" height="36" rx="8" fill={color} />
      {id !== 'none' && <rect x="2" y="2" width="36" height="36" rx="8" fill={`url(#pi-${id})`} />}
      {id === 'none' && <path d="M10 30 L30 10" stroke="rgba(31,42,68,.35)" strokeWidth="2" />}
    </svg>
  );
}

const Stars = ({ n }) => <span className="qstars" aria-label={`별 ${n}개`}>{[1, 2, 3].map(i => <i key={i} className={i <= n ? 'on' : ''} style={{ animationDelay: `${i * .15}s` }}>★</i>)}</span>;

export default function Design() {
  const { state, update, toast, celebrate } = useApp();
  const D = state.design;
  const [selId, setSelId] = useState(null);
  const [cat, setCat] = useState('top');
  const [panel, setPanel] = useState('part');
  const [grid, setGrid] = useState(false);
  const [quake, setQuake] = useState(null);      // 흔들리는 중인 결과
  const [quakeKey, setQuakeKey] = useState(0);
  const [result, setResult] = useState(null);    // 흔들기가 끝난 뒤 보여 줄 결과
  const [, setTick] = useState(0);
  const svgRef = useRef(null);
  useTouchLock(svgRef);
  const drag = useRef(null);
  const hist = useRef({ past: [], future: [] });
  const sel = D.parts.find(p => p.id === selId);
  useEffect(() => { if (selId) setPanel('part'); }, [selId]);
  const busy = !!quake;

  /* 되돌리기 기록을 남기고 바꿔요 */
  const snapshot = () => { const h = hist.current; h.past.push(structuredClone(D)); if (h.past.length > 50) h.past.shift(); h.future = []; setTick(t => t + 1); };
  const commit = fn => { snapshot(); setResult(null); update(s => fn(s.design)); };
  /* 되돌리기는 조각·배경만 바꿔요 (이름·소개·지진 기록은 그대로) */
  const restore = snap => update(s => { s.design = { ...snap, name: s.design.name, intro: s.design.intro, quake: s.design.quake }; });
  const undo = () => { const h = hist.current; if (!h.past.length) return; h.future.push(structuredClone(D)); restore(h.past.pop()); setSelId(null); setResult(null); setTick(t => t + 1); };
  const redo = () => { const h = hist.current; if (!h.future.length) return; h.past.push(structuredClone(D)); restore(h.future.pop()); setSelId(null); setResult(null); setTick(t => t + 1); };

  const addPart = type => {
    const d = PARTS[type], [cx, cy] = DEFAULT_POS[type] || [400, 300];
    const off = D.parts.filter(p => p.type === type).length * 18, id = 'p' + D.nextId;
    commit(g => { g.parts.push({ id, type, cx: cx + off, cy: cy + off * .5, w: d.w, h: d.h, color: d.color, flip: false, rot: 0, pattern: 'none' }); g.nextId++; });
    setSelId(id);
  };
  const edit = fn => commit(g => { const p = g.parts.find(x => x.id === selId); if (p) fn(p, g); });

  const act = a => {
    if (!sel) return;
    if (a === 'del') { commit(g => { g.parts = g.parts.filter(x => x.id !== selId); }); setSelId(null); return; }
    if (a === 'dup') { const id = 'p' + D.nextId; commit(g => { const p = g.parts.find(x => x.id === selId); g.parts.push({ ...p, id, cx: p.cx + 20, cy: p.cy + 20 }); g.nextId++; }); setSelId(id); return; }
    if (a === 'front') return commit(g => { const p = g.parts.find(x => x.id === selId); g.parts = g.parts.filter(x => x !== p).concat([p]); });
    if (a === 'back') return commit(g => { const p = g.parts.find(x => x.id === selId); g.parts = [p].concat(g.parts.filter(x => x !== p)); });
    edit(p => {
      if (a === 'flip') p.flip = !p.flip;
      if (a === 'rot') p.rot = ((p.rot || 0) + 1) % 4;
      if (a === 'bigger') { p.w = Math.min(780, Math.round(p.w * 1.15)); p.h = Math.min(580, Math.round(p.h * 1.15)); }
      if (a === 'smaller') { p.w = Math.max(20, Math.round(p.w / 1.15)); p.h = Math.max(16, Math.round(p.h / 1.15)); }
    });
  };

  /* 끌기: 마우스·손가락·펜 모두 (아이패드 사파리 대응: 좌표 직접 계산 + 터치 스크롤 막기) */
  const onDown = e => {
    if (busy) return;
    const svg = svgRef.current, pt = svgPoint(svg, e), t = e.target;
    if (t.getAttribute('data-resize') && sel) {
      e.preventDefault(); drag.current = { mode: 'resize', id: selId, pid: e.pointerId, started: false, sx: pt.x, sy: pt.y }; capture(svg, e); return;
    }
    const id = t.getAttribute('data-id');
    if (!id) { setSelId(null); return; }
    const p = D.parts.find(x => x.id === id);
    e.preventDefault();
    setSelId(id); drag.current = { mode: 'move', off: [p.cx - pt.x, p.cy - pt.y], id, pid: e.pointerId, started: false, sx: pt.x, sy: pt.y };
    capture(svg, e);
  };
  const onMove = e => {
    const dr = drag.current; if (!dr || e.pointerId !== dr.pid) return;
    e.preventDefault();
    const pt = svgPoint(svgRef.current, e);
    if (!dr.started) {
      if (Math.hypot(pt.x - dr.sx, pt.y - dr.sy) < 4) return;   // 손가락 떨림은 무시 (누르기만 한 것)
      dr.started = true; snapshot(); setResult(null);
    }
    update(s => {
      const p = s.design.parts.find(x => x.id === dr.id); if (!p) return;
      if (dr.mode === 'move') {
        const step = grid ? 10 : 5;
        p.cx = Math.max(0, Math.min(800, Math.round((pt.x + dr.off[0]) / step) * step));
        p.cy = Math.max(0, Math.min(600, Math.round((pt.y + dr.off[1]) / step) * step));
      } else {
        const [lx, ly] = worldToLocal(p, pt.x, pt.y);
        p.w = Math.max(20, Math.min(780, Math.round(Math.abs(lx)) * 2)); p.h = Math.max(16, Math.min(580, Math.round(Math.abs(ly)) * 2));
      }
    });
  };
  const onUp = e => { const dr = drag.current; if (dr && e && e.pointerId !== dr.pid) return; drag.current = null; };

  /* 키보드: 화살표로 조금씩 옮기기, Delete로 지우기, Ctrl+Z / Ctrl+Y */
  const keyRef = useRef(); keyRef.current = { act, undo, redo, sel, edit };
  useEffect(() => {
    const h = e => {
      if (e.target.closest && e.target.closest('input, textarea')) return;
      const k = keyRef.current;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); return e.shiftKey ? k.redo() : k.undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); return k.redo(); }
      if (!k.sel) return;
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); return k.act('del'); }
      const dv = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
      if (dv) { e.preventDefault(); const s = e.shiftKey ? 20 : 5; k.edit(p => { p.cx += dv[0] * s; p.cy += dv[1] * s; }); }
    };
    document.addEventListener('keydown', h); return () => document.removeEventListener('keydown', h);
  }, []);

  const runQuake = () => {
    const r = stability(D.parts);
    if (!r) return toast('먼저 조각을 놓아 건물을 지어 보세요.');
    setSelId(null); setResult(null); setQuake(r); setQuakeKey(k => k + 1);
    rumble(1.8);
    setTimeout(() => {
      setResult(r); resultSound(r.kind);
      update(s => { const best = s.design.quake ? s.design.quake.best : 0; s.design.quake = { tested: true, last: r.grade, best: Math.max(best, r.grade) }; });
      if (r.grade === 3) celebrate();
    }, r.kind === 'fall' || r.kind === 'float' ? 2000 : 1900);
  };
  const resetQuake = () => { setQuake(null); setResult(null); };
  useEffect(() => { if (!result || result.grade === 0) return; const t = setTimeout(() => setQuake(null), 600); return () => clearTimeout(t); }, [result]);

  const loadTemplate = t => {
    commit(g => { let n = g.nextId; g.parts = t.parts.map(p => ({ ...p, id: 'p' + (n++) })); g.nextId = n; });
    if (!D.name) update(s => { s.design.name = t.name; });
    setSelId(null); resetQuake(); toast('예시 건물을 불러왔어요. ↶ 되돌리기로 돌아갈 수 있어요.');
  };
  const clearAll = () => { if (!D.parts.length) return; commit(g => { g.parts = []; }); setSelId(null); resetQuake(); toast('모두 지웠어요. ↶ 되돌리기로 돌아갈 수 있어요.'); };

  const savePng = async () => {
    try { downloadBlob(await designPng(D), fileName('내건물')); toast('💾 PNG로 저장했어요!'); }
    catch (e) { toast('저장하지 못했어요. 다시 눌러 주세요.'); }
  };

  /* 모든 조각이 사다리꼴이에요 — 평행한 변이 1쌍인지 2쌍인지로 나누어 세어요 */
  const pairs1 = D.parts.filter(p => analyze(PARTS[p.type].u).count === 1).length;
  const pairs2 = D.parts.length - pairs1;
  const colors = new Set(D.parts.map(p => p.color)).size;
  const h = hist.current;

  return (
    <>
      <section className="card fit">
        <PageHead kicker="활동2 · 직사각형 건물에 사다리꼴 더하기" title="사다리꼴 조각으로 나만의 건물을 지어요">
          조각을 누르면 놓여요. 끌어서 옮기고, 노란 동그라미를 끌면 크기가 바뀌어요.
        </PageHead>

        <div className="dtoolbar">
          <div className="tb-group">
            <button className="btn ghost sm" onClick={undo} disabled={!h.past.length || busy} aria-label="되돌리기">↶ 되돌리기</button>
            <button className="btn ghost sm" onClick={redo} disabled={!h.future.length || busy} aria-label="다시 하기">↷ 다시</button>
          </div>
          <div className="tb-group">
            <button className={'chipbtn'} aria-pressed={grid} onClick={() => setGrid(g => !g)}>▦ 모눈</button>
            {SCENES.map(s => <button key={s.id} className="chipbtn" aria-pressed={D.scene === s.id} onClick={() => update(d => { d.design.scene = s.id; })}>{s.label}</button>)}
          </div>
          <div className="tb-group">
            <details className="tmpl">
              <summary className="chipbtn">✨ 예시 건물</summary>
              <div className="tmpl-menu pop">
                {TEMPLATES.map(t => <button key={t.id} className="btn ghost sm" onClick={e => { e.currentTarget.closest('details').open = false; loadTemplate(t); }}>{t.label}</button>)}
              </div>
            </details>
            <button className="chipbtn" onClick={clearAll} disabled={busy}>🧹 모두 지우기</button>
          </div>
          <div className="tb-group tb-right">
            <button className="btn ghost sm" onClick={savePng} disabled={busy}>💾 PNG</button>
            <SoundToggle />
            <button className="btn primary sm" onClick={runQuake} disabled={busy || !D.parts.length}>{busy && !result ? '흔드는 중…' : '🌬️ 지진 시험'}</button>
          </div>
        </div>

        <div className="designwrap">
          <div className="palette-col">
            <div className="cat-tabs" role="tablist">
              {PART_CATS.map(c => <button key={c.id} role="tab" aria-selected={cat === c.id} onClick={() => setCat(c.id)}>{c.label}</button>)}
            </div>
            <div className="palette" key={cat}>
              {Object.entries(PARTS).filter(([, d]) => d.cat === cat).map(([k, d], i) => (
                <button key={k} className="pbtn" style={{ animationDelay: `${i * 40}ms` }} onClick={() => addPart(k)} disabled={busy} aria-label={d.label + ' 조각 놓기'}>
                  <PaletteIcon d={d} />{d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="stage-col">
            <div className={'stage-frame fitbox' + (busy ? ' shaking' : '')} style={{ '--ar': 4 / 3 }}>
              <StageSvg design={D} selId={busy ? null : selId} showGrid={grid} quake={quake} quakeKey={quakeKey} svgRef={svgRef}
                className="stage" aria-label="건물 디자인 캔버스"
                onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} />
              {D.parts.length === 0 && <div className="stage-empty">👈 왼쪽에서 조각을 골라 건물을 지어 보세요<br /><span>또는 ✨ 예시 건물을 불러와도 좋아요</span></div>}
              {result && (
                <div className={'quake-card pop ' + result.kind}>
                  <Stars n={result.grade} />
                  <p>{result.text}</p>
                  <div className="qc-btns">
                    <button className="btn sm" onClick={resetQuake}>{result.grade === 0 ? '↺ 다시 세우기' : '확인'}</button>
                  </div>
                </div>
              )}
            </div>
            <div className="stage-stats">
              <span>🧱 조각 <b>{D.parts.length}</b>개</span>
              <span title="모든 조각이 사다리꼴이에요">📐 평행한 변 1쌍 <b>{pairs1}</b> · 2쌍 <b>{pairs2}</b></span>
              <span>🎨 색 <b>{colors}</b>가지</span>
              {D.quake && D.quake.tested && <span>🌬️ 최고 기록 <b className="star-txt">{'★'.repeat(D.quake.best) || '—'}</b></span>}
            </div>
          </div>

          <div className="dside">
            <SideTabs value={panel} onChange={setPanel} tabs={[{ id: 'part', label: '✋ 꾸미기' }, { id: 'name', label: '🏷️ 이름·소개' }]} />
            <div className="side-body" key={panel + (sel ? sel.id : '')}>
            {panel === 'name' ? (
              <div className="nameform">
                <label className="lbl" htmlFor="bname">🏷️ 건물 이름</label>
                <Field id="bname" path="design.name" maxLength={20} placeholder="예) 튼튼 사다리 도서관" />
                <label className="lbl" htmlFor="bintro">📝 사다리꼴을 어디에, 왜 썼나요?</label>
                <Field multiline id="bintro" path="design.intro" maxLength={200} placeholder="예) 아래에 넓은 사다리꼴 기단을 놓아 튼튼하게 만들고, 지붕은 빨간 사다리꼴로 멋을 냈어요." />
              </div>
            ) : sel ? (
              <div className="selpanel">
                <div className="ctitle">✋ {PARTS[sel.type].label}</div>
                <div className="ptools">
                  {[['flip', '↔ 반전'], ['rot', '⟳ 90°'], ['bigger', '＋ 크게'], ['smaller', '－ 작게'], ['front', '⬆ 맨 앞'], ['back', '⬇ 맨 뒤'], ['dup', '⧉ 복사'], ['del', '🗑 지우기']].map(([a, t]) => (
                    <button key={a} className={'btn sm' + (a === 'del' ? ' warn' : '')} disabled={busy} onClick={() => act(a)}>{t}</button>
                  ))}
                </div>
                <div className="ctitle">🎨 색</div>
                <div className="colors">
                  {SWATCH.map(c => <button key={c} className="sw" style={{ background: c }} aria-label={'색 ' + c} aria-pressed={sel.color === c} onClick={() => edit(p => { p.color = c; })} />)}
                </div>
                <div className="ctitle">🧩 무늬</div>
                <div className="patterns">
                  {PATTERNS.map(pt => (
                    <button key={pt.id} className="patbtn" aria-pressed={(sel.pattern || 'none') === pt.id} onClick={() => edit(p => { p.pattern = pt.id; })}>
                      <PatternIcon id={pt.id} color={sel.color} /><span>{pt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="selhint">
                <span className="tap-hint">👆</span>
                <b>건물의 조각을 눌러 보세요</b>
                <span className="muted">색과 무늬를 바꾸고, 돌리거나 크기를 바꿀 수 있어요.</span>
                <span className="muted kbd">⌨️ 화살표 옮기기 · Delete 지우기 · Ctrl+Z 되돌리기</span>
              </div>
            )}
            </div>
          </div>
        </div>
      </section>
      <TeacherMemo title="건물 디자인">
        <p>• 팔레트의 모든 조각은 평행한 변이 있어 <b>모두 사다리꼴</b>이에요(직사각형 몸체·문·창도 포함).</p>
        <p>• 지진 시험은 '아래 너비 ÷ 위 너비'와 건물이 바닥 위에 잘 놓였는지로 별(1~3개)을 줘요. 같은 건물을 위아래로 뒤집어(⟳ 두 번) 시험해 보게 하면 차이가 잘 보여요.</p>
        <p>• '꼬마 건축가' 배지: 조각 5개 이상 + 건물 이름 + 지진 시험 한 번 이상.</p>
        <p>• 발표: 건물 소개를 읽고, '아래가 넓은 사다리꼴'을 어디에 썼는지 말하게 해요.</p>
      </TeacherMemo>
    </>
  );
}
