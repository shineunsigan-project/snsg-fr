import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getScheduleParticipants,
  PARTICIPANT_LIST_FORBIDDEN,
} from "../api/scheduleDetail";
import { scheduleQueryKeys } from "./scheduleQueryKeys";
import { getApiErrorCode } from "@/shared/lib/api/client";

/**
 * 참여자 명단. 볼 수 있는 확정 참여자·개설자일 때 켠다(F-6). 접힌 요약의 사진에도 쓴다 (사용자 결정 2026-11-11).
 * 403이면 그 사이 역할이 바뀐 것(다른 기기에서 참여 취소 등)이라 상세를 다시 불러 그린다 (api-guide 참여자 명단)
 */
export function useScheduleParticipants(scheduleId: string, enabled: boolean) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: scheduleQueryKeys.participants(scheduleId),
    queryFn: async () => {
      try {
        return await getScheduleParticipants(scheduleId);
      } catch (error) {
        if (getApiErrorCode(error) === PARTICIPANT_LIST_FORBIDDEN) {
          void queryClient.invalidateQueries({
            queryKey: scheduleQueryKeys.detail(scheduleId),
            exact: true,
          });
        }
        throw error;
      }
    },
    enabled,
  });
}
