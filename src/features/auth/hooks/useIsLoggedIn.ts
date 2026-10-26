import { useQuery } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";

import { restoreSession, sessionQueryKey } from "../api/session";
import {
  getAccessToken,
  subscribeAccessToken,
} from "@/shared/lib/api/accessToken";

/**
 * 로그인 여부 — 메모리에 access token이 있으면 로그인 상태다
 * 처음 한 번 재발급 API로 로그인을 복구한다. 복구가 끝나기 전(서버 렌더링 포함)에는 undefined를 돌려준다.
 * 이때는 로그인 필요 모달을 띄우지 않는다
 */
export function useIsLoggedIn() {
  const { isPending } = useQuery({
    queryKey: sessionQueryKey,
    queryFn: restoreSession,
    staleTime: Infinity,
    retry: false,
  });
  const hasToken = useSyncExternalStore(
    subscribeAccessToken,
    () => getAccessToken() !== null,
    () => false,
  );
  return isPending ? undefined : hasToken;
}
