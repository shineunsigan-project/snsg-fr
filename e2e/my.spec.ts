import { expect, test, type Page } from "@playwright/test";

// 내 정보 MY-01: GNB `내 정보` → 프로필, 비로그인 → 로그인 화면
// 내 정보 API는 api-guide(snsg-be develop) "내 정보"·"탈퇴"를 따른 가짜 응답이다

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
  // 사진을 올린 적이 없으면 서버 기본 이미지 경로가 온다
  profileImageUrl: "/images/default-profile.png",
  ageGroup: { decade: 20, phase: "LATE" },
  nicknameChangeableAt: null,
};

type MockOptions = {
  loggedIn: boolean;
  /** 탈퇴 가능 여부 응답. blocked면 withdrawable false, error면 500 */
  eligibility?: "ok" | "blocked" | "error";
  /** 탈퇴 가능 여부를 이만큼 늦게 응답한다 */
  eligibilityDelayMs?: number;
  /** 탈퇴 응답. blocked면 409 WITHDRAWAL_BLOCKED, notFound면 404 USER_NOT_FOUND(이미 탈퇴) */
  withdraw?: "ok" | "blocked" | "notFound" | "error";
  /** 프로필 조회를 처음 n번 500으로 실패시킨다 */
  profileFailures?: number;
  /** 프로필 조회가 404 USER_NOT_FOUND(사용자가 없거나 탈퇴)다 */
  userNotFound?: boolean;
};

async function mockApis(
  page: Page,
  {
    loggedIn,
    eligibility = "ok",
    eligibilityDelayMs = 0,
    withdraw = "ok",
    profileFailures = 0,
    userNotFound = false,
  }: MockOptions,
) {
  let failuresLeft = profileFailures;
  const profileRequests: string[] = [];
  const logoutRequests: string[] = [];
  /** DELETE 요청 경로를 보낸 순서대로 */
  const deleteRequests: string[] = [];
  const eligibilityRequests: string[] = [];
  await page.route("**/api/v1/**", (route) =>
    route.fulfill(fail(404, "NOT_FOUND")),
  );
  await page.route("**/api/v1/auth/tokens", (route) => {
    if (route.request().method() === "DELETE") {
      deleteRequests.push("/api/v1/auth/tokens");
      logoutRequests.push(route.request().headers()["authorization"] ?? "");
      // 돌려줄 값이 없으면 data가 빠진다 (api-guide 로그아웃)
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ isSuccess: true }),
      });
    }
    return route.fulfill(
      loggedIn
        ? ok({ accessToken: "e2e-access-token" })
        : fail(401, "INVALID_REFRESH_TOKEN"),
    );
  });
  await page.route("**/api/v1/schedules?**", (route) =>
    route.fulfill(ok({ items: [], nextCursor: null })),
  );
  await page.route(
    "**/api/v1/users/me/withdrawal-eligibility",
    async (route) => {
      eligibilityRequests.push(
        route.request().headers()["authorization"] ?? "",
      );
      if (eligibilityDelayMs) {
        await new Promise((resolve) => setTimeout(resolve, eligibilityDelayMs));
      }
      return route.fulfill(
        eligibility === "error"
          ? fail(500, "INTERNAL_ERROR")
          : eligibility === "blocked"
            ? ok({ withdrawable: false, availableAt: "2026-11-15T19:00:00" })
            : ok({ withdrawable: true, availableAt: null }),
      );
    },
  );
  await page.route("**/api/v1/users/me", (route) => {
    if (route.request().method() === "DELETE") {
      deleteRequests.push("/api/v1/users/me");
      const responses = {
        ok: {
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ isSuccess: true }),
        },
        blocked: fail(409, "WITHDRAWAL_BLOCKED"),
        notFound: fail(404, "USER_NOT_FOUND"),
        error: fail(500, "INTERNAL_ERROR"),
      };
      return route.fulfill(responses[withdraw]);
    }
    profileRequests.push(route.request().headers()["authorization"] ?? "");
    if (failuresLeft > 0) {
      failuresLeft -= 1;
      return route.fulfill(fail(500, "INTERNAL_SERVER_ERROR"));
    }
    if (userNotFound) return route.fulfill(fail(404, "USER_NOT_FOUND"));
    return route.fulfill(loggedIn ? ok(profile) : fail(401, "UNAUTHENTICATED"));
  });
  return {
    profileRequests,
    logoutRequests,
    deleteRequests,
    eligibilityRequests,
  };
}

