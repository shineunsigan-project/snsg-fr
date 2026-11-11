import { useMutation, useQueryClient } from "@tanstack/react-query";

import { cancelSchedule } from "../api/scheduleDetail";
import { refreshScheduleDetail } from "./refreshScheduleDetail";

/**
 * 일정 전체 취소 (HOST-01, 개설자). 앞뒤 공백을 뺀 사유를 보낸다. 사유를 상세에 보여주지는 않는다 (F-20).
 * 성공이든 실패든 상세·목록을 다시 받아 서버 상태로 그린다
 */
export function useCancelSchedule(scheduleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reason: string) =>
      cancelSchedule(scheduleId, { reason: reason.trim() }),
    onSettled: () => refreshScheduleDetail(queryClient, scheduleId),
  });
}
