import { expect, test, type Page, type Route } from "@playwright/test";

// 일정 상세 DTL-01~08, HOST-01: 진입, 없는 일정, 공유, 참여자 명단 펼침 권한, 하단 영역, 참여·취소
// 응답 모양은 snsg-be api-guide(develop e746440) 일정 상세·참여자 명단·참여·참여 취소·일정 전체 취소

const ok = (data: unknown) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify({ isSuccess: true, data }),
});

const fail = (status: number, code: string, message = "") => ({
  status,
  contentType: "application/json",
  body: JSON.stringify({ isSuccess: false, code, message }),
});

const SCHEDULE_ID = "01a1a2b3-0000-7000-8000-000000000007";
const TITLE = "보드게임 추리 한 판";

/** 서버가 역할·상태로 주는 동작 (api-guide 일정 상세 역할·상태별 표, 시작 전 기준) */
function actionsFor(viewerRole: string, status: string) {
  const isOpen = status === "RECRUITING" || status === "RECRUITMENT_CLOSED";
  switch (viewerRole) {
    case "GUEST":
      return status === "RECRUITING" ? ["LOGIN_TO_JOIN"] : [];
    case "NON_PARTICIPANT":
      return status === "RECRUITING" ? ["JOIN"] : [];
    case "PARTICIPANT":
      return isOpen ? ["CANCEL_PARTICIPATION"] : [];
    default:
      return isOpen ? ["CANCEL_SCHEDULE"] : [];
  }
}

const makeDetail = ({
  viewerRole,
  status,
  confirmedCount = 5,
  availableActions = actionsFor(viewerRole, status),
}: {
  viewerRole: string;
  status: string;
  confirmedCount?: number;
  availableActions?: string[];
}) => ({
  id: SCHEDULE_ID,
  title: TITLE,
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
  confirmedCount,
  capacity: 6,
  remainingSeats: 6 - confirmedCount,
  participantSummary: {
    count: confirmedCount,
    // 성별을 알 수 없는 참여자는 어느 쪽에도 세지 않는다
    maleCount: 2,
    femaleCount: 2,
    minAgeGroup: { decade: 20, phase: "LATE" },
    maxAgeGroup: { decade: 30, phase: "EARLY" },
  },
  place: {
    name: "보드게임카페 A",
    roadAddress: "서울 마포구 와우산로 00",
    addressDetail: "2층",
    latitude: 37.5563,
    longitude: 126.9236,
    regionName: "마포구",
  },
  displayStatus: status,
  viewerRole,
  availableActions,
  cancellation: null,
});

const PARTICIPANTS = [
  {
    nickname: "민트초코",
    profileImageUrl: "/images/default-profile.png",
    gender: "FEMALE",
    ageGroup: { decade: 20, phase: "LATE" },
    isHost: true,
    isMe: false,
    withdrawn: false,
  },
  {
    nickname: "딸기스무디",
    profileImageUrl: "/images/default-profile.png",
    gender: "MALE",
    ageGroup: { decade: 20, phase: "LATE" },
    isHost: false,
    isMe: true,
    withdrawn: false,
  },
  {
    nickname: "탈퇴한 사용자",
    profileImageUrl: "/images/default-profile.png",
    gender: "MALE",
    ageGroup: null,
    isHost: false,
    isMe: false,
    withdrawn: true,
  },
];

/** 상세·명단을 가짜 응답으로 채운다. 명단 요청 수를 돌려준다 */
async function mockApis(
  page: Page,
  {
    loggedIn,
    viewerRole,
    status = "RECRUITING",
    availableActions,
  }: {
    loggedIn: boolean;
    viewerRole: string;
    status?: string;
    availableActions?: string[];
  },
) {
  const requests = { participants: 0 };
  // 네이버 지도는 외부 키 인증이 필요해 막는다
  await page.route("https://oapi.map.naver.com/**", (route) => route.abort());
  // 따로 정하지 않은 경로는 없는 경로의 404 (api-guide 공통 규칙)
  await page.route("**/api/v1/**", (route) =>
    route.fulfill(fail(404, "INVALID_REQUEST")),
  );
  await page.route("**/api/v1/auth/tokens", (route) =>
    route.fulfill(
      loggedIn
        ? ok({ accessToken: "e2e-access-token" })
        : fail(401, "INVALID_REFRESH_TOKEN"),
    ),
  );
  await page.route("**/api/v1/activity-categories", (route) =>
    route.fulfill(ok([])),
  );
  await page.route("**/api/v1/regions", (route) => route.fulfill(ok([])));
  await page.route("**/api/v1/schedules?**", (route) =>
    route.fulfill(
      ok({
        nextCursor: null,
        items: [
          {
            id: SCHEDULE_ID,
            category: {
              id: "01a19cc6-3d80-7000-8000-000000000001",
              name: "보드게임",
            },
            title: TITLE,
            regionName: "마포구",
            startAt: "2026-12-24T19:30:00",
            confirmedCount: 5,
            capacity: 6,
            remainingSeats: 1,
            displayStatus: "RECRUITING",
            createdAt: "2026-11-01T09:00:00",
          },
        ],
      }),
    ),
  );
  await page.route(`**/api/v1/schedules/${SCHEDULE_ID}`, (route) =>
    route.fulfill(ok(makeDetail({ viewerRole, status, availableActions }))),
  );
  await page.route(
    `**/api/v1/schedules/${SCHEDULE_ID}/participants`,
    (route) => {
      requests.participants += 1;
      return route.fulfill(ok(PARTICIPANTS));
    },
  );
  return requests;
}

