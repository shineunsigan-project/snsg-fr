import { expect, test, type Page } from "@playwright/test";

// 로그인 화면 AUTH-01 + 뒤로가기 캐시(bfcache) (USER_FLOW §4.2, SHI-185)
// Playwright는 Chrome의 뒤로가기 캐시를 꺼 두고 띄운다. 이 파일만 켜서 복원을 재현한다(브라우저 설정이라 파일 단위)
test.use({
  launchOptions: { ignoreDefaultArgs: ["--disable-back-forward-cache"] },
});
// 위 설정은 Chrome 전용이라 이 테스트들은 WebKit에서 같은 조건을 만들 수 없다. 사파리의 뒤로가기 캐시는 실제 기기에서 확인한다 (SHI-210)
test.skip(
  ({ browserName }) => browserName === "webkit",
  "Chrome 뒤로가기 캐시 설정에 맞춘 테스트",
);

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

/** 복원 여부를 탭 저장소에 기록하고(새로 불러와도 남는다), 재발급은 loggedIn()에 따라 성공·실패한다 */
async function openWithMocks(page: Page, loggedIn: () => boolean) {
  await page.addInitScript(() => {
    window.addEventListener("pageshow", (event) => {
      if (event.persisted) sessionStorage.setItem("e2eRestored", "1");
    });
  });
  // 네이버 지도는 외부 키 인증이 필요해 막는다
  await page.route("https://oapi.map.naver.com/**", (route) => route.abort());
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
}

/** 비로그인으로 참여한 일정 탭 → 헤더 로그인 → 로그인 화면까지 앱 안에서 이동한다 */
async function openLoginInApp(page: Page, loggedIn: () => boolean) {
  await openWithMocks(page, loggedIn);
  await page.goto("/schedules?tab=joined");
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
  await page.goto("/schedules?tab=created");
  await page.goBack({ waitUntil: "commit" });
}

/** 일정 상세 응답. 버튼은 서버가 로그인 여부로 정한다(api-guide 일정 상세) */
const makeDetail = (id: string, loggedIn: boolean) => ({
  id,
  title: "보드게임 추리 한 판",
  description: "처음 오셔도 괜찮아요.",
  startAt: "2026-12-24T19:30:00",
  createdAt: "2026-11-01T09:00:00",
  durationType: "NORMAL",
  category: { id: "01a19cc6-3d80-7000-8000-000000000001", name: "보드게임" },
  host: {
    nickname: "민트초코",
    profileImageUrl: "/images/default-profile.png",
    withdrawn: false,
  },
  confirmedCount: 2,
  capacity: 6,
  remainingSeats: 4,
  participantSummary: {
    count: 2,
    maleCount: 1,
    femaleCount: 1,
    minAgeGroup: { decade: 20, phase: "LATE" },
    maxAgeGroup: { decade: 20, phase: "LATE" },
  },
  place: {
    name: "보드게임카페 A",
    roadAddress: "서울 마포구 와우산로 00",
    addressDetail: "2층",
    latitude: 37.5563,
    longitude: 126.9236,
    regionName: "마포구",
  },
  displayStatus: "RECRUITING",
  viewerRole: loggedIn ? "NON_PARTICIPANT" : "GUEST",
  availableActions: [loggedIn ? "JOIN" : "LOGIN_TO_JOIN"],
  cancellation: null,
});

/** 로그인 후 상세: `참여하기`(정확히)만 있고 `로그인하고 참여하기`·로그인 화면은 없다 */
async function expectLoggedInDetail(page: Page, scheduleId: string) {
  await expect(page).toHaveURL(new RegExp(`/schedules/${scheduleId}$`));
  await expect(
    page.getByRole("button", { name: "참여하기", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "로그인하고 참여하기" }),
  ).toHaveCount(0);
  await expect(kakaoButton(page)).toHaveCount(0);
}

const wasRestored = (page: Page) =>
  page.evaluate(() => sessionStorage.getItem("e2eRestored"));

