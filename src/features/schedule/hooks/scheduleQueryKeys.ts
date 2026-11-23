import type { HistoryRole } from "../api/scheduleHistory";
import type { ScheduleFilter } from "../api/schedules";
import type { ScheduleListTab } from "../types";

export const scheduleQueryKeys = {
  /** 일정 목록 전체. 개설·참여 뒤 이 키 아래를 무효화한다 */
  schedules: ["schedules"] as const,
  /** 참여한·개설한 탭은 필터를 쓰지 않으므로 키에서도 빼서, 필터가 바뀌어도 다시 받지 않는다 */
  list: (tab: ScheduleListTab, filter: ScheduleFilter) =>
    ["schedules", "list", tab, tab === "recruiting" ? filter : {}] as const,
  /** 홈의 다가오는 내 일정 1건. 목록 키 아래에 두어 개설·참여 뒤 함께 무효화한다 */
  homeNext: ["schedules", "home", "next"] as const,
  /** 홈의 곧 마감돼요 */
  homeClosingSoon: ["schedules", "home", "closing-soon"] as const,
  /** 홈의 새로 열린 일정. 활동을 고르면 그 활동만 */
  homeNewlyOpened: (activityId?: string) =>
    ["schedules", "home", "newly-opened", activityId ?? "all"] as const,
  /** 참여 이력(지난 일정). 목록 키 아래에 두어 개설·참여 뒤 함께 무효화한다 */
  history: (role: HistoryRole) => ["schedules", "history", role] as const,
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