test("목록 카드로 상세에 들어가고, 뒤로 가면 목록으로 돌아온다", async ({
  page,
}) => {
  await mockApis(page, { loggedIn: false, viewerRole: "GUEST" });
  await page.goto("/?activity=01a19cc6-3d80-7000-8000-000000000001");

  await page.getByRole("link", { name: new RegExp(TITLE) }).click();
  await expect(page).toHaveURL(`/schedules/${SCHEDULE_ID}`);
  await expect(page.getByRole("heading", { name: TITLE })).toBeVisible();
  await expect(page.getByText("12월24일(목) 19:30")).toBeVisible();
  await expect(page.getByText("2시간 내외")).toBeVisible();
  await expect(
    page.getByText("남 2 · 여 2 · 20대 후반–30대 초반"),
  ).toBeVisible();
  await expect(page.getByText("서울 마포구 와우산로 00")).toBeVisible();

  // 앱 안에서 이동해 왔으므로 뒤로 = 브라우저 뒤로 (필터가 남은 이전 주소)
  await page.getByRole("button", { name: "뒤로" }).click();
  await expect(page).toHaveURL(
    "/?activity=01a19cc6-3d80-7000-8000-000000000001",
  );
});

test("공유 링크로 바로 들어온 조회자는 명단을 펼칠 수 없고, 뒤로 가면 홈으로 간다", async ({
  page,
}) => {
  const requests = await mockApis(page, {
    loggedIn: false,
    viewerRole: "GUEST",
  });
  await page.goto(`/schedules/${SCHEDULE_ID}`);

  await expect(page.getByRole("heading", { name: TITLE })).toBeVisible();
  await expect(page.getByText("참여자 5")).toBeVisible();
  // 확정 참여자·개설자만 펼친다 (F-6)
  await expect(page.getByRole("button", { name: /참여자/ })).toHaveCount(0);
  expect(requests.participants).toBe(0);

  await page.getByRole("button", { name: "뒤로" }).click();
  await expect(page).toHaveURL("/");
});

test("확정 참여자는 접힌 요약에 명단 사진을 보고, 펼쳐 개설자·탈퇴한 사용자를 본다", async ({
  page,
}) => {
  const requests = await mockApis(page, {
    loggedIn: true,
    viewerRole: "PARTICIPANT",
  });
  await page.goto(`/schedules/${SCHEDULE_ID}`);

  const toggle = page.getByRole("button", { name: "참여자 5" });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  // 펼치기 전에 명단을 받아 겹친 아바타에 사진을 쓴다(명단 3명 → 3장). 장식 이미지(alt 없음)라 role로 찾을 수 없다
  const summaryPhotos = page
    .locator("section", { has: toggle })
    .locator('img[src$="/images/default-profile.png"]');
  await expect(summaryPhotos).toHaveCount(3);
  expect(requests.participants).toBe(1);
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");

  const rows = page
    .getByRole("list", { name: "참여자 명단" })
    .getByRole("listitem");
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(0)).toContainText("민트초코");
  await expect(rows.nth(0)).toContainText("개설자");
  await expect(rows.nth(0)).toContainText("여 · 20대 후반");
  // 본인도 닉네임만 (Q5)
  await expect(rows.nth(1)).toHaveText(/^딸기스무디남 · 20대 후반$/);
  // 탈퇴한 사용자는 성별·연령대를 숨긴다 (Q9)
  await expect(rows.nth(2)).toHaveText("탈퇴한 사용자");
  expect(requests.participants).toBe(1);
});

test("공유를 누르면 상세 링크를 복사하고 토스트를 보여준다", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await mockApis(page, { loggedIn: false, viewerRole: "GUEST" });
  await page.goto(`/schedules/${SCHEDULE_ID}`);
  await expect(page.getByRole("heading", { name: TITLE })).toBeVisible();

  await page.getByRole("button", { name: "공유" }).click();
  await expect(page.getByText("링크가 복사되었습니다")).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    new URL(`/schedules/${SCHEDULE_ID}`, page.url()).href,
  );
});

test("없는 일정이면 홈으로 가고 토스트를 보여준다", async ({ page }) => {
  const missingId = "01a1a2b3-0000-7000-8000-000000000999";
  await mockApis(page, { loggedIn: false, viewerRole: "GUEST" });
  await page.route(`**/api/v1/schedules/${missingId}`, (route) =>
    route.fulfill(fail(404, "SCHEDULE_NOT_FOUND", "찾을 수 없는 일정이에요.")),
  );
  await page.goto(`/schedules/${missingId}`);

  await expect(page).toHaveURL("/");
  await expect(page.getByText("찾을 수 없는 일정이에요")).toBeVisible();
});

