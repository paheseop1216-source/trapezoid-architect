import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyze, selfTest } from '../src/lib/geo.js';
import { SHAPES, OX, PARTS, TEMPLATES } from '../src/lib/data.js';
import { stability } from '../src/lib/parts.js';

test('도형 엔진 자체 테스트 10개가 모두 통과해요', () => {
  for (const t of selfTest()) assert.ok(t.ok, t.name);
});

test('직사각형·정사각형·평행사변형·마름모는 모두 사다리꼴이에요', () => {
  for (const p of [
    [[0,0],[4,0],[4,2],[0,2]], [[0,0],[3,0],[3,3],[0,3]],
    [[1,0],[5,0],[4,2],[0,2]], [[2,0],[4,3],[2,6],[0,3]],
  ]) {
    const r = analyze(p);
    assert.equal(r.trap, true); assert.equal(r.count, 2);
  }
});

test('활동1 카드 정답: 평행한 변이 없는 카드는 나·라·사', () => {
  const none = SHAPES.filter(s => !analyze(s.p).trap).map(s => s.tag).sort();
  assert.deepEqual(none, ['나', '라', '사']);
  for (const s of SHAPES) assert.ok(analyze(s.p).valid, s.tag);
});

test('건물 조각은 모두 평행한 변이 있는 사다리꼴이에요', () => {
  for (const [k, d] of Object.entries(PARTS)) assert.ok(analyze(d.u).trap, k);
});

test('지진 시험: 아래가 넓으면 별 3개, 위가 넓으면 별 1개, 떠 있으면 0개', () => {
  const part = (type, cx, cy, w, h, rot = 0) => ({ id: type + cy, type, cx, cy, w, h, flip: false, rot });
  assert.equal(stability([part('base', 400, 490, 300, 100)]).grade, 3);
  assert.equal(stability([part('rect', 400, 490, 200, 100)]).grade, 2);
  assert.equal(stability([part('base', 400, 490, 300, 100, 2)]).grade, 1);
  assert.equal(stability([part('rect', 400, 300, 200, 100)]).kind, 'float');
  /* 좁은 기둥 위에 한쪽으로 치우친 큰 몸체 → 넘어져요 */
  assert.equal(stability([part('column', 300, 470, 30, 140), part('rect', 520, 350, 400, 100)]).kind, 'fall');
  for (const t of TEMPLATES) assert.ok(stability(t.parts).grade >= 2, t.id);
});

test('확인 문제 정답이 판정 결과와 같아요', () => {
  for (const q of OX) assert.equal(analyze(q.p).trap ? 'O' : 'X', q.a);
});
