import { defineConfig } from "@playwright/test";

// E2E 테스트 — 화면 흐름을 실제 브라우저로 확인한다. API는 테스트마다 page.route로 가짜 응답을 준다
// 개발 서버(next dev)는 한 폴더에 하나만 뜨므로, 프로덕션 빌드를 다른 포트에서 띄운다
const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: BASE_URL,
    // 설치된 Chrome을 쓴다 (Playwright 전용 브라우저를 따로 받지 않는다)
    channel: "chrome",
    // 시안 기준 화면 (DESIGN: 390×844)
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
    // MSW(service worker)가 요청을 가로채지 않게 막고, API는 테스트의 page.route로만 응답한다
    serviceWorkers: "block",
    trace: "retain-on-failure",
  },
  webServer: {
    command: `pnpm exec next build && pnpm exec next start -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    env: {
      NEXT_PUBLIC_API_MOCKING: "disabled",
      // 백엔드 대신 같은 주소로 보내 page.route가 받게 한다 (CORS 없이)
      NEXT_PUBLIC_API_BASE_URL: BASE_URL,
    },
  },
});