test("주소의 일정 ID가 UUID 형식이 아니면 없는 일정과 같이 처리한다", async ({
  page,
}) => {
  await mockApis(page, { loggedIn: false, viewerRole: "GUEST" });
  await page.goto("/schedules/abc");

  await expect(page).toHaveURL("/");
  await expect(page.getByText("찾을 수 없는 일정이에요")).toBeVisible();
});

const GUEST_NOTICE = "일정 정보는 누구나 볼 수 있어요.";
const bottomBar = (page: Page) =>
  page.getByRole("region", { name: "참여 영역" });

test("조회자는 모집 중이면 안내 띠와 로그인 버튼을 보고, 누르면 이 상세로 돌아오게 로그인 화면으로 간다", async ({
  page,
}) => {
  await mockApis(page, { loggedIn: false, viewerRole: "GUEST" });
  await page.goto(`/schedules/${SCHEDULE_ID}`);

  await expect(page.getByText(GUEST_NOTICE)).toBeVisible();
  await expect(bottomBar(page)).toContainText("1자리 남음");
  await page.getByRole("button", { name: "로그인하고 참여하기" }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(
    await page.evaluate(() => sessionStorage.getItem("loginRedirect")),
  ).toBe(`/schedules/${SCHEDULE_ID}`);
});

test("모집 마감이면 조회자는 비활성 모집 마감만 보고 안내 띠는 없다", async ({
  page,
}) => {
  await mockApis(page, {
    loggedIn: false,
    viewerRole: "GUEST",
    status: "RECRUITMENT_CLOSED",
  });
  await page.goto(`/schedules/${SCHEDULE_ID}`);

  await expect(page.getByRole("button", { name: "모집 마감" })).toBeDisabled();
  await expect(bottomBar(page)).toContainText("5 / 6명");
  await expect(page.getByText(GUEST_NOTICE)).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "로그인하고 참여하기" }),
  ).toHaveCount(0);
});

test("확정 참여자는 모집 마감이어도 참여 확정과 참여 취소를 본다", async ({
  page,
}) => {
  await mockApis(page, {
    loggedIn: true,
    viewerRole: "PARTICIPANT",
    status: "RECRUITMENT_CLOSED",
  });
  await page.goto(`/schedules/${SCHEDULE_ID}`);

  await expect(bottomBar(page)).toContainText("참여 확정");
  await expect(page.getByRole("button", { name: "참여 취소" })).toBeEnabled();
});

test("개설자는 내가 연 일정과 인원, 일정 전체 취소를 본다", async ({
  page,
}) => {
  await mockApis(page, { loggedIn: true, viewerRole: "HOST" });
  await page.goto(`/schedules/${SCHEDULE_ID}`);

  await expect(bottomBar(page)).toContainText("내가 연 일정5 / 6명");
  await expect(
    page.getByRole("button", { name: "일정 전체 취소" }),
  ).toBeEnabled();
});

// ---- 참여·참여 취소·일정 전체 취소 (DTL-03·DTL-07·HOST-01) ----

type ActionResult = { status: number; code?: string; message?: string };

/**
 * 상태가 바뀌는 상세 응답. 요청이 성공하면 다음 상세 응답이 바뀐다. 요청 본문과 요청 수를 돌려준다
 * mockApis 뒤에 등록해 상세 응답을 덮어쓴다 (나중에 등록한 route가 먼저 처리된다)
 */
async function mockActions(
  page: Page,
  {
    viewerRole,
    result = { status: 200 },
    confirmedCount = 5,
  }: { viewerRole: string; result?: ActionResult; confirmedCount?: number },
) {
  const state = { viewerRole, status: "RECRUITING", confirmedCount };
  const calls = {
    detail: 0,
    join: 0,
    participants: 0,
    bodies: [] as unknown[],
    /** 다음 상세 응답에 쓰는 값. 테스트가 바꿔 서버 쪽 변화를 흉내 낸다 */
    state,
  };
  await mockApis(page, { loggedIn: true, viewerRole });
  await page.route(`**/api/v1/schedules/${SCHEDULE_ID}`, (route) => {
    calls.detail += 1;
    return route.fulfill(
      ok(
        makeDetail({
          viewerRole: state.viewerRole,
          status: state.status,
          confirmedCount: state.confirmedCount,
        }),
      ),
    );
  });
  const respond = async (route: Route, apply: () => void) => {
    calls.bodies.push(route.request().postDataJSON());
    // 요청 중 버튼 막기를 확인할 수 있게 조금 늦게 답한다
    await new Promise((resolve) => setTimeout(resolve, 300));
    if (result.status !== 200) {
      // 서버가 거부한 뒤의 최신 상태: 마감
      if (result.code === "RECRUIT_CLOSED") {
        state.status = "RECRUITMENT_CLOSED";
        state.confirmedCount = 6;
      }
      return route.fulfill(
        fail(result.status, result.code ?? "", result.message),
      );
    }
    apply();
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ isSuccess: true }),
    });
  };
  // 같은 경로: GET = 명단, POST = 참여
  await page.route(
    `**/api/v1/schedules/${SCHEDULE_ID}/participants`,
    (route) => {
      if (route.request().method() === "GET") {
        calls.participants += 1;
        return route.fulfill(ok(PARTICIPANTS));
      }
      calls.join += 1;
      return respond(route, () => {
        state.viewerRole = "PARTICIPANT";
        state.confirmedCount += 1;
      });
    },
  );
  await page.route(
    `**/api/v1/schedules/${SCHEDULE_ID}/participants/me`,
    (route) =>
      respond(route, () => {
        state.viewerRole = "NON_PARTICIPANT";
        state.confirmedCount -= 1;
      }),
  );
  // 일정 전체 취소 뒤에도 참여 기록·확정 인원은 그대로다 (api-guide 일정 전체 취소)
  await page.route(`**/api/v1/schedules/${SCHEDULE_ID}/cancellation`, (route) =>
    respond(route, () => {
      state.status = "CANCELED";
    }),
  );
  return calls;
}

