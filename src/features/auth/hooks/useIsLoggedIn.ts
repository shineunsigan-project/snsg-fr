import { useSyncExternalStore } from "react";

import { TOKEN_STORAGE_KEY } from "@/shared/lib/api/client";

// 다른 탭에서 로그인·로그아웃하면 storage 이벤트로 다시 읽는다
const subscribe = (onChange: () => void) => {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
};

/**
 * 로그인 여부 — localStorage에 토큰이 있으면 로그인 상태다 (기존 프로젝트 방식)
 * 서버 렌더링 중에는 알 수 없어 undefined를 돌려준다. 이때는 로그인 필요 모달을 띄우지 않는다
 */
export function useIsLoggedIn() {
  return useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(TOKEN_STORAGE_KEY) !== null,
    () => undefined,
  );
}
