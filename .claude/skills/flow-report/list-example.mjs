import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

// 프로젝트 폴더에서 실행한다. 스크립트를 scratchpad에 복사해도 Playwright는 프로젝트의 것을 쓴다
const playwright = await import(
  pathToFileURL(path.resolve("node_modules/@playwright/test/index.js")).href
);
// CommonJS 패키지라 ESM import에서는 default 아래에 있다
const { chromium } = playwright.default ?? playwright;
const OUT = process.env.OUT || path.resolve("flow-shots") + "/";
fs.mkdirSync(OUT, { recursive: true });
const BASE = process.env.BASE || "http://localhost:3001";
const log = [];
(async () => {
  const browser = await chromium.launch({ channel: "chrome" });
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    timezoneId: "Asia/Seoul",
    locale: "ko-KR",
  });
  await ctx.addInitScript(() => {
    const st = document.createElement("style");
    st.textContent = "nextjs-portal{display:none!important}";
    document.addEventListener("DOMContentLoaded", () =>
      document.head.appendChild(st),
    );
  });
  const page = await ctx.newPage();
  const shot = async (name, note) => {
    await page.waitForTimeout(500);
    await page.screenshot({ path: OUT + name + ".png" });
    log.push({ name, note, url: page.url().replace(BASE, "") });
  };
  const chips = () =>
    page.getByRole("group", { name: "필터" }).getByRole("button");
  await page.goto(BASE + "/");
  await page.evaluate(() => sessionStorage.clear());
  await page.goto(BASE + "/");
  await page.locator("[data-slot=tabs-content] li").first().waitFor();
  await shot("01-home", "모집 중");
  await chips().nth(0).click();
  await shot("02-activity-sheet", "활동 시트");
  await page.getByRole("radio", { name: "보드게임" }).click();
  await shot("03-activity-selected", "보드게임 선택");
  await page.getByRole("button", { name: "적용하기" }).click();
  await shot("04-activity-applied", "활동 적용");
  await chips().nth(1).click();
  await page.getByRole("radio", { name: "마포구" }).click();
  await shot("05-region-sheet", "지역 시트");
  await page.getByRole("button", { name: "적용하기" }).click();
  await shot("06-region-applied", "지역 적용");
  await chips().nth(2).click();
  await shot("07-date-sheet", "날짜 시트");
  const days = page.locator("button[data-day]:not([disabled])");
  await days.nth(0).click();
  await days.nth(6).click();
  await shot("08-date-range", "기간 선택");
  await page.getByRole("switch", { name: "시작 시각 설정" }).click();
  await shot("09-date-time", "시작 시각 켬");
  await page.getByRole("button", { name: "적용하기" }).click();
  await shot("10-date-applied", "날짜 적용");
  await page.goto(
    BASE + "/?activity=2&region=11200&from=2027-06-01&to=2027-06-01",
  );
  await page.waitForTimeout(800);
  await shot("11-empty", "결과 없음");
  await page.goto(BASE + "/");
  await page.locator("[data-slot=tabs-content] li").first().waitFor();
  const more = page.getByRole("button", { name: "더 보기" });
  if (await more.count()) {
    await more.scrollIntoViewIfNeeded();
    await shot("12-more", "더 보기");
    await more.click();
    await page.waitForTimeout(800);
    await shot("13-more-loaded", "더 불러옴");
  }
  await page.getByRole("tab", { name: "참여한 일정" }).click();
  await shot("14-joined", "참여한 일정");
  await page.getByRole("tab", { name: "개설한 일정" }).click();
  await shot("15-created", "개설한 일정");
  // 비로그인: 같은 세션에서 로그아웃
  await page.goto(BASE + "/");
  await page.locator("[data-slot=tabs-content] li").first().waitFor();
  await page.getByRole("button", { name: "로그아웃" }).click();
  await page.waitForTimeout(800);
  const dlg = page.getByRole("dialog");
  if (await dlg.count()) {
    await shot("17-logout-confirm", "로그아웃 확인");
    await dlg
      .getByRole("button", { name: /로그아웃|확인/ })
      .last()
      .click();
    await page.waitForTimeout(800);
  }
  await shot("18-guest-home", "비로그인 모집 중");
  await page.getByRole("tab", { name: "참여한 일정" }).click();
  await shot("19-guest-joined", "비로그인 참여한 일정");
  await page.getByRole("tab", { name: "개설한 일정" }).click();
  await shot("20-guest-created", "비로그인 개설한 일정");
  await browser.close();
  console.log(JSON.stringify(log, null, 1));
})().catch((e) => {
  console.error(e.message);
  console.log(JSON.stringify(log, null, 1));
  process.exit(1);
});