test("미참여자가 참여하기를 누르면 바로 확정되고 토스트와 함께 참여 확정으로 다시 그린다", async ({
  page,
}) => {
  const calls = await mockActions(page, { viewerRole: "NON_PARTICIPANT" });
  await page.goto(`/schedules/${SCHEDULE_ID}`);
  // 미참여자는 명단을 받지 않는다
  await expect(page.getByRole("button", { name: "참여하기" })).toBeVisible();
  expect(calls.participants).toBe(0);

  await page.getByRole("button", { name: "참여하기" }).click();
  await expect(page.getByText("참여가 확정되었어요")).toBeVisible();
  await expect(bottomBar(page)).toContainText("참여 확정");
  await expect(page.getByRole("button", { name: "참여 취소" })).toBeVisible();
  await expect(page.getByText("6 / 6명").first()).toBeVisible();
  // 확정 참여자가 되면 명단을 받아 접힌 요약에 사진을 쓴다(명단 3명 → 3장). 장식 이미지(alt 없음)라 role로 찾을 수 없다
  await expect.poll(() => calls.participants).toBe(1);
  await expect(
    page
      .locator("section", { has: page.getByRole("button", { name: /참여자/ }) })
      .locator('img[src$="/images/default-profile.png"]'),
  ).toHaveCount(3);
});

test("이미 마감됐으면 서버 문구를 토스트로 보여주고 최신 상태(모집 마감)로 다시 그린다", async ({
  page,
}) => {
  const calls = await mockActions(page, {
    viewerRole: "NON_PARTICIPANT",
    result: {
      status: 409,
      code: "RECRUIT_CLOSED",
      message: "모집이 끝난 일정이에요.",
    },
  });
  await page.goto(`/schedules/${SCHEDULE_ID}`);
  await expect(page.getByRole("button", { name: "참여하기" })).toBeVisible();
  const before = calls.detail;

  await page.getByRole("button", { name: "참여하기" }).click();
  await expect(page.getByText("모집이 끝난 일정이에요.")).toBeVisible();
  await expect(page.getByRole("button", { name: "모집 마감" })).toBeDisabled();
  expect(calls.detail).toBeGreaterThan(before);
});

test("시간이 겹치는 일정이 있으면 서버 문구로 안내한다", async ({ page }) => {
  await mockActions(page, {
    viewerRole: "NON_PARTICIPANT",
    result: {
      status: 409,
      code: "SCHEDULE_TIME_CONFLICT",
      message: "앞뒤 12시간 안에 참여하는 다른 일정이 있어요.",
    },
  });
  await page.goto(`/schedules/${SCHEDULE_ID}`);

  await page.getByRole("button", { name: "참여하기" }).click();
  await expect(
    page.getByText("앞뒤 12시간 안에 참여하는 다른 일정이 있어요."),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "참여하기" })).toBeVisible();
});

test("참여 취소는 확인 팝업 → 완료 팝업 뒤 미참여자 상세가 된다", async ({
  page,
}) => {
  await mockActions(page, { viewerRole: "PARTICIPANT" });
  await page.goto(`/schedules/${SCHEDULE_ID}`);

  await page.getByRole("button", { name: "참여 취소" }).click();
  const confirm = page.getByRole("dialog", { name: "참여를 취소할까요?" });
  await expect(confirm).toContainText(
    "이 일정에서 빠지고, 참여자 명단에서도 제외돼요.",
  );
  // [닫기]는 아무것도 하지 않는다
  await confirm.getByRole("button", { name: "닫기" }).click();
  await expect(confirm).toHaveCount(0);
  await expect(bottomBar(page)).toContainText("참여 확정");

  await page.getByRole("button", { name: "참여 취소" }).click();
  await page
    .getByRole("dialog", { name: "참여를 취소할까요?" })
    .getByRole("button", { name: "확인" })
    .click();
  const done = page.getByRole("dialog", {
    name: "일정이 정상 취소되었습니다.",
  });
  await expect(done).toBeVisible();
  await done.getByRole("button", { name: "확인" }).click();
  await expect(done).toHaveCount(0);
  await expect(page.getByRole("button", { name: "참여하기" })).toBeVisible();
});

