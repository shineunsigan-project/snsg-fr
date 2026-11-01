import type { ScheduleDuration } from "../types";
import type { Region } from "./regions";
import { apiClient, type ApiSuccess } from "@/shared/lib/api/client";

// TODO(API): 미확정 — 활동 목록·일정 생성은 백엔드 스펙이 없어 임시 계약이다. 지금은 MSW(src/mocks/handlers.ts)로만 응답한다
// 장소 검색은 백엔드 장소 API가 생기기 전까지 이 앱의 Route Handler(/api/places)가 네이버 지역 검색을 대신 호출한다

/** 사용 중인 활동 정보 (MVP: 보드게임 / 방탈출 / 산책) */
export type Activity = {
  activityId: number;
  name: string;
  /** 장소 검색어 뒷부분 (보드게임 → 보드게임카페). 정의서 UI-02-1 "활동 정보의 검색 키워드" */
  searchKeyword: string;
};

/** 개설 장소. 일정에 함께 저장한다 (기능 요구사항 정의서 v0.3 03 장소 관리) */
export type Place = {
  /** 외부 장소 ID. 네이버 지역 검색은 주지 않는다 */
  externalPlaceId?: string;
  name: string;
  roadAddress: string;
  latitude: number;
  longitude: number;
  /** 법정동 코드 10자리. TODO(API): 주소→코드 변환 API가 정해지기 전까지 시·군·구 5자리만 채운다 */
  regionCode: string;
};

export type CreateScheduleRequest = {
  activityId: number;
  place: Place;
  /** 콘텐츠 활동명 = 일정 제목 */
  title: string;
  duration: ScheduleDuration;
  description: string;
  /** 한국 시간 `YYYY-MM-DDTHH:mm:ss` */
  startAt: string;
  /** 개설자 포함 전체 인원 */
  capacity: number;
};

export type CreateScheduleResponse = { scheduleId: number };

/** 개설 완료 팝업(CRT-07)에 필요한 최소 정보. TODO(API): 미확정 — 개설 완료 API가 정해지면 맞춘다 */
export type CreatedSchedule = {
  scheduleId: number;
  place: { name: string };
};

/** 시간 겹침으로 개설 거부 (기능 요구사항 정의서 v0.3 04 개설) */
export const SCHEDULE_TIME_CONFLICT = "SCHEDULE_TIME_CONFLICT";
/** TODO(API): 시작 시각이 지금 + 1시간 미만일 때의 오류 코드는 가정이다 */
export const INVALID_START_TIME = "INVALID_START_TIME";

/** 활동 목록 조회 — 상태가 '사용'인 활동만 */
export async function getActivities() {
  const { data } =
    await apiClient.get<ApiSuccess<Activity[]>>("/api/v1/activities");
  return data.data;
}

/** 장소 검색. 넘긴 지역마다 검색해 합친다 (`전체`는 모든 지역) */
export async function getPlaces({
  keyword,
  regions,
}: {
  keyword: string;
  regions: readonly Region[];
}) {
  // Route Handler는 지역 목록 API를 부르지 않으므로 검색어에 쓸 지역 이름을 코드와 함께 넘긴다
  const params = new URLSearchParams({ keyword });
  for (const region of regions) {
    params.append("region", `${region.code}:${region.name}`);
  }
  // 백엔드가 아니라 이 앱의 Route Handler로 보낸다. baseURL을 비워 같은 출처로 요청한다
  const { data } = await apiClient.get<ApiSuccess<Place[]>>("/api/places", {
    baseURL: "",
    params,
  });
  return data.data;
}

/** 개설 완료 정보 조회. TODO(API): 미확정 — 경로·필드는 가정이다 */
export async function getCreatedSchedule(scheduleId: number) {
  const { data } = await apiClient.get<ApiSuccess<CreatedSchedule>>(
    `/api/v1/schedules/${scheduleId}/created`,
  );
  return data.data;
}

/** 일정 생성. 로그인해야 한다(401) */
export async function postSchedule(body: CreateScheduleRequest) {
  const { data } = await apiClient.post<ApiSuccess<CreateScheduleResponse>>(
    "/api/v1/schedules",
    body,
  );
  return data.data;
}
