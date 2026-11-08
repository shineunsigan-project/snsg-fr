import { hashKey, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  deleteParticipation,
  isScheduleConflict,
  isScheduleNotFound,
} from "../api/scheduleDetail";
import { scheduleQueryKeys } from "./scheduleQueryKeys";

/**
 * 참여 취소 (DTL-07). 모집 중·모집 마감일 때만 서버가 받아 준다.
 * 성공하면 상세·목록을 다시 받고, 명단은 다시 받지 않고 지운다(미참여자가 다시 부르면 403, F-6).
 * 409·404로 거부되면 상세·명단·목록(모두 `schedules` 키 아래)을 다시 받아 최신 상태로 그린다
 */
export function useCancelParticipation(scheduleId: string) {
  const queryClient = useQueryClient();
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: scheduleQueryKeys.schedules });
  return useMutation({
    mutationFn: () => deleteParticipation(scheduleId),
    onSuccess: async () => {
      const participantsKey = scheduleQueryKeys.participants(scheduleId);
      await queryClient.invalidateQueries({
        queryKey: scheduleQueryKeys.schedules,
        predicate: (query) => query.queryHash !== hashKey(participantsKey),
      });
      // 다시 받은 상세로 역할이 바뀐 뒤 지운다. 먼저 지우면 아직 펼쳐 둔 명단이 바로 다시 요청된다
      queryClient.removeQueries({ queryKey: participantsKey, exact: true });
    },
    onError: (error) => {
      if (isScheduleConflict(error) || isScheduleNotFound(error)) refresh();
    },
  });
}
