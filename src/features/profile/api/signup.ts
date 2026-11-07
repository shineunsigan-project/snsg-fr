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
  /** 카카오 기본 이미지였거나 사진을 받지 못하면 null. 이때 서버는 기본 이미지로 가입시킨다 */
  profileImageUrl?: string | null;
};

/** 사진 없이 가입할 때 서버가 쓰는 기본 이미지. 도메인 없는 경로라 서버 주소를 붙인다 (api-guide 가입) */
export const DEFAULT_PROFILE_IMAGE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL ?? ""}/images/default-profile.png`;

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

/** 가입 요청. 필드와 입력 규칙은 api-guide "가입 요청의 입력 규칙"을 따른다. 사진을 빼면 서버가 카카오 사진을 쓴다 */
export type SignupRequest = {
  name: string;
  nickname?: string;
  gender: Gender;
  /** YYYY-MM-DD */
  birthDate: string;
  /** 선택 입력. 비워 두면 보내지 않는다 */
  email?: string;
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
