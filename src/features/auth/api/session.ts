import { refreshAccessToken } from "@/shared/lib/api/client";

/** 로그인 여부 쿼리. 가입 완료처럼 토큰을 직접 받은 경우에도 이 키의 값을 바꾼다 */
export const sessionQueryKey = ["auth", "session"] as const;

/** 앱 시작 때 refresh token 쿠키로 access token을 다시 받는다. 받으면 로그인, 401이면 비로그인 */
export async function restoreSession() {
  return (await refreshAccessToken()) !== null;
}
