import { useEffect } from 'react';

/* 손가락 위치 → SVG 좌표
   getScreenCTM 대신 화면 상자(getBoundingClientRect)와 viewBox로 직접 계산해요.
   (아이패드 사파리에서 CSS zoom·변형이 섞이면 getScreenCTM이 어긋날 수 있어서) */
export function svgPoint(svg, e) {
  const r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal;
  const s = Math.min(r.width / vb.width, r.height / vb.height) || 1;
  const ox = r.left + (r.width - vb.width * s) / 2, oy = r.top + (r.height - vb.height * s) / 2;
  return { x: vb.x + (e.clientX - ox) / s, y: vb.y + (e.clientY - oy) / s };
}

/* 아이패드 사파리는 SVG의 touch-action: none을 무시할 때가 있어요.
   그러면 끄는 도중 화면 스크롤로 바뀌며 끌기가 취소돼요(pointercancel).
   그래서 이 그림판 안에서는 터치 스크롤·확대를 직접 막아요. */
export function useTouchLock(ref) {
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const stop = e => { if (e.cancelable) e.preventDefault(); };
    el.addEventListener('touchstart', stop, { passive: false });
    el.addEventListener('touchmove', stop, { passive: false });
    el.addEventListener('gesturestart', stop);   // 사파리 두 손가락 확대
    return () => {
      el.removeEventListener('touchstart', stop);
      el.removeEventListener('touchmove', stop);
      el.removeEventListener('gesturestart', stop);
    };
  }, [ref]);
}

/* 끌기 중 포인터 붙잡기 — 실패해도(일부 브라우저) 끌기는 계속돼요 */
export function capture(el, e) { try { el.setPointerCapture(e.pointerId); } catch (err) { /* 무시 */ } }
