import { useMutation, useQueryClient } from "@tanstack/react-query";

import { USER_NOT_FOUND_CODE } from "../api/myProfile";
import { deleteMyAccount } from "../api/withdraw";
import { clearSession } from "@/features/auth/lib/clearSession";
import { getApiErrorCode } from "@/shared/lib/api/client";

/**
 * 회원 탈퇴 (MY-04). 성공하면 이 기기의 로그인 상태를 비운다.
 * 쿠키는 탈퇴 응답이 만료시키므로 로그아웃을 부르지 않는다 (api-guide 탈퇴)
 * 404 USER_NOT_FOUND는 이미 탈퇴한 것(두 번 눌렸거나 남은 access token)이라 성공과 같이 처리한다
 */
export function useWithdraw() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      try {
        await deleteMyAccount();
      } catch (error) {
        if (getApiErrorCode(error) !== USER_NOT_FOUND_CODE) throw error;
      }
    },
    onSuccess: () => clearSession(queryClient),
  });
}
