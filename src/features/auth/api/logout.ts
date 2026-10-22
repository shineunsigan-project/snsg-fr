import { apiClient } from "@/shared/lib/api/client";

/** 로그아웃 — 서버의 refresh token을 지우고 쿠키를 만료시킨다. access token으로 호출한다 */
export async function deleteTokens() {
  await apiClient.delete("/api/v1/auth/tokens");
}
