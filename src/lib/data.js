/* 수업 내용 데이터 (화면 코드와 분리) */

export const LABELS = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ'];
export const COL = { o: '#e46f1f', b: '#2a66d1', ink: '#1f2a44', gray: '#9aa3b5', red: '#c94848' };
export const FILLS = ['#ffe7a3', '#cde8ff', '#d9f2d0', '#ffd9cc', '#e8dcff'];

export const TABS = [
  { id: 'intro', n: 1, label: '도입', sub: '생각 열기' },
  { id: 'a1', n: 2, label: '활동1', sub: '사다리꼴 알기' },
  { id: 'a2', n: 3, label: '활동2', sub: '변신과 디자인' },
  { id: 'wrap', n: 4, label: '정리', sub: '생각 모으기' },
];

export const SUBS = {
  a1: [
    { id: 'a1:sort', label: '① 사각형 나누기' },
    { id: 'a1:find', label: '② 평행한 변 찾기' },
    { id: 'a1:quiz', label: '③ 확인 문제' },
  ],
  a2: [
    { id: 'a2:morph', label: '① 사다리꼴 변신 실험' },
    { id: 'a2:design', label: '② 사다리꼴 건물 디자인' },
  ],
  wrap: [
    { id: 'wrap:sum', label: '① 배운 내용' },
    { id: 'wrap:talk', label: '② 생각 정리하기' },
    { id: 'wrap:done', label: '③ 결과물 저장' },
  ],
};

/* 활동1 카드 — 순서가 곧 화면 순서 */
export const SHAPES = [
  { id: 's5', tag: '가', name: '직사각형', p: [[0,1],[6,1],[6,5],[0,5]] },
  { id: 's1', tag: '나', name: '사각형', p: [[0,1],[5,0],[6,5],[1,4]] },
  { id: 's2', tag: '다', name: '사다리꼴', p: [[1,1],[4,1],[6,5],[0,5]] },
  { id: 's9', tag: '라', name: '사각형(연 모양)', p: [[3,0],[5,2],[3,6],[1,2]] },
  { id: 's4', tag: '마', name: '마름모', p: [[3,0],[5,3],[3,6],[1,3]] },
  { id: 's7', tag: '바', name: '돌려 놓은 사다리꼴', p: [[1,0],[5,2],[5,4],[1,6]] },
  { id: 's10', tag: '사', name: '사각형', p: [[0,0],[5,1],[4,5],[1,4]] },
  { id: 's3', tag: '아', name: '평행사변형', p: [[2,1],[6,1],[4,5],[0,5]] },
  { id: 's6', tag: '자', name: '정사각형', p: [[1,1],[5,1],[5,5],[1,5]] },
  { id: 's8', tag: '차', name: '기울어진 사다리꼴', p: [[0,2],[4,0],[6,2],[0,5]] },
];

export const OX = [
  { p: [[0,1],[6,1],[6,5],[0,5]], a: 'O', why: '직사각형은 평행한 변이 2쌍이에요. 한 쌍이라도 있으니 사다리꼴이에요.' },
  { p: [[3,0],[5,2],[3,6],[1,2]], a: 'X', why: '마주 보는 변을 늘이면 모두 만나요. 평행한 변이 없어요.' },
  { p: [[1,1],[5,1],[5,5],[1,5]], a: 'O', why: '정사각형도 평행한 변이 2쌍이라 사다리꼴이에요.' },
  { p: [[1,0],[5,2],[5,4],[1,6]], a: 'O', why: '돌려 놓아도 세로로 선 두 변이 평행해요.' },
  { p: [[2,1],[6,1],[4,5],[0,5]], a: 'O', why: '평행사변형은 평행한 변이 2쌍 있어요.' },
];

