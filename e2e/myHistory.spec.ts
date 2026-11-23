import { expect, test, type Page } from "@playwright/test";

// 내 정보 MY-01 `참여 이력 ›` · 참여 이력 MY-01-1
// 지난 일정은 `/participating`·`/hosted`의 `period=PAST` 가짜 응답을 클라이언트에서 합친다 (SHI-201, snsg-be develop 96f6cee)

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

const profile = {
  id: "01a19cc6-3d80-7000-8000-000000000001",
  name: "김민준",
  nickname: "딸기스무디",
  gender: "MALE",
  birthDate: "1998-03-14",
  email: "strawberry@example.com",
  profileImageUrl: "/images/default-profile.png",
  ageGroup: { decade: 20, phase: "LATE" },
  nicknameChangeableAt: null,
};

/** 지난 일정 하나. 번호가 클수록 오래된 일정이다 */
const makePast = (index: number, overrides: object = {}) => ({
  id: `01a1a2b3-0000-7000-8000-${String(index).padStart(12, "0")}`,
  category: { id: "01a19cc6-3d80-7000-8000-000000000001", name: "보드게임" },
  title: `지난 일정 ${index}`,
  regionName: "마포구",
  startAt: `2026-09-${String(30 - index).padStart(2, "0")}T15:00:00`,
  confirmedCount: 4,
  capacity: 4,
  remainingSeats: 0,
  displayStatus: "COMPLETED",
  createdAt: "2026-08-01T09:00:00",
  ...overrides,
});

type Page_ = { items: object[]; nextCursor: string | null };

type MockOptions = {
  loggedIn?: boolean;
  /** 요청 순서대로 받는 페이지. 마지막 페이지 뒤에는 빈 페이지를 준다 */
  participating?: Page_[];
  hosted?: Page_[];
  /** 해당 목록의 첫 요청을 실패시킨다(4xx, 5xx는 앱이 여러 번 다시 시도해 오래 걸린다) */
  failing?: Array<"participating" | "hosted">;
};

async function mockApis(
  page: Page,
  {
    loggedIn = true,
    participating = [{ items: [], nextCursor: null }],
    hosted = [{ items: [], nextCursor: null }],
    failing = [],
  }: MockOptions = {},
) {
  const requests: URL[] = [];
  const served = { participating: 0, hosted: 0 };
  let failuresLeft = Object.fromEntries(failing.map((name) => [name, 1]));

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
  await page.route("**/api/v1/users/me", (route) => route.fulfill(ok(profile)));
  await page.route("**/api/v1/schedules?**", (route) =>
    route.fulfill(ok({ items: [], nextCursor: null })),
  );
  for (const [name, pages] of [
    ["participating", participating],
    ["hosted", hosted],
  ] as const) {
    await page.route(`**/api/v1/schedules/${name}?**`, (route) => {
      requests.push(new URL(route.request().url()));
      if (failuresLeft[name]) {
        failuresLeft = { ...failuresLeft, [name]: 0 };
        return route.fulfill(fail(400, "INVALID_REQUEST"));
      }
      const result = pages[served[name]] ?? { items: [], nextCursor: null };
      served[name] += 1;
      return route.fulfill(ok(result));
    });
  }
  return requests;
}

const cards = (page: Page) => page.getByRole("main").getByRole("link");

test("내 정보의 참여 이력 줄을 누르면 참여 이력 화면으로 가고 뒤로 가기는 내 정보로 간다", async ({
  page,
}) => {
  await mockApis(page);
  await page.goto("/my");

  await page.getByRole("link", { name: "참여 이력" }).click();
  await expect(page).toHaveURL(/\/my\/history$/);
  await expect(
    page.getByRole("heading", { name: "참여 이력", level: 1 }),
  ).toBeVisible();

  await page.getByRole("link", { name: "뒤로 가기" }).click();
  await expect(page).toHaveURL(/\/my$/);
});

test("내 정보에 이용약관·개인정보 처리방침이 새 창 링크로 있다", async ({
  page,
}) => {
  await mockApis(page);
  await page.goto("/my");

  const terms = page.getByRole("link", { name: "이용약관" });
  await expect(terms).toHaveAttribute(
    "href",
    "https://info.shineunsigan.com/terms.html",
  );
  await expect(terms).toHaveAttribute("target", "_blank");
  const privacy = page.getByRole("link", { name: "개인정보 처리방침" });
  await expect(privacy).toHaveAttribute(
    "href",
    "https://info.shineunsigan.com/privacy.html",
  );
  await expect(privacy).toHaveAttribute("target", "_blank");
});

