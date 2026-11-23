---
paths:
  - "e2e/**"
  - "playwright.config.ts"
---

# E2E (Playwright)

- 실행: `pnpm test:e2e`. 3100 포트에 프로덕션 빌드를 띄워 돌린다(개발 서버는 폴더당 하나만 뜨므로). 같은 테스트를 두 프로젝트로 돌린다: `chrome`(설치된 Chrome)과 `webkit`(아이폰 사파리와 같은 엔진, SHI-210). 아이폰은 크롬 앱도 WebKit이라 크롬 엔진만으로는 사파리 전용 화면 문제를 못 잡는다.
- WebKit은 처음 한 번 `pnpm exec playwright install webkit`으로 받는다(약 80MB, 프로젝트 의존성은 아니다). 한쪽만 돌리려면 `pnpm exec playwright test --project=webkit`.
- 엔진마다 다른 것: 클립보드 권한은 WebKit에 줄 수 없어 `captureClipboard`(복사한 글 가로채기)로 확인한다. 뒤로가기 캐시(`loginBfcache.spec.ts`)는 Chrome 전용 설정이라 WebKit에서 건너뛰고, 사파리 동작은 실제 기기에서 본다. 엔진에 따라 다른 테스트는 `test.skip`에 이유를 적는다.
- API는 테스트마다 `page.route`로 가짜 응답을 준다. MSW(service worker)는 막는다(`serviceWorkers: "block"`). 네이버 지도 스크립트는 막는다.
- 로그인 상태는 `POST /api/v1/auth/tokens`를 성공으로 응답해 만든다.
- 요소는 role·접근성 이름으로 찾는다(`getByRole`, `getByLabel`). class나 DOM 구조에 기대지 않는다.
- 스크린샷 비교는 바뀌지 않는 영역(팝업 등)만 기준 이미지로 둔다. 날짜에 따라 바뀌는 화면은 첨부만 한다.
- 화면 크기는 390×844 모바일 기준(`playwright.config.ts`). 시간대는 Asia/Seoul.
