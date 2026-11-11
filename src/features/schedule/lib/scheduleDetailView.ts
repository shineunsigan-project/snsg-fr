import type {
  AgeGroup,
  ScheduleDetail,
  ScheduleParticipant,
} from "../api/scheduleDetail";
import { durationOptions } from "../schemas/createScheduleSchema";
import type {
  AgeGroupPhase,
  ScheduleStatus,
  ScheduleViewerRole,
} from "../types";
import { toApiImageUrl } from "@/shared/lib/apiImageUrl";

// 상세 화면 표시값 가공. 서버가 준 값을 글자로 바꾸기만 하고 상태·역할·누를 수 있는 동작은 계산하지 않는다

/** 참여자 요약에 겹쳐 보일 원 수. 더 많아도 `+n`은 없다 (팀 결정 Q6) */
export const SUMMARY_AVATAR_MAX = 4;

/** 상단 상태 태그·비활성 버튼 문구 (api-guide 일정 상세 `displayStatus`, 시안 DTL-08) */
export const SCHEDULE_STATUS_LABEL: Record<ScheduleStatus, string> = {
  RECRUITING: "모집 중",
  RECRUITMENT_CLOSED: "모집 마감",
  COMPLETED: "일정 완료",
  CANCELED: "일정 취소됨",
};

/** 예상 소요 `1시간 내외` 등. 개설 화면(CRT-03)과 같은 문구 */
export function getDurationLabel(duration: ScheduleDetail["durationType"]) {
  return (
    durationOptions.find((option) => option.value === duration)?.description ??
    ""
  );
}

/** 상단 개설자 이름. 개설자 본인이 보면 `나 (닉네임)` (팀 결정 Q5, 시안 HOST-01). 탈퇴했으면 서버가 `탈퇴한 사용자`로 준다 */
export function getHostName(detail: ScheduleDetail) {
  return detail.viewerRole === "HOST"
    ? `나 (${detail.host.nickname})`
    : detail.host.nickname;
}

/** 명단을 펼칠 수 있는 역할: 확정 참여자·개설자 (팀 결정 Q1, F-6, api-guide 참여자 명단) */
export const canViewParticipants = (role: ScheduleViewerRole) =>
  role === "PARTICIPANT" || role === "HOST";

const GENDER_LABEL = { MALE: "남", FEMALE: "여" } as const;
const AGE_PHASE_LABEL: Record<AgeGroupPhase, string> = {
  EARLY: "초반",
  MID: "중반",
  LATE: "후반",
};

/** `20대 후반` */
const formatAgeGroup = ({ decade, phase }: AgeGroup) =>
  `${decade}대 ${AGE_PHASE_LABEL[phase]}`;

/** 펼친 명단 제목 줄의 성별 수 `남 2 · 여 2` (팀 결정 2026-11-04, 시안 DTL-06) */
export const getParticipantGenderLabel = (
  summary: ScheduleDetail["participantSummary"],
) => `남 ${summary.maleCount} · 여 ${summary.femaleCount}`;

/** 참여자 요약 문구 `남 2 · 여 2 · 20대 후반–30대 초반` (USER_FLOW §7.2). 연령대를 모르면 성별 수만 */
export function getParticipantSummaryLabel(
  summary: ScheduleDetail["participantSummary"],
) {
  const genderLabel = getParticipantGenderLabel(summary);
  if (!summary.minAgeGroup || !summary.maxAgeGroup) return genderLabel;
  const youngest = formatAgeGroup(summary.minAgeGroup);
  const oldest = formatAgeGroup(summary.maxAgeGroup);
  return `${genderLabel} · ${youngest === oldest ? youngest : `${youngest}–${oldest}`}`;
}

/**
 * 참여자 요약에 겹쳐 보일 사진(최대 4개). 명단을 받았으면(개설자·확정 참여자) 명단 앞쪽 사진을 쓴다.
 * 명단을 볼 수 없거나(조회자·미참여자) 아직 받지 못했으면 사진 없는 원(null)을 인원만큼 그린다 (사용자 결정 2026-11-11)
 */
export function getSummaryAvatars(
  summary: ScheduleDetail["participantSummary"],
  rows: ParticipantRow[] | undefined,
): (string | null)[] {
  if (rows) {
    return rows.slice(0, SUMMARY_AVATAR_MAX).map((row) => row.profileImageUrl);
  }
  return Array.from(
    { length: Math.min(summary.count, SUMMARY_AVATAR_MAX) },
    () => null,
  );
}

/** 명단 한 줄 표시값 */
export type ParticipantRow = {
  /** 본인도 닉네임만 (팀 결정 Q5). 탈퇴했으면 서버가 `탈퇴한 사용자`로 준다 */
  name: string;
  /** 서버가 준 사진(탈퇴했으면 서버 기본 이미지) */
  profileImageUrl: string | null;
  isHost: boolean;
  /** `여 · 20대 후반`. 탈퇴한 사용자는 숨긴다 (팀 결정 Q9). 모르는 값은 빼고, 둘 다 모르면 null */
  detail: string | null;
};

/** 서버가 준 순서(개설자 맨 앞, 참여 일시 순) 그대로 바꾼다 */
export function toParticipantRows(
  participants: ScheduleParticipant[],
): ParticipantRow[] {
  return participants.map((participant) => {
    const details = participant.withdrawn
      ? []
      : [
          participant.gender && GENDER_LABEL[participant.gender],
          participant.ageGroup && formatAgeGroup(participant.ageGroup),
        ].filter((value): value is string => Boolean(value));
    return {
      name: participant.nickname,
      profileImageUrl: toApiImageUrl(participant.profileImageUrl),
      isHost: participant.isHost,
      detail: details.length ? details.join(" · ") : null,
    };
  });
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
