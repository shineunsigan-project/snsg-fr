import type { AuthResponse, Gender } from "@/features/auth/types";
import { apiClient } from "@/shared/lib/api/client";

/** 이름·닉네임·이메일·성별은 백엔드에서 필수다 */
export type SignupRequest = {
  signupToken: string;
  name: string;
  nickname: string;
  email: string;
  gender: Gender;
  /** YYYY-MM-DD */
  birthDate: string;
};

// TODO(API): 엔드포인트·요청 필드는 백엔드 계약이 나오면 맞춘다. 지금은 MSW가 응답한다
// TODO(API): 프로필 사진 업로드 방식이 정해지면 추가한다
/** 신규 회원 가입 완료 — 가입 토큰과 프로필을 보내고 로그인 토큰을 받는다 */
export async function postSignup(body: SignupRequest) {
  const { data } = await apiClient.post<AuthResponse>("/api/auth/signup", body);
  return data;
}
