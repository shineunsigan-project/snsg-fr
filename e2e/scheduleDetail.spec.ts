import { expect, test, type Page, type Route } from "@playwright/test";

// 일정 상세 DTL-01~08, HOST-01: 진입, 없는 일정, 공유, 참여자 명단 펼침 권한, 하단 영역, 참여·취소
// 상세·명단·참여·취소 API는 임시 계약이라 가짜 응답이다

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

const SCHEDULE_ID = "01a1a2b3-0000-7000-8000-000000000007";
const TITLE = "보드게임 추리 한 판";

const makeDetail = (viewerRole: string, status: string) => ({
  scheduleId: SCHEDULE_ID,
  status,
  viewerRole,
  activityName: "보드게임",
  title: TITLE,
  host: { nickname: "민트초코", profileImageUrl: null },
  startAt: "2026-12-24T19:30:00",
  duration: "NORMAL",
  participantCount: 5,
  capacity: 6,
  description: "처음 오셔도 괜찮아요.",
  participantSummary: {
    maleCount: 2,
    femaleCount: 2,
    ageGroupRange: { youngest: "20대 후반", oldest: "30대 초반" },
    profileImageUrls: [null, null, null, null, null],
  },
  place: {
    name: "보드게임카페 A",
    roadAddress: "서울 마포구 와우산로 00",
    latitude: 37.5563,
    longitude: 126.9236,
  },
});

const PARTICIPANTS = [
  {
    userId: 100,
    isHost: true,
    isWithdrawn: false,
    nickname: "민트초코",
    profileImageUrl: null,
    gender: "FEMALE",
    ageGroup: "20대 후반",
  },
  {
    userId: 1,
    isHost: false,
    isWithdrawn: false,
    nickname: "딸기스무디",
    profileImageUrl: null,
    gender: "MALE",
    ageGroup: "20대 후반",
  },
  { userId: 199, isHost: false, isWithdrawn: true },
];