export const RECT0 = [[2, 2], [10, 2], [10, 6], [2, 6]];
export const GW = 12, GH = 8, CELL = 50;
export const MISSIONS = [
  { id: 'm1', t: '직사각형을 꼭짓점 하나만 옮겨서 사다리꼴로 만들어 보세요.' },
  { id: 'm2', t: '평행한 변이 2쌍인 사다리꼴을 만들어 보세요. (직사각형 말고 다른 모양으로!)' },
  { id: 'm3', t: '사다리꼴이 아닌 사각형을 만들어 보세요.' },
];

/* 건물 디자인 조각 — u: 20×20 단위 꼭짓점 (모두 평행한 변이 있는 사다리꼴) */
const TRAP = [[3,0],[17,0],[20,20],[0,20]], RECT = [[0,0],[20,0],[20,20],[0,20]];
export const PARTS = {
  roof:    { cat: 'top',  label: '지붕',          u: TRAP,                          w: 340, h: 100, color: '#c8553d' },
  peak:    { cat: 'top',  label: '뾰족 지붕',     u: [[8,0],[12,0],[20,20],[0,20]], w: 220, h: 130, color: '#8a5a3b' },
  tower:   { cat: 'top',  label: '탑 꼭대기',     u: [[7,0],[13,0],[20,20],[0,20]], w: 110, h: 140, color: '#e8a33a' },
  awning:  { cat: 'top',  label: '차양',          u: [[0,0],[20,0],[16,20],[4,20]], w: 150, h: 46,  color: '#2a66d1' },
  rect:    { cat: 'body', label: '직사각형 몸체', u: RECT,                          w: 200, h: 150, color: '#f2d7a6' },
  base:    { cat: 'body', label: '넓은 기단',     u: [[2,0],[18,0],[20,20],[0,20]], w: 380, h: 50,  color: '#b9a27c' },
  column:  { cat: 'body', label: '기둥',          u: RECT,                          w: 30,  h: 160, color: '#ffffff' },
  rtrap:   { cat: 'body', label: '직각 사다리꼴', u: [[0,0],[12,0],[20,20],[0,20]], w: 120, h: 90,  color: '#7fb069' },
  para:    { cat: 'body', label: '평행사변형',    u: [[6,0],[20,0],[14,20],[0,20]], w: 140, h: 70,  color: '#a78bd4' },
  window:  { cat: 'open', label: '사다리꼴 창',   u: [[4,0],[16,0],[20,20],[0,20]], w: 66,  h: 66,  color: '#9fd3f0' },
  rwin:    { cat: 'open', label: '네모 창',       u: RECT,                          w: 56,  h: 56,  color: '#9fd3f0' },
  door:    { cat: 'open', label: '문',            u: RECT,                          w: 60,  h: 96,  color: '#8a5a3b' },
  stairs:  { cat: 'open', label: '출입구 계단',   u: TRAP,                          w: 150, h: 36,  color: '#b9a27c' },
  balcony: { cat: 'open', label: '발코니',        u: [[0,0],[20,0],[17,20],[3,20]], w: 140, h: 40,  color: '#555f73' },
  flag:    { cat: 'deco', label: '깃발',          u: [[0,0],[14,0],[20,20],[6,20]], w: 60,  h: 36,  color: '#ff8fab' },
  chimney: { cat: 'deco', label: '굴뚝',          u: RECT,                          w: 34,  h: 70,  color: '#c8553d' },
  sign:    { cat: 'deco', label: '간판',          u: RECT,                          w: 170, h: 40,  color: '#ffd23f' },
  pot:     { cat: 'deco', label: '화분',          u: [[0,0],[20,0],[16,20],[4,20]], w: 50,  h: 40,  color: '#e8a33a' },
};
export const PART_CATS = [
  { id: 'top', label: '지붕·꼭대기' }, { id: 'body', label: '몸체·기단' },
  { id: 'open', label: '창·문' }, { id: 'deco', label: '꾸미기' },
];
export const DEFAULT_POS = {
  roof: [400, 220], peak: [400, 200], tower: [400, 110], awning: [400, 430], rect: [400, 400], base: [400, 515], column: [250, 420],
  rtrap: [620, 470], para: [180, 470], window: [330, 350], rwin: [470, 350], door: [400, 470], stairs: [400, 522], balcony: [400, 330],
  flag: [430, 60], chimney: [500, 230], sign: [400, 300], pot: [260, 520],
};
export const SWATCH = ['#c8553d', '#e8a33a', '#ffd23f', '#7fb069', '#2a66d1', '#9fd3f0', '#a78bd4', '#f2d7a6', '#8a5a3b', '#ffffff', '#555f73', '#ff8fab'];
export const PATTERNS = [
  { id: 'none', label: '없음' }, { id: 'brick', label: '벽돌' }, { id: 'stripe', label: '줄무늬' },
  { id: 'dot', label: '물방울' }, { id: 'tile', label: '타일' },
];

