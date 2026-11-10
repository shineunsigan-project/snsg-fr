import { useInfiniteQuery } from "@tanstack/react-query";

import { getScheduleList, type ScheduleFilter } from "../api/schedules";
import type { ScheduleListTab } from "../types";
import { scheduleQueryKeys } from "./scheduleQueryKeys";

/** 탭을 오갈 때 바로 다시 받지 않는 시간. 개설 등으로 무효화하면 이 시간과 상관없이 다시 받는다 */
const LIST_STALE_TIME = 30_000;
/** 첫 페이지는 cursor 없이 부른다 */
const FIRST_PAGE_CURSOR: string | undefined = undefined;

/**
 * 탭별 일정 목록. [더 보기]를 누르면 받은 `nextCursor`로 다음 20개를 붙인다. 필터는 모집 중 탭에만 쓴다.
 * 서버가 중복·누락 없이 순서대로 주므로 받은 그대로 이어 붙인다 (api-guide 일정 목록)
 */
export function useScheduleList(
  tab: ScheduleListTab,
  filter: ScheduleFilter,
  enabled = true,
) {
  return useInfiniteQuery({
    queryKey: scheduleQueryKeys.list(tab, filter),
    queryFn: ({ pageParam, signal }) =>
      getScheduleList({ tab, cursor: pageParam, filter, signal }),
    initialPageParam: FIRST_PAGE_CURSOR,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    select: (data) => data.pages.flatMap((page) => page.items),
    staleTime: LIST_STALE_TIME,
    enabled,
  });
}
