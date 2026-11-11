import type {
  AgeGroupPhase,
  ScheduleAction,
  ScheduleDuration,
  ScheduleStatus,
  ScheduleViewerRole,
} from "../types";
import type { Gender } from "@/features/auth/types";
import { getAccessToken } from "@/shared/lib/api/accessToken";
import {
  apiClient,
  getApiErrorCode,
  refreshAccessToken,
  type ApiSuccess,
} from "@/shared/lib/api/client";

// 일정 상세·참여자 명단·참여·참여 취소·일정 전체 취소 (snsg-be api-guide develop e746440). 필드 이름은 서버 응답 그대로 쓴다

/** 연령대. `{ decade: 20, phase: "LATE" }` = 20대 후반 */
export type AgeGroup = { decade: number; phase: AgeGroupPhase };

/**
 * 일정 상세 (USER_FLOW §7.2). 장소는 개설 때 값이다.
 * 서버는 `cancellation`(취소 사유·일시)도 주지만 상세에 보여주지 않아 받지 않는다 (사용자 결정 2026-11-11, TODO(F-20): 알림 기능이 생기면 보여준다)
 */
export type ScheduleDetail = {
  /** 일정 ID(UUID 문자열) */
  id: string;
  /** 활동명(일정 제목) */
  title: string;
  /** 간략 설명. 줄바꿈이 들어 있을 수 있다 */
  description: string;
  /** 한국 시간, 오프셋 없음 */
  startAt: string;
  createdAt: string;
  durationType: ScheduleDuration;
  /** 활동. 활동 정보를 찾을 수 없으면 `name`이 빈 문자열 */
  category: { id: string; name: string };
  host: {
    /** 탈퇴했으면 `탈퇴한 사용자` */
    nickname: string;
    /** 도메인 없는 경로. 탈퇴했으면 서버 기본 이미지 경로 */
    profileImageUrl: string;
    withdrawn: boolean;
  };
  /** 확정 인원 (개설자 포함) */
  confirmedCount: number;
  /** 정원 (개설자 포함) */
  capacity: number;
  /** capacity − confirmedCount */
  remainingSeats: number;
  /** 확정 참여자(개설자 포함) 요약. 명단을 펼칠 수 없는 사람도 받는다 (F-6) */
  participantSummary: {
    count: number;
    /** 성별을 알 수 없는 참여자는 어느 쪽에도 세지 않는다 */
    maleCount: number;
    femaleCount: number;
    /** 연령대를 아는 참여자가 없으면 둘 다 null. 그때는 연령대를 표시하지 않는다 */
    minAgeGroup: AgeGroup | null;
    maxAgeGroup: AgeGroup | null;
  };
  place: {
    name: string;
    roadAddress: string;
    /** 상세주소. 없으면 빈 문자열 */
    addressDetail: string;
    latitude: number;
    longitude: number;
    /** 시·군·구 이름. 지역 정보를 찾을 수 없으면 빈 문자열 */
    regionName: string;
  };
  /** 서버가 정한 표시 상태 */
  displayStatus: ScheduleStatus;
  /** 보는 사람의 역할. 토큰이 없거나 틀리면 GUEST */
  viewerRole: ScheduleViewerRole;
  /** 지금 누를 수 있는 동작. 들어 있는 동작의 버튼만 활성으로 그린다 */
  availableActions: ScheduleAction[];
};

/** 참여자 명단 한 줄 (DTL-06, HOST-02). 개설자가 맨 앞이다. 이름·이메일·생년월일·사용자 ID는 오지 않는다 */
export type ScheduleParticipant = {
  /** 탈퇴했으면 `탈퇴한 사용자` */
  nickname: string;
  /** 도메인 없는 경로. 탈퇴했으면 서버 기본 이미지 경로 */
  profileImageUrl: string;
  /** 사용자 정보를 찾을 수 없으면 null */
  gender: Gender | null;
  /** 탈퇴했거나 사용자 정보를 찾을 수 없으면 null */
  ageGroup: AgeGroup | null;
  isHost: boolean;
  isMe: boolean;
  withdrawn: boolean;
};

