import { useEffect, useRef } from 'react';

/* 축하 효과: 작은 사다리꼴 조각이 쏟아져요 (움직임 줄이기 설정이면 생략) */
const COLORS = ['#ffc93c', '#e46f1f', '#2a66d1', '#22885a', '#ff8fab', '#a78bd4'];

export default function Confetti({ fire }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!fire) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cv = ref.current, ctx = cv.getContext('2d');
    const W = cv.width = innerWidth, H = cv.height = innerHeight;
    const bits = Array.from({ length: 90 }, () => ({
      x: W / 2 + (Math.random() - .5) * W * .5, y: H * .35,
      vx: (Math.random() - .5) * 14, vy: -Math.random() * 14 - 4,
      r: Math.random() * Math.PI, vr: (Math.random() - .5) * .3,
      s: 8 + Math.random() * 8, c: COLORS[(Math.random() * COLORS.length) | 0],
    }));
    let raf, t0 = performance.now();
    const step = now => {
      const t = now - t0; ctx.clearRect(0, 0, W, H);
      bits.forEach(b => {
        b.vy += .45; b.vx *= .99; b.x += b.vx; b.y += b.vy; b.r += b.vr;
        ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.r); ctx.fillStyle = b.c;
        ctx.globalAlpha = Math.max(0, 1 - t / 1800);
        ctx.beginPath(); ctx.moveTo(-b.s * .3, -b.s * .4); ctx.lineTo(b.s * .3, -b.s * .4); ctx.lineTo(b.s * .5, b.s * .4); ctx.lineTo(-b.s * .5, b.s * .4); ctx.closePath(); ctx.fill();
        ctx.restore();
      });
      if (t < 1800) raf = requestAnimationFrame(step); else ctx.clearRect(0, 0, W, H);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [fire]);
  return <canvas ref={ref} className="confetti" aria-hidden="true" />;
}
