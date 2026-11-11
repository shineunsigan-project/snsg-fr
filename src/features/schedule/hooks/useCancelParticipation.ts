import { useMutation, useQueryClient } from "@tanstack/react-query";

import { deleteParticipation } from "../api/scheduleDetail";
import { refreshScheduleDetail } from "./refreshScheduleDetail";

/** 참여 취소 (DTL-07). 성공이든 실패든 상세·목록을 다시 받아 서버 상태로 그린다 */
export function useCancelParticipation(scheduleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deleteParticipation(scheduleId),
    onSettled: () => refreshScheduleDetail(queryClient, scheduleId),
  });
}
