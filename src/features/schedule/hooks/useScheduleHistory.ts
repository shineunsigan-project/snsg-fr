import { isAxiosError } from "axios";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { getScheduleHistory, type HistoryRole } from "../api/scheduleHistory";
import type { ScheduleListItem } from "../api/schedules";
import { scheduleQueryKeys } from "./scheduleQueryKeys";

/** 지난 일정은 바뀌지 않으므로 오래 두되, 개설·참여 뒤 무효화하면 다시 받는다 */
const HISTORY_STALE_TIME = 30_000;
/** 첫 페이지는 cursor 없이 부른다 */
const FIRST_PAGE_CURSOR: string | undefined = undefined;

export type HistoryItem = ScheduleListItem & { role: HistoryRole };

/** 시작 늦은 순, 같으면 id 역순 (서버 정렬과 같다). 값이 클수록 앞이다 */
const compareNewestFirst = (a: ScheduleListItem, b: ScheduleListItem) => {
  if (a.startAt !== b.startAt) return a.startAt < b.startAt ? 1 : -1;
  if (a.id !== b.id) return a.id < b.id ? 1 : -1;
  return 0;
};

function useHistoryList(role: HistoryRole, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: scheduleQueryKeys.history(role),
    queryFn: ({ pageParam, signal }) =>
      getScheduleHistory({ role, cursor: pageParam, signal }),
    initialPageParam: FIRST_PAGE_CURSOR,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: HISTORY_STALE_TIME,
    enabled,
  });
}

/**
 * 참여 이력(MY-01-1). 참여한 지난 일정과 개설한 지난 일정은 합쳐 주는 API가 없어 두 목록을 받아 한 목록으로 합친다
 * (사용자 결정 2026-11-23). 각 목록이 이미 최근 순이므로 합친 뒤 같은 기준으로 다시 정렬한다.
 * 아직 더 받을 목록이 있으면 그 목록에서 가장 늦게 받은 일정보다 오래된 일정은 다른 목록에 더 있을 수 있어
 * 보여 주지 않는다. [더 보기]는 더 받을 수 있는 목록을 모두 다음 페이지로 받는다
 */
export function useScheduleHistory(enabled: boolean) {
  const participant = useHistoryList("participant", enabled);
  const host = useHistoryList("host", enabled);
  const lists = [participant, host];

  const participantData = participant.data;
  const participantHasNext = participant.hasNextPage;
  const hostData = host.data;
  const hostHasNext = host.hasNextPage;
  const items = useMemo<HistoryItem[] | undefined>(() => {
    if (!participantData || !hostData) return undefined;
    const sources = [
      {
        role: "participant" as const,
        data: participantData,
        hasNext: participantHasNext,
      },
      { role: "host" as const, data: hostData, hasNext: hostHasNext },
    ];
    const withRole: HistoryItem[] = sources.flatMap(({ role, data }) =>
      data.pages.flatMap((page) =>
        page.items.map((item) => ({ ...item, role })),
      ),
    );
    // 더 받을 목록들이 마지막으로 받은 일정 가운데 가장 앞선 것까지만 확실하다
    const boundaries = sources.flatMap(({ data, hasNext }) => {
      const last = hasNext ? data.pages.at(-1)?.items.at(-1) : undefined;
      return last ? [last] : [];
    });
    const boundary = boundaries.sort(compareNewestFirst)[0];
    return withRole
      .sort(compareNewestFirst)
      .filter((item) => !boundary || compareNewestFirst(item, boundary) <= 0);
  }, [participantData, participantHasNext, hostData, hostHasNext]);

  return {
    items,
    /** 첫 페이지를 한 목록이라도 못 받았다 */
    isInitialError: items === undefined && lists.some((list) => list.isError),
    hasNextPage: lists.some((list) => list.hasNextPage),
    isFetchingNextPage: lists.some((list) => list.isFetchingNextPage),
    isFetchNextPageError: lists.some((list) => list.isFetchNextPageError),
    /** 받은 오류. 401 판정에 쓰므로 한 목록이라도 401이면 그 오류를 먼저 준다 */
    error:
      lists.find(
        (list) =>
          isAxiosError(list.error) && list.error.response?.status === 401,
      )?.error ??
      lists.find((list) => list.error)?.error ??
      null,
    fetchNextPage: () =>
      Promise.all(
        lists
          .filter((list) => list.hasNextPage && !list.isFetchingNextPage)
          .map((list) => list.fetchNextPage()),
      ),
    refetch: () => Promise.all(lists.map((list) => list.refetch())),
  };
}
