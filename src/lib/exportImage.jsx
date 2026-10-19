import { renderToStaticMarkup } from 'react-dom/server';
import StageSvg from '../components/StageSvg.jsx';
import { analyze, sub, dot } from './geo.js';
import { COL, MISSIONS, MCQ, VOTE, WORD, sliderWord } from './data.js';
import { STARS, rankTitle } from './stars.js';

export const FONT = '"BMDOHYEON",system-ui,-apple-system,"Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",sans-serif';

export function fileName(k) {
  const d = new Date();
  return `사다리꼴건축가_${k}_${d.getMonth() + 1}월${d.getDate()}일.png`;
}
export function downloadBlob(blob, name) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
}
export async function fontReady() {
  try {
    await Promise.race([document.fonts.load('24px "BMDOHYEON"', '사다리꼴'), new Promise(r => setTimeout(r, 3000))]);
    return document.fonts.check('24px "BMDOHYEON"', '사다리꼴');
  } catch (e) { return false; }
}

/* 건물 그림을 이미지로 (선택 표시 없이) */
export async function designImage(design, w, h) {
  const markup = renderToStaticMarkup(<StageSvg design={design} exportMode width={w} height={h} />);
  const img = new Image();
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(markup); });
  return img;
}

export async function designPng(design) {
  const img = await designImage(design, 1600, 1200);
  const c = document.createElement('canvas'); c.width = 1600; c.height = 1200;
  const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
  if (design.name) {
    const ok = await fontReady(); ctx.textBaseline = 'top'; ctx.fillStyle = design.scene === 'night' ? '#fff' : COL.ink;
    ctx.font = `${ok ? '' : '800'} 60px ${FONT}`; ctx.fillText('🏠 ' + design.name, 48, 44);
  }
  return new Promise(r => c.toBlob(r, 'image/png'));
}

/* ---------- 오늘 결과물 1080×1080 ---------- */
function wrapText(ctx, text, maxW) {
  const lines = [];
  (text || '').split('\n').forEach(par => {
    let line = '';
    for (const ch of Array.from(par)) {
      if (ctx.measureText(line + ch).width > maxW && line) {
        const sp = line.lastIndexOf(' ');
        if (sp > line.length * .5) { lines.push(line.slice(0, sp)); line = line.slice(sp + 1) + ch; }
        else { lines.push(line); line = ch; }
      } else line += ch;
    }
    lines.push(line);
  });
  return lines;
}
function fitLine(ctx, t, maxW) { if (ctx.measureText(t).width <= maxW) return t; while (t && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1); return t + '…'; }
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function canvasQuad(ctx, p, x, y, size) {
  const xs = p.map(q => q[0]), ys = p.map(q => q[1]); const minx = Math.min(...xs), miny = Math.min(...ys);
  const w = Math.max(...xs) - minx, h = Math.max(...ys) - miny, m = Math.max(w, h, 1), pad = size * .14, s = (size - pad * 2) / m;
  const P = p.map(q => [x + pad + (q[0] - minx) * s + ((size - pad * 2) - w * s) / 2, y + pad + (q[1] - miny) * s + ((size - pad * 2) - h * s) / 2]);
  const an = analyze(p);
  ctx.beginPath(); P.forEach((q, i) => (i ? ctx.lineTo(...q) : ctx.moveTo(...q))); ctx.closePath();
  ctx.fillStyle = an.trap ? '#fff0c2' : '#eef1f6'; ctx.fill(); ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeStyle = COL.ink; ctx.stroke();
  an.pairs.forEach((pr, k) => {
    const ref = sub(P[(pr[0] + 1) % 4], P[pr[0]]);
    pr.forEach(i => {
      const a = P[i], b = P[(i + 1) % 4];
      ctx.strokeStyle = k ? COL.b : COL.o; ctx.lineWidth = 7; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke();
      let d = sub(b, a); if (dot(d, ref) < 0) d = [-d[0], -d[1]];
      const L = Math.hypot(...d), u = [d[0] / L, d[1] / L], n = [-u[1], u[0]], mm = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], sz = 8;
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 4;
      for (let c = 0; c <= k; c++) {
        const o = (c - k / 2) * sz * 1.1, tip = [mm[0] + u[0] * (sz * .6 + o), mm[1] + u[1] * (sz * .6 + o)], bk = [tip[0] - u[0] * sz, tip[1] - u[1] * sz];
        ctx.beginPath(); ctx.moveTo(bk[0] + n[0] * sz * .8, bk[1] + n[1] * sz * .8); ctx.lineTo(...tip); ctx.lineTo(bk[0] - n[0] * sz * .8, bk[1] - n[1] * sz * .8); ctx.stroke();
      }
    });
  });
  return an;
}
const blankOr = t => ((t && t.trim()) ? t.trim() : '(아직 쓰지 않았어요)');

