import { expect, test, type Page } from "@playwright/test";

// 일정 개설 CRT-01~07: 로그인한 사용자가 1~6단계를 마치고 개설 완료 팝업을 본다
// 로그인·활동·지역·장소 후보·일정 생성 API는 모두 가짜 응답이다

const PLACE = {
  id: "01a178b9-b980-7000-8000-000000000001",
  name: "보드게임카페 더조커 홍대점",
  roadAddress: "서울특별시 마포구 잔다리로2길 19",
  addressDetail: "2층",
  latitude: 37.5517301,
  longitude: 126.920971,
  regionCode: "11440",
};

const ok = (data: unknown) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify({ isSuccess: true, data }),
});

/** 로그인한 상태와 개설에 필요한 API를 가짜 응답으로 채운다. 일정 생성 요청 본문을 돌려준다 */
async function mockApis(page: Page) {
  const createRequests: unknown[] = [];

  // 네이버 지도는 외부 키 인증이 필요해 막는다. 지도 자리에 안내 문구가 나오고 목록으로 고를 수 있다
  await page.route("https://oapi.map.naver.com/**", (route) => route.abort());

  // 나머지 백엔드 API는 404 (아래에서 등록한 경로가 먼저 처리된다)
  await page.route("**/api/v1/**", (route) =>
    route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({
        isSuccess: false,
        code: "NOT_FOUND",
        message: "e2e mock 없음",
      }),
    }),
  );
  // 재발급 성공 = 로그인 상태
  await page.route("**/api/v1/auth/tokens", (route) =>
    route.fulfill(ok({ accessToken: "e2e-access-token" })),
  );
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
        {
          id: "01a19cc6-3d80-7000-8000-000000000003",
          code: "WALK",
          name: "산책",
        },
      ]),
    ),
  );
  await page.route("**/api/v1/regions", (route) =>
    route.fulfill(
      ok([
        { code: "11440", name: "마포구" },
        { code: "11410", name: "서대문구" },
        { code: "11200", name: "성동구" },
      ]),
    ),
  );
  await page.route("**/api/v1/place-candidates?**", (route) =>
    route.fulfill(
      ok([
        PLACE,
        {
          id: "01a178b9-b980-7000-8000-000000000002",
          name: "홈즈앤루팡 보드게임카페 홍대점",
          roadAddress: "서울특별시 마포구 홍익로3길 8",
          addressDetail: "5층",
          latitude: 37.554176,
          longitude: 126.9221472,
          regionCode: "11440",
        },
      ]),
    ),
  );
  // 목록 조회(GET, 임시 계약)는 만든 일정을 돌려주고, 생성(POST)은 요청을 기록한다
  await page.route("**/api/v1/schedules", (route) => {
    if (route.request().method() === "GET") {
      return route.fulfill(
        ok(
          createRequests.length === 0
            ? []
            : [
                {
                  scheduleId: 1,
                  activityName: "보드게임",
                  title: "초보 환영 보드게임",
                  startAt: "2026-12-24T19:30:00",
                  place: { name: PLACE.name, regionName: "마포구" },
                  participantCount: 1,
                  capacity: 4,
                  status: "RECRUITING",
                },
              ],
        ),
      );
    }
    createRequests.push(route.request().postDataJSON());
    return route.fulfill({
      ...ok({ scheduleId: "01a1a2b3-4c5d-7e6f-8a9b-0c1d2e3f4a5b" }),
      status: 201,
    });
  });

  return createRequests;
}

