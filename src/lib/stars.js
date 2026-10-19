import { analyze } from './geo.js';
import { SHAPES, OX, MISSIONS, MCQ } from './data.js';

export function shapeDone(state, sh) {
  const a = analyze(sh.p), f = (state.a1.found[sh.id] || []).filter(Array.isArray);
  return a.count > 0 ? f.length === a.count : !!state.a1.foundNone[sh.id];
}
const filled = t => !!(t && t.trim());

/* 배지(별) 9개 — 각 활동의 핵심 과제를 끝내면 하나씩 받아요 */
export const STARS = [
  { id: 'vote', tab: 'intro', icon: '🗳️', title: '생각 열기', desc: '투표하고 까닭을 썼어요',
    test: s => !!s.intro.vote && filled(s.intro.reason) },
  { id: 'sort', tab: 'a1', icon: '🗂️', title: '분류 박사', desc: '평행한 변으로 바르게 나누었어요',
    test: s => !!s.a1.sortDone },
  { id: 'find', tab: 'a1', icon: '🔍', title: '평행 탐정', desc: '카드 10장의 평행한 변을 모두 찾았어요',
    test: s => SHAPES.every(sh => shapeDone(s, sh)) },
  { id: 'ox', tab: 'a1', icon: '⭕', title: '개념 지킴이', desc: '확인 문제 5개를 모두 맞혔어요',
    test: s => OX.every((q, i) => s.a1.ox[i] === q.a) },
  { id: 'mission', tab: 'a2', icon: '🎯', title: '변신 마법사', desc: '변신 미션 3개를 모두 성공했어요',
    test: s => MISSIONS.every(m => s.a2.missions[m.id]) },
  { id: 'record', tab: 'a2', icon: '📸', title: '관찰 기록가', desc: '변신 기록 3개를 남기고 공통 성질을 썼어요',
    test: s => s.a2.records.length >= 3 && filled(s.a2.opinion) },
  { id: 'design', tab: 'a2', icon: '🏗️', title: '꼬마 건축가', desc: '조각 5개 이상으로 건물을 짓고 이름을 붙여 지진 시험을 했어요',
    test: s => s.design.parts.length >= 5 && filled(s.design.name) && !!(s.design.quake && s.design.quake.tested) },
  { id: 'debate', tab: 'wrap', icon: '💬', title: '토론왕', desc: '내 생각 위치, 까닭, 아이디어를 썼어요',
    test: s => s.wrap.touched && filled(s.wrap.reason) && filled(s.wrap.idea) },
  { id: 'mcq', tab: 'wrap', icon: '🏆', title: '사다리꼴 마스터', desc: '배움 확인 3문제를 모두 맞혔어요',
    test: s => MCQ.every((m, i) => s.wrap.mcq[i] === m.a) },
];

export const earnedIds = s => STARS.filter(st => st.test(s)).map(st => st.id);

/* 모은 배지 개수에 따른 칭호 */
export function rankTitle(n) {
  if (n >= STARS.length) return { icon: '🏆', title: '사다리꼴 마스터 건축가' };
  if (n >= 7) return { icon: '🥇', title: '으뜸 건축가' };
  if (n >= 4) return { icon: '🔨', title: '쑥쑥 크는 건축가' };
  return { icon: '🌱', title: '새싹 건축가' };
}
