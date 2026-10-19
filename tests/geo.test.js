import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyze, selfTest } from '../src/lib/geo.js';
import { SHAPES, OX } from '../src/lib/data.js';

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

test('확인 문제 정답이 판정 결과와 같아요', () => {
  for (const q of OX) assert.equal(analyze(q.p).trap ? 'O' : 'X', q.a);
});
