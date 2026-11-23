import { expect, test, type Page } from "@playwright/test";

// 홈 LIST-06·06-1: 다가오는 일정 / 활동 버튼 / 곧 마감돼요 / 메인 배너
// 다가오는 내 일정은 `GET /schedules/next`, 곧 마감돼요·새로 열린 일정은 `GET /schedules?sort=…`를 가짜 응답으로 준다 (USER_FLOW §5.1)

const ok = (data: unknown) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify({ isSuccess: true, data }),
});

/** 실패 응답. 5xx는 앱이 여러 번 다시 시도해 오래 걸리므로 4xx로 바로 실패시킨다 */
const failResponse = () => fail(400, "INVALID_REQUEST");

const fail = (status: number, code: string) => ({
  status,
  contentType: "application/json",
  body: JSON.stringify({ isSuccess: false, code, message: "" }),
});

/** 한국 날짜 `YYYY-MM-DD` (오늘 + offset일) */
function kstDate(offset = 0) {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(
    new Date(Date.now() + offset * 24 * 60 * 60 * 1000),
  );
}

const ACTIVITY_IDS = {
  BOARD_GAME: "01a19cc6-3d80-7000-8000-000000000001",
  ESCAPE_ROOM: "01a19cc6-3d80-7000-8000-000000000002",
  WALK: "01a19cc6-3d80-7000-8000-000000000003",
};

const makeSchedule = (index: number, overrides: object = {}) => ({
  id: `01a1a2b3-0000-7000-8000-${String(index + 1).padStart(12, "0")}`,
  category: { id: ACTIVITY_IDS.BOARD_GAME, name: "보드게임" },
  title: `예시 일정 ${index + 1}`,
  regionName: "마포구",
  startAt: `${kstDate(10)}T19:30:00`,
  confirmedCount: 1,
  capacity: 4,
  remainingSeats: 3,
  displayStatus: "RECRUITING",
  createdAt: "2026-11-01T09:00:00",
  ...overrides,
});

/** 다가오는 내 일정 1건 (`/schedules/next`). 목록 카드 필드에 장소명·예상 소요·참여자 사진이 더해진다 */
const makeNext = (overrides: object = {}) => ({
  ...makeSchedule(0),
  title: "보드게임 같이 해요",
  startAt: `${kstDate(1)}T19:30:00`,
  confirmedCount: 3,
  capacity: 6,
  remainingSeats: 3,
  placeName: "보드게임카페 홍대점",
  durationType: "NORMAL",
  participantProfileImageUrls: [
    "/images/profiles/a.png",
    "/images/default-profile.png",
    "/images/profiles/c.png",
  ],
  ...overrides,
});

type MockOptions = {
  loggedIn: boolean;
  /** 다가오는 내 일정. 없으면 서버처럼 `data` 키 없는 200을 준다 */
  next?: object;
  /** `sort=CLOSING_SOON` 응답 */
  closingSoon?: object[];
  /** `sort=LATEST` 응답 */
  newlyOpened?: object[];
  /** 해당 요청을 실패시킨다 */
  failing?: Array<"next" | "closingSoon" | "newlyOpened" | "activities">;
};

