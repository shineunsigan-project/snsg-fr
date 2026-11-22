import { getScheduleList, type ScheduleListItem } from "./schedules";
import type { ScheduleDuration } from "../types";
import { apiClient, type ApiSuccess } from "@/shared/lib/api/client";

// 홈(LIST-06) 데이터 (snsg-be api-guide "다가오는 내 일정"·"일정 목록", develop 96f6cee)

/** 곧 마감돼요에 보여주는 최대 개수 (기획 v1.5 8쪽) */
export const CLOSING_SOON_LIMIT = 10;
/** 새로 열린 일정에 보여주는 개수 (홈 화면 시안) */
export const NEWLY_OPENED_LIMIT = 5;

/** 다가오는 내 일정 1건. 목록 카드 필드에 장소명·예상 소요·참여자 사진이 더해진다 */
export type NextSchedule = ScheduleListItem & {
  /** 장소 이름. 개설 시점의 값 */
  placeName: string;
  durationType: ScheduleDuration;
  /** 참여자 프로필 사진 경로(도메인 없이) 앞 3명. 개설자가 첫 번째다. 탈퇴한 사람은 기본 이미지 경로가 온다 */
  participantProfileImageUrls: string[];
};

/**
 * 다가오는 내 일정: 내가 참여 확정했거나 내가 연 일정 중 취소되지 않고 시작 전인 것 가운데 가장 빠른 1건. 로그인 필요(401).
 * 대상이 없으면 오류가 아니라 `data` 키가 빠진 200이다. 그때는 null을 돌려준다.
 * 시작 여부는 서버가 판정한다(시작한 일정은 오지 않는다)
 */
export async function getNextSchedule(
  signal?: AbortSignal,
): Promise<NextSchedule | null> {
  const { data } = await apiClient.get<
    ApiSuccess<NextSchedule | undefined> | { isSuccess: true }
  >("/api/v1/schedules/next", { signal });
  return "data" in data && data.data ? data.data : null;
}

/** 곧 마감돼요: 서버의 마감 임박 순(시작이 오늘~모레, 자리가 적은 순, 정원이 찬 일정 제외)으로 10개. 로그인 필요 없음 */
export async function getClosingSoonSchedules(signal?: AbortSignal) {
  const page = await getScheduleList({
    tab: "recruiting",
    sort: "CLOSING_SOON",
    size: CLOSING_SOON_LIMIT,
    signal,
  });
  return page.items;
}

/**
 * 새로 열린 일정: 서버의 최근 열린 순으로 5개 (홈 화면 시안, 모집완료도 보인다).
 * `activityId`가 있으면 그 활동만 받는다
 */
export async function getNewlyOpenedSchedules(
  activityId?: string,
  signal?: AbortSignal,
) {
  const page = await getScheduleList({
    tab: "recruiting",
    sort: "LATEST",
    size: NEWLY_OPENED_LIMIT,
    filter: activityId ? { activityId } : {},
    signal,
  });
  return page.items;
}
