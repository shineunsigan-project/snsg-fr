import { expect, test, type Page } from "@playwright/test";

// 프로필 완성 AUTH-02의 사진 선택·업로드 오류 토스트 (USER_FLOW §4.1)
// 사진은 JPG·PNG만 받는다. 서버는 파일 내용으로 판별해 400 INVALID_PROFILE_IMAGE를 준다 (api-guide 가입)

const FORMAT_MESSAGE = "JPG, PNG 형식의 사진만 올릴 수 있어요.";

// 1×1 투명 PNG. 미리보기를 그릴 수 있는 실제 이미지여야 한다
const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

async function mockApis(page: Page) {
  const uploadRequests: string[] = [];
  const signupRequests: string[] = [];
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
  // 확장자만 바꾼 파일처럼 서버가 내용을 보고 거부한 경우
  await page.route("**/api/v1/auth/signup/profile-image", (route) => {
    uploadRequests.push(route.request().method());
    return route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({
        isSuccess: false,
        code: "INVALID_PROFILE_IMAGE",
        message: FORMAT_MESSAGE,
      }),
    });
  });
  await page.route("**/api/v1/auth/signup", (route) => {
    signupRequests.push(route.request().method());
    return route.fulfill({ status: 500 });
  });
  return { uploadRequests, signupRequests };
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
