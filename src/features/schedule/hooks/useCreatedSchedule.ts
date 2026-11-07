import { useQuery } from "@tanstack/react-query";

import { getCreatedSchedule } from "../api/scheduleCreate";
import { scheduleQueryKeys } from "./scheduleQueryKeys";

/** 개설 완료 팝업(CRT-07)에 보여줄 일정. ID가 없으면 부르지 않는다 */
export function useCreatedSchedule(scheduleId: number | null) {
  return useQuery({
    queryKey: scheduleQueryKeys.created(scheduleId ?? 0),
    queryFn: () => getCreatedSchedule(scheduleId ?? 0),
    enabled: scheduleId !== null,
  });
}