test("일정 전체 취소: 사유가 비면 막고, 확인하면 바로 취소되어 일정 취소됨이 된다", async ({
  page,
}) => {
  const calls = await mockActions(page, { viewerRole: "HOST" });
  await page.goto(`/schedules/${SCHEDULE_ID}`);

  await page.getByRole("button", { name: "일정 전체 취소" }).click();
  const confirm = page.getByRole("dialog", { name: "일정을 전체 취소할까요?" });
  // 확정 참여자 = 확정 인원 5명 − 개설자
  await expect(confirm).toContainText(
    "확정 참여자 4명의 참여가 모두 취소되고, 취소한 일정은 되돌릴 수 없어요.",
  );
  await confirm.getByRole("button", { name: "확인" }).click();

  const reasonSheet = page.getByRole("dialog", {
    name: "취소 사유를 알려주세요",
  });
  const reason = reasonSheet.getByRole("textbox", { name: "취소 사유" });
  const next = reasonSheet.getByRole("button", { name: "확인" });
  await expect(next).toBeDisabled();
  await reason.fill("   ");
  await expect(next).toBeDisabled();
  await reason.fill("개인 사정");
  await expect(reasonSheet).toContainText("5/100");
  // 알림 기능이 없어 "참여자에게 전달" 안내·미리보기는 없다 (사용자 결정 2026-11-08)
  await expect(reasonSheet).not.toContainText("전달");
  await reason.fill("  개인 사정이 생겼어요  ");
  // 빠르게 두 번 눌러도 요청은 한 번만 보낸다
  await next.dblclick();

  const done = page.getByRole("dialog", {
    name: "일정이 정상 취소되었습니다.",
  });
  await expect(done).not.toContainText("전달했어요");
  // 앞뒤 공백을 빼고 보낸다
  expect(calls.bodies).toEqual([{ reason: "개인 사정이 생겼어요" }]);
  await done.getByRole("button", { name: "확인" }).click();
  await expect(
    page.getByRole("button", { name: "일정 취소됨" }),
  ).toBeDisabled();
  // 확정 인원은 서버가 준 그대로다
  await expect(bottomBar(page)).toContainText("내가 연 일정5 / 6명");
});

test("일정 취소 사유는 앞뒤 공백을 뺀 100자까지 받고, 이모지는 한 글자로 센다", async ({
  page,
}) => {
  await mockActions(page, { viewerRole: "HOST" });
  await page.goto(`/schedules/${SCHEDULE_ID}`);

  await page.getByRole("button", { name: "일정 전체 취소" }).click();
  await page
    .getByRole("dialog", { name: "일정을 전체 취소할까요?" })
    .getByRole("button", { name: "확인" })
    .click();
  const reasonSheet = page.getByRole("dialog", {
    name: "취소 사유를 알려주세요",
  });
  const reason = reasonSheet.getByRole("textbox", { name: "취소 사유" });

  await reason.fill("😀".repeat(100));
  await expect(reasonSheet).toContainText("100/100");
  await expect(reasonSheet.getByRole("button", { name: "확인" })).toBeEnabled();

  await reason.fill(` ${"가".repeat(100)} `);
  await expect(reasonSheet).toContainText("100/100");
  // 100자를 넘기는 입력은 받지 않는다
  await reason.press("End");
  await reason.pressSequentially("나");
  await expect(reason).toHaveValue(` ${"가".repeat(100)} `);
});

test("이미 취소됐거나 시작한 일정이면 시트를 닫고 서버 문구를 보여준 뒤 다시 그린다", async ({
  page,
}) => {
  const calls = await mockActions(page, {
    viewerRole: "HOST",
    result: {
      status: 409,
      code: "SCHEDULE_NOT_CANCELABLE",
      message: "이미 취소됐거나 시작한 일정은 취소할 수 없어요.",
    },
  });
  await page.goto(`/schedules/${SCHEDULE_ID}`);

  await page.getByRole("button", { name: "일정 전체 취소" }).click();
  await page
    .getByRole("dialog", { name: "일정을 전체 취소할까요?" })
    .getByRole("button", { name: "확인" })
    .click();
  const reasonSheet = page.getByRole("dialog", {
    name: "취소 사유를 알려주세요",
  });
  await reasonSheet
    .getByRole("textbox", { name: "취소 사유" })
    .fill("개인 사정");
  const before = calls.detail;
  await reasonSheet.getByRole("button", { name: "확인" }).click();

  await expect(
    page.getByText("이미 취소됐거나 시작한 일정은 취소할 수 없어요."),
  ).toBeVisible();
  await expect(reasonSheet).toHaveCount(0);
  expect(calls.detail).toBeGreaterThan(before);
});

