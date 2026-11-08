import type { ScheduleDuration } from "../types";
import { apiClient, type ApiSuccess } from "@/shared/lib/api/client";

/** 장소 후보. 개설할 때는 `id`만 보내고, 서버가 개설 시점의 장소 정보를 저장한다 (api-guide 장소 후보) */
export type Place = {
  /** 장소 ID(UUID 문자열). 일정 개설 요청의 `placeId` */
  id: string;
  name: string;
  /** 도로명주소(없으면 지번주소). 상세주소는 들어 있지 않다 */
  roadAddress: string;
  /** 상세주소(층 등). 없으면 빈 문자열 */
  addressDetail: string;
  latitude: number;
  longitude: number;
  /** 지역 목록 API의 `code` (시군구 5자리) */
  regionCode: string;
};

/** 표시용 주소. 상세주소는 도로명주소 뒤에 붙인다 */
export const formatPlaceAddress = (place: Place) =>
  place.addressDetail
    ? `${place.roadAddress} ${place.addressDetail}`
    : place.roadAddress;

export type CreateScheduleRequest = {
  /** 활동 목록 API의 `id` */
  categoryId: string;
  /** 장소 후보 API의 `id` */
  placeId: string;
  /** 콘텐츠 활동명 = 일정 제목 */
  title: string;
  durationType: ScheduleDuration;
  description: string;
  /** 한국 시간 `YYYY-MM-DDTHH:mm:ss` */
  startAt: string;
  /** 개설자 포함 전체 인원 */
  capacity: number;
};

export type CreateScheduleResponse = {
  /** 만든 일정의 ID(UUID 문자열) */
  scheduleId: string;
};

/** 장소 후보 조회 오류: 활동·지역을 다시 고르게 한다 */
export const INVALID_CATEGORY = "INVALID_CATEGORY";
export const INVALID_REGION = "INVALID_REGION";
/** 일정 개설 오류 (api-guide 일정 개설) */
export const INVALID_PLACE = "INVALID_PLACE";
export const INVALID_START_AT = "INVALID_START_AT";
export const INVALID_CAPACITY = "INVALID_CAPACITY";
/** 활동명·설명 길이 위반. 서버의 안전망이라 요청 검증을 통과한 값이면 나지 않는다 */
export const INVALID_TITLE = "INVALID_TITLE";
export const INVALID_DESCRIPTION = "INVALID_DESCRIPTION";
export const SCHEDULE_TIME_CONFLICT = "SCHEDULE_TIME_CONFLICT";
/** 탈퇴한 사용자가 남은 access token으로 호출했다 */
export const USER_NOT_ACTIVE = "USER_NOT_ACTIVE";

/** 장소 후보. 지역을 빼면 서비스 중인 전체 지역이다. 지역 순서, 같은 지역은 장소명 순으로 온다. 인증이 필요 없다 */
export async function getPlaces({
  categoryId,
  regionCode,
}: {
  categoryId: string;
  regionCode?: string;
}) {
  const { data } = await apiClient.get<ApiSuccess<Place[]>>(
    "/api/v1/place-candidates",
    { params: regionCode ? { categoryId, regionCode } : { categoryId } },
  );
  return data.data;
}

/** 일정 개설. 로그인해야 한다(401). 성공하면 201 */
export async function postSchedule(body: CreateScheduleRequest) {
  const { data } = await apiClient.post<ApiSuccess<CreateScheduleResponse>>(
    "/api/v1/schedules",
    body,
  );
  return data.data;
}
