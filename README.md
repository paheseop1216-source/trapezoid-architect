# 사다리꼴 건축가

초등학교 4학년 2학기 4단원 '사각형' — 사다리꼴 수업용 웹앱입니다. (React + Vite)
핵심 질문: **"모든 건물은 직사각형이어야 할까?"**

- 단계: 도입 · 활동1(분류, 평행한 변 찾기, 확인 문제) · 활동2(변신 실험, 건물 디자인) · 정리
- 안내 캐릭터 '사다리 박사', 배지(별) 9개 모으기, 미션 성공 축하 효과
- 진행 상황은 브라우저 `localStorage`에만 저장돼요. 학생 이름·개인정보는 받지 않아요.
- 외부 CDN 없이 동작해요 (글꼴까지 함께 묶여 있어 한 번 열리면 학교 네트워크 차단에도 안전).

## 개발
```bash
npm install
npm run dev      # 개발 서버
npm test         # 도형 판정 테스트
npm run build    # dist/ 폴더에 배포용 파일 생성
```

- 선생님 메모·발표 모드: 주소 뒤에 `?teacher=1`을 붙이거나 화면 오른쪽 아래 구석을 길게 눌러요.
- 도형 판정 자체 테스트: 주소 뒤에 `?test=1`을 붙이고 개발자 도구 콘솔을 확인해요.

## 폴더 구조
```
src/
  lib/geo.js          도형 엔진 (평행 판정, 사각형 유효성)
  lib/data.js         수업 내용 데이터 (카드, 문제, 미션, 조각)
  lib/parts.js        건물 조각 좌표 · 지진 시험 계산
  lib/stars.js        배지 조건 · 칭호
  lib/store.jsx       상태 · localStorage 저장
  lib/exportImage.jsx PNG 저장
  lib/sound.js        효과음 (기본 꺼짐)
  components/         공통 컴포넌트 (도형, 캐릭터, 건물 캔버스, 대화창 등)
  pages/              도입 · 활동1 · 활동2(변신 실험) · Design(건물 디자인) · 정리
legacy/index.html     1차 버전 (단일 HTML 파일, 더블클릭 실행용)
```

화면별 기능, 배지·칭호, 수정 기록 등 자세한 설명은 [사다리꼴건축가_웹앱정리.md](사다리꼴건축가_웹앱정리.md)를 보세요.

## 배포 (Vercel)
GitHub 저장소를 Vercel에서 Import하면 Vite로 자동 인식돼요.
(Framework Preset: **Vite**, Build Command: `npm run build`, Output Directory: `dist`)

## 글꼴
배달의민족 도현체(Do Hyeon, SIL Open Font License 1.1)를 `src/assets`에 함께 넣어 두었어요.