test("로그인한 사용자가 일정을 열면 개설 완료 팝업이 뜬다", async ({
  page,
}) => {
  const createRequests = await mockApis(page);

  // 1단계 활동
  await page.goto("/create?step=1");
  await page.getByText("보드게임", { exact: true }).click();
  await page.getByRole("button", { name: "다음" }).click();

  // 2단계 장소 (목록 시트에서 고른다)
  await expect(page).toHaveURL(/step=2/);
  await page.getByRole("button", { name: new RegExp(PLACE.name) }).click();
  await page.getByRole("button", { name: "다음" }).click();

  // 3단계 내용
  await expect(page).toHaveURL(/step=3/);
  await page.getByLabel("콘텐츠 활동명").fill("초보 환영 보드게임");
  await page.getByText("보통", { exact: true }).click();
  await page
    .getByLabel("간략 설명글")
    .fill("처음 오셔도 룰 설명해 드려요. 가볍게 즐겨요!");
  await page.getByRole("button", { name: "다음" }).click();

  // 4단계 날짜·시각 (기본값: 오늘, 가장 이른 시각)
  await expect(page).toHaveURL(/step=4/);
  await page.getByRole("button", { name: "다음" }).click();

  // 5단계 인원 (기본 4명)
  await expect(page).toHaveURL(/step=5/);
  await page.getByRole("button", { name: "다음" }).click();

  // 6단계 최종 확인. [초기화] → 확인 팝업에서 [취소]하면 입력값이 그대로다
  await expect(page).toHaveURL(/step=6/);
  await page.getByRole("button", { name: "초기화" }).click();
  const restartDialog = page.getByRole("dialog", {
    name: "입력한 내용을 초기화할까요?",
  });
  await restartDialog.getByRole("button", { name: "취소" }).click();
  await expect(restartDialog).toBeHidden();
  await expect(page).toHaveURL(/step=6/);
  await expect(page.getByText("초보 환영 보드게임")).toBeVisible();

  // → 일정 열기
  await page.getByRole("button", { name: "일정 열기" }).click();

  // CRT-07 개설 완료 팝업
  const dialog = page.getByRole("dialog", { name: "일정이 열렸어요" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(`${PLACE.name} 일정이 모집을 시작했어요.`);
  await expect(dialog).toContainText(
    "개설한 일정에서 모집 현황을 확인할 수 있어요.",
  );

  // 보낸 일정 생성 요청
  expect(createRequests).toHaveLength(1);
  expect(createRequests[0]).toMatchObject({
    categoryId: "01a19cc6-3d80-7000-8000-000000000001",
    placeId: PLACE.id,
    title: "초보 환영 보드게임",
    durationType: "NORMAL",
    capacity: 4,
  });

  // 팝업만 기준 이미지와 비교한다. 뒤의 홈 목록은 날짜에 따라 바뀌어 비교하지 않는다
  // 둥근 모서리 뒤로 비치는 목록 화면에 따라 가장자리 몇 픽셀이 달라질 수 있어 그만큼은 허용한다
  await expect(dialog).toHaveScreenshot("schedule-created-dialog.png", {
    maxDiffPixels: 50,
  });
  // 화면 전체는 결과 보고서에 첨부만 한다
  await test.info().attach("개설 완료 화면", {
    body: await page.screenshot(),
    contentType: "image/png",
  });

  // 만든 일정이 홈 목록 맨 위에 보인다 (개설 후 목록을 다시 불러온다)
  await expect(page.locator("main li").first()).toContainText(
    "초보 환영 보드게임",
  );

  // 확인을 누르면 팝업이 닫히고 홈에 머문다
  await dialog.getByRole("button", { name: "확인" }).click();
  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(/\/$/);

  // 새로고침해도 팝업이 다시 뜨지 않는다
  await page.reload();
  await expect(page.getByRole("button", { name: "일정 개설" })).toBeVisible();
  await expect(dialog).toBeHidden();
});

test("일정을 열지 않고 홈에 오면 개설 완료 팝업이 뜨지 않는다", async ({
  page,
}) => {
  await mockApis(page);
  // 예전 방식의 주소로 들어와도 뜨지 않는다
  await page.goto("/?created=보드게임카페");
  await expect(page.getByRole("button", { name: "일정 개설" })).toBeVisible();
  await expect(
    page.getByRole("dialog", { name: "일정이 열렸어요" }),
  ).toBeHidden();
});

test("초기화 확인 팝업에서 [초기화]를 누르면 입력값을 비우고 1단계로 간다", async ({
  page,
}) => {
  await mockApis(page);
  await page.goto("/create?step=1");
  const activity = page.getByRole("radio", { name: "보드게임" });
  await page.getByText("보드게임", { exact: true }).click();
  await page.getByRole("button", { name: "다음" }).click();
  await expect(page).toHaveURL(/step=2/);

  // 1~5단계 상단에도 같은 [초기화]와 확인 팝업이 있다 (사용자 결정 2026-11-07)
  await page.getByRole("button", { name: "초기화" }).click();
  const restartDialog = page.getByRole("dialog", {
    name: "입력한 내용을 초기화할까요?",
  });
  await expect(restartDialog).toContainText(
    "장소·일시·인원이 모두 지워지고 첫 단계로 돌아가요.",
  );
  await restartDialog.getByRole("button", { name: "초기화" }).click();

  await expect(page).toHaveURL(/step=1$/);
  await expect(activity).not.toBeChecked();
  await expect(page.getByRole("button", { name: "다음" })).toBeDisabled();
});

/** 1~5단계를 모두 고른 입력값을 기기에 넣고 그 단계(기본 6단계 최종 확인)를 연다. 시작은 기본 내일 19:30(한국 시간) */
/** 오늘 + days일의 한국 날짜 `YYYY-MM-DD` */
const kstDate = (days: number) =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(
    Date.now() + days * 24 * 60 * 60 * 1000,
  );

async function openConfirmStep(
  page: Page,
  { step = 6, date = kstDate(1) }: { step?: number; date?: string } = {},
) {
  await page.addInitScript(
    (draft) => {
      if (!sessionStorage.getItem("scheduleCreateDraft")) {
        sessionStorage.setItem("scheduleCreateDraft", JSON.stringify(draft));
      }
    },
    {
      activityId: "01a19cc6-3d80-7000-8000-000000000001",
      place: PLACE,
      title: "초보 환영 보드게임",
      duration: "NORMAL",
      description: "처음 오시는 분도 환영해요.",
      date,
      startTime: "19:30",
      capacity: 4,
    },
  );
  await page.goto(`/create?step=${step}`);
  if (step === 6) {
    await expect(page.getByText("초보 환영 보드게임")).toBeVisible();
  }
}

/** 일정 생성(POST)만 실패 응답으로 바꾼다 */
async function failCreate(page: Page, status: number, body: object) {
  await page.route("**/api/v1/schedules", (route) =>
    route.request().method() === "POST"
      ? route.fulfill({
          status,
          contentType: "application/json",
          body: JSON.stringify({ isSuccess: false, ...body }),
        })
      : route.fallback(),
  );
}

test("장소 목록은 상세주소를 붙여 보여주고, [전체]는 지역 없이 부른다", async ({
  page,
}) => {
  await mockApis(page);
  const placeRequests: URL[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/v1/place-candidates")) {
      placeRequests.push(new URL(request.url()));
    }
  });

  await page.goto("/create?step=1");
  await page.getByText("보드게임", { exact: true }).click();
  await page.getByRole("button", { name: "다음" }).click();

  await expect(
    page.getByRole("button", { name: /잔다리로2길 19 2층/ }),
  ).toBeVisible();
  expect(placeRequests.at(-1)?.searchParams.get("categoryId")).toBe(
    "01a19cc6-3d80-7000-8000-000000000001",
  );
  expect(placeRequests.at(-1)?.searchParams.get("regionCode")).toBe("11440");

  await page.getByRole("button", { name: "전체" }).click();
  await expect
    .poll(() => placeRequests.at(-1)?.searchParams.has("regionCode"))
    .toBe(false);
});

