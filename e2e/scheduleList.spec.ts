import { expect, test, type Page, type Route } from "@playwright/test";

// 일정 목록 LIST-01~05: 20개씩 [더 보기], 필터(활동·지역·날짜·시작 시각), 탭, 로그인 상태별 목록
// 목록 API는 임시 계약이라 가짜 응답이다

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

/** 한국 날짜 `YYYY-MM-DD` (오늘 + offset일). 일정 시각은 한국 시간이다 */
function kstDate(offset = 0) {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(
    new Date(Date.now() + offset * 24 * 60 * 60 * 1000),
  );
}

const makeSchedule = (index: number, overrides: object = {}) => ({
  scheduleId: `01a1a2b3-0000-7000-8000-${String(index + 1).padStart(12, "0")}`,
  activityName: "보드게임",
  title: `예시 일정 ${index + 1}`,
  startAt: "2026-12-24T19:30:00",
  regionName: "마포구",
  participantCount: 1,
  capacity: 4,
  status: "RECRUITING",
  ...overrides,
});

type MockOptions = {
  loggedIn: boolean;
  /** [더 보기](page=1) 첫 요청을 실패시킨다 */
  failNextPageOnce?: boolean;
  /** 참여한 일정 목록이 401(access token 만료)을 주고 재발급도 실패한다 */
  expireSession?: boolean;
};

/** 모집 중 25개(20 + 5). 받은 목록 요청 주소를 돌려준다 */
async function mockApis(
  page: Page,
  { loggedIn, failNextPageOnce = false, expireSession = false }: MockOptions,
) {
  const listRequests: URL[] = [];
  let tokenRequests = 0;
  let nextPageFailures = failNextPageOnce ? 1 : 0;

  await page.route("**/api/v1/**", (route) =>
    route.fulfill(fail(404, "NOT_FOUND")),
  );
  await page.route("**/api/v1/auth/tokens", (route) => {
    tokenRequests += 1;
    // 세션 만료: 앱 시작 때 복구는 되고, 그 뒤 재발급은 실패한다
    const canRefresh = loggedIn && !(expireSession && tokenRequests > 1);
    return route.fulfill(
      canRefresh
        ? ok({ accessToken: "e2e-access-token" })
        : fail(401, "INVALID_REFRESH_TOKEN"),
    );
  });
  await page.route("**/api/v1/activity-categories", (route) =>
    route.fulfill(
      ok([
        {
          id: "01a19cc6-3d80-7000-8000-000000000001",
          code: "BOARD_GAME",
          name: "보드게임",
        },
        {
          id: "01a19cc6-3d80-7000-8000-000000000002",
          code: "ESCAPE_ROOM",
          name: "방탈출",
        },
      ]),
    ),
  );
  await page.route("**/api/v1/regions", (route) =>
    route.fulfill(
      ok([
        { code: "11440", name: "마포구" },
        { code: "11410", name: "서대문구" },
      ]),
    ),
  );
  await page.route("**/api/v1/schedules?**", (route) => {
    const url = new URL(route.request().url());
    listRequests.push(url);
    const pageIndex = Number(url.searchParams.get("page"));
    if (pageIndex === 1 && nextPageFailures > 0) {
      nextPageFailures -= 1;
      return route.fulfill(fail(400, "INVALID_REQUEST"));
    }
    const all = Array.from({ length: 25 }, (_, index) => makeSchedule(index));
    return route.fulfill(
      ok({
        schedules: all.slice(pageIndex * 20, pageIndex * 20 + 20),
        hasNext: pageIndex === 0,
      }),
    );
  });

  const mineRoute = (schedules: object[]) => (route: Route) => {
    listRequests.push(new URL(route.request().url()));
    if (expireSession) return route.fulfill(fail(401, "UNAUTHENTICATED"));
    return route.fulfill(ok({ schedules, hasNext: false }));
  };
  await page.route(
    "**/api/v1/users/me/schedules/joined?**",
    mineRoute([
      makeSchedule(100, {
        title: "오늘 저녁 보드게임",
        startAt: `${kstDate()}T23:59:00`,
        status: "CLOSED",
      }),
      makeSchedule(101, {
        title: "사흘 뒤 방탈출",
        startAt: `${kstDate(3)}T19:00:00`,
      }),
    ]),
  );
  await page.route(
    "**/api/v1/users/me/schedules/created?**",
    mineRoute([
      makeSchedule(200, {
        title: "새로 연 산책",
        startAt: `${kstDate(5)}T10:00:00`,
        isNew: true,
      }),
    ]),
  );
  // 내 정보(로그아웃 경로)에서 쓰는 프로필
  await page.route("**/api/v1/users/me", (route) =>
    route.fulfill(
      ok({
        name: "김민준",
        nickname: "딸기스무디",
        gender: "MALE",
        birthDate: "1998-03-14",
        email: null,
        profileImageUrl: null,
        nicknameChangeableAt: null,
      }),
    ),
  );
  return listRequests;
}

