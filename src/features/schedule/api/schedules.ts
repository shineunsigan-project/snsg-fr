import type { ScheduleListTab, ScheduleStatus } from "../types";
import { apiClient, type ApiSuccess } from "@/shared/lib/api/client";

// 일정 목록 (snsg-be api-guide "일정 목록", develop e746440). 필드 이름은 서버 응답 그대로 쓴다

/** 한 번에 불러오는 개수 (팀 결정 2026-11-02, F-18) */
export const SCHEDULE_PAGE_SIZE = 20;

/** 목록 카드 하나. 장소명·주소·대표 이미지·비용은 목록에 오지 않는다 */
export type ScheduleListItem = {
  /** 일정 ID(UUID 문자열) */
  id: string;
  /** 활동. 활동 정보를 찾을 수 없으면 `name`이 빈 문자열 */
  category: { id: string; name: string };
  title: string;
  /** 시·군·구 이름 (예: 마포구). 지역 정보를 찾을 수 없으면 빈 문자열 */
  regionName: string;
  /** 한국 시간 `YYYY-MM-DDTHH:mm:ss` */
  startAt: string;
  /** 확정 인원 (개설자 포함) */
  confirmedCount: number;
  /** 정원 (개설자 포함) */
  capacity: number;
  /** capacity − confirmedCount */
  remainingSeats: number;
  /** 서버가 정한 표시 상태. 목록에는 `RECRUITING`·`RECRUITMENT_CLOSED`·`CANCELED`만 온다 */
  displayStatus: ScheduleStatus;
  /** 개설 일시. 한국 시간, 오프셋 없음 */
  createdAt: string;
};

export type SchedulePage = {
  items: ScheduleListItem[];
  /** 다음 페이지 커서(불투명 문자열). 마지막 페이지면 null */
  nextCursor: string | null;
};

/** 커서가 잘못됐다. 처음부터 다시 받는다 */
export const INVALID_CURSOR = "INVALID_CURSOR";

/** 모집 중 목록 필터. 활동·지역은 하나만 고른다 (팀 결정 2026-11-02) */
export type ScheduleFilter = {
  /** 활동 목록 API의 `id` */
  activityId?: string;
  /** 시·군·구 코드 5자리 */
  regionCode?: string;
  /** `YYYY-MM-DD`. 시작일만 있으면 하루 */
  startDate?: string;
  endDate?: string;
};

const LIST_PATHS: Record<ScheduleListTab, string> = {
  recruiting: "/api/v1/schedules",
  joined: "/api/v1/schedules/participating",
  created: "/api/v1/schedules/hosted",
};

/** 필터 → 쿼리. 값이 없는 항목은 보내지 않는다(빈 값으로 보내면 빈 결과가 된다) */
const toFilterParams = (filter: ScheduleFilter) => ({
  ...(filter.activityId ? { categoryIds: filter.activityId } : {}),
  ...(filter.regionCode ? { regionCodes: filter.regionCode } : {}),
  ...(filter.startDate ? { startDate: filter.startDate } : {}),
  ...(filter.endDate ? { endDate: filter.endDate } : {}),
});

/**
 * 탭별 일정 목록. 세 목록 모두 시작 빠른 순, 같으면 id 순으로 온다. 받은 순서 그대로 그린다
 * - 모집 중: 시작 전 일정. 필터를 쓴다. 로그인 필요 없음
 * - 참여한·개설한: 완료(시작 + 12시간) 전 일정. 필터 없음. 로그인 필요(401)
 * cursor를 빼면 첫 페이지다
 */
export async function getScheduleList({
  tab,
  cursor,
  filter = {},
  signal,
}: {
  tab: ScheduleListTab;
  cursor?: string;
  filter?: ScheduleFilter;
  /** 필터를 바꾸거나 화면을 떠나면 이전 요청을 취소한다 */
  signal?: AbortSignal;
}) {
  const { data } = await apiClient.get<ApiSuccess<SchedulePage>>(
    LIST_PATHS[tab],
    {
      params: {
        ...(tab === "recruiting" ? toFilterParams(filter) : {}),
        ...(cursor ? { cursor } : {}),
        size: SCHEDULE_PAGE_SIZE,
      },
      signal,
    },
  );
  return data.data;
}