test("GNB 내 정보를 누르면 내 프로필을 보여준다", async ({ page }) => {
  const { profileRequests } = await mockApis(page, { loggedIn: true });
  await page.goto("/");

  // 로그인 상태의 홈 헤더에는 로그인·로그아웃 버튼이 없다 (USER_FLOW §4.2)
  const nav = page.getByRole("navigation", { name: "주요 메뉴" });
  await expect(nav.getByRole("button", { name: "내 정보" })).toBeVisible();
  await expect(page.getByRole("button", { name: "로그아웃" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "로그인" })).toHaveCount(0);

  await nav.getByRole("button", { name: "내 정보" }).click();
  await expect(page).toHaveURL(/\/my$/);
  await expect(page.getByRole("heading", { name: "내 정보" })).toBeVisible();
  await expect(page.getByText("딸기스무디")).toBeVisible();
  await expect(page.getByText("이름 김민준")).toBeVisible();
  await expect(page.getByText("strawberry@example.com")).toBeVisible();
  expect(profileRequests).toContain("Bearer e2e-access-token");
  await expect(nav.getByRole("button", { name: "내 정보" })).toHaveAttribute(
    "aria-current",
    "page",
  );

  // GNB 일정 → 홈
  await nav.getByRole("button", { name: "일정", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("비로그인으로 내 정보에 들어오면 로그인 화면으로 가고 내 정보로 돌아오게 한다", async ({
  page,
}) => {
  const { profileRequests } = await mockApis(page, { loggedIn: false });
  await page.goto("/my");

  await expect(page).toHaveURL(/\/login$/);
  expect(
    await page.evaluate(() => sessionStorage.getItem("loginRedirect")),
  ).toBe("/my");
  expect(profileRequests).toHaveLength(0);
});

test("비로그인으로 프로필 수정에 들어오면 로그인 화면으로 가고 프로필 수정으로 돌아오게 한다", async ({
  page,
}) => {
  const { profileRequests } = await mockApis(page, { loggedIn: false });
  await page.goto("/my/edit");

  await expect(page).toHaveURL(/\/login$/);
  expect(
    await page.evaluate(() => sessionStorage.getItem("loginRedirect")),
  ).toBe("/my/edit");
  expect(profileRequests).toHaveLength(0);
});

test("로그아웃 팝업에서 [닫기]는 그대로, [로그아웃]은 홈으로 가고 헤더에 로그인을 보여준다", async ({
  page,
}) => {
  const { logoutRequests } = await mockApis(page, { loggedIn: true });
  await page.goto("/my");
  await expect(page.getByText("딸기스무디")).toBeVisible();

  await page.getByRole("button", { name: "로그아웃" }).click();
  const dialog = page.getByRole("dialog", { name: "로그아웃할까요?" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "닫기" }).click();
  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(/\/my$/);
  expect(logoutRequests).toHaveLength(0);

  await page.getByRole("button", { name: "로그아웃" }).click();
  await dialog.getByRole("button", { name: "로그아웃" }).click();
  // 로그인 화면이 아니라 홈(모집 중)으로 간다 (USER_FLOW §4.4)
  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole("banner").getByRole("button", { name: "로그인" }),
  ).toBeVisible();
  expect(logoutRequests).toEqual(["Bearer e2e-access-token"]);
});

const withdrawConfirm = (page: Page) =>
  page.getByRole("dialog", { name: "정말 탈퇴하실 건가요?" });
const withdrawBlocked = (page: Page) =>
  page.getByRole("dialog", { name: "진행중인 일정이 있습니다." });
const withdrawDone = (page: Page) =>
  page.getByRole("dialog", { name: "회원 탈퇴가 정상 처리되었습니다." });

test("탈퇴 확인 팝업에서 [닫기]를 누르면 탈퇴 요청을 보내지 않는다", async ({
  page,
}) => {
  const { deleteRequests, eligibilityRequests } = await mockApis(page, {
    loggedIn: true,
  });
  await page.goto("/my");
  await page.getByRole("button", { name: "회원 탈퇴" }).click();
  await withdrawConfirm(page).getByRole("button", { name: "닫기" }).click();
  await expect(withdrawConfirm(page)).toBeHidden();
  await expect(page).toHaveURL(/\/my$/);
  expect(eligibilityRequests).toEqual(["Bearer e2e-access-token"]);
  expect(deleteRequests).toHaveLength(0);
});

test("탈퇴 가능 여부를 받는 동안 [회원 탈퇴]·[로그아웃]을 막아 연달아 눌러도 한 번만 묻는다", async ({
  page,
}) => {
  const { eligibilityRequests } = await mockApis(page, {
    loggedIn: true,
    eligibilityDelayMs: 1500,
  });
  await page.goto("/my");
  const withdrawButton = page.getByRole("button", { name: "회원 탈퇴" });
  await withdrawButton.click();
  await expect(withdrawButton).toBeDisabled();
  await expect(page.getByRole("button", { name: "로그아웃" })).toBeDisabled();
  // 막힌 버튼은 눌러도 click이 일어나지 않는다
  await withdrawButton.click({ force: true });

  await expect(withdrawConfirm(page)).toBeVisible();
  expect(eligibilityRequests).toHaveLength(1);
});

test("탈퇴할 수 있으면 가능 여부 → 재확인 → 탈퇴만 보내고(로그아웃 없음) 완료 팝업 뒤 로그인 화면으로 간다", async ({
  page,
}) => {
  const { deleteRequests, eligibilityRequests } = await mockApis(page, {
    loggedIn: true,
  });
  await page.goto("/my");
  await page.getByRole("button", { name: "회원 탈퇴" }).click();
  await expect(withdrawConfirm(page)).toBeVisible();
  expect(eligibilityRequests).toHaveLength(1);
  await withdrawConfirm(page).getByRole("button", { name: "탈퇴하기" }).click();

  await expect(withdrawDone(page)).toBeVisible();
  // 완료 팝업이 먼저 보이고, 그 전에 로그인 화면으로 가지 않는다. 팝업 뒤에는 내 정보가 그대로 있다
  await expect(page).toHaveURL(/\/my$/);
  await expect(page.getByText("딸기스무디")).toBeVisible();
  // GNB도 누르기 직전(로그인 상태) 그대로다. 팝업이 열려 있어 뒤 화면은 접근성 트리에서 숨겨진다
  await expect(
    page
      .getByRole("navigation", { name: "주요 메뉴", includeHidden: true })
      .getByRole("button", { name: "내 정보", includeHidden: true }),
  ).toBeAttached();
  // 탈퇴 응답이 쿠키를 만료시키므로 로그아웃을 부르지 않는다 (api-guide 탈퇴)
  expect(deleteRequests).toEqual(["/api/v1/users/me"]);

  await withdrawDone(page).getByRole("button", { name: "확인" }).click();
  await expect(page).toHaveURL(/\/login$/);
  // 돌아올 화면이 없다
  expect(
    await page.evaluate(() => sessionStorage.getItem("loginRedirect")),
  ).toBeNull();
});

test("탈퇴를 막는 일정이 있으면(가능 여부 false) 재확인 없이 바로 불가 팝업을 보여준다", async ({
  page,
}) => {
  const { deleteRequests } = await mockApis(page, {
    loggedIn: true,
    eligibility: "blocked",
  });
  await page.goto("/my");
  await page.getByRole("button", { name: "회원 탈퇴" }).click();

  await expect(withdrawBlocked(page)).toBeVisible();
  // 시안 문구만 보여주고 탈퇴 가능 시각은 쓰지 않는다 (SHI-165 결정 2)
  await expect(
    withdrawBlocked(page).getByText(
      /모든 일정을 취소하거나, 마지막 일정 시작 시각으로부터\s*24시간이 지나야 탈퇴할 수 있어요\./,
    ),
  ).toBeVisible();
  await expect(withdrawBlocked(page).getByText(/11월|19:00/)).toHaveCount(0);
  await expect(withdrawConfirm(page)).toHaveCount(0);
  await withdrawBlocked(page).getByRole("button", { name: "확인" }).click();
  await expect(withdrawBlocked(page)).toBeHidden();
  await expect(page).toHaveURL(/\/my$/);
  expect(deleteRequests).toEqual([]);
});

test("재확인 뒤 탈퇴가 409 WITHDRAWAL_BLOCKED면 재확인 팝업을 닫고 같은 불가 팝업을 보여준다", async ({
  page,
}) => {
  const { deleteRequests } = await mockApis(page, {
    loggedIn: true,
    withdraw: "blocked",
  });
  await page.goto("/my");
  await page.getByRole("button", { name: "회원 탈퇴" }).click();
  await withdrawConfirm(page).getByRole("button", { name: "탈퇴하기" }).click();

  await expect(withdrawBlocked(page)).toBeVisible();
  await expect(withdrawConfirm(page)).toBeHidden();
  await withdrawBlocked(page).getByRole("button", { name: "확인" }).click();
  await expect(withdrawBlocked(page)).toBeHidden();
  await expect(page).toHaveURL(/\/my$/);
  await expect(page.getByText("딸기스무디")).toBeVisible();
  expect(deleteRequests).toEqual(["/api/v1/users/me"]);
});

test("탈퇴가 404 USER_NOT_FOUND면 이미 탈퇴한 것으로 보고 완료 팝업을 보여준다", async ({
  page,
}) => {
  await mockApis(page, { loggedIn: true, withdraw: "notFound" });
  await page.goto("/my");
  await page.getByRole("button", { name: "회원 탈퇴" }).click();
  await withdrawConfirm(page).getByRole("button", { name: "탈퇴하기" }).click();

  await expect(withdrawDone(page)).toBeVisible();
  await withdrawDone(page).getByRole("button", { name: "확인" }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test("탈퇴 가능 여부를 받지 못하면(500) 토스트로 알리고 팝업을 띄우지 않는다", async ({
  page,
}) => {
  const { deleteRequests } = await mockApis(page, {
    loggedIn: true,
    eligibility: "error",
  });
  await page.goto("/my");
  await page.getByRole("button", { name: "회원 탈퇴" }).click();

  await expect(
    page.getByText("탈퇴하지 못했어요. 다시 시도해주세요."),
  ).toBeVisible();
  await expect(withdrawConfirm(page)).toHaveCount(0);
  await expect(withdrawBlocked(page)).toHaveCount(0);
  await expect(page).toHaveURL(/\/my$/);
  expect(deleteRequests).toEqual([]);
});

test("탈퇴가 그 밖의 오류(500)로 실패하면 토스트로 알리고 내 정보에 남는다", async ({
  page,
}) => {
  const { deleteRequests } = await mockApis(page, {
    loggedIn: true,
    withdraw: "error",
  });
  await page.goto("/my");
  await page.getByRole("button", { name: "회원 탈퇴" }).click();
  await withdrawConfirm(page).getByRole("button", { name: "탈퇴하기" }).click();

  await expect(
    page.getByText("탈퇴하지 못했어요. 다시 시도해주세요."),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/my$/);
  await expect(page.getByText("딸기스무디")).toBeVisible();
  expect(deleteRequests).toEqual(["/api/v1/users/me"]);
});

test("내 프로필 조회가 404 USER_NOT_FOUND면 로그인 화면으로 가고 내 정보로 돌아오게 한다", async ({
  page,
}) => {
  await mockApis(page, { loggedIn: true, userNotFound: true });
  await page.goto("/my");

  await expect(page).toHaveURL(/\/login$/);
  expect(
    await page.evaluate(() => sessionStorage.getItem("loginRedirect")),
  ).toBe("/my");
});

test("내 정보를 불러오지 못하면 GNB는 두고 [다시 시도]로 다시 받는다", async ({
  page,
}) => {
  // 자동 재시도(기본 3번)까지 실패해야 오류 화면이 나온다
  const { profileRequests } = await mockApis(page, {
    loggedIn: true,
    profileFailures: 4,
  });
  await page.goto("/my");

  await expect(page.getByText("내 정보를 불러오지 못했어요.")).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByRole("heading", { name: "내 정보" })).toBeVisible();
  await expect(page.getByRole("navigation")).toBeVisible();
  const failedCount = profileRequests.length;

  await page.getByRole("button", { name: "다시 시도" }).click();
  await expect(page.getByText("딸기스무디")).toBeVisible();
  expect(profileRequests.length).toBe(failedCount + 1);
});

// 프로필 수정 MY-02: 바뀐 항목만 PATCH, 사진은 [수정 완료] 때 업로드 (SHI-158 결정 2026-11-07)
// 닉네임 칸을 벗어날 때 사용 가능 여부를 묻는다 (SHI-165 결정 4)

// 1×1 PNG. 미리보기를 그릴 수 있는 실제 이미지여야 한다
const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

type MockProfile = Omit<typeof profile, "nicknameChangeableAt"> & {
  nicknameChangeableAt: string | null;
};

/** 업로드 API가 돌려주는 경로 (api-guide 프로필 사진 업로드) */
const UPLOADED_PATH = "/images/profiles/0a1b2c3d-e2e.png";

type NicknameResult = "available" | "DUPLICATED" | "INVALID_FORMAT" | "error";

type EditMockOptions = {
  initialProfile?: MockProfile;
  /** 첫 PATCH 응답을 바꾼다. 그 뒤와 없을 때는 받은 항목을 반영해 200 */
  patchFailure?: { status: number; body: unknown };
  /** PATCH가 실패한 뒤 조회가 돌려줄 프로필 */
  profileAfterFailure?: MockProfile;
  /** 사진 업로드 거부: 400 INVALID_PROFILE_IMAGE(형식) 또는 413 INVALID_REQUEST(5MB 초과) */
  rejectUpload?: "format" | "tooLarge";
  /** 닉네임 사용 가능 여부 결과(닉네임별). 없으면 사용 가능. delayMs만큼 늦게 응답한다 */
  nicknameResults?: Record<
    string,
    { result: NicknameResult; delayMs?: number }
  >;
};

/** 사용 가능 여부 응답 */
const nicknameResponse = (result: NicknameResult) =>
  result === "error"
    ? fail(500, "INTERNAL_ERROR")
    : ok(
        result === "available"
          ? { available: true, reason: null }
          : { available: false, reason: result },
      );

async function mockEditApis(page: Page, options: EditMockOptions = {}) {
  let current: Record<string, unknown> = {
    ...(options.initialProfile ?? profile),
  };
  const patchBodies: unknown[] = [];
  const uploads: string[] = [];
  /** 사용 가능 여부를 물은 닉네임과 Authorization 헤더 */
  const nicknameRequests: { nickname: string; authorization: string }[] = [];
  await page.route("**/api/v1/**", (route) =>
    route.fulfill(fail(404, "NOT_FOUND")),
  );
  await page.route(
    "**/api/v1/users/nickname-availability?**",
    async (route) => {
      const nickname =
        new URL(route.request().url()).searchParams.get("nickname") ?? "";
      nicknameRequests.push({
        nickname,
        authorization: route.request().headers()["authorization"] ?? "",
      });
      const { result = "available", delayMs = 0 } =
        options.nicknameResults?.[nickname] ?? {};
      if (delayMs) await new Promise((resolve) => setTimeout(resolve, delayMs));
      return route.fulfill(nicknameResponse(result));
    },
  );
  await page.route("**/api/v1/auth/tokens", (route) =>
    route.fulfill(ok({ accessToken: "e2e-access-token" })),
  );
  await page.route("**/api/v1/users/me/profile-image", (route) => {
    uploads.push(route.request().method());
    if (options.rejectUpload === "format") {
      return route.fulfill(fail(400, "INVALID_PROFILE_IMAGE"));
    }
    if (options.rejectUpload === "tooLarge") {
      return route.fulfill(fail(413, "INVALID_REQUEST"));
    }
    return route.fulfill(ok({ profileImageUrl: UPLOADED_PATH }));
  });
  await page.route("**/api/v1/users/me", (route) => {
    if (route.request().method() === "PATCH") {
      const body: Record<string, unknown> = route.request().postDataJSON();
      patchBodies.push(body);
      if (options.patchFailure && patchBodies.length === 1) {
        if (options.profileAfterFailure) {
          current = { ...options.profileAfterFailure };
        }
        return route.fulfill({
          status: options.patchFailure.status,
          contentType: "application/json",
          body: JSON.stringify(options.patchFailure.body),
        });
      }
      current = { ...current, ...body };
      return route.fulfill(ok(current));
    }
    return route.fulfill(ok(current));
  });
  return { patchBodies, uploads, nicknameRequests };
}

async function openEdit(page: Page) {
  await page.goto("/my");
  await page.getByRole("button", { name: "수정하기" }).click();
  await expect(page).toHaveURL(/\/my\/edit$/);
}

const submitEdit = (page: Page) =>
  page.getByRole("button", { name: "수정 완료" }).click();

test("수정하기를 누르면 프로필 수정 화면에 지금 값을 채우고, 바뀐 것이 없으면 요청 없이 돌아간다", async ({
  page,
}) => {
  const { patchBodies, uploads } = await mockEditApis(page);
  await openEdit(page);

  await expect(
    page.getByRole("heading", { name: "프로필 수정" }),
  ).toBeVisible();
  await expect(page.getByLabel("닉네임")).toHaveValue("딸기스무디");
  await expect(page.getByLabel("이메일 (선택)")).toHaveValue(
    "strawberry@example.com",
  );
  await expect(page.getByLabel("이름 · 수정 불가")).toHaveValue("김민준");

  await submitEdit(page);
  await expect(page).toHaveURL(/\/my$/);
  expect(patchBodies).toEqual([]);
  expect(uploads).toEqual([]);
});

test("닉네임만 바꾸면 닉네임만 보내고, 성공하면 내 정보로 돌아가 새 값을 보여준다", async ({
  page,
}) => {
  const { patchBodies } = await mockEditApis(page);
  await openEdit(page);

  // 앞뒤 공백은 지우고 보낸다
  await page.getByLabel("닉네임").fill("  민트라떼 ");
  await submitEdit(page);

  await expect(page).toHaveURL(/\/my$/);
  await expect(page.getByText("프로필을 수정했어요.")).toBeVisible();
  await expect(page.getByText("민트라떼")).toBeVisible();
  expect(patchBodies).toEqual([{ nickname: "민트라떼" }]);

  // 기록을 바꿨으므로 뒤로 가도 편집 화면이 다시 나오지 않는다
  await page.goBack();
  await expect(page).not.toHaveURL(/\/my\/edit$/);
});

test("이메일을 비우면 빈 문자열로 삭제를 보낸다", async ({ page }) => {
  const { patchBodies } = await mockEditApis(page);
  await openEdit(page);

  await page.getByLabel("이메일 (선택)").fill("");
  await submitEdit(page);

  await expect(page).toHaveURL(/\/my$/);
  expect(patchBodies).toEqual([{ email: "" }]);
  await expect(page.getByText("strawberry@example.com")).toHaveCount(0);
});

test("사진을 고르면 [수정 완료] 때 먼저 올리고 받은 경로를 수정 요청에 넣는다", async ({
  page,
}) => {
  const { patchBodies, uploads } = await mockEditApis(page);
  await openEdit(page);

  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "프로필 사진 변경" }).click();
  await (
    await chooser
  ).setFiles({ name: "photo.png", mimeType: "image/png", buffer: PNG_1PX });
  // 고르기만 하면 올리지 않는다
  expect(uploads).toEqual([]);

  await submitEdit(page);
  await expect(page).toHaveURL(/\/my$/);
  expect(uploads).toEqual(["POST"]);
  expect(patchBodies).toEqual([{ profileImageUrl: UPLOADED_PATH }]);
});

test("닉네임이 중복(409)이면 닉네임 칸 아래에 안내하고 편집 화면에 남는다", async ({
  page,
}) => {
  await mockEditApis(page, {
    patchFailure: {
      status: 409,
      body: { isSuccess: false, code: "DUPLICATED_NICKNAME", message: "" },
    },
  });
  await openEdit(page);

  await page.getByLabel("닉네임").fill("민트초코");
  await submitEdit(page);

  await expect(
    page.getByText("이미 사용 중인 닉네임이에요. 다른 닉네임을 입력해주세요."),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/my\/edit$/);
});

test("서버 필드 검증 실패(400 errors)는 해당 칸 아래에 서버 문구를 보여준다", async ({
  page,
}) => {
  await mockEditApis(page, {
    patchFailure: {
      status: 400,
      body: {
        isSuccess: false,
        code: "INVALID_REQUEST",
        message: "",
        errors: [{ field: "email", message: "서버가 거부한 이메일이에요." }],
      },
    },
  });
  await openEdit(page);

  await page.getByLabel("이메일 (선택)").fill("new@example.com");
  await submitEdit(page);

  await expect(page.getByText("서버가 거부한 이메일이에요.")).toBeVisible();
  await expect(page).toHaveURL(/\/my\/edit$/);
});

test("닉네임 제한 중이면 닉네임 칸을 잠그고 다시 바꿀 수 있는 날짜를 보여준다", async ({
  page,
}) => {
  await mockEditApis(page, {
    initialProfile: { ...profile, nicknameChangeableAt: "2099-01-15T10:00:00" },
  });
  await openEdit(page);

  await expect(page.getByLabel("닉네임")).toHaveAttribute("readonly", "");
  await expect(
    page.getByText("01월15일부터 다시 바꿀 수 있어요."),
  ).toBeVisible();
});

test("수정 중 닉네임 제한(409)을 받으면 닉네임을 되돌려 잠그고 칸 아래 오류로 알린 뒤, 다시 누르면 나머지만 저장한다", async ({
  page,
}) => {
  const lockedProfile = {
    ...profile,
    nicknameChangeableAt: "2099-01-15T10:00:00",
  };
  const { patchBodies, uploads } = await mockEditApis(page, {
    patchFailure: {
      status: 409,
      body: {
        isSuccess: false,
        code: "NICKNAME_CHANGE_RESTRICTED",
        message: "",
      },
    },
    profileAfterFailure: lockedProfile,
  });
  await openEdit(page);

  await page.getByLabel("닉네임").fill("민트라떼");
  await page.getByLabel("이메일 (선택)").fill("new@example.com");
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "프로필 사진 변경" }).click();
  await (
    await chooser
  ).setFiles({ name: "photo.png", mimeType: "image/png", buffer: PNG_1PX });
  await submitEdit(page);

  // 토스트 없이 칸 아래 빨간 오류(잠금 안내와 같은 문구)
  const nickname = page.getByLabel("닉네임");
  await expect(nickname).toHaveValue("딸기스무디");
  await expect(nickname).toHaveAttribute("readonly", "");
  await expect(nickname).toHaveAttribute("aria-invalid", "true");
  await expect(
    page.getByText("01월15일부터 다시 바꿀 수 있어요."),
  ).toBeVisible();
  await expect(page.getByText("프로필을 수정하지 못했어요")).toHaveCount(0);
  await expect(page.getByLabel("이메일 (선택)")).toHaveValue("new@example.com");
  await expect(page).toHaveURL(/\/my\/edit$/);

  // 다시 누르면 닉네임 없이 나머지만 보내고, 사진은 올려 둔 경로를 다시 쓴다
  await submitEdit(page);
  await expect(page).toHaveURL(/\/my$/);
  expect(uploads).toEqual(["POST"]);
  expect(patchBodies).toEqual([
    {
      nickname: "민트라떼",
      email: "new@example.com",
      profileImageUrl: UPLOADED_PATH,
    },
    {
      email: "new@example.com",
      profileImageUrl: UPLOADED_PATH,
    },
  ]);
});

test("사진 업로드가 형식 오류(400)면 형식 토스트를 보여주고 수정 요청을 보내지 않는다", async ({
  page,
}) => {
  const { patchBodies, uploads } = await mockEditApis(page, {
    rejectUpload: "format",
  });
  await openEdit(page);

  // 확장자만 바꾼 파일처럼 서버가 내용으로 거부하는 경우
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "프로필 사진 변경" }).click();
  await (
    await chooser
  ).setFiles({ name: "photo.png", mimeType: "image/png", buffer: PNG_1PX });
  await page.getByLabel("이메일 (선택)").fill("new@example.com");
  await submitEdit(page);

  await expect(
    page.getByText("JPG, PNG 형식의 사진만 올릴 수 있어요."),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/my\/edit$/);
  expect(uploads).toEqual(["POST"]);
  expect(patchBodies).toEqual([]);
});

