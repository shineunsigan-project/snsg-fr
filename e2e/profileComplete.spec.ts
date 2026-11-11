import { expect, test, type Page } from "@playwright/test";

// 프로필 완성 AUTH-02의 사진 선택·업로드 오류 토스트, 닉네임 사용 가능 여부 (USER_FLOW §4.1)
// 사진은 JPG·PNG만 받는다. 서버는 파일 내용으로 판별해 400 INVALID_PROFILE_IMAGE를 주고, 5MB를 넘으면 413 (api-guide 가입)

const FORMAT_MESSAGE = "JPG, PNG 형식의 사진만 올릴 수 있어요.";

// 1×1 투명 PNG. 미리보기를 그릴 수 있는 실제 이미지여야 한다
const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

type MockOptions = {
  /** 사진 업로드 거부: 400 INVALID_PROFILE_IMAGE(형식) 또는 413 INVALID_REQUEST(5MB 초과) */
  rejectUpload?: "format" | "tooLarge";
  /** 닉네임 사용 가능 여부 결과. 없으면 사용 가능 */
  nickname?: "available" | "DUPLICATED" | "error";
};

async function mockApis(
  page: Page,
  { rejectUpload = "format", nickname = "available" }: MockOptions = {},
) {
  const uploadRequests: string[] = [];
  const signupRequests: string[] = [];
  /** 사용 가능 여부를 물은 닉네임과 Authorization 헤더 */
  const nicknameRequests: { nickname: string; authorization: string }[] = [];
  await page.route("**/api/v1/**", (route) =>
    route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({ isSuccess: false, code: "NOT_FOUND" }),
    }),
  );
  await page.route("**/api/v1/auth/signup/session", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        isSuccess: true,
        data: { nickname: "딸기스무디", profileImageUrl: null },
      }),
    }),
  );
  // format: 확장자만 바꾼 파일처럼 서버가 내용을 보고 거부한 경우 / tooLarge: 5MB 초과
  await page.route("**/api/v1/auth/signup/profile-image", (route) => {
    uploadRequests.push(route.request().method());
    return route.fulfill({
      status: rejectUpload === "format" ? 400 : 413,
      contentType: "application/json",
      body: JSON.stringify({
        isSuccess: false,
        code:
          rejectUpload === "format"
            ? "INVALID_PROFILE_IMAGE"
            : "INVALID_REQUEST",
        message: "",
      }),
    });
  });
  await page.route("**/api/v1/users/nickname-availability?**", (route) => {
    nicknameRequests.push({
      nickname:
        new URL(route.request().url()).searchParams.get("nickname") ?? "",
      authorization: route.request().headers()["authorization"] ?? "",
    });
    if (nickname === "error") return route.fulfill({ status: 500 });
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        isSuccess: true,
        data:
          nickname === "available"
            ? { available: true, reason: null }
            : { available: false, reason: nickname },
      }),
    });
  });
  await page.route("**/api/v1/auth/signup", (route) => {
    signupRequests.push(route.request().method());
    return route.fulfill({ status: 500 });
  });
  return { uploadRequests, signupRequests, nicknameRequests };
}

async function chooseAvatar(
  page: Page,
  file: { name: string; mimeType: string; buffer: Buffer },
) {
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "프로필 사진 변경" }).click();
  await (await chooser).setFiles(file);
}

test("WebP 사진을 고르면 형식 토스트를 보여주고 미리보기를 바꾸지 않는다", async ({
  page,
}) => {
  await mockApis(page);
  await page.goto("/signup");

  await chooseAvatar(page, {
    name: "photo.webp",
    mimeType: "image/webp",
    buffer: PNG_1PX,
  });

  await expect(page.getByText(FORMAT_MESSAGE)).toBeVisible();
  await expect(
    page.getByRole("img", { name: "프로필 사진" }),
  ).not.toHaveAttribute("src", /^blob:/);
});

test("업로드가 400 INVALID_PROFILE_IMAGE면 형식 토스트를 보여주고 가입 요청을 보내지 않는다", async ({
  page,
}) => {
  const { uploadRequests, signupRequests } = await mockApis(page);
  await page.goto("/signup");

  await chooseAvatar(page, {
    name: "photo.png",
    mimeType: "image/png",
    buffer: PNG_1PX,
  });
  await page.getByLabel("이름").fill("김민준");
  await page.getByText("남성", { exact: true }).click();
  await page.getByLabel("생년월일").fill("19980314");
  await page.getByRole("button", { name: "시작하기" }).click();

  await expect(page.getByText(FORMAT_MESSAGE)).toBeVisible();
  await expect(
    page.getByText("사진을 올리지 못했어요. 다시 시도해주세요."),
  ).toHaveCount(0);
  expect(uploadRequests).toEqual(["POST"]);
  expect(signupRequests).toEqual([]);
});

test("업로드가 413(5MB 초과)이면 용량 토스트를 보여주고 가입 요청을 보내지 않는다", async ({
  page,
}) => {
  const { signupRequests } = await mockApis(page, {
    rejectUpload: "tooLarge",
  });
  await page.goto("/signup");

  await chooseAvatar(page, {
    name: "photo.png",
    mimeType: "image/png",
    buffer: PNG_1PX,
  });
  await page.getByLabel("이름").fill("김민준");
  await page.getByText("남성", { exact: true }).click();
  await page.getByLabel("생년월일").fill("19980314");
  await page.getByRole("button", { name: "시작하기" }).click();

  await expect(
    page.getByText("5MB 이하의 이미지만 등록할 수 있어요."),
  ).toBeVisible();
  expect(signupRequests).toEqual([]);
});

test("카카오 닉네임 그대로 칸을 벗어나도 토큰 없이 사용 가능 여부를 묻고 녹색으로 안내한다", async ({
  page,
}) => {
  const { nicknameRequests } = await mockApis(page);
  await page.goto("/signup");

  const nickname = page.getByLabel("닉네임");
  await expect(nickname).toHaveValue("딸기스무디");
  await nickname.focus();
  await nickname.blur();

  await expect(page.getByText("사용할 수 있는 닉네임이에요.")).toBeVisible();
  expect(nicknameRequests).toEqual([
    { nickname: "딸기스무디", authorization: "" },
  ]);
});

test("닉네임이 중복이면 칸 아래 빨간 오류로 알리고, 값을 고치면 지운다", async ({
  page,
}) => {
  await mockApis(page, { nickname: "DUPLICATED" });
  await page.goto("/signup");

  const nickname = page.getByLabel("닉네임");
  await nickname.fill("민트초코");
  await nickname.blur();
  const duplicated = page.getByText(
    "이미 사용 중인 닉네임이에요. 다른 닉네임을 입력해주세요.",
  );
  await expect(duplicated).toBeVisible();
  await expect(nickname).toHaveAttribute("aria-invalid", "true");

  await nickname.fill("민트초코2");
  await expect(duplicated).toHaveCount(0);
});

test("닉네임 사용 가능 여부를 묻지 못하면 다시 시도 안내를 빨간 오류로 보여준다", async ({
  page,
}) => {
  await mockApis(page, { nickname: "error" });
  await page.goto("/signup");

  const nickname = page.getByLabel("닉네임");
  await nickname.fill("민트초코");
  await nickname.blur();
  await expect(
    page.getByText("닉네임을 확인하지 못했어요. 잠시 후 다시 시도해주세요."),
  ).toBeVisible();
});
