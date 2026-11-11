import { expect, test, type Page } from "@playwright/test";

// 홈 화면 추가 안내 ONB-01·01-1 (USER_FLOW §9.1, SHI-160 결정 Q1~Q5)
// 대상 판별은 user-agent로 하므로 기기별로 user-agent를 바꿔 돌린다. 기록은 localStorage `homeScreenGuide.v1`

const UA = {
  iphone:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  android:
    "Mozilla/5.0 (Linux; Android 14; SM-S918N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
  // 앱 안 브라우저(결정 Q2의 5개)
  kakaoInApp:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 KAKAOTALK 10.8.0",
  instagramInApp:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 300.0.0.0.0 (iPhone14,2; iOS 17_5; ko_KR; ko; scale=3.00; 1170x2532)",
  facebookInApp:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/450.0.0.0;FBBV/1;FBDV/iPhone14,2;FBMD/iPhone;FBSN/iOS;FBSV/17.5;FBSS/3;FBLC/ko_KR]",
  threadsInApp:
    "Mozilla/5.0 (Linux; Android 14; SM-S918N Build/UP1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.0.0 Mobile Safari/537.36 Barcelona 300.0.0.0",
  naverInApp:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 NAVER(inapp; search; 2000; 12.6.1; 14PRO)",
  // iPadOS Safari는 데스크톱처럼 Macintosh로 표시된다
  ipad: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
  pc: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
};

const RECORD_KEY = "homeScreenGuide.v1";
const DAY_MS = 24 * 60 * 60 * 1000;
const RETURN_PATH = "/?tab=joined";

const ok = (data: unknown) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify({ isSuccess: true, data }),
});

async function mockApis(page: Page) {
  await page.route("**/api/v1/**", (route) =>
    route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({ isSuccess: false, code: "NOT_FOUND" }),
    }),
  );
  await page.route("**/api/v1/auth/tokens", (route) =>
    route.fulfill(ok({ accessToken: "e2e-access-token" })),
  );
  await page.route("**/api/v1/auth/signup/session", (route) =>
    route.fulfill(ok({ nickname: "딸기스무디", profileImageUrl: null })),
  );
  await page.route("**/api/v1/auth/signup", (route) =>
    route.fulfill(ok({ accessToken: "e2e-access-token" })),
  );
  await page.route("**/api/v1/schedules?**", (route) =>
    route.fulfill(ok({ items: [], nextCursor: null })),
  );
  for (const path of ["participating", "hosted"]) {
    await page.route(`**/api/v1/schedules/${path}?**`, (route) =>
      route.fulfill(ok({ items: [], nextCursor: null })),
    );
  }
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
}

const guideHeading = (page: Page) =>
  page.getByRole("heading", { name: /홈 화면에 추가하고/ });

const readRecord = (page: Page) =>
  page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? "null"),
    RECORD_KEY,
  );

/** 가입 화면에서 로그인 전 보던 화면(RETURN_PATH)을 남기고 가입을 마친다 */
async function signUp(page: Page) {
  await page.goto("/signup");
  await page.evaluate(
    (path) => sessionStorage.setItem("loginRedirect", path),
    RETURN_PATH,
  );
  await page.getByLabel("이름").fill("김민준");
  await page.getByText("남성", { exact: true }).click();
  await page.getByLabel("생년월일").fill("19980314");
  await page.getByRole("button", { name: "시작하기" }).click();
}

/** 다른 화면에서 기록을 넣은 뒤 홈으로 들어간다 */
async function openHomeWithRecord(page: Page, record: unknown) {
  await page.goto("/login");
  await page.evaluate(([key, value]) => localStorage.setItem(key, value), [
    RECORD_KEY,
    JSON.stringify(record),
  ] as const);
  await page.goto("/");
}

