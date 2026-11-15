import { expect, test, type Page } from "@playwright/test";

// 로그인 화면 AUTH-01 + 뒤로가기 캐시(bfcache) (USER_FLOW §4.2, SHI-185)
// Playwright는 Chrome의 뒤로가기 캐시를 꺼 두고 띄운다. 이 파일만 켜서 복원을 재현한다(브라우저 설정이라 파일 단위)
test.use({
  launchOptions: { ignoreDefaultArgs: ["--disable-back-forward-cache"] },
});

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

const kakaoButton = (page: Page) =>
  page.getByRole("button", { name: "카카오 로그인" });

/**
 * 복원 여부를 탭 저장소에 기록하고(새로 불러와도 남는다), 재발급은 loggedIn()에 따라 성공·실패한다.
 * 비로그인으로 참여한 일정 탭 → 헤더 로그인 → 로그인 화면까지 앱 안에서 이동한다
 */
async function openLoginInApp(page: Page, loggedIn: () => boolean) {
  await page.addInitScript(() => {
    window.addEventListener("pageshow", (event) => {
      if (event.persisted) sessionStorage.setItem("e2eRestored", "1");
    });
  });
  await page.route("**/api/v1/**", (route) =>
    route.fulfill(fail(404, "NOT_FOUND")),
  );
  await page.route("**/api/v1/auth/tokens", (route) =>
    route.fulfill(
      loggedIn()
        ? ok({ accessToken: "e2e-access-token" })
        : fail(401, "INVALID_REFRESH_TOKEN"),
    ),
  );

  await page.goto("/?tab=joined");
  await page
    .getByRole("button", { name: "로그인", exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(kakaoButton(page)).toBeVisible();
  // 진행 중인 요청(미리 받기 등)이 있으면 Chrome이 뒤로가기 캐시에 넣지 않으므로 끝날 때까지 기다린다
  await page.waitForLoadState("networkidle");
}

/** 카카오·약관 대신 다른 문서로 갔다가 뒤로가기한다. 복원은 load 이벤트가 없어 commit까지만 기다린다 */
async function leaveAndGoBack(page: Page) {
  await page.goto("/?tab=created");
  await page.goBack({ waitUntil: "commit" });
}

const wasRestored = (page: Page) =>
  page.evaluate(() => sessionStorage.getItem("e2eRestored"));

test.describe("뒤로가기 캐시(bfcache)", () => {
  test("카카오 로그인을 다녀온 뒤 뒤로가기로 로그인 화면이 복원되면, 다시 불러와 앞 화면으로 돌아간다", async ({
    page,
  }) => {
    let loggedIn = false;
    await openLoginInApp(page, () => loggedIn);

    loggedIn = true;
    await leaveAndGoBack(page);

    await expect(page).toHaveURL(/\/\?tab=joined$/);
    expect(await wasRestored(page)).toBe("1");
  });

  test("비로그인으로 약관·카카오 화면에서 뒤로가기로 돌아오면 로그인 화면이 다시 보이고 카카오 버튼을 다시 누를 수 있다", async ({
    page,
  }) => {
    await openLoginInApp(page, () => false);

    await leaveAndGoBack(page);

    await expect(page).toHaveURL(/\/login$/);
    await expect(kakaoButton(page)).toBeVisible();
    expect(await wasRestored(page)).toBe("1");

    // 다시 누르면 서버의 카카오 인증 주소로 이동한다
    const authorize = page.waitForRequest("**/api/v1/auth/kakao/authorize");
    await kakaoButton(page).click();
    await authorize;
  });
});
