import { SCHEDULE_PAGE_SIZE, type SchedulePage } from "./schedules";
import { apiClient, type ApiSuccess } from "@/shared/lib/api/client";

// 지난 일정 목록 (snsg-be api-guide "참여한 일정 목록"·"개설한 일정 목록"의 `period=PAST`, develop 96f6cee)

/** 목록 항목에는 역할이 없다. 어느 목록에서 왔는지로 정한다 */
export type HistoryRole = "participant" | "host";

const HISTORY_PATHS: Record<HistoryRole, string> = {
  participant: "/api/v1/schedules/participating",
  host: "/api/v1/schedules/hosted",
};

/**
 * 지난 일정 한 페이지. 시작 늦은 순, 같으면 id 역순이다. 로그인 필요(401)
 * - participant: 내가 연 일정과 참여를 취소한 일정은 빠진다
 * - host: 내가 연 일정
 */
export async function getScheduleHistory({
  role,
  cursor,
  signal,
}: {
  role: HistoryRole;
  cursor?: string;
  signal?: AbortSignal;
}) {
  const { data } = await apiClient.get<ApiSuccess<SchedulePage>>(
    HISTORY_PATHS[role],
    {
      params: {
        period: "PAST",
        ...(cursor ? { cursor } : {}),
        size: SCHEDULE_PAGE_SIZE,
      },
      signal,
    },
  );
  return data.data;
}