test.describe("아이폰 Safari", () => {
  test.use({ userAgent: UA.iphone });

  test("가입 직후 ONB-01을 보여주고, 나중에 할게요 → 복귀 경로로 가며 누른 시각을 남긴다", async ({
    page,
  }) => {
    await mockApis(page);
    await signUp(page);

    await expect(page).toHaveURL(/\/home-screen-guide\?from=signup$/);
    await expect(guideHeading(page)).toBeVisible();
    await expect(page.getByText("‘더 보기’")).toBeVisible();

    const before = Date.now();
    await page.getByRole("button", { name: "나중에 할게요" }).click();
    await expect(page).toHaveURL(/\/\?tab=joined$/);
    const record = await readRecord(page);
    expect(record.status).toBe("later");
    expect(record.at).toBeGreaterThanOrEqual(before);
    // 방금 나중에를 눌렀으므로 홈에서 다시 띄우지 않는다
    await expect(guideHeading(page)).toHaveCount(0);
  });

  test("나중에 누르고 7일이 지나면 홈에서 한 번 더 보여주고, 두 번째 나중에 뒤로는 다시 띄우지 않는다", async ({
    page,
  }) => {
    await mockApis(page);
    await openHomeWithRecord(page, {
      status: "later",
      at: Date.now() - 8 * DAY_MS,
    });

    await expect(page).toHaveURL(/\/home-screen-guide\?from=home$/);
    await page.getByRole("button", { name: "나중에 할게요" }).click();
    await expect(page).toHaveURL(/\/$/);
    expect(await readRecord(page)).toEqual({ status: "done" });

    await page.reload();
    await expect(page.getByRole("tab", { name: "모집 중" })).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
    await expect(guideHeading(page)).toHaveCount(0);
  });

  test("나중에 누른 지 7일이 안 됐거나 확인했어요를 눌렀으면 홈에서 띄우지 않는다", async ({
    page,
  }) => {
    await mockApis(page);
    await openHomeWithRecord(page, {
      status: "later",
      at: Date.now() - 6 * DAY_MS,
    });
    await expect(page.getByRole("tab", { name: "모집 중" })).toBeVisible();
    await expect(page).toHaveURL(/\/$/);

    await openHomeWithRecord(page, { status: "confirmed" });
    await expect(page.getByRole("tab", { name: "모집 중" })).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
  });

  test("개설 완료 팝업이 뜨는 홈 진입에서는 미루고 다음 홈 진입에 보여준다", async ({
    page,
  }) => {
    await mockApis(page);
    await page.goto("/login");
    await page.evaluate(
      ([key, value]) => {
        localStorage.setItem(key, value);
        sessionStorage.setItem(
          "scheduleCreatedNotice",
          JSON.stringify({
            scheduleId: "01a1a2b3-0000-7000-8000-000000000001",
            placeName: "보드게임카페 A",
          }),
        );
      },
      [
        RECORD_KEY,
        JSON.stringify({ status: "later", at: Date.now() - 8 * DAY_MS }),
      ] as const,
    );
    await page.goto("/?tab=created");
    // 개설 완료 팝업이 먼저 뜨고 안내는 띄우지 않는다
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page).toHaveURL(/\/\?tab=created$/);
    expect(await readRecord(page)).toMatchObject({ status: "later" });

    await page.goto("/");
    await expect(page).toHaveURL(/\/home-screen-guide\?from=home$/);
  });

  test("내 정보 메뉴로 연 안내는 내 정보로 돌아가고 기록을 바꾸지 않는다", async ({
    page,
  }) => {
    await mockApis(page);
    await page.goto("/my");
    await page.getByRole("button", { name: /홈 화면에 추가하는 방법/ }).click();

    await expect(page).toHaveURL(/\/home-screen-guide\?from=menu$/);
    await expect(guideHeading(page)).toBeVisible();
    await page.getByRole("button", { name: "확인했어요" }).click();
    await expect(page).toHaveURL(/\/my$/);
    expect(await readRecord(page)).toBeNull();
  });
});

