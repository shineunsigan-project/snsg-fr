import { useMutation } from "@tanstack/react-query";

import { deleteMyAccount } from "../api/withdraw";
import { useLogout } from "@/features/auth/hooks/useLogout";

/**
 * 회원 탈퇴 (MY-04). 서버가 쿠키를 비우지 않으므로 탈퇴가 되면 이어서 로그아웃을 부른다 (api-guide 탈퇴)
 * 토큰·캐시 정리는 로그아웃과 같아서 useLogout을 그대로 쓴다. 로그아웃 요청이 실패해도 탈퇴는 끝났으므로 성공으로 둔다
 */
export function useWithdraw() {
  const { mutateAsync: logout } = useLogout();
  return useMutation({
    mutationFn: async () => {
      await deleteMyAccount();
      await logout().catch(() => undefined);
    },
  });
}