async function mockApis(
  page: Page,
  {
    loggedIn,
    next,
    closingSoon = [],
    newlyOpened = [],
    failing = [],
  }: MockOptions,
) {
  const requests: URL[] = [];

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
  await page.route("**/api/v1/activity-categories", (route) =>
    failing.includes("activities")
      ? route.fulfill(failResponse())
      : route.fulfill(
          ok([
            {
              id: ACTIVITY_IDS.BOARD_GAME,
              code: "BOARD_GAME",
              name: "보드게임",
            },
            {
              id: ACTIVITY_IDS.ESCAPE_ROOM,
              code: "ESCAPE_ROOM",
              name: "방탈출",
            },
            { id: ACTIVITY_IDS.WALK, code: "WALK", name: "산책" },
          ]),
        ),
  );
  await page.route("**/api/v1/users/me", (route) =>
    route.fulfill(
      ok({
        id: "01a19cc6-3d80-7000-8000-000000000001",
        name: "김민준",
        nickname: "딸기스무디",
        gender: "MALE",
        birthDate: "1998-03-14",
        email: "",
        profileImageUrl: "/images/default-profile.png",
        ageGroup: { decade: 20, phase: "LATE" },
        nicknameChangeableAt: null,
      }),
    ),
  );
  await page.route("**/api/v1/schedules/next", (route) => {
    requests.push(new URL(route.request().url()));
    if (failing.includes("next")) return route.fulfill(failResponse());
    return route.fulfill(
      next
        ? ok(next)
        : {
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ isSuccess: true }),
          },
    );
  });
  await page.route("**/api/v1/schedules?**", (route) => {
    const url = new URL(route.request().url());
    requests.push(url);
    const sort = url.searchParams.get("sort");
    const name = sort === "CLOSING_SOON" ? "closingSoon" : "newlyOpened";
    if (failing.includes(name)) return route.fulfill(failResponse());
    return route.fulfill(
      ok({
        items: sort === "CLOSING_SOON" ? closingSoon : newlyOpened,
        nextCursor: null,
      }),
    );
  });
  return requests;
}

const nav = (page: Page) => page.getByRole("navigation", { name: "주요 메뉴" });
const upcoming = (page: Page) =>
  page.getByRole("region", { name: "다가오는 일정" });
const closingSoon_ = (page: Page) =>
  page.getByRole("region", { name: "곧 마감돼요" });
const newSchedules = (page: Page) =>
  page.getByRole("region", { name: "새로 열린 일정" });
const banner = (page: Page) =>
  page.getByRole("link", { name: /보드게임·방탈출 모임/ });

test("로그인하면 다가오는 내 일정 1건을 카드 한 장으로 보여 주고 장소·예상 소요·참여자 사진이 들어 있다", async ({
  page,
}) => {
  await mockApis(page, { loggedIn: true, next: makeNext() });
  await page.goto("/");

  const cards = upcoming(page).getByRole("link");
  await expect(cards).toHaveCount(1);
  await expect(cards).toContainText("보드게임 같이 해요");
  await expect(cards).toContainText("D-1");
  await expect(cards).toContainText("다가오는 내 일정");
  await expect(cards).toContainText(
    /\d{1,2}월 \d{1,2}일 \(.\) 19:30 · 2시간 내외/,
  );
  await expect(cards).toContainText("보드게임카페 홍대점 · 3/6명");
  // 참여자 사진은 서버가 준 앞 3명이다. 슬라이더 표시(`1 / n`)는 없다
  await expect(cards.locator("img")).toHaveCount(3);
  await expect(upcoming(page)).not.toContainText(/\d \/ \d/);
  await expect(banner(page)).toHaveCount(0);
  // 카드 배경은 단색이 아니라 노랑에서 연두로 이어지는 그라데이션이다 (사용자 결정 2026-11-23)
  await expect(cards).toHaveCSS("background-image", /linear-gradient/);

  // 인사말: 오늘 날짜와 닉네임
  await expect(
    page.getByRole("heading", {
      name: "딸기스무디님, 이번 주말엔 누구랑 쉬어갈까요?",
    }),
  ).toBeVisible();

  // 로그인 상태의 홈 헤더에는 로그인 버튼이 없고 GNB 마지막은 내 정보다
  await expect(page.getByRole("button", { name: "로그인" })).toHaveCount(0);
  await expect(
    nav(page).getByRole("button", { name: "내 정보" }),
  ).toBeVisible();

  // 카드를 누르면 일정 상세로 간다
  await cards.click();
  await expect(page).toHaveURL(
    /\/schedules\/01a1a2b3-0000-7000-8000-000000000001$/,
  );
});

