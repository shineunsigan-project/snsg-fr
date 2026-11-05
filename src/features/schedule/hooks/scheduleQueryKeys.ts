import type { ScheduleFilter } from "../api/schedules";
import type { ScheduleListTab } from "../types";

export const scheduleQueryKeys = {
  /** 일정 목록 전체. 개설·참여 뒤 이 키 아래를 무효화한다 */
  schedules: ["schedules"] as const,
  list: (tab: ScheduleListTab, filter: ScheduleFilter) =>
    ["schedules", "list", tab, filter] as const,
  activities: ["activities"] as const,
  regions: ["regions"] as const,
  /** 일정 상세. 참여·참여 취소·전체 취소 뒤 무효화한다 */
  detail: (scheduleId: string) => ["schedules", "detail", scheduleId] as const,
  /** 참여자 명단. 상세 키 아래에 두어 상세를 무효화하면 함께 다시 불러온다 */
  participants: (scheduleId: string) =>
    ["schedules", "detail", scheduleId, "participants"] as const,
  /** 지역 코드가 빈 문자열이면 전체 지역 */
  places: (categoryId: string, regionCode: string) =>
    ["places", categoryId, regionCode] as const,
};
