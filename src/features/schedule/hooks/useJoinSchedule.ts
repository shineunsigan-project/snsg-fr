import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  isScheduleConflict,
  isScheduleNotFound,
  postParticipation,
} from "../api/scheduleDetail";
import { scheduleQueryKeys } from "./scheduleQueryKeys";

/**
 * 참여 (DTL-03). 신청 즉시 확정된다.
 * 성공하거나 409·404로 거부되면 상세·명단·목록(모두 `schedules` 키 아래)을 다시 받아 최신 상태로 그린다
 */
export function useJoinSchedule(scheduleId: string) {
  const queryClient = useQueryClient();
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: scheduleQueryKeys.schedules });
  return useMutation({
    mutationFn: () => postParticipation(scheduleId),
    onSuccess: refresh,
    onError: (error) => {
      if (isScheduleConflict(error) || isScheduleNotFound(error)) refresh();
    },
  });
}