test("확정 참여자가 없으면 일정 전체 취소에서 참여자·알림 문구를 뺀다", async ({
  page,
}) => {
  // 확정 인원 1명 = 개설자만
  await mockActions(page, { viewerRole: "HOST", confirmedCount: 1 });
  await page.goto(`/schedules/${SCHEDULE_ID}`);

  await page.getByRole("button", { name: "일정 전체 취소" }).click();
  const confirm = page.getByRole("dialog", { name: "일정을 전체 취소할까요?" });
  await expect(confirm).toContainText("취소한 일정은 되돌릴 수 없어요.");
  await expect(confirm).not.toContainText("확정 참여자");
  await confirm.getByRole("button", { name: "확인" }).click();

  const reasonSheet = page.getByRole("dialog", {
    name: "취소 사유를 알려주세요",
  });
  await reasonSheet
    .getByRole("textbox", { name: "취소 사유" })
    .fill("개인 사정");
  await reasonSheet.getByRole("button", { name: "확인" }).click();

  const done = page.getByRole("dialog", {
    name: "일정이 정상 취소되었습니다.",
  });
  await expect(done).toBeVisible();
  await expect(done).not.toContainText("전달했어요");
});

test("참여하기를 연달아 눌러도 참여 요청은 한 번만 보낸다", async ({
  page,
}) => {
  const calls = await mockActions(page, { viewerRole: "NON_PARTICIPANT" });
  await page.goto(`/schedules/${SCHEDULE_ID}`);

  await page.getByRole("button", { name: "참여하기" }).dblclick();
  await expect(bottomBar(page)).toContainText("참여 확정");
  expect(calls.join).toBe(1);
});

test("미참여자는 참여자 명단을 펼칠 수 없다", async ({ page }) => {
  const calls = await mockActions(page, { viewerRole: "NON_PARTICIPANT" });
  await page.goto(`/schedules/${SCHEDULE_ID}`);

  await expect(page.getByText("참여자 5")).toBeVisible();
  await expect(page.getByRole("button", { name: /참여자/ })).toHaveCount(0);
  expect(calls.participants).toBe(0);
});

test("참여 취소가 거부(409)되면 서버 문구를 토스트로 알리고 상세를 다시 받는다", async ({
  page,
}) => {
  const calls = await mockActions(page, {
    viewerRole: "PARTICIPANT",
    result: {
      status: 409,
      code: "PARTICIPATION_NOT_CANCELABLE",
      message: "취소되었거나 끝난 일정은 참여를 취소할 수 없어요.",
    },
  });
  await page.goto(`/schedules/${SCHEDULE_ID}`);
  await expect(page.getByRole("button", { name: "참여 취소" })).toBeVisible();
  const before = calls.detail;

  await page.getByRole("button", { name: "참여 취소" }).click();
  await page
    .getByRole("dialog", { name: "참여를 취소할까요?" })
    .getByRole("button", { name: "확인" })
    .click();
  await expect(
    page.getByText("취소되었거나 끝난 일정은 참여를 취소할 수 없어요."),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(bottomBar(page)).toContainText("참여 확정");
  expect(calls.detail).toBeGreaterThan(before);
});

test("일정 전체 취소가 실패하면 사유 시트와 입력한 사유를 그대로 둔다", async ({
  page,
}) => {
  await mockActions(page, {
    viewerRole: "HOST",
    result: { status: 500, code: "INTERNAL_ERROR" },
  });
  await page.goto(`/schedules/${SCHEDULE_ID}`);

  await page.getByRole("button", { name: "일정 전체 취소" }).click();
  await page
    .getByRole("dialog", { name: "일정을 전체 취소할까요?" })
    .getByRole("button", { name: "확인" })
    .click();
  const reasonSheet = page.getByRole("dialog", {
    name: "취소 사유를 알려주세요",
  });
  await reasonSheet
    .getByRole("textbox", { name: "취소 사유" })
    .fill("개인 사정");
  await reasonSheet.getByRole("button", { name: "확인" }).click();

  await expect(
    page.getByText("요청을 처리하지 못했어요. 다시 시도해주세요."),
  ).toBeVisible();
  await expect(reasonSheet).toBeVisible();
  await expect(page.getByRole("textbox", { name: "취소 사유" })).toHaveValue(
    "개인 사정",
  );
});

test("명단이 403(PARTICIPANT_LIST_FORBIDDEN)이면 상세를 다시 받아 미참여자로 그린다", async ({
  page,
}) => {
  const calls = await mockActions(page, { viewerRole: "PARTICIPANT" });
  // 그 사이 다른 기기에서 참여를 취소한 상황
  await page.route(
    `**/api/v1/schedules/${SCHEDULE_ID}/participants`,
    (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      calls.state.viewerRole = "NON_PARTICIPANT";
      calls.state.confirmedCount = 4;
      return route.fulfill(
        fail(
          403,
          "PARTICIPANT_LIST_FORBIDDEN",
          "참여한 일정만 참여자 명단을 볼 수 있어요.",
        ),
      );
    },
  );
  // 확정 참여자는 상세를 열 때 명단도 받는다(접힌 요약의 사진). 그 명단이 403이면 상세를 한 번 더 받는다
  await page.goto(`/schedules/${SCHEDULE_ID}`);

  await expect(page.getByRole("button", { name: "참여하기" })).toBeVisible();
  await expect(page.getByRole("button", { name: /참여자/ })).toHaveCount(0);
  await expect(page.getByRole("list", { name: "참여자 명단" })).toHaveCount(0);
  await expect(page.getByText("참여자 4")).toBeVisible();
  expect(calls.detail).toBe(2);
});

/** 일정 전체 취소의 사유 시트를 열고 사유를 적는다 */
async function openCancelSheet(page: Page, reasonText: string) {
  await page.getByRole("button", { name: "일정 전체 취소" }).click();
  await page
    .getByRole("dialog", { name: "일정을 전체 취소할까요?" })
    .getByRole("button", { name: "확인" })
    .click();
  const reasonSheet = page.getByRole("dialog", {
    name: "취소 사유를 알려주세요",
  });
  await reasonSheet
    .getByRole("textbox", { name: "취소 사유" })
    .fill(reasonText);
  return reasonSheet;
}

test("일정 취소 사유가 서버 검증(400)에 걸리면 문구를 토스트로 보여주고 시트와 사유를 둔다", async ({
  page,
}) => {
  await mockActions(page, { viewerRole: "HOST" });
  await page.route(`**/api/v1/schedules/${SCHEDULE_ID}/cancellation`, (route) =>
    route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({
        isSuccess: false,
        code: "INVALID_REQUEST",
        message: "요청 형식이 올바르지 않습니다.",
        errors: [
          { field: "reason", message: "취소 사유는 1~100자로 적어주세요." },
        ],
      }),
    }),
  );
  await page.goto(`/schedules/${SCHEDULE_ID}`);

  const reasonSheet = await openCancelSheet(page, "개인 사정");
  await reasonSheet.getByRole("button", { name: "확인" }).click();

  await expect(
    page.getByText("취소 사유는 1~100자로 적어주세요."),
  ).toBeVisible();
  await expect(reasonSheet).toBeVisible();
  await expect(
    reasonSheet.getByRole("textbox", { name: "취소 사유" }),
  ).toHaveValue("개인 사정");
  await expect(reasonSheet.getByRole("button", { name: "확인" })).toBeEnabled();
});

