import { hashKey, useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteTokens } from "../api/logout";
import { sessionQueryKey } from "../api/session";
import { setAccessToken } from "@/shared/lib/api/accessToken";

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTokens,
    // 응답과 상관없이 메모리의 토큰을 버린다. 발급된 access token은 만료까지 유효하기 때문이다 (TECH_STACK §6)
    onSettled: () => {
      setAccessToken(null);
      // 참여한·개설한 일정 등 이 사용자의 데이터를 메모리에 남기지 않는다. 로그인 여부만 남기고 모두 지운다.
      // 기능별 키를 알 필요가 없도록 auth 안에서 끝낸다. 보고 있는 화면의 데이터는 다시 받는다
      queryClient.removeQueries({
        predicate: (query) => query.queryHash !== hashKey(sessionQueryKey),
      });
      queryClient.setQueryData(sessionQueryKey, false);
    },
  });
}
