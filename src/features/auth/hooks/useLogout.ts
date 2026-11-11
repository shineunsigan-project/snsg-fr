import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteTokens } from "../api/logout";
import { clearSession } from "../lib/clearSession";

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTokens,
    // 응답과 상관없이 이 기기의 로그인 상태를 비운다
    onSettled: () => clearSession(queryClient),
  });
}