test("내가 연 일정이 아니면(403 NOT_HOST) 시트를 닫고 서버 문구를 보여준다", async ({
  page,
}) => {
  const calls = await mockActions(page, {
    viewerRole: "HOST",
    result: {
      status: 403,
      code: "NOT_HOST",
      message: "내가 연 일정만 취소할 수 있어요.",
    },
  });
  await page.goto(`/schedules/${SCHEDULE_ID}`);

  const reasonSheet = await openCancelSheet(page, "개인 사정");
  const before = calls.detail;
  await reasonSheet.getByRole("button", { name: "확인" }).click();

  await expect(
    page.getByText("내가 연 일정만 취소할 수 있어요."),
  ).toBeVisible();
  await expect(reasonSheet).toHaveCount(0);
  expect(calls.detail).toBeGreaterThan(before);
});

test("탈퇴한 사용자가 참여하면(USER_NOT_ACTIVE) 이 상세로 돌아오게 로그인 화면으로 간다", async ({
  page,
}) => {
  await mockActions(page, {
    viewerRole: "NON_PARTICIPANT",
    result: {
      status: 401,
      code: "USER_NOT_ACTIVE",
      message: "이용할 수 없는 사용자예요. 다시 로그인해주세요.",
    },
  });
  await page.goto(`/schedules/${SCHEDULE_ID}`);

  await page.getByRole("button", { name: "참여하기" }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(
    await page.evaluate(() => sessionStorage.getItem("loginRedirect")),
  ).toBe(`/schedules/${SCHEDULE_ID}`);
});

test("로그인했는데 상세가 GUEST이고 재발급도 401이면 조회자 화면을 두고 로그아웃 상태가 된다", async ({
  page,
}) => {
  await mockApis(page, { loggedIn: true, viewerRole: "GUEST" });
  let tokenRequests = 0;
  // 앱 시작 때는 토큰을 받고, 상세가 GUEST로 와서 다시 재발급할 때는 refresh도 만료됐다
  await page.route("**/api/v1/auth/tokens", (route) => {
    tokenRequests += 1;
    return route.fulfill(
      tokenRequests === 1
        ? ok({ accessToken: "e2e-access-token" })
        : fail(401, "INVALID_REFRESH_TOKEN", "다시 로그인해야 합니다."),
    );
  });
  await page.goto(`/schedules/${SCHEDULE_ID}`);

  await expect(
    page.getByRole("button", { name: "로그인하고 참여하기" }),
  ).toBeVisible();
  await expect(page).toHaveURL(`/schedules/${SCHEDULE_ID}`);
  expect(tokenRequests).toBe(2);

  // 토큰을 지웠으므로 앱 안에서 홈으로 가면 비로그인으로 보인다
  await page.getByRole("button", { name: "뒤로" }).click();
  await expect(page).toHaveURL("/");
  await page.getByRole("tab", { name: "참여한 일정" }).click();
  await expect(
    page.getByRole("button", { name: "로그인 후 사용 가능합니다" }),
  ).toBeVisible();
  expect(tokenRequests).toBe(2);
});

test("상세를 불러오지 못하면(5xx) 다시 시도로 다시 받는다", async ({
  page,
}) => {
  await mockApis(page, { loggedIn: false, viewerRole: "GUEST" });
  let detailRequests = 0;
  let isServerDown = true;
  await page.route(`**/api/v1/schedules/${SCHEDULE_ID}`, (route) => {
    detailRequests += 1;
    return route.fulfill(
      isServerDown
        ? fail(500, "INTERNAL_ERROR")
        : ok(makeDetail({ viewerRole: "GUEST", status: "RECRUITING" })),
    );
  });
  await page.goto(`/schedules/${SCHEDULE_ID}`);

  // 5xx는 공통 설정대로 몇 번 다시 보낸 뒤 오류를 보여준다
  const retry = page.getByRole("button", { name: "다시 시도" });
  await expect(retry).toBeVisible({ timeout: 15_000 });
  expect(detailRequests).toBeGreaterThan(1);

  isServerDown = false;
  await retry.click();
  await expect(page.getByRole("heading", { name: TITLE })).toBeVisible();
});

for (const [status, label] of [
  ["RECRUITMENT_CLOSED", "모집 마감"],
  ["CANCELED", "일정 취소됨"],
] as const) {
  test(`개설자는 ${label}에서도 하단 왼쪽에 내가 연 일정과 인원을 본다`, async ({
    page,
  }) => {
    await mockApis(page, { loggedIn: true, viewerRole: "HOST", status });
    await page.goto(`/schedules/${SCHEDULE_ID}`);

    // 상태와 상관없이 `내가 연 일정 / n / m명` (팀 결정 N5)
    await expect(bottomBar(page)).toContainText("내가 연 일정5 / 6명");
  });
}

test("시작 후 개설자는 서버가 일정 취소를 주지 않아 비활성 모집 마감을 본다", async ({
  page,
}) => {
  await mockApis(page, {
    loggedIn: true,
    viewerRole: "HOST",
    status: "RECRUITMENT_CLOSED",
    availableActions: [],
  });
  await page.goto(`/schedules/${SCHEDULE_ID}`);

  await expect(page.getByRole("button", { name: "모집 마감" })).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "일정 전체 취소" }),
  ).toHaveCount(0);
  await expect(bottomBar(page)).toContainText("내가 연 일정5 / 6명");
});

