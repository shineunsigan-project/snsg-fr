import { useQuery } from "@tanstack/react-query";

import { getScheduleParticipants } from "../api/scheduleDetail";
import { scheduleQueryKeys } from "./scheduleQueryKeys";

/** 참여자 명단. 확정 참여자·개설자가 명단을 펼쳤을 때만 켠다 (F-6) */
export function useScheduleParticipants(scheduleId: string, enabled: boolean) {
  return useQuery({
    queryKey: scheduleQueryKeys.participants(scheduleId),
    queryFn: () => getScheduleParticipants(scheduleId),
    enabled,
  });
}
