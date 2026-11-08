---
paths:
  - "e2e/**"
  - "playwright.config.ts"
---

# E2E (Playwright)

- 실행: `pnpm test:e2e`. 3100 포트에 프로덕션 빌드를 띄워 돌린다(개발 서버는 폴더당 하나만 뜨므로). 설치된 Chrome(`channel: "chrome"`)을 쓴다.
- API는 테스트마다 `page.route`로 가짜 응답을 준다. MSW(service worker)는 막는다(`serviceWorkers: "block"`). 네이버 지도 스크립트는 막는다.
- 로그인 상태는 `POST /api/v1/auth/tokens`를 성공으로 응답해 만든다.
- 요소는 role·접근성 이름으로 찾는다(`getByRole`, `getByLabel`). class나 DOM 구조에 기대지 않는다.
- 스크린샷 비교는 바뀌지 않는 영역(팝업 등)만 기준 이미지로 둔다. 날짜에 따라 바뀌는 화면은 첨부만 한다.
- 화면 크기는 390×844 모바일 기준(`playwright.config.ts`). 시간대는 Asia/Seoul.
