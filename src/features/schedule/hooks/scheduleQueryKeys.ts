import type { ScheduleFilter } from "../api/schedules";
import type { ScheduleListTab } from "../types";

export const scheduleQueryKeys = {
  /** 일정 목록 전체. 개설·참여 뒤 이 키 아래를 무효화한다 */
  schedules: ["schedules"] as const,
  list: (tab: ScheduleListTab, filter: ScheduleFilter) =>
    ["schedules", "list", tab, filter] as const,
  activities: ["activities"] as const,
  regions: ["regions"] as const,
  /** 지역 코드가 빈 문자열이면 전체 지역 */
  places: (categoryId: string, regionCode: string) =>
    ["places", categoryId, regionCode] as const,
};
