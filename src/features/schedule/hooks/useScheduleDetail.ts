import { useQuery } from "@tanstack/react-query";

import { getScheduleDetail } from "../api/scheduleDetail";
import { scheduleQueryKeys } from "./scheduleQueryKeys";

/**
 * 일정 상세. 보는 사람의 역할(viewerRole)이 토큰에 따라 달라지므로 로그인 복구가 끝난 뒤(enabled)에 부른다.
 * 로그아웃하면 useLogout이 이 데이터를 지워 다시 받는다
 */
export function useScheduleDetail(scheduleId: string | null, enabled = true) {
  return useQuery({
    queryKey: scheduleQueryKeys.detail(scheduleId ?? ""),
    queryFn: () => getScheduleDetail(scheduleId ?? ""),
    enabled: enabled && scheduleId !== null,
  });
}