test("사진 업로드가 5MB 초과(413)면 용량 토스트를 보여주고 수정 요청을 보내지 않는다", async ({
  page,
}) => {
  const { patchBodies } = await mockEditApis(page, {
    rejectUpload: "tooLarge",
  });
  await openEdit(page);

  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "프로필 사진 변경" }).click();
  await (
    await chooser
  ).setFiles({ name: "photo.png", mimeType: "image/png", buffer: PNG_1PX });
  await submitEdit(page);

  await expect(
    page.getByText("5MB 이하의 이미지만 등록할 수 있어요."),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/my\/edit$/);
  expect(patchBodies).toEqual([]);
});

test("수정이 400 INVALID_PROFILE_IMAGE_URL이면 토스트로 알리고, 다시 누르면 사진을 새로 올린다", async ({
  page,
}) => {
  const { patchBodies, uploads } = await mockEditApis(page, {
    patchFailure: {
      status: 400,
      body: {
        isSuccess: false,
        code: "INVALID_PROFILE_IMAGE_URL",
        message: "",
      },
    },
  });
  await openEdit(page);

  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "프로필 사진 변경" }).click();
  await (
    await chooser
  ).setFiles({ name: "photo.png", mimeType: "image/png", buffer: PNG_1PX });
  await submitEdit(page);

  await expect(
    page.getByText("사진을 올리지 못했어요. 다시 시도해주세요."),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/my\/edit$/);

  await submitEdit(page);
  await expect(page).toHaveURL(/\/my$/);
  expect(uploads).toEqual(["POST", "POST"]);
  expect(patchBodies).toEqual([
    { profileImageUrl: UPLOADED_PATH },
    { profileImageUrl: UPLOADED_PATH },
  ]);
});

