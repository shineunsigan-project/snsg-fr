import { apiClient } from "@/shared/lib/api/client";

/**
 * 진행 중인 일정이 있어 탈퇴할 수 없을 때(409)의 code (USER_FLOW §4.5)
 * TODO(API): api-guide·openapi의 `DELETE /users/me`는 200·401만 있다. 검사와 code 이름은 백엔드에 요청 중이고,
 * 이 이름은 임시다(SHI-158 결정 Q3). 지금은 MSW로만 재현한다
 */
export const HAS_ACTIVE_SCHEDULE_CODE = "HAS_ACTIVE_SCHEDULE";

/**
 * 회원 탈퇴 (MY-04). access token으로 호출한다. 되돌릴 수 없다.
 * 서버가 쿠키를 비우지 않으므로 성공하면 이어서 deleteTokens(로그아웃)를 부른다 (api-guide 탈퇴)
 */
export async function deleteMyAccount() {
  await apiClient.delete("/api/v1/users/me");
}