test("고를 수 없는 장소(INVALID_PLACE)면 장소 단계로 돌아가 다시 고르게 한다", async ({
  page,
}) => {
  await mockApis(page);
  await failCreate(page, 400, {
    code: "INVALID_PLACE",
    message: "선택할 수 없는 장소예요. 장소를 다시 골라주세요.",
  });
  await openConfirmStep(page);

  await page.getByRole("button", { name: "일정 열기" }).click();

  await expect(page).toHaveURL(/step=2/);
  await expect(
    page.getByText("선택할 수 없는 장소예요. 장소를 다시 골라주세요."),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "다음" })).toBeDisabled();
});

test("칸별 오류(errors)는 그 칸이 있는 단계로 가서 칸 아래에 보여준다", async ({
  page,
}) => {
  await mockApis(page);
  await failCreate(page, 400, {
    code: "INVALID_REQUEST",
    message: "요청 형식이 올바르지 않습니다.",
    errors: [{ field: "title", message: "활동명은 1~20자로 입력해주세요." }],
  });
  await openConfirmStep(page);

  await page.getByRole("button", { name: "일정 열기" }).click();

  await expect(page).toHaveURL(/step=3/);
  await expect(page.getByText("활동명은 1~20자로 입력해주세요.")).toBeVisible();
});

test("장소 후보가 고를 수 없는 활동(INVALID_CATEGORY)이면 1단계로 돌아가 다시 고르게 한다", async ({
  page,
}) => {
  await mockApis(page);
  await page.route("**/api/v1/place-candidates?**", (route) =>
    route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({
        isSuccess: false,
        code: "INVALID_CATEGORY",
        message: "선택할 수 없는 활동이에요. 활동을 다시 골라주세요.",
      }),
    }),
  );

  await page.goto("/create?step=1");
  await page.getByText("보드게임", { exact: true }).click();
  await page.getByRole("button", { name: "다음" }).click();

  await expect(page).toHaveURL(/step=1$/);
  await expect(
    page.getByText("선택할 수 없는 활동이에요. 활동을 다시 골라주세요."),
  ).toBeVisible();
  await expect(page.getByRole("radio", { name: "보드게임" })).not.toBeChecked();
});

test("시작 날짜는 오늘 + 30일까지다. 보관한 날짜가 더 늦으면 그날로 맞춘다", async ({
  page,
}) => {
  await mockApis(page);
  await openConfirmStep(page, { step: 4, date: kstDate(40) });

  const [, month, day] = kstDate(30).split("-");
  await expect(
    page.getByRole("button", { name: new RegExp(`날짜 ${month}\\.${day}`) }),
  ).toBeVisible();
});

test("활동명은 이모지도 한 글자로 세어 20자까지 쓸 수 있다", async ({
  page,
}) => {
  await mockApis(page);
  await openConfirmStep(page, { step: 3 });

  const title = page.getByLabel("콘텐츠 활동명");
  await title.fill("🎲".repeat(21));
  await expect(title).toHaveValue("🎲".repeat(20));
  await expect(page.getByText("20/20")).toBeVisible();
  await page.getByRole("button", { name: "다음" }).click();
  await expect(page).toHaveURL(/step=4/);
});
