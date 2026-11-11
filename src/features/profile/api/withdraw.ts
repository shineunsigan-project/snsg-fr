import { apiClient, type ApiSuccess } from "@/shared/lib/api/client";

// 회원 탈퇴 MY-04: 탈퇴 가능 여부 → 재확인 → 탈퇴 (api-guide 탈퇴). 둘 다 access token이 필요하다

/** 탈퇴를 막는 일정(취소되지 않았고 시작 후 24시간이 지나지 않은 일정)이 있을 때 탈퇴 API의 code (409) */
export const WITHDRAWAL_BLOCKED_CODE = "WITHDRAWAL_BLOCKED";

export type WithdrawalEligibility = {
  withdrawable: boolean;
  /** 탈퇴할 수 있게 되는 시각(한국 시간). withdrawable이 true면 null. 화면에는 쓰지 않는다 (SHI-165 결정 2) */
  availableAt: string | null;
};

/** 탈퇴 가능 여부. 결과는 안내용이고 탈퇴 API가 같은 기준으로 다시 확인한다 */
export async function getWithdrawalEligibility() {
  const { data } = await apiClient.get<ApiSuccess<WithdrawalEligibility>>(
    "/api/v1/users/me/withdrawal-eligibility",
  );
  return data.data;
}

/**
 * 회원 탈퇴. 되돌릴 수 없다.
 * 성공 응답이 refresh token 쿠키를 만료시키므로 로그아웃을 따로 부르지 않는다(apiClient가 쿠키를 함께 주고받는다)
 */
export async function deleteMyAccount() {
  await apiClient.delete("/api/v1/users/me");
}
