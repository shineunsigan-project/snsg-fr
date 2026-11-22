import { useQuery } from "@tanstack/react-query";

import {
  getClosingSoonSchedules,
  getNewlyOpenedSchedules,
  getNextSchedule,
} from "../api/homeSchedules";
import { scheduleQueryKeys } from "./scheduleQueryKeys";

/** 홈으로 돌아올 때마다 바로 다시 받지 않는 시간. 개설·참여로 무효화하면 이 시간과 상관없이 다시 받는다 */
const HOME_STALE_TIME = 30_000;

/** 다가오는 내 일정 1건. 로그인한 뒤에만 받는다. 없으면 `null` */
export function useNextSchedule(enabled: boolean) {
  return useQuery({
    queryKey: scheduleQueryKeys.homeNext,
    queryFn: ({ signal }) => getNextSchedule(signal),
    staleTime: HOME_STALE_TIME,
    enabled,
  });
}

/** 곧 마감돼요 */
export function useClosingSoonSchedules() {
  return useQuery({
    queryKey: scheduleQueryKeys.homeClosingSoon,
    queryFn: ({ signal }) => getClosingSoonSchedules(signal),
    staleTime: HOME_STALE_TIME,
  });
}

/** 새로 열린 일정. `activityId`가 있으면 그 활동만 받는다 */
export function useNewlyOpenedSchedules(activityId?: string) {
  return useQuery({
    queryKey: scheduleQueryKeys.homeNewlyOpened(activityId),
    queryFn: ({ signal }) => getNewlyOpenedSchedules(activityId, signal),
    staleTime: HOME_STALE_TIME,
  });
}