test.describe("뒤로가기 캐시(bfcache)", () => {
  test("다른 페이지에 다녀온 뒤 뒤로가기로 로그인 화면이 복원되면, 로그인 상태를 다시 받아 앞 화면으로 돌아간다", async ({
    page,
  }) => {
    let loggedIn = false;
    await openLoginInApp(page, () => loggedIn);

    loggedIn = true;
    await leaveAndGoBack(page);

    await expect(page).toHaveURL(/\/schedules\?tab=joined$/);
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

  test("상세에서 로그인하고 돌아온 뒤 뒤로가기는 로그인 전 상세(새 상태로), 앞으로 가기는 로그인 후 상세로 간다. 로그인 화면이 끼어들지 않는다", async ({
    page,
  }) => {
    const scheduleId = "01a1a2b3-0000-7000-8000-000000000007";
    let loggedIn = false;
    await openWithMocks(page, () => loggedIn);
    // 서버처럼 Authorization 헤더로 버튼을 정한다. 토큰 없이 다시 받으면 `로그인하고 참여하기`가 된다
    await page.route(`**/api/v1/schedules/${scheduleId}`, (route) =>
      route.fulfill(
        ok(makeDetail(scheduleId, !!route.request().headers().authorization)),
      ),
    );
    await page.route(
      `**/api/v1/schedules/${scheduleId}/participants`,
      (route) => route.fulfill(fail(403, "PARTICIPANTS_FORBIDDEN")),
    );
    // 서버·카카오 인증 대신: 인증 주소가 콜백으로 바로 보낸다(실제처럼 기록에 남지 않는 서버 이동)
    await page.route("**/api/v1/auth/kakao/authorize", (route) =>
      route.fulfill({ status: 302, headers: { location: "/auth/callback" } }),
    );

    // 실제처럼 홈에서 카드를 눌러 상세로 간다(앱 안 이동). 처음 연 문서는 홈이다
    await page.route("**/api/v1/schedules?**", (route) =>
      route.fulfill(
        ok({
          items: [
            {
              id: scheduleId,
              category: {
                id: "01a19cc6-3d80-7000-8000-000000000001",
                name: "보드게임",
              },
              title: "보드게임 추리 한 판",
              regionName: "마포구",
              startAt: "2026-12-24T19:30:00",
              confirmedCount: 2,
              capacity: 6,
              remainingSeats: 4,
              displayStatus: "RECRUITING",
              createdAt: "2026-11-01T09:00:00",
            },
          ],
          nextCursor: null,
        }),
      ),
    );
    await page.goto("/schedules");
    await page.getByRole("link", { name: /보드게임 추리 한 판/ }).click();
    await expect(page).toHaveURL(new RegExp(`/schedules/${scheduleId}$`));
    await page.getByRole("button", { name: "로그인하고 참여하기" }).click();
    await expect(page).toHaveURL(/\/login$/);

    loggedIn = true;
    await kakaoButton(page).click();
    // 콜백이 로그인을 확인하고 원래 상세로 바꾼다
    await expectLoggedInDetail(page, scheduleId);
    // 진행 중인 요청이 있으면 Chrome이 뒤로가기 캐시에 넣지 않으므로 끝날 때까지 기다린다
    await page.waitForLoadState("networkidle");

    // 뒤로가기: 로그인 화면이 아니라 로그인 전 상세로 간다. 로그인 화면 기록을 카카오 이동으로 바꿨으므로
    // 로그인 전 페이지는 뒤로가기 캐시에 남지 않고 새로 불러와져, 로그인 상태의 `참여하기`가 보인다
    await page.goBack({ waitUntil: "commit" });
    await expectLoggedInDetail(page, scheduleId);
    expect(await wasRestored(page)).toBeNull();

    // 앞으로 가기: 로그인 화면을 거치지 않고 로그인 후 상세로 간다
    await page.goForward({ waitUntil: "commit" });
    await expectLoggedInDetail(page, scheduleId);

    // 두 번 뒤로가기: 로그인 후 상세 → 로그인 전 상세 → 일정 목록(로그인 화면이 기록에 없다)
    await page.goBack({ waitUntil: "commit" });
    await page.goBack({ waitUntil: "commit" });
    await expect(page).toHaveURL(/\/schedules$/);
  });

  test("주소를 직접 열어 온 로그인 화면은 기록을 바꾸지 않아, 카카오 화면에서 뒤로가기하면 로그인 화면으로 돌아온다", async ({
    page,
  }) => {
    await openWithMocks(page, () => false);
    // 카카오 인증 화면 대신
    await page.route("**/api/v1/auth/kakao/authorize", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: "<!doctype html><title>kakao</title><p>kakao</p>",
      }),
    );
    await page.goto("/login");
    await kakaoButton(page).click();
    await expect(page).toHaveURL(/\/api\/v1\/auth\/kakao\/authorize$/);

    await page.goBack({ waitUntil: "commit" });
    await expect(page).toHaveURL(/\/login$/);
    await expect(kakaoButton(page)).toBeVisible();
  });
});
