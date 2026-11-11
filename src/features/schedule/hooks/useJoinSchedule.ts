import { useMutation, useQueryClient } from "@tanstack/react-query";

import { postParticipation } from "../api/scheduleDetail";
import { refreshScheduleDetail } from "./refreshScheduleDetail";

/** 참여 (DTL-03). 신청 즉시 확정된다. 성공이든 실패든 상세·목록을 다시 받아 서버 상태로 그린다 */
export function useJoinSchedule(scheduleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => postParticipation(scheduleId),
    onSettled: () => refreshScheduleDetail(queryClient, scheduleId),
  });
}
