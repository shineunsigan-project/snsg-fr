export const scheduleQueryKeys = {
  /** 일정 목록 전체. 개설·참여 뒤 이 키 아래를 무효화한다 */
  schedules: ["schedules"] as const,
  activities: ["activities"] as const,
  regions: ["regions"] as const,
  created: (scheduleId: number) =>
    ["schedules", "created", scheduleId] as const,
  places: (keyword: string, regionCodes: readonly string[]) =>
    ["places", keyword, ...regionCodes] as const,
};
