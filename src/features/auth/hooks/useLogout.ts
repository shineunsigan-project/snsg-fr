import { useMutation, useQueryClient } from "@tanstack/react-query";

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
      queryClient.setQueryData(sessionQueryKey, false);
    },
  });
}