test("수정이 404 USER_NOT_FOUND면 로그인 화면으로 가고 프로필 수정으로 돌아오게 한다", async ({
  page,
}) => {
  await mockEditApis(page, {
    patchFailure: {
      status: 404,
      body: { isSuccess: false, code: "USER_NOT_FOUND", message: "" },
    },
  });
  await openEdit(page);

  await page.getByLabel("이메일 (선택)").fill("new@example.com");
  await submitEdit(page);

  await expect(page).toHaveURL(/\/login$/);
  expect(
    await page.evaluate(() => sessionStorage.getItem("loginRedirect")),
  ).toBe("/my/edit");
});

test("생년월일 옆 연령대는 서버가 준 ageGroup으로 보여준다", async ({
  page,
}) => {
  // 기기 날짜로 계산하면 20대 후반이지만 서버 값(30대 초반)을 그대로 쓴다
  await mockEditApis(page, {
    initialProfile: { ...profile, ageGroup: { decade: 30, phase: "EARLY" } },
  });
  await openEdit(page);

  await expect(page.getByText("30대 초반")).toBeVisible();
  await expect(page.getByText("20대 후반")).toHaveCount(0);
});

const nicknameField = (page: Page) => page.getByLabel("닉네임");

test("닉네임 칸을 벗어나면 토큰을 붙여 사용 가능 여부를 묻고 결과를 칸 아래에 보여준다", async ({
  page,
}) => {
  const { nicknameRequests } = await mockEditApis(page, {
    nicknameResults: {
      민트초코: { result: "DUPLICATED" },
      바닐라: { result: "error" },
      "a..b": { result: "INVALID_FORMAT" },
    },
  });
  await openEdit(page);

  // 처음·입력 중에는 14일 제한 안내, 사용 가능하면 그 자리에 녹색 결과 문구(기획대로, 사용자 결정 2026-11-12)
  const lockNote = page.getByText(
    "닉네임을 바꾸면 14일 동안 다시 바꿀 수 없어요.",
  );
  await expect(lockNote).toBeVisible();
  await nicknameField(page).fill("민트라떼");
  await expect(lockNote).toBeVisible();
  await nicknameField(page).blur();
  await expect(page.getByText("사용할 수 있는 닉네임이에요.")).toBeVisible();
  await expect(lockNote).toHaveCount(0);
  expect(nicknameRequests).toEqual([
    { nickname: "민트라떼", authorization: "Bearer e2e-access-token" },
  ]);

  // 값을 고치면 결과 문구를 지우고 14일 안내로 돌아간다
  await nicknameField(page).fill("민트라떼2");
  await expect(page.getByText("사용할 수 있는 닉네임이에요.")).toHaveCount(0);
  await expect(lockNote).toBeVisible();

  // 중복 → 빨간 오류
  await nicknameField(page).fill("민트초코");
  await nicknameField(page).blur();
  await expect(
    page.getByText("이미 사용 중인 닉네임이에요. 다른 닉네임을 입력해주세요."),
  ).toBeVisible();
  await expect(nicknameField(page)).toHaveAttribute("aria-invalid", "true");

  // 화면 검사를 통과했는데 서버가 형식 오류라고 하면 화면 형식 문구
  await nicknameField(page).fill("a..b");
  await nicknameField(page).blur();
  await expect(
    page.getByText(
      "닉네임은 2~10자의 한글·영문·숫자·마침표(.)·밑줄(_)만 쓸 수 있어요.",
    ),
  ).toBeVisible();

  // 요청 실패 → 빨간 오류
  await nicknameField(page).fill("바닐라");
  await nicknameField(page).blur();
  await expect(
    page.getByText("닉네임을 확인하지 못했어요. 잠시 후 다시 시도해주세요."),
  ).toBeVisible();

  // 화면 형식 검사에 걸리면 묻지 않는다
  const asked = nicknameRequests.length;
  await nicknameField(page).fill("가");
  await nicknameField(page).blur();
  await expect(
    page.getByText(
      "닉네임은 2~10자의 한글·영문·숫자·마침표(.)·밑줄(_)만 쓸 수 있어요.",
    ),
  ).toBeVisible();
  expect(nicknameRequests).toHaveLength(asked);
});