test("참여한 지난 일정과 개설한 지난 일정을 최근 순 한 목록으로 합치고 역할·상태 배지와 불러온 개수를 보여 준다", async ({
  page,
}) => {
  const requests = await mockApis(page, {
    participating: [
      {
        items: [
          makePast(1),
          makePast(4, { displayStatus: "CANCELED", confirmedCount: 3 }),
        ],
        nextCursor: null,
      },
    ],
    hosted: [
      {
        items: [
          makePast(2, { displayStatus: "CANCELED", confirmedCount: 2 }),
          makePast(3),
        ],
        nextCursor: null,
      },
    ],
  });
  await page.goto("/my/history");

  await expect(cards(page)).toHaveCount(4);
  await expect(page.getByText("지난 일정 4 · 최근 순")).toBeVisible();
  // 시작 늦은 순으로 섞인다: 1(참여) → 2(개설) → 3(개설) → 4(참여)
  await expect(cards(page).nth(0)).toContainText("지난 일정 1");
  await expect(cards(page).nth(0)).toContainText("일정 완료");
  await expect(cards(page).nth(0)).toContainText("참여");
  await expect(cards(page).nth(1)).toContainText("지난 일정 2");
  await expect(cards(page).nth(1)).toContainText("일정 취소됨");
  await expect(cards(page).nth(1)).toContainText("개설");
  await expect(cards(page).nth(1)).toContainText("마포구");
  await expect(cards(page).nth(1)).toContainText("2/4명");
  await expect(cards(page).nth(2)).toContainText("일정 완료");
  await expect(cards(page).nth(2)).toContainText("개설");
  await expect(cards(page).nth(3)).toContainText("일정 취소됨");
  await expect(cards(page).nth(3)).toContainText("참여");
  // 지난 일정에는 D-n·남은 자리·NEW가 없다
  await expect(page.getByRole("main")).not.toContainText(
    /D-|자리 남음|NEW|모집/,
  );
  // 두 목록 모두 PAST로 받는다
  expect(requests).toHaveLength(2);
  for (const url of requests) {
    expect(url.searchParams.get("period")).toBe("PAST");
    expect(url.searchParams.get("size")).toBe("20");
  }

  await cards(page).nth(1).click();
  await expect(page).toHaveURL(
    /\/schedules\/01a1a2b3-0000-7000-8000-000000000002$/,
  );
});

test("[더 보기]는 더 받을 목록의 다음 페이지를 받아 이어 붙이고 마지막 페이지면 숨긴다", async ({
  page,
}) => {
  const requests = await mockApis(page, {
    participating: [
      { items: [makePast(1), makePast(3)], nextCursor: "p-2" },
      { items: [makePast(5)], nextCursor: null },
    ],
    hosted: [{ items: [makePast(2)], nextCursor: null }],
  });
  await page.goto("/my/history");

  // 참여 목록이 일정 3까지만 받았으므로 그보다 오래된 일정은 아직 확실하지 않다
  await expect(cards(page)).toHaveCount(3);
  await expect(page.getByText("지난 일정 3 · 최근 순")).toBeVisible();

  await page.getByRole("button", { name: "더 보기" }).click();
  await expect(cards(page)).toHaveCount(4);
  await expect(page.getByText("지난 일정 4 · 최근 순")).toBeVisible();
  await expect(cards(page).nth(3)).toContainText("지난 일정 5");
  await expect(page.getByRole("button", { name: "더 보기" })).toHaveCount(0);
  expect(requests.some((url) => url.searchParams.get("cursor") === "p-2")).toBe(
    true,
  );
});

test("지난 일정이 없으면 빈 상태 문구를 보여 준다", async ({ page }) => {
  await mockApis(page);
  await page.goto("/my/history");

  await expect(page.getByText("아직 지난 일정이 없어요")).toBeVisible();
  await expect(page.getByText(/지난 일정 \d+ ·/)).toHaveCount(0);
});

test("한 목록이라도 못 받으면 다시 시도를 보여 주고 누르면 다시 받는다", async ({
  page,
}) => {
  await mockApis(page, {
    // 다시 시도하면 두 목록을 모두 처음부터 다시 받으므로 같은 첫 페이지를 두 번 준다
    participating: [
      { items: [makePast(1)], nextCursor: null },
      { items: [makePast(1)], nextCursor: null },
    ],
    failing: ["hosted"],
  });
  await page.goto("/my/history");

  await expect(page.getByText("참여 이력을 불러오지 못했어요.")).toBeVisible();
  await page.getByRole("button", { name: "다시 시도" }).click();
  await expect(cards(page)).toHaveCount(1);
});

test("비로그인으로 들어오면 로그인 화면으로 가고 참여 이력으로 돌아오게 한다", async ({
  page,
}) => {
  await mockApis(page, { loggedIn: false });
  await page.goto("/my/history");

  await expect(page).toHaveURL(/\/login$/);
  expect(
    await page.evaluate(() => sessionStorage.getItem("loginRedirect")),
  ).toBe("/my/history");
});