test.describe("아이폰 Safari — 예외 경우", () => {
  test.use({ userAgent: UA.iphone });

  test("가입 직후 안내는 보여주는 순간 나중에와 같은 기록을 남긴다(버튼 없이 나가도 7일 뒤 다시)", async ({
    page,
  }) => {
    await mockApis(page);
    const before = Date.now();
    await signUp(page);
    await expect(page).toHaveURL(/\/home-screen-guide\?from=signup$/);
    // 보여주는 순간 `나중에`로 기록한다 (사용자 결정 2026-11-09)
    const record = await readRecord(page);
    expect(record).toMatchObject({ status: "later" });
    expect(record.at).toBeGreaterThanOrEqual(before);
  });

  test("기록이 이미 있는 기기에서 가입하면 안내 없이 복귀 경로로 간다", async ({
    page,
  }) => {
    await mockApis(page);
    await page.goto("/login");
    await page.evaluate(([key, value]) => localStorage.setItem(key, value), [
      RECORD_KEY,
      JSON.stringify({ status: "confirmed" }),
    ] as const);
    await signUp(page);
    await expect(page).toHaveURL(/\/\?tab=joined$/);
    expect(await readRecord(page)).toEqual({ status: "confirmed" });
  });

  test("7일 뒤 안내에서 버튼 없이 뒤로 가도 다시 띄우지 않는다", async ({
    page,
  }) => {
    await mockApis(page);
    await openHomeWithRecord(page, {
      status: "later",
      at: Date.now() - 8 * DAY_MS,
    });
    await expect(page).toHaveURL(/\/home-screen-guide\?from=home$/);

    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("tab", { name: "모집 중" })).toBeVisible();
    expect(await readRecord(page)).toEqual({ status: "done" });
    await expect(page).toHaveURL(/\/$/);
  });

  test("기록이 깨져 있으면 기록이 없는 것처럼 다루고 홈은 그대로 연다", async ({
    page,
  }) => {
    await mockApis(page);
    await page.goto("/login");
    await page.evaluate(
      (key) => localStorage.setItem(key, "{not json"),
      RECORD_KEY,
    );
    await page.goto("/");
    await expect(page.getByRole("tab", { name: "모집 중" })).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
  });

  test("버튼을 두 번 눌러도 한 번만 돌아간다", async ({ page }) => {
    await mockApis(page);
    await page.goto("/");
    await page
      .getByRole("navigation", { name: "주요 메뉴" })
      .getByRole("button", { name: "내 정보" })
      .click();
    await expect(page).toHaveURL(/\/my$/);
    await page.getByRole("button", { name: /홈 화면에 추가하는 방법/ }).click();
    await expect(guideHeading(page)).toBeVisible();

    await page.getByRole("button", { name: "확인했어요" }).dblclick();
    await expect(page).toHaveURL(/\/my$/);
    // 뒤로가기가 두 번 되면 홈으로 간다
    await expect(page.getByRole("heading", { name: "내 정보" })).toBeVisible();
    await expect(page).toHaveURL(/\/my$/);
  });

  test("주소를 직접 연 메뉴 안내는 버튼을 누르면 내 정보로 간다", async ({
    page,
  }) => {
    await mockApis(page);
    await page.goto("/home-screen-guide?from=menu");
    await page.getByRole("button", { name: "확인했어요" }).click();
    await expect(page).toHaveURL(/\/my$/);
  });
});

test.describe("안드로이드 Chrome", () => {
  test.use({ userAgent: UA.android });

  test("가입 직후 ONB-01-1을 보여주고, 확인했어요 → 복귀 경로로 가며 다시 띄우지 않는다", async ({
    page,
  }) => {
    await mockApis(page);
    await signUp(page);

    await expect(page).toHaveURL(/\/home-screen-guide\?from=signup$/);
    await expect(page.getByText(/주소창 오른쪽 ⋮/)).toBeVisible();
    await page.getByRole("button", { name: "확인했어요" }).click();

    await expect(page).toHaveURL(/\/\?tab=joined$/);
    expect(await readRecord(page)).toEqual({ status: "confirmed" });
  });
});

for (const [name, userAgent] of [
  ["카카오톡 앱 안 브라우저", UA.kakaoInApp],
  ["인스타그램 앱 안 브라우저", UA.instagramInApp],
  ["페이스북 앱 안 브라우저", UA.facebookInApp],
  ["스레드 앱 안 브라우저", UA.threadsInApp],
  ["네이버 앱 안 브라우저", UA.naverInApp],
  ["PC", UA.pc],
] as const) {
  test.describe(name, () => {
    test.use({ userAgent });

    test("가입 직후 안내 없이 복귀 경로로 가고, 7일이 지나도 홈에서 띄우지 않는다", async ({
      page,
    }) => {
      await mockApis(page);
      await signUp(page);
      await expect(page).toHaveURL(/\/\?tab=joined$/);
      await expect(guideHeading(page)).toHaveCount(0);
      expect(await readRecord(page)).toBeNull();

      await openHomeWithRecord(page, {
        status: "later",
        at: Date.now() - 8 * DAY_MS,
      });
      await expect(page.getByRole("tab", { name: "모집 중" })).toBeVisible();
      await expect(page).toHaveURL(/\/$/);
      // 대상이 아니므로 홈이 기록을 바꾸지 않는다
      expect(await readRecord(page)).toMatchObject({ status: "later" });
    });
  });
}

test.describe("아이패드 Safari", () => {
  test.use({ userAgent: UA.ipad });

  test("Macintosh로 표시돼도 터치를 지원하면 ONB-01을 보여준다", async ({
    page,
  }) => {
    await page.addInitScript(() =>
      Object.defineProperty(navigator, "maxTouchPoints", { get: () => 5 }),
    );
    await mockApis(page);
    await signUp(page);

    await expect(page).toHaveURL(/\/home-screen-guide\?from=signup$/);
    await expect(page.getByText("‘더 보기’")).toBeVisible();
  });
});

test.describe("PC Chrome", () => {
  test.use({ userAgent: UA.pc });

  test("내 정보에 홈 화면 추가 안내 메뉴가 없다 (F-23)", async ({ page }) => {
    await mockApis(page);
    await page.goto("/my");
    await expect(page.getByRole("button", { name: "로그아웃" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /홈 화면에 추가하는 방법/ }),
    ).toHaveCount(0);
  });
});