test("지금 닉네임 그대로 칸을 벗어나면 사용 가능 여부를 묻지 않는다", async ({
  page,
}) => {
  const { nicknameRequests } = await mockEditApis(page);
  await openEdit(page);

  await nicknameField(page).focus();
  await nicknameField(page).blur();
  await page.getByLabel("이메일 (선택)").fill("new@example.com");
  await submitEdit(page);

  await expect(page).toHaveURL(/\/my$/);
  expect(nicknameRequests).toEqual([]);
});

test("늦게 온 이전 닉네임의 결과는 지금 값의 결과를 덮지 않는다", async ({
  page,
}) => {
  const { nicknameRequests } = await mockEditApis(page, {
    nicknameResults: { 민트초코: { result: "DUPLICATED", delayMs: 1500 } },
  });
  await openEdit(page);

  await nicknameField(page).fill("민트초코");
  await nicknameField(page).blur();
  await nicknameField(page).fill("민트라떼");
  await nicknameField(page).blur();
  await expect(page.getByText("사용할 수 있는 닉네임이에요.")).toBeVisible();

  // 이전 값(민트초코)의 응답까지 받은 뒤에도 지금 값의 결과가 그대로다
  await expect
    .poll(() => nicknameRequests.map(({ nickname }) => nickname))
    .toEqual(["민트초코", "민트라떼"]);
  await page.waitForTimeout(1800);
  await expect(page.getByText("사용할 수 있는 닉네임이에요.")).toBeVisible();
  await expect(
    page.getByText("이미 사용 중인 닉네임이에요. 다른 닉네임을 입력해주세요."),
  ).toHaveCount(0);
});

