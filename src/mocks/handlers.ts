import { http, HttpResponse, type AnyHandler } from "msw";

import type { KakaoLoginRequest } from "@/features/auth/api/kakaoLogin";
import type { AuthResponse, User } from "@/features/auth/types";
import type { SignupRequest } from "@/features/profile/api/signup";

// API 함수와 1:1로 핸들러를 추가한다. 응답은 백엔드 스펙 문서를 기준으로 작성한다 (TECH_STACK §3.8)
// 백엔드가 준비되면 NEXT_PUBLIC_API_MOCKING=disabled로 끄면 같은 API 함수가 실제 백엔드를 부른다
// TODO(API): 응답 값은 백엔드 응답 예시가 나오면 맞춘다

/** 테스트용: 이 code로 콜백 API를 부르면 기존 회원 응답을 준다. 그 밖의 code(실제 카카오 인가 코드)는 신규 회원 응답 */
const EXISTING_USER_CODE = "existing-user";

const mockProfileImageUrl =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="#578627"/><text x="40" y="52" font-size="32" text-anchor="middle" fill="#fff" font-family="sans-serif">민</text></svg>',
  );

const mockUser: User = {
  id: 1,
  nickname: "민트초코",
  name: "홍길동",
  email: "mint@example.com",
  gender: "FEMALE",
  birthDate: "1996-04-12",
  profileImageUrl: mockProfileImageUrl,
};

export const handlers: AnyHandler[] = [
  // postKakaoCallback — 카카오 OAuth 자체는 mock하지 않고, 인가 코드를 받는 백엔드 API만 대신한다
  http.post<never, KakaoLoginRequest, AuthResponse>(
    "*/api/auth/kakao/callback",
    async ({ request }) => {
      const { code } = await request.json();
      if (!code) return new HttpResponse(null, { status: 400 });

      if (code === EXISTING_USER_CODE) {
        return HttpResponse.json({
          authStatus: "LOGIN_SUCCESS",
          accessToken: "mock-access-token",
          refreshToken: "mock-refresh-token",
          user: mockUser,
        });
      }

      return HttpResponse.json({
        authStatus: "ADDITIONAL_INFO_REQUIRED",
        signupToken: "mock-signup-token",
        requiredFields: ["name", "nickname", "email", "gender"],
        socialUser: {
          nickname: mockUser.nickname,
          email: mockUser.email,
          profileImageUrl: mockUser.profileImageUrl,
        },
      });
    },
  ),

  // postSignup — 이름·닉네임·이메일·성별은 필수
  http.post<never, SignupRequest, AuthResponse>(
    "*/api/auth/signup",
    async ({ request }) => {
      const body = await request.json();
      const isMissingRequired =
        !body.signupToken ||
        !body.name ||
        !body.nickname ||
        !body.email ||
        !body.gender;
      if (isMissingRequired) return new HttpResponse(null, { status: 400 });

      return HttpResponse.json({
        authStatus: "SIGNUP_SUCCESS",
        accessToken: "mock-access-token",
        refreshToken: "mock-refresh-token",
        user: {
          id: mockUser.id,
          nickname: body.nickname,
          name: body.name,
          email: body.email,
          gender: body.gender,
          birthDate: body.birthDate,
          profileImageUrl: mockUser.profileImageUrl,
        },
      });
    },
  ),
];
