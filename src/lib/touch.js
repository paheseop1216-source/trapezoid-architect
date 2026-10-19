import { useEffect } from 'react';

/* 손가락 위치 → SVG 좌표
   getScreenCTM 대신 화면 상자(getBoundingClientRect)와 viewBox로 직접 계산해요.
   (아이패드 사파리에서 CSS zoom·변형이 섞이면 getScreenCTM이 어긋날 수 있어서) */
/* 화면 크기(CSS zoom)를 80%·125%로 바꿨을 때 브라우저마다 위치를 다르게 알려 줘요.
   - 컴퓨터 크롬(표준 방식): getBoundingClientRect가 이미 줄어든 '보이는 크기'
   - 아이패드 사파리·크롬(옛 방식): 줄이기 전 크기 → 손가락 위치와 어긋나 꼭짓점이 왼쪽 위로 밀려요
   그래서 '보이는 크기 ÷ 원래 크기'를 재서 옛 방식이면 zoom 배율을 곱해 맞춰요. */
export function currentZoom() {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--zoom')) || 1;
}
export function rectScale(el) {
  const z = currentZoom();
  if (Math.abs(z - 1) < 1e-3) return 1;
  let box = el; while (box && !(box.offsetWidth > 0)) box = box.parentElement;   // SVG는 offsetWidth가 없어서 감싼 상자로 재요
  if (!box) return 1;
  const ratio = box.getBoundingClientRect().width / box.offsetWidth;
  return Math.abs(ratio - z) < Math.abs(ratio - 1) ? 1 : z;
}
/* 손가락(clientX/Y)과 같은 기준의 화면 상자 */
export function visualRect(el) {
  const r = el.getBoundingClientRect(), f = rectScale(el);
  return f === 1 ? r : { left: r.left * f, top: r.top * f, width: r.width * f, height: r.height * f };
}

export function svgPoint(svg, e) {
  const r = visualRect(svg), vb = svg.viewBox.baseVal;
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
