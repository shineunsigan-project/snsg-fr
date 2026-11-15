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

test("로그인한 사람이 앱 안에서 로그인 화면에 오면 앞 화면으로 돌아간다", async ({
  page,
}) => {
  await mockApis(page, { loggedIn: true });
  await page.goto("/?tab=joined");
  await page.goto("/login");

  // 홈(/)이 아니라 앞 화면(참여한 일정 탭)이다
  await expect(page).toHaveURL(/\/\?tab=joined$/);
  await expect(kakaoButton(page)).toHaveCount(0);
});
