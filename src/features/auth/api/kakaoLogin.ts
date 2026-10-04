import type { AuthResponse } from "../types";
import { apiClient } from "@/shared/lib/api/client";

export type KakaoLoginRequest = { code: string };

/** 카카오 인가 코드를 백엔드에 넘긴다. 기존 회원은 토큰, 신규 회원은 가입 토큰을 받는다 */
export async function postKakaoCallback(body: KakaoLoginRequest) {
  const { data } = await apiClient.post<AuthResponse>(
    "/api/auth/kakao/callback",
    body,
  );
  return data;
}
