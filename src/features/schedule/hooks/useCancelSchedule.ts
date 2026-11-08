import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  cancelSchedule,
  isScheduleConflict,
  isScheduleNotFound,
} from "../api/scheduleDetail";
import { scheduleQueryKeys } from "./scheduleQueryKeys";

/**
 * 일정 전체 취소 (HOST-01, 개설자). 사유는 서버에 보내기만 한다 (F-20).
 * 성공하거나 409·404로 거부되면 상세·명단·목록(모두 `schedules` 키 아래)을 다시 받아 최신 상태로 그린다
 */
export function useCancelSchedule(scheduleId: string) {
  const queryClient = useQueryClient();
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: scheduleQueryKeys.schedules });
  return useMutation({
    mutationFn: (reason: string) =>
      cancelSchedule(scheduleId, { reason: reason.trim() }),
    onSuccess: refresh,
    onError: (error) => {
      if (isScheduleConflict(error) || isScheduleNotFound(error)) refresh();
    },
  });
}