/** 상세·명단을 가짜 응답으로 채운다. 명단 요청 수를 돌려준다 */
async function mockApis(
  page: Page,
  {
    loggedIn,
    viewerRole,
    status = "RECRUITING",
  }: { loggedIn: boolean; viewerRole: string; status?: string },
) {
  const requests = { participants: 0 };
  // 네이버 지도는 외부 키 인증이 필요해 막는다
  await page.route("https://oapi.map.naver.com/**", (route) => route.abort());
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
    route.fulfill(ok([])),
  );
  await page.route("**/api/v1/regions", (route) => route.fulfill(ok([])));
  await page.route("**/api/v1/schedules?**", (route) =>
    route.fulfill(
      ok({
        hasNext: false,
        schedules: [
          {
            scheduleId: SCHEDULE_ID,
            activityName: "보드게임",
            title: TITLE,
            startAt: "2026-12-24T19:30:00",
            regionName: "마포구",
            participantCount: 5,
            capacity: 6,
            status: "RECRUITING",
          },
        ],
      }),
    ),
  );
  await page.route(`**/api/v1/schedules/${SCHEDULE_ID}`, (route) =>
    route.fulfill(ok(makeDetail(viewerRole, status))),
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

test("확정 참여자는 명단을 펼쳐 개설자·탈퇴한 사용자를 본다", async ({
  page,
}) => {
  const requests = await mockApis(page, {
    loggedIn: true,
    viewerRole: "PARTICIPANT",
  });
  await page.goto(`/schedules/${SCHEDULE_ID}`);

  const toggle = page.getByRole("button", { name: "참여자 5" });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
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
  await mockApis(page, { loggedIn: false, viewerRole: "GUEST" });
  await page.goto("/schedules/01a1a2b3-0000-7000-8000-000000000999");

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
    status: "CLOSED",
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
    status: "CLOSED",
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

type ActionResult = { status: number; code?: string };

/**
 * 상태가 바뀌는 상세 응답. 요청이 성공하면 다음 상세 응답이 바뀐다. 요청 본문과 요청 수를 돌려준다
 * mockApis 뒤에 등록해 상세 응답을 덮어쓴다 (나중에 등록한 route가 먼저 처리된다)
 */
async function mockActions(
  page: Page,
  {
    viewerRole,
    result = { status: 200 },
    participantCount = 5,
  }: { viewerRole: string; result?: ActionResult; participantCount?: number },
) {
  const state = { viewerRole, status: "RECRUITING", participantCount };
  const calls = {
    detail: 0,
    join: 0,
    participants: 0,
    bodies: [] as unknown[],
  };
  await mockApis(page, { loggedIn: true, viewerRole });
  await page.route(`**/api/v1/schedules/${SCHEDULE_ID}`, (route) => {
    calls.detail += 1;
    return route.fulfill(
      ok({
        ...makeDetail(state.viewerRole, state.status),
        participantCount: state.participantCount,
      }),
    );
  });
  const respond = async (route: Route, apply: () => void) => {
    calls.bodies.push(route.request().postDataJSON());
    // 요청 중 버튼 막기를 확인할 수 있게 조금 늦게 답한다
    await new Promise((resolve) => setTimeout(resolve, 300));
    if (result.status !== 200) {
      // 서버가 거부한 뒤의 최신 상태: 마감
      if (result.code === "RECRUIT_CLOSED") {
        state.status = "CLOSED";
        state.participantCount = 6;
      }
      return route.fulfill(fail(result.status, result.code ?? ""));
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
        state.participantCount += 1;
      });
    },
  );
  await page.route(
    `**/api/v1/schedules/${SCHEDULE_ID}/participants/me`,
    (route) =>
      respond(route, () => {
        state.viewerRole = "NON_PARTICIPANT";
        state.participantCount -= 1;
      }),
  );
  await page.route(`**/api/v1/schedules/${SCHEDULE_ID}/cancel`, (route) =>
    respond(route, () => {
      state.status = "CANCELED";
      state.participantCount = 1;
    }),
  );
  return calls;
}

test("미참여자가 참여하기를 누르면 바로 확정되고 참여 확정으로 다시 그린다", async ({
  page,
}) => {
  await mockActions(page, { viewerRole: "NON_PARTICIPANT" });
  await page.goto(`/schedules/${SCHEDULE_ID}`);

  await page.getByRole("button", { name: "참여하기" }).click();
  await expect(bottomBar(page)).toContainText("참여 확정");
  await expect(page.getByRole("button", { name: "참여 취소" })).toBeVisible();
  await expect(page.getByText("6 / 6명").first()).toBeVisible();
});

test("이미 마감됐으면 토스트를 보여주고 최신 상태(모집 마감)로 다시 그린다", async ({
  page,
}) => {
  const calls = await mockActions(page, {
    viewerRole: "NON_PARTICIPANT",
    result: { status: 409, code: "RECRUIT_CLOSED" },
  });
  await page.goto(`/schedules/${SCHEDULE_ID}`);
  await expect(page.getByRole("button", { name: "참여하기" })).toBeVisible();
  const before = calls.detail;

  await page.getByRole("button", { name: "참여하기" }).click();
  await expect(page.getByText("모집이 마감된 일정이에요.")).toBeVisible();
  await expect(page.getByRole("button", { name: "모집 마감" })).toBeDisabled();
  expect(calls.detail).toBeGreaterThan(before);
});

test("시간이 겹치는 일정이 있으면 개설 화면과 같은 문구로 안내한다", async ({
  page,
}) => {
  await mockActions(page, {
    viewerRole: "NON_PARTICIPANT",
    result: { status: 409, code: "SCHEDULE_TIME_CONFLICT" },
  });
  await page.goto(`/schedules/${SCHEDULE_ID}`);

  await page.getByRole("button", { name: "참여하기" }).click();
  await expect(
    page.getByText("같은 시간대에 참여하거나 개설한 일정이 있어요."),
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

test("일정 전체 취소: 사유가 비면 막고, 미리보기에서 수정 뒤 확인하면 일정 취소됨이 된다", async ({
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
  await expect(reasonSheet).toContainText("5/200");
  await next.click();

  const preview = page.getByRole("dialog", {
    name: "참여자에게 이렇게 전달돼요",
  });
  await expect(preview).toContainText("확정 참여자 4명 전원에게");
  await expect(preview).toContainText("보드게임카페 A 일정이 취소되었어요");
  await expect(preview).toContainText("개인 사정");
  await preview.getByRole("button", { name: "수정" }).click();
  await expect(reason).toHaveValue("개인 사정");
  await reason.fill("  개인 사정이 생겼어요  ");
  await reasonSheet.getByRole("button", { name: "확인" }).click();
  await preview.getByRole("button", { name: "확인" }).click();

  const done = page.getByRole("dialog", {
    name: "일정이 정상 취소되었습니다.",
  });
  await expect(done).toContainText("참여자 4명에게 취소 사유를 전달했어요.");
  // 앞뒤 공백을 빼고 보낸다
  expect(calls.bodies).toEqual([{ reason: "개인 사정이 생겼어요" }]);
  await done.getByRole("button", { name: "확인" }).click();
  await expect(
    page.getByRole("button", { name: "일정 취소됨" }),
  ).toBeDisabled();
});

test("확정 참여자가 없으면 일정 전체 취소에서 참여자·알림 문구를 뺀다", async ({
  page,
}) => {
  // 확정 인원 1명 = 개설자만
  await mockActions(page, { viewerRole: "HOST", participantCount: 1 });
  await page.goto(`/schedules/${SCHEDULE_ID}`);

  await page.getByRole("button", { name: "일정 전체 취소" }).click();
  const confirm = page.getByRole("dialog", { name: "일정을 전체 취소할까요?" });
  await expect(confirm).toContainText("취소한 일정은 되돌릴 수 없어요.");
  await expect(confirm).not.toContainText("확정 참여자");
  await confirm.getByRole("button", { name: "확인" }).click();

  const reasonSheet = page.getByRole("dialog", {
    name: "취소 사유를 알려주세요",
  });
  await expect(reasonSheet).not.toContainText("확정 참여자에게 전달돼요");
  await reasonSheet
    .getByRole("textbox", { name: "취소 사유" })
    .fill("개인 사정");
  await reasonSheet.getByRole("button", { name: "확인" }).click();

  const preview = page.getByRole("dialog", {
    name: "참여자에게 이렇게 전달돼요",
  });
  await expect(preview).toContainText("개인 사정");
  await expect(preview).not.toContainText("전원에게");
  await preview.getByRole("button", { name: "확인" }).click();

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

test("참여 취소가 거부(409)되면 토스트로 알리고 참여 상태를 유지한다", async ({
  page,
}) => {
  await mockActions(page, {
    viewerRole: "PARTICIPANT",
    result: { status: 409, code: "TODO_API_UNDEFINED" },
  });
  await page.goto(`/schedules/${SCHEDULE_ID}`);

  await page.getByRole("button", { name: "참여 취소" }).click();
  await page
    .getByRole("dialog", { name: "참여를 취소할까요?" })
    .getByRole("button", { name: "확인" })
    .click();
  await expect(
    page.getByText("이미 시작된 일정은 참여를 취소할 수 없어요."),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(bottomBar(page)).toContainText("참여 확정");
});

test("일정 전체 취소가 실패하면 미리보기와 입력한 사유를 그대로 둔다", async ({
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
  const preview = page.getByRole("dialog", {
    name: "참여자에게 이렇게 전달돼요",
  });
  await preview.getByRole("button", { name: "확인" }).click();

  await expect(
    page.getByText("요청을 처리하지 못했어요. 다시 시도해주세요."),
  ).toBeVisible();
  await expect(preview).toBeVisible();
  await preview.getByRole("button", { name: "수정" }).click();
  await expect(page.getByRole("textbox", { name: "취소 사유" })).toHaveValue(
    "개인 사정",
  );
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
        : ok(makeDetail("GUEST", "RECRUITING")),
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
  ["CLOSED", "모집 마감"],
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
