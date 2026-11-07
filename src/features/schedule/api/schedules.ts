import type { ScheduleStatus } from "../types";
import { apiClient, type ApiSuccess } from "@/shared/lib/api/client";

// TODO(API): 미확정 — 일정 목록 임시 계약. api-guide에 일정 API가 아직 없다. 지금은 MSW(src/mocks/handlers.ts)로만 응답한다

/** 홈 목록 카드에 필요한 최소 정보 (USER_FLOW §11 일정 목록) */
export type ScheduleListItem = {
  scheduleId: number;
  /** 활동 이름 (예: 보드게임) */
  activityName: string;
  title: string;
  /** 한국 시간 `YYYY-MM-DDTHH:mm:ss` */
  startAt: string;
  place: { name: string; regionName?: string };
  participantCount: number;
  capacity: number;
  status: ScheduleStatus;
};

/** 모집 중 일정 목록 */
export async function getSchedules() {
  const { data } =
    await apiClient.get<ApiSuccess<ScheduleListItem[]>>("/api/v1/schedules");
  return data.data;
}
