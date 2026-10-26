// access token은 메모리에만 둔다. localStorage·sessionStorage에 넣지 않는다 (XSS 대비, TECH_STACK §6)
// 새로고침하면 사라지고, 앱 시작 때 재발급 API로 다시 받는다
let accessToken: string | null = null;
const listeners = new Set<() => void>();

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
  listeners.forEach((listener) => listener());
}

/** 로그인·로그아웃으로 토큰이 바뀌면 알린다 (useSyncExternalStore용) */
export function subscribeAccessToken(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