/* 예시 건물 — 바닥(땅)은 y=540 */
const P = (type, cx, cy, w, h, color, extra = {}) => ({ type, cx, cy, w, h, color: color || PARTS[type].color, flip: false, rot: 0, pattern: 'none', ...extra });
export const TEMPLATES = [
  { id: 'library', label: '📚 튼튼 도서관', name: '튼튼 사다리 도서관', parts: [
    P('base', 400, 515, 400, 50), P('rect', 400, 395, 300, 190, '#f2d7a6', { pattern: 'brick' }),
    P('roof', 400, 250, 340, 100), P('sign', 400, 325, 160, 36),
    P('window', 315, 385, 60, 60), P('window', 485, 385, 60, 60), P('door', 400, 450, 60, 80), P('awning', 400, 400, 110, 30),
  ] },
  { id: 'tower', label: '🗼 하늘 탑', name: '구름 위 하늘 탑', parts: [
    P('base', 400, 510, 320, 60), P('roof', 400, 430, 260, 100, '#7fb069'), P('roof', 400, 330, 210, 100, '#a6cf8f'),
    P('roof', 400, 235, 165, 90, '#cfe7bf'), P('tower', 400, 130, 110, 120), P('flag', 430, 55, 50, 30),
    P('rwin', 400, 430, 40, 40), P('rwin', 400, 330, 36, 36),
  ] },
  { id: 'house', label: '🏠 우리 집', name: '포근한 우리 집', parts: [
    P('chimney', 500, 280, 34, 80), P('rect', 400, 450, 320, 180, '#fff3c4', { pattern: 'stripe' }), P('roof', 400, 310, 380, 100),
    P('door', 400, 495, 60, 90), P('awning', 400, 440, 100, 28, '#c8553d'), P('rwin', 315, 430, 56, 56), P('rwin', 485, 430, 56, 56),
    P('pot', 330, 522, 44, 36), P('pot', 470, 522, 44, 36, '#7fb069'),
  ] },
];
export const SCENES = [
  { id: 'day', label: '☀️ 낮', sky: ['#cfe9fb', '#eef7fd'], ground: '#cfe3b5', line: '#9cbf7d', sun: '#ffd23f' },
  { id: 'sunset', label: '🌇 노을', sky: ['#ffb38a', '#ffe2c4'], ground: '#c9c08f', line: '#a39a68', sun: '#ff7b54' },
  { id: 'night', label: '🌙 밤', sky: ['#1d2b53', '#3b4a7a'], ground: '#4b5b3c', line: '#36432a', sun: '#f4f1c9' },
];

export const MCQ = [
  { q: '1. 사다리꼴의 뜻으로 알맞은 것은 무엇일까요?', o: ['평행한 변이 한 쌍이라도 있는 사각형', '평행한 변이 정확히 한 쌍만 있는 사각형', '네 변의 길이가 모두 같은 사각형'], a: 0 },
  { q: '2. 다음 중 사다리꼴이 아닌 것은 무엇일까요?', o: ['직사각형', '평행사변형', '평행한 변이 하나도 없는 사각형'], a: 2 },
  { q: '3. 건물의 아래쪽을 넓은 사다리꼴 모양으로 만들면 좋은 점은 무엇일까요?', o: ['아래가 넓어서 잘 넘어지지 않아요', '건물이 더 가벼워져요', '평행한 변이 없어져요'], a: 0 },
];

