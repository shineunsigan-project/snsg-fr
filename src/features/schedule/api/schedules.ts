import type { ScheduleListTab, ScheduleStatus } from "../types";
import { apiClient, type ApiSuccess } from "@/shared/lib/api/client";

// TODO(API): 미확정 — 일정 목록 임시 계약. api-guide에 일정 API가 아직 없다. 지금은 MSW(src/mocks/handlers.ts)로만 응답한다
// 백엔드에 확인할 것: page 번호 대신 커서 방식(목록이 바뀌면 [더 보기]에서 겹치거나 빠진다), 로그인 필요 목록의 401 code

/** 한 번에 불러오는 개수 (팀 결정 2026-11-02, F-18) */
export const SCHEDULE_PAGE_SIZE = 20;

/** 목록 카드에 필요한 정보 (USER_FLOW §5). 장소명·비용은 목록에 보여주지 않아 받지 않는다 */
export type ScheduleListItem = {
  scheduleId: number;
  /** 활동 이름 (예: 보드게임) */
  activityName: string;
  title: string;
  /** 한국 시간 `YYYY-MM-DDTHH:mm:ss` */
  startAt: string;
  /** 시·군·구 이름 (예: 마포구) */
  regionName: string;
  participantCount: number;
  capacity: number;
  status: ScheduleStatus;
  /** 새로 개설한 일정 (개설한 일정 탭의 NEW 배지). 기준은 서버가 정한다 */
  isNew?: boolean;
};

export type SchedulePage = {
  schedules: ScheduleListItem[];
  /** 다음 목록이 있으면 [더 보기]를 보여준다 */
  hasNext: boolean;
};

/** 모집 중 목록 필터. 지역은 하나만 고른다 (팀 결정 2026-11-02) */
export type ScheduleFilter = {
  /** 활동 목록 API의 `id` */
  activityId?: string;
  /** 시·군·구 코드 5자리 */
  regionCode?: string;
  /** `YYYY-MM-DD`. 시작일만 있으면 하루 */
  startDate?: string;
  endDate?: string;
  /** `HH:mm`. 이 시각 이후에 시작하는 일정만 (시안 LIST-03 날짜·시간, 2026-11-02) */
  startTime?: string;
};

const LIST_PATHS: Record<ScheduleListTab, string> = {
  recruiting: "/api/v1/schedules",
  joined: "/api/v1/users/me/schedules/joined",
  created: "/api/v1/users/me/schedules/created",
};

/**
 * 탭별 일정 목록. page는 0부터
 * - 모집 중: 시작 시간 빠른 순, 같으면 최근 개설 순. 필터를 쓴다
 * - 참여한·개설한: 진행 예정 일정을 시작 빠른 순, 그 아래 지난 일정을 시작 최근 순. 필터는 없다. 로그인 필요(401)
 */
export async function getScheduleList({
  tab,
  page,
  filter = {},
  signal,
}: {
  tab: ScheduleListTab;
  page: number;
  filter?: ScheduleFilter;
  /** 필터를 바꾸거나 화면을 떠나면 이전 요청을 취소한다 */
  signal?: AbortSignal;
}) {
  const { data } = await apiClient.get<ApiSuccess<SchedulePage>>(
    LIST_PATHS[tab],
    {
      params: {
        ...(tab === "recruiting" ? filter : {}),
        page,
        size: SCHEDULE_PAGE_SIZE,
      },
      signal,
    },
  );
  return data.data;
}