/** 일정 전체 취소 요청. 사유는 앞뒤 공백을 뺀 길이로 1~100자 */
export type CancelScheduleRequest = { reason: string };

/** 없거나 삭제된 일정 (모든 일정 API 공통 404) */
export const SCHEDULE_NOT_FOUND = "SCHEDULE_NOT_FOUND";
/** 명단을 볼 수 없는 사람(403). 상세를 다시 불러 그린다 */
export const PARTICIPANT_LIST_FORBIDDEN = "PARTICIPANT_LIST_FORBIDDEN";
/** 일정 취소 사유 검증 실패(서버 안전망). `INVALID_REQUEST`와 같게 처리한다 */
export const INVALID_CANCEL_REASON = "INVALID_CANCEL_REASON";

/**
 * 참여·참여 취소·일정 취소를 서버가 지금 상태 때문에 거부한 code (409, 일정 취소의 403 NOT_HOST).
 * 서버 `message`를 그대로 안내한다 (사용자 결정 2026-11-11)
 */
const ACTION_REJECTED_CODES = [
  "HOST_CANNOT_JOIN",
  "ALREADY_JOINED",
  "RECRUIT_CLOSED",
  "SCHEDULE_TIME_CONFLICT",
  "HOST_CANNOT_LEAVE",
  "NOT_PARTICIPANT",
  "PARTICIPATION_NOT_CANCELABLE",
  "NOT_HOST",
  "SCHEDULE_NOT_CANCELABLE",
];

export const isScheduleNotFound = (error: unknown) =>
  getApiErrorCode(error) === SCHEDULE_NOT_FOUND;

export function isScheduleActionRejected(error: unknown) {
  const code = getApiErrorCode(error);
  return code !== undefined && ACTION_REJECTED_CODES.includes(code);
}

const fetchScheduleDetail = async (scheduleId: string) => {
  const { data } = await apiClient.get<ApiSuccess<ScheduleDetail>>(
    `/api/v1/schedules/${scheduleId}`,
  );
  return data.data;
};

/**
 * 일정 상세 조회. 토큰은 선택이고 401이 없다(토큰이 틀리거나 만료되면 GUEST로 온다).
 * 로그인했는데 GUEST로 오면 토큰이 만료된 것이라 재발급 후 한 번 다시 부른다 (api-guide 일정 상세)
 */
export async function getScheduleDetail(scheduleId: string) {
  const detail = await fetchScheduleDetail(scheduleId);
  if (detail.viewerRole !== "GUEST" || !getAccessToken()) return detail;
  // 재발급이 실패하면(로그인 만료·네트워크) 받은 GUEST 상세를 그대로 보여준다. 상세는 로그인 없이도 볼 수 있다
  const token = await refreshAccessToken().catch(() => null);
  return token ? fetchScheduleDetail(scheduleId) : detail;
}

/** 참여자 명단(개설자 포함, 최대 24명 한 번에). 상세의 viewerRole이 HOST·PARTICIPANT일 때만 부른다 (F-6) */
export async function getScheduleParticipants(scheduleId: string) {
  const { data } = await apiClient.get<ApiSuccess<ScheduleParticipant[]>>(
    `/api/v1/schedules/${scheduleId}/participants`,
  );
  return data.data;
}

/** 참여. 즉시 확정된다. 성공하면 data가 없다 */
export async function postParticipation(scheduleId: string) {
  await apiClient.post(`/api/v1/schedules/${scheduleId}/participants`);
}

/** 참여 취소. 완료(시작 + 12시간) 전까지 된다. 성공하면 data가 없다 */
export async function deleteParticipation(scheduleId: string) {
  await apiClient.delete(`/api/v1/schedules/${scheduleId}/participants/me`);
}

/** 일정 전체 취소(개설자). 시작 전까지 된다. 성공하면 data가 없다 */
export async function cancelSchedule(
  scheduleId: string,
  body: CancelScheduleRequest,
) {
  await apiClient.post(`/api/v1/schedules/${scheduleId}/cancellation`, body);
}
