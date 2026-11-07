import { useQuery } from "@tanstack/react-query";

import { getSchedules } from "../api/schedules";
import { scheduleQueryKeys } from "./scheduleQueryKeys";

/** 모집 중 일정 목록. 일정을 열면 이 키를 무효화해 새 일정이 보인다 */
export function useSchedules() {
  return useQuery({
    queryKey: scheduleQueryKeys.schedules,
    queryFn: getSchedules,
  });
}
