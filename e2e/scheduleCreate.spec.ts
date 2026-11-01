import { expect, test, type Page } from "@playwright/test";

// 일정 개설 CRT-01~07: 로그인한 사용자가 1~6단계를 마치고 개설 완료 팝업을 본다
// 로그인·활동·지역·장소·일정 생성 API는 모두 가짜 응답이다 (백엔드 로그인이 아직 동작하지 않는다)

const PLACE = {
  name: "보드게임카페 더조커 홍대점",
  roadAddress: "서울특별시 마포구 잔다리로2길 19 2층",
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
  await page.route("**/api/v1/activities", (route) =>
    route.fulfill(
      ok([
        { activityId: 1, name: "보드게임", searchKeyword: "보드게임카페" },
        { activityId: 2, name: "방탈출", searchKeyword: "방탈출카페" },
        { activityId: 3, name: "산책", searchKeyword: "산책" },
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
  await page.route("**/api/places?**", (route) =>
    route.fulfill(
      ok([
        PLACE,
        {
          name: "홈즈앤루팡 보드게임카페 홍대점",
          roadAddress: "서울특별시 마포구 홍익로3길 8 5층",
          latitude: 37.554176,
          longitude: 126.9221472,
          regionCode: "11440",
        },
      ]),
    ),
  );
  await page.route("**/api/v1/schedules", (route) => {
    createRequests.push(route.request().postDataJSON());
    return route.fulfill(ok({ scheduleId: 1 }));
  });
  // 개설 완료 팝업 내용 (임시 계약)
  await page.route("**/api/v1/schedules/1/created", (route) =>
    route.fulfill(ok({ scheduleId: 1, place: { name: PLACE.name } })),
  );

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

  // 6단계 최종 확인 → 일정 열기
  await expect(page).toHaveURL(/step=6/);
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
    activityId: 1,
    place: PLACE,
    title: "초보 환영 보드게임",
    duration: "MEDIUM",
    capacity: 4,
  });

  // 팝업만 기준 이미지와 비교한다. 뒤의 홈 목록은 날짜에 따라 바뀌어 비교하지 않는다
  await expect(dialog).toHaveScreenshot("schedule-created-dialog.png");
  // 화면 전체는 결과 보고서에 첨부만 한다
  await test.info().attach("개설 완료 화면", {
    body: await page.screenshot(),
    contentType: "image/png",
  });

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
