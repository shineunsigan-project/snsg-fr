import { isValid, parseISO } from "date-fns";

import type { ScheduleFilter } from "../api/schedules";
import type { ScheduleListTab } from "../types";

// 홈 목록의 탭과 필터 값은 URL에만 둔다. 기기에 저장하지 않는다 (rules/api.md 상태 위치, 팀 결정 2026-11-02)
// ?tab=joined&activity=<활동 UUID>&region=11440&from=2026-11-02&to=2026-11-05&time=18:00
// 주소는 사용자가 고치거나 공유할 수 있어 잘못된 값은 없는 것으로 본다
// TODO(API): 목록에 없는 활동·지역 값(`?activity=<없는 UUID>`)은 형식만 맞으면 그대로 보낸다. 서버가 무시할지 오류를 줄지 정해지면 맞춘다

const TABS: readonly ScheduleListTab[] = ["recruiting", "joined", "created"];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const REGION_PATTERN = /^\d{5}$/;
/** 활동·일정 ID 형식 (api-guide의 UUID 문자열) */
export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

type ReadableParams = Pick<URLSearchParams, "get">;

/** 형식이 맞고 실제로 있는 날짜(`2026-02-31` 제외) */
const isDateParam = (value: string) =>
  DATE_PATTERN.test(value) && isValid(parseISO(value));

export function readScheduleTab(params: ReadableParams): ScheduleListTab {
  const tab = params.get("tab");
  return TABS.find((value) => value === tab) ?? "recruiting";
}

export function readScheduleFilter(params: ReadableParams): ScheduleFilter {
  const activityId = params.get("activity") ?? "";
  const regionCode = params.get("region") ?? "";
  const startDate = params.get("from") ?? "";
  const endDate = params.get("to") ?? "";
  const startTime = params.get("time") ?? "";
  const hasStartDate = isDateParam(startDate);
  return {
    ...(UUID_PATTERN.test(activityId) ? { activityId } : {}),
    ...(REGION_PATTERN.test(regionCode) ? { regionCode } : {}),
    ...(hasStartDate ? { startDate } : {}),
    // 종료일은 시작일이 있고 시작일보다 앞서지 않을 때만. 아니면 시작일 하루로 본다
    ...(hasStartDate && isDateParam(endDate) && endDate >= startDate
      ? { endDate }
      : {}),
    ...(TIME_PATTERN.test(startTime) ? { startTime } : {}),
  };
}

/** 탭·필터를 주소 쿼리로. 기본값(모집 중, 필터 없음)은 빼서 주소를 짧게 둔다 */
export function toScheduleListQuery(
  tab: ScheduleListTab,
  filter: ScheduleFilter,
) {
  const params = new URLSearchParams();
  if (tab !== "recruiting") params.set("tab", tab);
  if (filter.activityId) params.set("activity", filter.activityId);
  if (filter.regionCode) params.set("region", filter.regionCode);
  if (filter.startDate) params.set("from", filter.startDate);
  if (filter.endDate) params.set("to", filter.endDate);
  if (filter.startTime) params.set("time", filter.startTime);
  const query = params.toString();
  return query ? `/?${query}` : "/";
}