test("시작 후에도 서버가 참여 취소를 주면 확정 참여자는 참여 취소를 누를 수 있다", async ({
  page,
}) => {
  await mockApis(page, {
    loggedIn: true,
    viewerRole: "PARTICIPANT",
    status: "RECRUITMENT_CLOSED",
    availableActions: ["CANCEL_PARTICIPATION"],
  });
  await page.goto(`/schedules/${SCHEDULE_ID}`);

  await expect(page.getByRole("button", { name: "참여 취소" })).toBeEnabled();
});

test("로그인했는데 상세가 GUEST로 오면 토큰을 재발급하고 한 번 다시 받는다", async ({
  page,
}) => {
  await mockApis(page, { loggedIn: true, viewerRole: "PARTICIPANT" });
  let tokenRequests = 0;
  await page.route("**/api/v1/auth/tokens", (route) => {
    tokenRequests += 1;
    return route.fulfill(
      ok({ accessToken: `e2e-access-token-${tokenRequests}` }),
    );
  });
  // 처음 받은 토큰은 만료된 것처럼 GUEST로 답한다
  await page.route(`**/api/v1/schedules/${SCHEDULE_ID}`, (route) => {
    const isFresh =
      route.request().headers().authorization === "Bearer e2e-access-token-2";
    return route.fulfill(
      ok(
        makeDetail({
          viewerRole: isFresh ? "PARTICIPANT" : "GUEST",
          status: "RECRUITING",
        }),
      ),
    );
  });
  await page.goto(`/schedules/${SCHEDULE_ID}`);

  await expect(bottomBar(page)).toContainText("참여 확정");
  expect(tokenRequests).toBe(2);
});

test("명단을 받을 때 일정이 없어졌으면(404) 홈으로 가고 토스트를 보여준다", async ({
  page,
}) => {
  await mockApis(page, { loggedIn: true, viewerRole: "PARTICIPANT" });
  await page.route(`**/api/v1/schedules/${SCHEDULE_ID}/participants`, (route) =>
    route.fulfill(fail(404, "SCHEDULE_NOT_FOUND", "찾을 수 없는 일정이에요.")),
  );
  await page.goto(`/schedules/${SCHEDULE_ID}`);

  // 확정 참여자는 상세를 열 때 명단도 받는다
  await expect(page).toHaveURL("/");
  await expect(page.getByText("찾을 수 없는 일정이에요")).toBeVisible();
});

test("주소 복사는 도로명주소 뒤에 상세주소를 붙여 복사한다", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await mockApis(page, { loggedIn: false, viewerRole: "GUEST" });
  await page.goto(`/schedules/${SCHEDULE_ID}`);

  await expect(page.getByText("서울 마포구 와우산로 00 2층")).toBeVisible();
  await page.getByRole("button", { name: "주소 복사" }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "서울 마포구 와우산로 00 2층",
  );
});
