import type { Gender } from "@/features/auth/types";
import {
  apiClient,
  type ApiSuccess,
  type TokenResponse,
} from "@/shared/lib/api/client";

// 가입 API는 모두 가입 토큰 쿠키(signUpToken)로 가입 세션을 찾는다. 세션이 만료되면 401 INVALID_SIGNUP_TOKEN

/** 카카오에서 받은 정보. 받지 못한 값은 비어 있다 */
export type SignUpSession = {
  nickname?: string;
  profileImageUrl?: string;
};

/** 가입 세션 조회 — 프로필 완성 화면의 기본값(카카오 닉네임·사진) */
export async function getSignUpSession() {
  const { data } = await apiClient.get<ApiSuccess<SignUpSession>>(
    "/api/v1/auth/signup/session",
  );
  return data.data;
}

/** 프로필 사진 업로드 — 돌려받은 경로를 가입 요청의 profileImageUrl에 넣는다 */
export async function postProfileImage(image: File) {
  const body = new FormData();
  body.append("image", image);
  const { data } = await apiClient.post<
    ApiSuccess<{ profileImageUrl: string }>
  >("/api/v1/auth/signup/profile-image", body);
  return data.data.profileImageUrl;
}

/** 닉네임·사진을 빼면 서버가 카카오 정보를 쓴다 */
export type SignupRequest = {
  nickname?: string;
  gender: Gender;
  /** YYYY-MM-DD */
  birthDate: string;
  /** postProfileImage가 돌려준 경로 */
  profileImageUrl?: string;
};

/** 신규 회원 가입 완료 — 프로필을 보내고 access token을 받는다 */
export async function postSignup(body: SignupRequest) {
  const { data } = await apiClient.post<ApiSuccess<TokenResponse>>(
    "/api/v1/auth/signup",
    body,
  );
  return data.data;
}
