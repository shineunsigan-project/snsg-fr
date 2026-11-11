import { useMutation } from "@tanstack/react-query";

import { getWithdrawalEligibility } from "../api/withdraw";

/**
 * 탈퇴 가능 여부 (MY-04 [회원 탈퇴]). 누를 때마다 새로 확인하므로 캐시하지 않고 누를 때 부른다.
 * 응답 전까지 [회원 탈퇴]를 막는 데 isPending을 쓴다
 */
export function useWithdrawalEligibility() {
  return useMutation({ mutationFn: getWithdrawalEligibility });
}