test("비로그인이면 메인 배너를 보여 주고 탭하면 서비스 소개를 새 창으로 연다", async ({
  page,
}) => {
  const requests = await mockApis(page, { loggedIn: false });
  await page.goto("/");

  await expect(banner(page)).toBeVisible();
  // 비로그인 인사말은 닉네임 없이 같은 질문만 보여 준다
  await expect(
    page.getByRole("heading", { name: "이번 주말엔 누구랑 쉬어갈까요?" }),
  ).toBeVisible();
  await expect(banner(page)).toHaveAttribute(
    "href",
    "https://info.shineunsigan.com",
  );
  await expect(banner(page)).toHaveAttribute("target", "_blank");
  await expect(upcoming(page)).toHaveCount(0);
  await expect(
    page.getByRole("banner").getByRole("button", { name: "로그인" }),
  ).toBeVisible();
  await expect(nav(page).getByRole("button", { name: "로그인" })).toBeVisible();
  // 다가오는 내 일정은 로그인해야 받을 수 있다
  expect(
    requests.filter((url) => url.pathname === "/api/v1/schedules/next"),
  ).toHaveLength(0);
});

test("메인 배너는 화면 폭 안에 들어오고 양옆 여백이 같다 (아이폰 사파리에서 오른쪽으로 넘쳤다, SHI-210)", async ({
  page,
}) => {
  await mockApis(page, { loggedIn: false });
  await page.goto("/");
  await expect(banner(page)).toBeVisible();

  const box = await banner(page).boundingBox();
  const viewport = page.viewportSize();
  if (!box || !viewport) throw new Error("배너 크기를 읽지 못했다");
  // 왼쪽 여백(px-5 = 20px)과 같은 여백이 오른쪽에도 있어야 한다
  expect(box.x).toBe(20);
  expect(viewport.width - (box.x + box.width)).toBe(20);
});

test("로그인했지만 다가오는 일정이 없으면(응답에 data가 없으면) 로그인 버튼 없이 메인 배너를 보여 준다", async ({
  page,
}) => {
  await mockApis(page, { loggedIn: true });
  await page.goto("/");

  await expect(banner(page)).toBeVisible();
  await expect(page.getByRole("button", { name: "로그인" })).toHaveCount(0);
  await expect(
    nav(page).getByRole("button", { name: "내 정보" }),
  ).toBeVisible();
});

test("활동 버튼을 누르면 그 활동 필터가 켜진 일정 목록으로 간다", async ({
  page,
}) => {
  await mockApis(page, { loggedIn: false });
  await page.goto("/");

  await expect(
    page.getByRole("link", { name: "방탈출", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "보드게임", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "산책", exact: true }),
  ).toBeVisible();

  await page.getByRole("link", { name: "방탈출", exact: true }).click();
  await expect(page).toHaveURL(
    new RegExp(`/schedules\\?activity=${ACTIVITY_IDS.ESCAPE_ROOM}$`),
  );
  await expect(
    page
      .getByRole("group", { name: "필터" })
      .getByRole("button", { name: "방탈출" }),
  ).toBeVisible();
});

test("곧 마감돼요는 서버의 마감 임박 순으로 10개를 받아 받은 순서대로 보여 준다", async ({
  page,
}) => {
  const closingSoon = Array.from({ length: 10 }, (_, index) =>
    makeSchedule(10 + index, {
      title: `모집 중 ${index + 1}`,
      remainingSeats: 2,
      confirmedCount: 2,
      // 첫째는 오늘, 둘째는 내일, 셋째는 사흘 뒤, 그 뒤는 열흘 뒤
      startAt:
        index === 0
          ? `${kstDate(0)}T19:00:00`
          : index === 1
            ? `${kstDate(1)}T14:00:00`
            : index === 2
              ? `${kstDate(3)}T18:00:00`
              : `${kstDate(10)}T19:30:00`,
    }),
  );
  const requests = await mockApis(page, { loggedIn: false, closingSoon });
  await page.goto("/");

  const cards = closingSoon_(page).getByRole("link", { name: /^(?!전체보기)/ });
  await expect(cards).toHaveCount(10);
  await expect(cards.first()).toContainText("모집 중 1");
  await expect(cards.first()).toContainText("2자리 남음");
  // 오늘·내일은 날짜 대신 말로 보여 준다 (홈 화면 수정 시안)
  await expect(cards.nth(0)).toContainText("오늘 19:00");
  await expect(cards.nth(1)).toContainText("내일 14:00");
  await expect(cards.nth(2)).toContainText(/^.*[일월화수목금토] 18:00/);
  await expect(cards.nth(3)).toContainText(/\d{1,2}월 \d{1,2}일 \(.\) 19:30/);
  await expect(cards.nth(0)).toContainText("마포구");
  await expect(cards.nth(0)).toContainText("D-DAY");
  // 정렬·개수는 서버에 맡긴다: sort=CLOSING_SOON, size=10
  const request = requests.find(
    (url) => url.searchParams.get("sort") === "CLOSING_SOON",
  );
  expect(request?.searchParams.get("size")).toBe("10");

  // 전체보기는 필터 없이 일정 목록으로 간다
  await closingSoon_(page).getByRole("link", { name: "전체보기" }).click();
  await expect(page).toHaveURL(/\/schedules$/);
});

