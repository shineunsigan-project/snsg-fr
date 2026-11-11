import { hashKey, type QueryClient } from "@tanstack/react-query";

import { scheduleQueryKeys } from "./scheduleQueryKeys";

/**
 * 참여·참여 취소·일정 전체 취소 뒤에는 성공이든 실패든 상세를 다시 불러 그린다 (api-guide 일정 상세).
 * 목록도 바뀌므로 `schedules` 키 아래를 모두 다시 받는다.
 * 명단은 다시 받은 상세로 역할이 바뀐 뒤 지운다. 먼저 다시 받으면 참여를 취소한 사람의 명단 요청이 403이 된다.
 * 명단을 볼 수 있는 역할(개설자·확정 참여자)이면 다음 그리기에서 새로 받는다(접힌 요약 사진에도 쓴다)
 */
export async function refreshScheduleDetail(
  queryClient: QueryClient,
  scheduleId: string,
) {
  const participantsKey = scheduleQueryKeys.participants(scheduleId);
  await queryClient.invalidateQueries({
    queryKey: scheduleQueryKeys.schedules,
    predicate: (query) => query.queryHash !== hashKey(participantsKey),
  });
  queryClient.removeQueries({ queryKey: participantsKey, exact: true });
}
