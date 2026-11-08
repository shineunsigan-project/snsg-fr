import { apiClient, type ApiSuccess } from "@/shared/lib/api/client";

/** 고를 수 있는 활동 (MVP: 보드게임 / 방탈출 / 산책) */
export type Activity = {
  /** 활동 ID(UUID 문자열). 다른 API에 활동을 넘길 때 쓴다 */
  id: string;
  /** 표시 이름이 바뀌어도 그대로인 식별자(`BOARD_GAME` 등). 이 셋 밖의 코드도 올 수 있다 */
  code: string;
  name: string;
};

/** 활동 목록 — 활성 활동만, 서버가 정한 노출 순서 그대로 쓴다. 인증이 필요 없다 */
export async function getActivities() {
  const { data } = await apiClient.get<ApiSuccess<Activity[]>>(
    "/api/v1/activity-categories",
  );
  return data.data;
}