test("곧 마감돼요가 0개면 구역을 숨기고 모집 중인 일정 전체보기는 남긴다", async ({
  page,
}) => {
  await mockApis(page, { loggedIn: false });
  await page.goto("/");

  await expect(banner(page)).toBeVisible();
  await expect(closingSoon_(page)).toHaveCount(0);
  await page.getByRole("link", { name: "모집 중인 일정 전체보기" }).click();
  await expect(page).toHaveURL(/\/schedules$/);
});

test("다가오는 일정을 받지 못해도(400) 오류 화면 없이 메인 배너를 보여 주고 나머지 구역은 그대로 둔다", async ({
  page,
}) => {
  await mockApis(page, {
    loggedIn: true,
    next: makeNext(),
    closingSoon: [makeSchedule(5, { title: "마감 임박 일정" })],
    failing: ["next"],
  });
  await page.goto("/");

  await expect(banner(page)).toBeVisible();
  await expect(upcoming(page)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "다시 시도" })).toHaveCount(0);
  // 다른 구역은 정상이다
  await expect(closingSoon_(page)).toContainText("마감 임박 일정");
  await expect(
    page.getByRole("link", { name: "방탈출", exact: true }),
  ).toBeVisible();
});

test("곧 마감돼요를 받지 못하면 그 구역에 다시 시도를 보여 주고 누르면 다시 받는다", async ({
  page,
}) => {
  await mockApis(page, {
    loggedIn: false,
    closingSoon: [makeSchedule(5, { title: "마감 임박 일정" })],
    failing: ["closingSoon"],
  });
  await page.goto("/");

  await expect(
    closingSoon_(page).getByRole("button", { name: "다시 시도" }),
  ).toBeVisible();

  await page.unrouteAll();
  await mockApis(page, {
    loggedIn: false,
    closingSoon: [makeSchedule(5, { title: "마감 임박 일정" })],
  });
  await closingSoon_(page).getByRole("button", { name: "다시 시도" }).click();
  await expect(closingSoon_(page)).toContainText("마감 임박 일정");
});

test("활동 목록을 못 받으면 활동 구역에 다시 시도를 보여 준다", async ({
  page,
}) => {
  await mockApis(page, { loggedIn: false, failing: ["activities"] });
  await page.goto("/");

  await expect(
    page
      .getByRole("region", { name: "어떤 활동을 찾으세요?" })
      .getByRole("button", { name: "다시 시도" }),
  ).toBeVisible();
  await expect(banner(page)).toBeVisible();
});

