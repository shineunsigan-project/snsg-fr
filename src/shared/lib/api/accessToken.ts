import { syncLoginHint } from "../loginHint";

// access token은 메모리에만 둔다. localStorage·sessionStorage에 넣지 않는다 (XSS 대비, TECH_STACK §6)
// 새로고침하면 사라지고, 앱 시작 때 재발급 API로 다시 받는다
let accessToken: string | null = null;
const listeners = new Set<() => void>();

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
  // 토큰을 바꾸는 모든 곳(로그인·재발급·가입·로그아웃·탈퇴·재발급 실패)에서 표시용 쿠키도 맞춘다
  // 로그인 화면으로 보내기 전에 토큰을 지우므로, 서버가 다시 홈으로 돌려보내는 반복이 생기지 않는다
  syncLoginHint(token !== null);
  listeners.forEach((listener) => listener());
}

/** 로그인·로그아웃으로 토큰이 바뀌면 알린다 (useSyncExternalStore용) */
export function subscribeAccessToken(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