/* 오늘 결과물 1080×1080 — 맨 위에 칭호와 받은 배지, 그 아래 건물·기록·토론·소감 */
export async function buildSquare(state, earned) {
  const W = 1080, c = document.createElement('canvas'); c.width = W; c.height = W;
  const ctx = c.getContext('2d'); ctx.textBaseline = 'top';
  const ok = await fontReady();
  const F = (wt, px) => { ctx.font = `${ok ? '' : wt} ${px}px ${FONT}`; };
  ctx.fillStyle = '#f5f1e6'; ctx.fillRect(0, 0, W, W);

  /* 머리 */
  ctx.fillStyle = COL.ink; ctx.fillRect(0, 0, W, 104);
  ctx.fillStyle = '#ffc93c'; ctx.beginPath(); ctx.moveTo(50, 28); ctx.lineTo(88, 28); ctx.lineTo(104, 84); ctx.lineTo(34, 84); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#fff'; F(800, 40); ctx.fillText('사다리꼴 건축가', 124, 18);
  ctx.fillStyle = '#ffd96b'; F(700, 24); ctx.fillText('오늘의 결과물', 126, 68);
  const d = new Date(); ctx.textAlign = 'right'; ctx.fillStyle = '#c9d0e0'; F(500, 24);
  ctx.fillText(`${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`, W - 40, 70); ctx.textAlign = 'left';

  /* 칭호 + 받은 배지 */
  const rank = rankTitle(earned.length), got = STARS.filter(s => earned.includes(s.id));
  rr(ctx, 40, 118, W - 80, 128, 20);
  const g = ctx.createLinearGradient(40, 118, W - 40, 246); g.addColorStop(0, '#fff6d6'); g.addColorStop(1, '#ffe9a8');
  ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = '#e0b84a'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = COL.ink; F(800, 30); ctx.fillText(`${rank.icon} ${rank.title}`, 62, 132);
  ctx.textAlign = 'right'; F(700, 24); ctx.fillStyle = '#7a4d00'; ctx.fillText(`⭐ 배지 ${earned.length} / ${STARS.length}`, W - 62, 136); ctx.textAlign = 'left';
  F(600, 19);
  if (!got.length) { ctx.fillStyle = '#9aa3b5'; ctx.fillText('(아직 받은 배지가 없어요)', 62, 184); }
  let cx = 62, cy = 176;
  got.forEach(s => {
    const label = `${s.icon} ${s.title}`, w = ctx.measureText(label).width + 24;
    if (cx + w > W - 62) { cx = 62; cy += 34; }
    rr(ctx, cx, cy, w, 28, 14); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#e0b84a'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = COL.ink; ctx.fillText(label, cx + 12, cy + 4);
    cx += w + 8;
  });

  const panel = (x, y, w, h, title, bg = '#fffdf7') => {
    rr(ctx, x, y, w, h, 20); ctx.fillStyle = bg; ctx.fill(); ctx.strokeStyle = '#d8d0ba'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = COL.ink; F(800, 22); ctx.fillText(fitLine(ctx, title, w - 32), x + 16, y + 13);
  };
  const textPanel = (x, y, w, h, title, text, bg) => {
    panel(x, y, w, h, title, bg);
    F(500, 20); const lh = 27, max = Math.max(1, Math.floor((h - 48) / lh));
    let lines = wrapText(ctx, text, w - 32);
    if (lines.length > max) { lines = lines.slice(0, max); lines[max - 1] = fitLine(ctx, lines[max - 1] + '…', w - 32); }
    ctx.fillStyle = (text || '').startsWith('(아직') ? '#9aa3b5' : COL.ink;
    lines.forEach((l, i) => ctx.fillText(l, x + 16, y + 46 + i * lh));
  };

  const LX = 40, RX = 556, CW = 484, TOP = 260;
  /* 내 건물 */
  panel(LX, TOP, CW, 360, '🏠 ' + (state.design.name || '내 건물'));
  try {
    const img = await designImage(state.design, 1200, 900); const ih = 300, iw = ih * 4 / 3, ix = LX + (CW - iw) / 2;
    ctx.save(); rr(ctx, ix, TOP + 46, iw, ih, 12); ctx.clip(); ctx.drawImage(img, ix, TOP + 46, iw, ih); ctx.restore();
  } catch (e) { F(500, 22); ctx.fillStyle = '#9aa3b5'; ctx.fillText('(그림을 불러오지 못했어요)', LX + 16, TOP + 70); }

  /* 변신 기록 */
  const ms = MISSIONS.filter(m => state.a2.missions[m.id]).length, RY = TOP + 376;
  panel(LX, RY, CW, 1026 - RY, `📸 변신 기록   ·   🎯 미션 ${ms}/3`);
  const recs = state.a2.records.length ? state.a2.records.slice(0, 6) : [state.a2.pts];
  const gap = 10, size = 128, gx = LX + (CW - (size * 3 + gap * 2)) / 2;
  recs.forEach((p, i) => {
    const x = gx + (i % 3) * (size + gap), y = RY + 44 + Math.floor(i / 3) * (size + 36);
    rr(ctx, x, y, size, size + 28, 14); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#e4ddc9'; ctx.lineWidth = 2; ctx.stroke();
    const an = analyze(p); if (an.valid) canvasQuad(ctx, p, x, y, size);
    ctx.fillStyle = COL.ink; F(700, 18); ctx.textAlign = 'center';
    ctx.fillText(an.valid ? `평행 ${an.count}쌍 ${an.trap ? '✅' : '❌'}` : '사각형 아님', x + size / 2, y + size + 2); ctx.textAlign = 'left';
  });

  /* 토론 */
  const DY = TOP;
  panel(RX, DY, CW, 212, '💬 디자인과 구조, 무엇이 더 중요할까?');
  F(600, 20); ctx.fillStyle = '#55607a'; ctx.fillText('도입 때', RX + 16, DY + 54);
  F(800, 21); ctx.fillStyle = COL.ink; ctx.fillText(VOTE[state.intro.vote], RX + 100, DY + 53);
  F(800, 19); ctx.fillText('🎨 디자인', RX + 16, DY + 90); ctx.textAlign = 'right'; ctx.fillText('구조 🏗️', RX + CW - 16, DY + 90); ctx.textAlign = 'left';
  const bx = RX + 30, bw = CW - 60; rr(ctx, bx, DY + 122, bw, 14, 7); ctx.fillStyle = '#e1dccd'; ctx.fill();
  const v = state.wrap.touched ? +state.wrap.slider : null;
  if (v != null) { ctx.beginPath(); ctx.arc(bx + bw * v / 100, DY + 129, 16, 0, 7); ctx.fillStyle = '#ffc93c'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = COL.ink; ctx.stroke(); }
  F(600, 20); ctx.fillStyle = '#55607a'; ctx.fillText('지금', RX + 16, DY + 166);
  F(800, 21); ctx.fillStyle = COL.ink; ctx.fillText(fitLine(ctx, state.wrap.touched ? WORD[sliderWord(v)] : '아직 정하지 않았어요', CW - 116), RX + 100, DY + 165);

  /* 글 4칸 */
  const ty = DY + 226, th = (1026 - ty - 3 * 10) / 4;
  const right = MCQ.filter((m, i) => state.wrap.mcq[i] === m.a).length;
  [['까닭', state.wrap.reason, undefined], ['💡 둘 다 살리는 아이디어', state.wrap.idea, '#e6f5ec'],
   ['📐 모양이 바뀌어도 공통된 성질은?', state.a2.opinion, '#fff6d6'], [`✏️ 한 줄 소감   ·   ✅ 배움 확인 ${right}/3`, state.wrap.reflect, undefined]]
    .forEach(([t, txt, bg], i) => textPanel(RX, ty + i * (th + 10), CW, th, t, blankOr(txt), bg));

  ctx.fillStyle = '#8a92a6'; F(600, 19); ctx.textAlign = 'center';
  ctx.fillText('사다리꼴: 평행한 변이 한 쌍이라도 있는 사각형', W / 2, 1044); ctx.textAlign = 'left';
  return new Promise(r => c.toBlob(r, 'image/png'));
}
