import { isAxiosError } from "axios";

import type {
  ScheduleDuration,
  ScheduleStatus,
  ScheduleViewerRole,
} from "../types";
import type { Gender } from "@/features/auth/types";
import { apiClient, type ApiSuccess } from "@/shared/lib/api/client";

// TODO(API): 미확정 — 일정 상세·참여자 명단·참여·참여 취소·일정 전체 취소 임시 계약.
// api-guide에 일정 API가 아직 없다(snsg-be develop 87b3c36, 2026-11-03). 지금은 MSW로만 응답한다
// 백엔드에 확인할 것: 경로·필드 이름, 일정 없음(404)의 code, 명단 접근 거부·참여/취소 거부 사유별 code, 명단 정렬

/** 일정 상세 (USER_FLOW §7.2). 일정에 저장된 값이며 외부 장소 API를 다시 부르지 않는다 */
export type ScheduleDetail = {
  scheduleId: string;
  status: ScheduleStatus;
  /** 보는 사람의 역할. 토큰이 없으면 GUEST */
  viewerRole: ScheduleViewerRole;
  /** 활동 이름 (예: 보드게임) */
  activityName: string;
  /** 콘텐츠 활동명 */
  title: string;
  host: {
    nickname: string;
    profileImageUrl: string | null;
  };
  /** 한국 시간 `YYYY-MM-DDTHH:mm:ss` */
  startAt: string;
  duration: ScheduleDuration;
  /** 개설자 포함 확정 인원 */
  participantCount: number;
  /** 개설자 포함 전체 인원 */
  capacity: number;
  description: string;
  /** 참여자 요약. 명단을 펼칠 수 없는 조회자·미참여자도 받는다 (F-6) */
  participantSummary: {
    maleCount: number;
    femaleCount: number;
    /** 연령대 범위 (예: `20대 후반`–`30대 초반`). 서버가 정한 표시값. 생년월일은 받지 않는다 */
    ageGroupRange: { youngest: string; oldest: string } | null;
    /** 겹쳐 보일 아바타. 화면은 앞에서 4개까지만 쓴다 (Q6) */
    profileImageUrls: (string | null)[];
  };
  place: {
    name: string;
    roadAddress: string;
    /** TODO(API): 개설 요청에 상세주소 입력이 없다. 서버가 주는지 확인 */
    detailAddress?: string;
    latitude: number;
    longitude: number;
  };
};

/** 참여자 명단 한 줄 (DTL-06, HOST-02). 이름·이메일·생년월일은 받지 않는다 */
export type ScheduleParticipant = {
  /** 줄 구분용 */
  userId: number;
  isHost: boolean;
} & (
  | {
      isWithdrawn: false;
      nickname: string;
      profileImageUrl: string | null;
      gender: Gender;
      /** 연령대 표시값 (예: `20대 후반`) */
      ageGroup: string;
    }
  /** 탈퇴한 사용자는 기본 아바타 + `탈퇴한 사용자`만 보여준다 (Q9) */
  | { isWithdrawn: true }
);

/** 일정 전체 취소 요청. 사유는 필수 1~200자(앞뒤 공백 제외, USER_FLOW §7.5) */
export type CancelScheduleRequest = { reason: string };

/** 모집 중이 아니라 참여 거부 — 마지막 자리를 동시에 신청한 경우 포함 (정의서 v0.3 04 일정 상태·참여) */
export const RECRUIT_CLOSED = "RECRUIT_CLOSED";
// 시간 겹침으로 참여 거부(409)는 개설과 같은 SCHEDULE_TIME_CONFLICT (scheduleCreate.ts)

/** 일정 없음·삭제. TODO(API): 404의 code가 없어 HTTP 상태로 판단한다 */
export function isScheduleNotFound(error: unknown) {
  return isAxiosError(error) && error.response?.status === 404;
}

/** 지금 상태에서는 할 수 없는 요청(409). TODO(API): 참여 취소·전체 취소 거부 code가 없어 HTTP 상태로 판단한다 */
export function isScheduleConflict(error: unknown) {
  return isAxiosError(error) && error.response?.status === 409;
}

/** 일정 상세 조회. 로그인 없이도 부를 수 있다 */
export async function getScheduleDetail(scheduleId: string) {
  const { data } = await apiClient.get<ApiSuccess<ScheduleDetail>>(
    `/api/v1/schedules/${scheduleId}`,
  );
  return data.data;
}

/** 참여자 명단(개설자 포함). 확정 참여자·개설자만 부른다 (F-6) */
export async function getScheduleParticipants(scheduleId: string) {
  const { data } = await apiClient.get<ApiSuccess<ScheduleParticipant[]>>(
    `/api/v1/schedules/${scheduleId}/participants`,
  );
  return data.data;
}

/** 참여. 즉시 확정된다. 로그인 필요(401), 409 RECRUIT_CLOSED · SCHEDULE_TIME_CONFLICT */
export async function postParticipation(scheduleId: string) {
  await apiClient.post(`/api/v1/schedules/${scheduleId}/participants`);
}

/** 참여 취소. 모집 중·모집 마감일 때만 된다. 로그인 필요(401) */
export async function deleteParticipation(scheduleId: string) {
  await apiClient.delete(`/api/v1/schedules/${scheduleId}/participants/me`);
}

/** 일정 전체 취소(개설자). 모집 중·모집 마감일 때만 된다. 사유는 서버에 보내기만 한다 (F-20) */
export async function cancelSchedule(
  scheduleId: string,
  body: CancelScheduleRequest,
) {
  await apiClient.post(`/api/v1/schedules/${scheduleId}/cancel`, body);
}
