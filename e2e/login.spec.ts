import { expect, test, type Page } from "@playwright/test";

// 로그인 화면 AUTH-01 (USER_FLOW §4.2, SHI-185)
// 로그인한 사람이 오면 바로 내보낸다. 앱 안에서 왔으면 앞 화면, 아니면 홈

const ok = (data: unknown) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify({ isSuccess: true, data }),
});

const fail = (status: number, code: string) => ({
  status,
  contentType: "application/json",
  body: JSON.stringify({ isSuccess: false, code, message: "" }),
});

/** 앱을 열 때 로그인 복구(재발급)가 loggedIn이면 성공한다. 그 밖의 API는 이 테스트와 관계없어 404 */
async function mockApis(page: Page, { loggedIn }: { loggedIn: boolean }) {
  await page.route("**/api/v1/**", (route) =>
    route.fulfill(fail(404, "NOT_FOUND")),
  );
  await page.route("**/api/v1/auth/tokens", (route) =>
    route.fulfill(
      loggedIn
        ? ok({ accessToken: "e2e-access-token" })
        : fail(401, "INVALID_REFRESH_TOKEN"),
    ),
  );
}

/** 로그인 표시용 쿠키 (src/shared/lib/loginHint.ts) */
const LOGIN_HINT = "snsg_logged_in";

const hasLoginHint = async (page: Page) =>
  (await page.context().cookies()).some(({ name }) => name === LOGIN_HINT);

const kakaoButton = (page: Page) =>
  page.getByRole("button", { name: "카카오 로그인" });

test("비로그인이면 카카오 로그인 버튼을 보여주고, 네이버 버튼은 연결 전이라 없다", async ({
  page,
}) => {
  await mockApis(page, { loggedIn: false });
  await page.goto("/login");

  await expect(kakaoButton(page)).toBeVisible();
  await expect(page.getByRole("img", { name: "네이버 로그인" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "네이버 로그인" })).toHaveCount(
    0,
  );
});

test("로그인한 사람이 로그인 화면 주소를 바로 열면 홈으로 가고, 뒤로가기로 다시 오지 않는다", async ({
  page,
}) => {
  await mockApis(page, { loggedIn: true });
  await page.goto("/login");

  await expect(page).toHaveURL(/\/$/);
  await expect(kakaoButton(page)).toHaveCount(0);
  // 기록을 바꿨으므로 앞에 로그인 화면이 없다
  const canGoBack = await page.evaluate(() => {
    const navigation: unknown = Reflect.get(window, "navigation");
    return (
      typeof navigation === "object" &&
      navigation !== null &&
      "canGoBack" in navigation &&
      navigation.canGoBack === true
    );
  });
  expect(canGoBack).toBe(false);
});

test("표시용 쿠키가 없으면 화면이 안전장치로 확인해, 앱 안에서 왔을 때 앞 화면으로 돌아간다", async ({
  page,
}) => {
  await mockApis(page, { loggedIn: true });
  await page.goto("/?tab=joined");
  // 로그인 복구가 끝나 쿠키가 생긴 뒤 지워, 쿠키가 없는 경우를 만든다. 있으면 앱 서버가 먼저 홈으로 보낸다
  await expect.poll(() => hasLoginHint(page)).toBe(true);
  await page.context().clearCookies({ name: LOGIN_HINT });
  await page.goto("/login");

  // 홈(/)이 아니라 앞 화면(참여한 일정 탭)이다
  await expect(page).toHaveURL(/\/\?tab=joined$/);
  await expect(kakaoButton(page)).toHaveCount(0);
});

test("로그인이 확인되면 표시용 쿠키를 두고, 로그인 복구가 401이면 지운다", async ({
  page,
}) => {
  await mockApis(page, { loggedIn: true });
  await page.goto("/");
  await expect.poll(() => hasLoginHint(page)).toBe(true);

  // 쿠키는 남은 채 서버에서 세션이 끝났다
  await page.unrouteAll();
  await mockApis(page, { loggedIn: false });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "로그인", exact: true }).first(),
  ).toBeVisible();
  await expect.poll(() => hasLoginHint(page)).toBe(false);
});

test("표시용 쿠키가 있으면 로그인 화면을 그리지 않고 앱 서버가 홈으로 보낸다", async ({
  page,
  baseURL,
}) => {
  await mockApis(page, { loggedIn: true });
  await page
    .context()
    .addCookies([{ name: LOGIN_HINT, value: "1", url: baseURL }]);
  const response = await page.goto("/login");

  // 서버 이동(307)을 거쳐 홈 문서를 받았다
  expect(response?.request().redirectedFrom()?.url()).toMatch(/\/login$/);
  await expect(page).toHaveURL(/\/$/);
});

test("표시용 쿠키가 예전 값이면 홈에서 로그인 복구가 실패하며 지우고, 다시 로그인을 누르면 로그인 화면이 보인다", async ({
  page,
  baseURL,
}) => {
  await mockApis(page, { loggedIn: false });
  await page
    .context()
    .addCookies([{ name: LOGIN_HINT, value: "1", url: baseURL }]);
  await page.goto("/login");
  await expect(page).toHaveURL(/\/$/);
  await expect.poll(() => hasLoginHint(page)).toBe(false);

  // 반복 이동 없이 로그인 화면에 머문다
  await page
    .getByRole("button", { name: "로그인", exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(kakaoButton(page)).toBeVisible();
});

test("로그인 복구가 서버 오류로 실패해 예전 쿠키가 남아도, 로그인 버튼을 누르면 로그인 화면으로 간다(앱 안 이동)", async ({
  page,
  baseURL,
}) => {
  await page.route("**/api/v1/**", (route) =>
    route.fulfill(fail(404, "NOT_FOUND")),
  );
  await page.route("**/api/v1/auth/tokens", (route) =>
    route.fulfill(fail(500, "INTERNAL_ERROR")),
  );
  await page
    .context()
    .addCookies([{ name: LOGIN_HINT, value: "1", url: baseURL }]);
  await page.goto("/?tab=joined");

  await page
    .getByRole("button", { name: "로그인", exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(kakaoButton(page)).toBeVisible();
});