export const WORD = { design: '🎨 디자인이 더 중요해요', stable: '🏗️ 구조가 더 중요해요', both: '⚖️ 둘 다 비슷하게 중요해요', '': '아직 투표하지 않았어요' };
export const VOTE = { design: '🎨 아름다움 · 디자인', stable: '🏗️ 튼튼함 · 안정성', '': '투표 안 함' };
export const sliderWord = v => (v <= 35 ? 'design' : v >= 65 ? 'stable' : 'both');

/* 발표 모드 질문 */
export const PQ = {
  intro: ['모든 건물은 직사각형이어야 할까?', '왜 직사각형으로 만들지 않고 사다리꼴 모양을 사용했을까?', '튼튼함과 아름다움, 어떤 까닭이 더 클까요?', '아래가 넓은 탑과 위가 넓은 탑, 어느 쪽이 더 안정감이 있을까요?'],
  a1: ['사각형을 두 무리로 나누어 보세요. 어떤 기준으로 나누었나요?', '평행한 변이 있는 것과 없는 것으로 나누어 볼까요?', '평행한 변이 한 쌍이라도 있는 사각형을 사다리꼴이라고 합니다.', '직사각형과 정사각형도 사다리꼴일까요?'],
  a2: ['직사각형을 꼭짓점 하나만 옮겨서 사다리꼴로 만들어 보세요.', '평행한 변이 2쌍인 사다리꼴을 만들어 보세요.', '모양이 달라졌는데 공통된 수학적 성질은 무엇일까요?', '사다리꼴 조각으로 튼튼하면서도 멋진 건물을 지어 볼까요?', '지진 시험을 통과한 건물은 어떤 모양이었나요?'],
  wrap: ['건축물을 만들 때 아름다운 디자인과 튼튼하고 편리한 구조 중 무엇을 더 중요하게 생각해야 할까?', '디자인과 구조, 둘 다 살리는 아이디어는 무엇일까요?', '오늘 배운 사다리꼴을 한 문장으로 말해 볼까요?'],
};

/* 안내 캐릭터 '사다리 박사'의 말 (화면별) */
export const GUIDE = {
  intro: '안녕하세요! 저는 사다리 박사예요. 오늘은 건물 속에 숨은 모양을 함께 찾아봐요. 두 건물은 무엇이 다를까요?',
  'a1:sort': '카드를 끌어서 두 무리로 나누어 보세요. 정답은 없어요. 내 기준이 중요해요!',
  'a1:find': '마주 보는 두 변을 차례로 눌러 보세요. 아무리 늘여도 만나지 않으면 평행이에요.',
  'a1:quiz': '직사각형과 정사각형도 평행한 변이 있는지 꼭 살펴보세요!',
  'a2:morph': '동그란 꼭짓점을 끌어 보세요. 모양이 바뀌어도 평행한 변이 남아 있나요?',
  'a2:design': '사다리꼴 조각으로 나만의 건물을 지어 봐요! 다 지으면 🌬️ 지진 시험으로 얼마나 튼튼한지 확인해 보세요.',
  wrap: '오늘 모은 별을 확인해 보세요. 처음 생각과 지금 생각은 어떻게 달라졌나요?',
  'wrap:sum': '오늘 배운 사다리꼴을 정리하고, 배움 확인 문제를 풀어 봐요!',
  'wrap:talk': '디자인과 구조, 무엇이 더 중요할까요? 도입 때 내 생각과 비교해 보세요.',
  'wrap:done': '한 줄 소감을 쓰고 오늘 결과물을 그림 파일로 저장해요. 모두 수고했어요!',
};