test("프로필 수정에서 조회가 404 USER_NOT_FOUND면 로그인 화면으로 가고 프로필 수정으로 돌아오게 한다", async ({
  page,
}) => {
  await mockApis(page, { loggedIn: true, userNotFound: true });
  await page.goto("/my/edit");

  await expect(page).toHaveURL(/\/login$/);
  expect(
    await page.evaluate(() => sessionStorage.getItem("loginRedirect")),
  ).toBe("/my/edit");
});

for (const { code, label, value } of [
  { code: "INVALID_NICKNAME", label: "닉네임", value: "민트라떼" },
  { code: "INVALID_EMAIL", label: "이메일 (선택)", value: "new@example.com" },
]) {
  test(`수정이 400 ${code}면 서버 문구를 ${label} 칸 아래에 보여준다`, async ({
    page,
  }) => {
    await mockEditApis(page, {
      patchFailure: {
        status: 400,
        body: { isSuccess: false, code, message: `서버가 거부한 ${label}` },
      },
    });
    await openEdit(page);

    await page.getByLabel(label).fill(value);
    await submitEdit(page);

    await expect(page.getByText(`서버가 거부한 ${label}`)).toBeVisible();
    await expect(page.getByLabel(label)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await expect(page).toHaveURL(/\/my\/edit$/);
  });
}