const cards = (page: Page) => page.locator("[data-slot=tabs-content] li");
const filterChip = (page: Page, name: string) =>
  page.getByRole("group", { name: "필터" }).getByRole("button", { name });
const lastListRequest = (requests: URL[], path: string) =>
  requests.filter((url) => url.pathname === path).at(-1);

test("모집 중 목록은 20개씩 보여주고 [더 보기]로 이어 붙인다", async ({
  page,
}) => {
  await mockApis(page, { loggedIn: false });
  await page.goto("/");

  await expect(cards(page)).toHaveCount(20);
  // 약속 시간 표기 MM월DD일(요일) HH:MM
  await expect(cards(page).first()).toContainText("12월24일(목) 19:30");

  await page.getByRole("button", { name: "더 보기" }).click();
  await expect(cards(page)).toHaveCount(25);
  await expect(page.getByRole("button", { name: "더 보기" })).toBeHidden();
});

test("[더 보기]가 실패하면 받은 목록은 두고 그 자리에 다시 시도를 보여준다", async ({
  page,
}) => {
  const listRequests = await mockApis(page, {
    loggedIn: false,
    failNextPageOnce: true,
  });
  await page.goto("/");

  await page.getByRole("button", { name: "더 보기" }).click();
  await expect(page.getByRole("button", { name: "다시 시도" })).toBeVisible();
  await expect(cards(page)).toHaveCount(20);
  // 4xx는 재시도하지 않는다 (Q10)
  expect(
    listRequests.filter((url) => url.searchParams.get("page") === "1"),
  ).toHaveLength(1);

  await page.getByRole("button", { name: "다시 시도" }).click();
  await expect(cards(page)).toHaveCount(25);
});

test("활동 필터를 적용하면 주소와 요청에 반영된다", async ({ page }) => {
  const listRequests = await mockApis(page, { loggedIn: false });
  await page.goto("/");

  await filterChip(page, "활동").click();
  await page.getByRole("radio", { name: "방탈출" }).click();
  await page.getByRole("button", { name: "적용하기" }).click();

  await expect(page).toHaveURL(
    /\/\?activity=01a19cc6-3d80-7000-8000-000000000002$/,
  );
  await expect(filterChip(page, "방탈출")).toBeVisible();
  await expect
    .poll(() => listRequests.at(-1)?.searchParams.get("activityId"))
    .toBe("01a19cc6-3d80-7000-8000-000000000002");
});