test("GNB 일정을 누르면 일정 목록으로, 개설하기를 누르면 개설 1단계로 간다", async ({
  page,
}) => {
  await mockApis(page, { loggedIn: false });
  await page.goto("/");

  await expect(nav(page).getByRole("button", { name: "홈" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await nav(page).getByRole("button", { name: "일정", exact: true }).click();
  await expect(page).toHaveURL(/\/schedules$/);

  await nav(page).getByRole("button", { name: "홈" }).click();
  await expect(page).toHaveURL(/\/$/);
  await nav(page).getByRole("button", { name: "개설하기" }).click();
  await expect(page).toHaveURL(/\/create\?step=1$/);
});

test("새로 열린 일정은 서버의 최근 열린 순으로 5개를 받아 받은 순서대로 보여 주고 모집완료는 배지와 회색 인원으로 보여 준다", async ({
  page,
}) => {
  const newlyOpened = [
    makeSchedule(2, {
      title: "오늘 연 일정",
      createdAt: `${kstDate(0)}T08:00:00`,
      startAt: `${kstDate(3)}T19:30:00`,
      confirmedCount: 1,
      capacity: 6,
      remainingSeats: 5,
    }),
    makeSchedule(3, {
      title: "자리 반쯤 찬 일정",
      createdAt: "2026-11-10T08:00:00",
      confirmedCount: 2,
      capacity: 4,
      remainingSeats: 2,
    }),
    makeSchedule(4, {
      title: "모집완료 일정",
      createdAt: "2026-11-09T08:00:00",
      displayStatus: "RECRUITMENT_CLOSED",
      confirmedCount: 6,
      capacity: 6,
      remainingSeats: 0,
    }),
    makeSchedule(5, { title: "넷째", createdAt: "2026-11-08T08:00:00" }),
    makeSchedule(6, { title: "다섯째", createdAt: "2026-11-07T08:00:00" }),
  ];
  const requests = await mockApis(page, { loggedIn: false, newlyOpened });
  await page.goto("/");

  const rows = newSchedules(page).getByRole("link");
  await expect(rows).toHaveCount(5);
  await expect(rows.nth(0)).toContainText("오늘 연 일정");
  await expect(rows.nth(1)).toContainText("자리 반쯤 찬 일정");
  await expect(rows.nth(2)).toContainText("모집완료 일정");
  // 오늘 연 일정: NEW · 보드게임 · 마포구 · 시간 · 1/6명 · 모집중
  await expect(rows.nth(0)).toContainText("NEW");
  await expect(rows.nth(0)).toContainText("보드게임 · 마포구 · 19:30");
  await expect(rows.nth(0)).toContainText("1/6명 · 모집중");
  await expect(rows.nth(1)).toContainText("2/4명 · 2자리 남음");
  // 모집완료는 배지와 인원만
  await expect(rows.nth(2)).toContainText("모집완료");
  await expect(rows.nth(2)).toContainText("6/6명");
  await expect(rows.nth(2)).not.toContainText("모집중");
  await expect(rows.nth(2)).not.toContainText("NEW");
  // 정렬·개수는 서버에 맡긴다: sort=LATEST, size=5
  const request = requests.find(
    (url) => url.searchParams.get("sort") === "LATEST",
  );
  expect(request?.searchParams.get("size")).toBe("5");

  // 행을 누르면 일정 상세로 간다
  await rows.nth(0).click();
  await expect(page).toHaveURL(
    /\/schedules\/01a1a2b3-0000-7000-8000-000000000003$/,
  );
});

test("새로 열린 일정의 활동 칩을 고르면 그 활동의 일정만 다시 받는다", async ({
  page,
}) => {
  const requests = await mockApis(page, {
    loggedIn: false,
    newlyOpened: [makeSchedule(1), makeSchedule(2)],
  });
  await page.goto("/");

  const chips = newSchedules(page).getByRole("button");
  await expect(chips).toHaveText(["전체", "보드게임", "방탈출", "산책"]);
  await expect(chips.nth(0)).toHaveAttribute("aria-pressed", "true");

  await chips.getByText("방탈출").click();
  await expect(chips.nth(2)).toHaveAttribute("aria-pressed", "true");
  await expect(chips.nth(0)).toHaveAttribute("aria-pressed", "false");
  await expect
    .poll(() =>
      requests.some(
        (url) =>
          url.pathname === "/api/v1/schedules" &&
          url.searchParams.get("sort") === "LATEST" &&
          url.searchParams.get("categoryIds") === ACTIVITY_IDS.ESCAPE_ROOM,
      ),
    )
    .toBe(true);
});
