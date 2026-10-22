import { http, HttpResponse, type AnyHandler } from "msw";

import type {
  SignUpSession,
  SignupRequest,
} from "@/features/profile/api/signup";
import type {
  ApiFailure,
  ApiSuccess,
  TokenResponse,
} from "@/shared/lib/api/client";

// API 함수와 1:1로 핸들러를 추가한다. 응답은 백엔드 스펙(/v3/api-docs)을 기준으로 작성한다 (TECH_STACK §3.8)
// 실제 서버에 붙일 때는 NEXT_PUBLIC_API_MOCKING=disabled로 끈다
// 카카오 인증 이동(GET /api/v1/auth/kakao/authorize)은 페이지 이동이라 mock할 수 없다.
// mock으로 가입 화면을 보려면 /auth/callback?signUp=true로 들어간다

/** 테스트용: 이 닉네임으로 가입하면 409 DUPLICATED_NICKNAME을 준다 */
const DUPLICATED_NICKNAME = "중복닉네임";

/** 카카오 정보 (임시 닉네임) */
const mockSignUpSession: SignUpSession = {
  nickname: "딸기스무디",
  profileImageUrl:
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="#578627"/><text x="40" y="52" font-size="32" text-anchor="middle" fill="#fff" font-family="sans-serif">딸</text></svg>',
    ),
};

const failure = (status: number, code: string, message: string) =>
  HttpResponse.json<ApiFailure>(
    { isSuccess: false, code, message },
    { status },
  );

export const handlers: AnyHandler[] = [
  // refreshAccessToken — mock에는 refresh token 쿠키가 없어 항상 비로그인으로 시작한다
  http.post("*/api/v1/auth/tokens", () =>
    failure(401, "INVALID_REFRESH_TOKEN", "다시 로그인해야 합니다."),
  ),

  // getSignUpSession
  http.get("*/api/v1/auth/signup/session", () =>
    HttpResponse.json<ApiSuccess<SignUpSession>>({
      isSuccess: true,
      data: mockSignUpSession,
    }),
  ),

  // postProfileImage
  http.post("*/api/v1/auth/signup/profile-image", async ({ request }) => {
    const image = (await request.formData()).get("image");
    if (!(image instanceof File)) {
      return failure(400, "INVALID_REQUEST", "요청 형식이 올바르지 않습니다.");
    }
    return HttpResponse.json({
      isSuccess: true,
      data: { profileImageUrl: `/images/profiles/mock-${image.name}` },
    });
  }),

  // postSignup — 성별·생년월일은 필수, 닉네임은 선택
  http.post<never, SignupRequest, ApiSuccess<TokenResponse> | ApiFailure>(
    "*/api/v1/auth/signup",
    async ({ request }) => {
      const body = await request.json();
      if (!body.gender || !body.birthDate) {
        return failure(
          400,
          "INVALID_REQUEST",
          "요청 형식이 올바르지 않습니다.",
        );
      }
      if (body.nickname === DUPLICATED_NICKNAME) {
        return failure(
          409,
          "DUPLICATED_NICKNAME",
          "이미 사용 중인 닉네임입니다.",
        );
      }
      return HttpResponse.json({
        isSuccess: true,
        data: { accessToken: "mock-access-token" },
      });
    },
  ),
];