test("지역 필터를 적용하고 초기화하면 필터가 빠진다", async ({ page }) => {
  const listRequests = await mockApis(page, { loggedIn: false });
  await page.goto("/");

  await filterChip(page, "지역").click();
  await page.getByRole("radio", { name: "마포구" }).click();
  await page.getByRole("button", { name: "적용하기" }).click();
  await expect(page).toHaveURL(/\/\?region=11440$/);
  await expect
    .poll(() => listRequests.at(-1)?.searchParams.get("regionCode"))
    .toBe("11440");

  await filterChip(page, "마포구").click();
  await expect(page.getByRole("radio", { name: "마포구" })).toBeChecked();
  await page.getByRole("button", { name: "초기화" }).click();
  await expect(page.getByRole("radio", { name: "전체" })).toBeChecked();
  await page.getByRole("button", { name: "적용하기" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(filterChip(page, "지역")).toBeVisible();
});

test("같은 날을 두 번 누르면 그 하루로 남고, 시작 시각을 켜면 그 이후로 찾는다", async ({
  page,
}) => {
  const listRequests = await mockApis(page, { loggedIn: false });
  await page.goto("/");
  const today = kstDate();

  await filterChip(page, "날짜").click();
  const day = page.locator(`button[data-day="${today}"]`);
  await day.click();
  await day.click();
  await page.getByRole("switch", { name: "시작 시각 설정" }).click();
  await page.getByRole("button", { name: "적용하기" }).click();

  await expect(page).toHaveURL(`/?from=${today}&to=${today}&time=18%3A00`);
  await expect
    .poll(() => {
      const params = listRequests.at(-1)?.searchParams;
      return [
        params?.get("startDate"),
        params?.get("endDate"),
        params?.get("startTime"),
      ];
    })
    .toEqual([today, today, "18:00"]);
});

test("기간이 있을 때 새 날짜 두 개를 누르면 새 기간으로 바뀐다", async ({
  page,
}) => {
  const listRequests = await mockApis(page, { loggedIn: false });
  // 다음 달 날짜로 기간을 둔다. 달력은 시작일이 있는 달을 보여주므로 네 날짜가 한 화면에 있다
  const [year, month] = kstDate().split("-").map(Number);
  const nextMonth = `${month === 12 ? year + 1 : year}-${String((month % 12) + 1).padStart(2, "0")}`;
  const day = (date: number) => `${nextMonth}-${String(date).padStart(2, "0")}`;
  await page.goto(`/?from=${day(3)}&to=${day(10)}`);

  await filterChip(
    page,
    `${day(3).slice(5).replace("-", ".")}~${day(10).slice(5).replace("-", ".")}`,
  ).click();
  await page.locator(`button[data-day="${day(20)}"]`).click();
  await page.locator(`button[data-day="${day(22)}"]`).click();
  await page.getByRole("button", { name: "적용하기" }).click();

  await expect(page).toHaveURL(`/?from=${day(20)}&to=${day(22)}`);
  await expect
    .poll(() => {
      const params = listRequests.at(-1)?.searchParams;
      return [params?.get("startDate"), params?.get("endDate")];
    })
    .toEqual([day(20), day(22)]);
});

test("주소의 잘못된 탭·필터 값은 없는 것으로 보고 목록을 보여준다", async ({
  page,
}) => {
  const listRequests = await mockApis(page, { loggedIn: false });
  await page.goto(
    "/?tab=unknown&activity=abc&region=12&from=2026-02-31&to=2026-13-01&time=25:00",
  );

  await expect(cards(page)).toHaveCount(20);
  await expect(page.getByRole("tab", { name: "모집 중" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(filterChip(page, "날짜")).toBeVisible();
  const params = listRequests.at(-1)?.searchParams;
  expect([...(params?.keys() ?? [])].sort()).toEqual(["page", "size"]);
});

test("종료일이 시작일보다 앞서면 시작일 하루로 찾는다", async ({ page }) => {
  const listRequests = await mockApis(page, { loggedIn: false });
  await page.goto(`/?from=${kstDate(2)}&to=${kstDate(1)}`);

  await expect(cards(page)).toHaveCount(20);
  const params = listRequests.at(-1)?.searchParams;
  expect(params?.get("startDate")).toBe(kstDate(2));
  expect(params?.has("endDate")).toBe(false);
});

test("탭을 옮겨도 필터는 주소에 남고, 참여한 일정 요청에는 필터를 보내지 않는다", async ({
  page,
}) => {
  const listRequests = await mockApis(page, { loggedIn: true });
  await page.goto("/?activity=01a19cc6-3d80-7000-8000-000000000002");

  await page.getByRole("tab", { name: "참여한 일정" }).click();
  await expect(page).toHaveURL(
    /\/\?tab=joined&activity=01a19cc6-3d80-7000-8000-000000000002$/,
  );
  await expect(cards(page)).toHaveCount(2);
  const joinedRequest = lastListRequest(
    listRequests,
    "/api/v1/users/me/schedules/joined",
  );
  expect(joinedRequest?.searchParams.has("activityId")).toBe(false);

  await page.getByRole("tab", { name: "모집 중" }).click();
  await expect(page).toHaveURL(
    /\/\?activity=01a19cc6-3d80-7000-8000-000000000002$/,
  );
  await expect(filterChip(page, "방탈출")).toBeVisible();
});

test("로그인하면 참여한 일정에 참여 확정·D-day, 개설한 일정에 상태·NEW를 보여준다", async ({
  page,
}) => {
  await mockApis(page, { loggedIn: true });
  await page.goto("/?tab=joined");

  const joined = cards(page);
  await expect(joined).toHaveCount(2);
  await expect(joined.nth(0)).toContainText("오늘 저녁 보드게임");
  await expect(joined.nth(0)).toContainText("참여 확정");
  await expect(joined.nth(0)).toContainText("D-DAY");
  await expect(joined.nth(1)).toContainText("D-3");

  await page.getByRole("tab", { name: "개설한 일정" }).click();
  await expect(page).toHaveURL(/\/\?tab=created$/);
  const created = cards(page);
  await expect(created).toHaveCount(1);
  await expect(created.first()).toContainText("모집 중");
  await expect(created.first()).toContainText("NEW");
  // 녹색 테두리는 방금 연 일정에만 보인다. NEW라도 강조하지 않는다 (사용자 결정 2026-11-08)
  await expect(created.first().getByRole("link")).not.toHaveClass(/ring-brand/);
});

test("비로그인이 참여한 일정 탭을 누르면 로그인 안내를 보여준다", async ({
  page,
}) => {
  await mockApis(page, { loggedIn: false });
  await page.goto("/");

  await page.getByRole("tab", { name: "참여한 일정" }).click();
  await expect(page).toHaveURL(/\/\?tab=joined$/);
  // 시안 LIST-04 비로그인 화면: 안내 문구 + `로그인 후 사용 가능합니다` 버튼
  await expect(page.getByText("아직 함께한 일정이 없네요.")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "로그인 후 사용 가능합니다" }),
  ).toBeVisible();
  await test.info().attach("참여한 일정 비로그인", {
    body: await page.screenshot(),
    contentType: "image/png",
  });
});

test("로그인 안내 버튼을 누르면 로그인 화면으로 가고, 돌아올 주소는 지금 탭·필터다", async ({
  page,
}) => {
  await mockApis(page, { loggedIn: false });
  await page.goto(
    "/?tab=created&activity=01a19cc6-3d80-7000-8000-000000000002",
  );

  await page.getByRole("button", { name: "로그인 후 사용 가능합니다" }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(
    await page.evaluate(() => sessionStorage.getItem("loginRedirect")),
  ).toBe("/?tab=created&activity=01a19cc6-3d80-7000-8000-000000000002");
});

test("참여한 일정 중 세션이 만료되면 로그인 화면으로 가고 그 탭으로 돌아오게 한다", async ({
  page,
}) => {
  await mockApis(page, { loggedIn: true, expireSession: true });
  await page.goto("/?tab=joined");

  await expect(page).toHaveURL(/\/login$/);
  expect(
    await page.evaluate(() => sessionStorage.getItem("loginRedirect")),
  ).toBe("/?tab=joined");
});

test("로그아웃하면 받아 둔 참여한 일정을 보여주지 않는다", async ({ page }) => {
  await mockApis(page, { loggedIn: true });
  await page.goto("/?tab=joined");
  await expect(cards(page)).toHaveCount(2);

  // 로그아웃은 내 정보에서만 한다 (USER_FLOW §4.4)
  await page
    .getByRole("navigation", { name: "주요 메뉴" })
    .getByRole("button", { name: "내 정보" })
    .click();
  await page.getByRole("button", { name: "로그아웃" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "로그아웃" })
    .click();
  await expect(page).toHaveURL(/\/$/);
  await page.getByRole("tab", { name: "참여한 일정" }).click();
  await expect(
    page.getByRole("button", { name: "로그인 후 사용 가능합니다" }),
  ).toBeVisible();
  await expect(cards(page)).toHaveCount(0);
});
