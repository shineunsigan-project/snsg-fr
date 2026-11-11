import { hashKey, type QueryClient } from "@tanstack/react-query";

import { sessionQueryKey } from "../api/session";
import { setAccessToken } from "@/shared/lib/api/accessToken";

/**
 * 이 기기의 로그인 상태를 비운다: 메모리의 access token을 버리고, 이 사용자의 데이터를 지우고, 비로그인으로 둔다
 * 로그아웃·탈퇴·사용자 없음(404 USER_NOT_FOUND)이 함께 쓴다. 발급된 access token은 만료까지 유효하므로 버린다 (TECH_STACK §6)
 */
export function clearSession(queryClient: QueryClient) {
  setAccessToken(null);
  // 참여한·개설한 일정 등 이 사용자의 데이터를 메모리에 남기지 않는다. 로그인 여부만 남기고 모두 지운다.
  // 기능별 키를 알 필요가 없도록 auth 안에서 끝낸다. 보고 있는 화면의 데이터는 다시 받는다
  queryClient.removeQueries({
    predicate: (query) => query.queryHash !== hashKey(sessionQueryKey),
  });
  queryClient.setQueryData(sessionQueryKey, false);
}
