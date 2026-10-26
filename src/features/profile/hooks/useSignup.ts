import { useMutation, useQueryClient } from "@tanstack/react-query";

import { postSignup } from "../api/signup";
import { sessionQueryKey } from "@/features/auth/api/session";
import { setAccessToken } from "@/shared/lib/api/accessToken";

export function useSignup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postSignup,
    onSuccess: ({ accessToken }) => {
      setAccessToken(accessToken);
      // 가입 응답으로 로그인했으므로 재발급 API로 다시 복구하지 않는다
      queryClient.setQueryData(sessionQueryKey, true);
    },
  });
}
