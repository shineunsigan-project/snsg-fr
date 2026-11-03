import { useInfiniteQuery, type InfiniteData } from "@tanstack/react-query";

import {
  getScheduleList,
  type ScheduleFilter,
  type SchedulePage,
} from "../api/schedules";
import type { ScheduleListTab } from "../types";
import { scheduleQueryKeys } from "./scheduleQueryKeys";

/** 탭을 오갈 때 바로 다시 받지 않는 시간. 개설 등으로 무효화하면 이 시간과 상관없이 다시 받는다 */
const LIST_STALE_TIME = 30_000;

/**
 * 받은 페이지를 한 목록으로. page 번호 방식이라 사이에 목록이 바뀌면 같은 일정이 다음 페이지에 또 올 수 있어
 * 처음 나온 것만 남긴다 (TODO(API): 커서 방식 문의)
 */
function toUniqueSchedules(data: InfiniteData<SchedulePage>) {
  const seen = new Set<number>();
  return data.pages
    .flatMap((page) => page.schedules)
    .filter((schedule) => {
      if (seen.has(schedule.scheduleId)) return false;
      seen.add(schedule.scheduleId);
      return true;
    });
}

/** 탭별 일정 목록. [더 보기]를 누르면 다음 20개를 붙인다. 필터는 모집 중 탭에만 쓴다 */
export function useScheduleList(
  tab: ScheduleListTab,
  filter: ScheduleFilter,
  enabled = true,
) {
  // 참여한·개설한 탭은 필터를 쓰지 않으므로 키에서도 빼서, 필터가 바뀌어도 다시 받지 않는다
  const listFilter = tab === "recruiting" ? filter : {};
  return useInfiniteQuery({
    queryKey: scheduleQueryKeys.list(tab, listFilter),
    queryFn: ({ pageParam, signal }) =>
      getScheduleList({ tab, page: pageParam, filter: listFilter, signal }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      lastPage.hasNext ? lastPageParam + 1 : undefined,
    select: toUniqueSchedules,
    staleTime: LIST_STALE_TIME,
    enabled,
  });
}
