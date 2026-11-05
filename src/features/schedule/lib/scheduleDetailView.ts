import type {
  ScheduleDetail,
  ScheduleParticipant,
} from "../api/scheduleDetail";
import { durationOptions } from "../schemas/createScheduleSchema";
import type { ScheduleStatus, ScheduleViewerRole } from "../types";

// 상세 화면 표시값 가공. 서버가 준 값을 글자로 바꾸기만 하고 상태·역할은 계산하지 않는다

/** 참여자 요약에 겹쳐 보일 아바타 수. 더 많아도 `+n`은 없다 (팀 결정 Q6) */
export const SUMMARY_AVATAR_MAX = 4;

/** 상단 상태 태그 (정의서 v0.3 04 일정 상태, 시안 DTL-08) */
export const SCHEDULE_STATUS_LABEL: Record<ScheduleStatus, string> = {
  RECRUITING: "모집 중",
  CLOSED: "모집 마감",
  IN_PROGRESS: "활동 진행 중",
  COMPLETED: "일정 완료",
  CANCELED: "일정 취소됨",
};

/** 예상 소요 `1시간 내외` 등. 개설 화면(CRT-03)과 같은 문구 */
export function getDurationLabel(duration: ScheduleDetail["duration"]) {
  return (
    durationOptions.find((option) => option.value === duration)?.description ??
    ""
  );
}

/** 상단 개설자 이름. 개설자 본인이 보면 `나 (닉네임)` (팀 결정 Q5, 시안 HOST-01) */
export function getHostName(detail: ScheduleDetail) {
  return detail.viewerRole === "HOST"
    ? `나 (${detail.host.nickname})`
    : detail.host.nickname;
}

/** 명단을 펼칠 수 있는 역할: 확정 참여자·개설자 (팀 결정 Q1, F-6) */
export const canViewParticipants = (role: ScheduleViewerRole) =>
  role === "PARTICIPANT" || role === "HOST";

const GENDER_LABEL = { MALE: "남", FEMALE: "여" } as const;

/** 펼친 명단 제목 줄의 성별 수 `남 2 · 여 2` (팀 결정 2026-11-04, 시안 DTL-06) */
export const getParticipantGenderLabel = (
  summary: ScheduleDetail["participantSummary"],
) => `남 ${summary.maleCount} · 여 ${summary.femaleCount}`;

/** 참여자 요약 문구 `남 2 · 여 2 · 20대 후반–30대 초반` (USER_FLOW §7.2) */
export function getParticipantSummaryLabel(
  summary: ScheduleDetail["participantSummary"],
) {
  const range = summary.ageGroupRange;
  const ageLabel =
    range &&
    (range.youngest === range.oldest
      ? range.youngest
      : `${range.youngest}–${range.oldest}`);
  const genderLabel = getParticipantGenderLabel(summary);
  return ageLabel ? `${genderLabel} · ${ageLabel}` : genderLabel;
}

/** 겹쳐 보일 아바타. null이면 기본 아바타 */
export const getSummaryAvatars = (
  summary: ScheduleDetail["participantSummary"],
) => summary.profileImageUrls.slice(0, SUMMARY_AVATAR_MAX);

/** 명단 한 줄 표시값 */
export type ParticipantRow = {
  key: number;
  /** 본인도 닉네임만 (팀 결정 Q5) */
  name: string;
  /** null이면 기본 아바타 */
  profileImageUrl: string | null;
  isHost: boolean;
  /** `여 · 20대 후반`. 탈퇴한 사용자는 숨긴다 (팀 결정 Q9) */
  detail: string | null;
};

export function toParticipantRows(
  participants: ScheduleParticipant[],
): ParticipantRow[] {
  return participants.map((participant) =>
    participant.isWithdrawn
      ? {
          key: participant.userId,
          name: "탈퇴한 사용자",
          profileImageUrl: null,
          isHost: participant.isHost,
          detail: null,
        }
      : {
          key: participant.userId,
          name: participant.nickname,
          profileImageUrl: participant.profileImageUrl,
          isHost: participant.isHost,
          detail: `${GENDER_LABEL[participant.gender]} · ${participant.ageGroup}`,
        },
  );
}

/** 주소 `주소 복사`·화면 표시용. 상세주소가 있으면 뒤에 붙인다 */
export function getFullAddress(place: ScheduleDetail["place"]) {
  return place.detailAddress
    ? `${place.roadAddress} ${place.detailAddress}`
    : place.roadAddress;
}

/**
 * 앱 안에서 이동해 온 기록이 있는지 (팀 결정 Q7: 있으면 뒤로, 없으면 홈).
 * Navigation API의 canGoBack은 같은 출처(이 앱)의 이전 기록이 있을 때만 true다.
 * 공유 링크로 바로 들어왔거나 카카오 로그인(다른 출처)을 거쳐 돌아온 경우는 false라 홈으로 간다.
 * 이 API가 없는 브라우저는 앱 밖으로 나가지 않도록 홈으로 보낸다
 */
export function canGoBackInApp() {
  const navigation: unknown = Reflect.get(window, "navigation");
  return (
    typeof navigation === "object" &&
    navigation !== null &&
    "canGoBack" in navigation &&
    navigation.canGoBack === true
  );
}
