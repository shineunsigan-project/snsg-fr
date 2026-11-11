// 일정 도메인 값. 문자열 리터럴은 여기서만 정의하고 가져다 쓴다 (rules/code-quality.md)

/** 예상 소요: 짧게·보통·길게. 서버 `durationType` 값 그대로다 (기능 요구사항 정의서 v0.3 04 개설). 표시용 값이고 상태 전환 기준이 아니다 */
export type ScheduleDuration = "SHORT" | "NORMAL" | "LONG";

/**
 * 화면에 보여줄 일정 상태: 모집 중 / 모집 마감 / 일정 완료 / 일정 취소됨.
 * 서버가 판정한다 (USER_FLOW §7.1). 값은 api-guide 일정 목록·상세 `displayStatus` 그대로다.
 * 시작 후 ~ 완료 전도 서버는 `RECRUITMENT_CLOSED`로 준다. 활동 진행 중은 따로 없다 (사용자 결정 2026-11-11, SHI-164)
 */
export type ScheduleStatus =
  "RECRUITING" | "RECRUITMENT_CLOSED" | "COMPLETED" | "CANCELED";

/**
 * 일정 상세를 보는 사람의 역할: 조회자(비로그인) / 미참여자 / 확정 참여자 / 개설자 (USER_FLOW §2.2).
 * 일정마다 서버가 판정해 상세 응답 `viewerRole`에 담는다 (api-guide 일정 상세)
 */
export type ScheduleViewerRole =
  "GUEST" | "NON_PARTICIPANT" | "PARTICIPANT" | "HOST";

/**
 * 보는 사람이 지금 누를 수 있는 동작. 서버가 상세 응답 `availableActions`에 담는다 (api-guide 일정 상세).
 * 로그인하고 참여하기 / 참여하기 / 참여 취소 / 일정 전체 취소
 */
export type ScheduleAction =
  "LOGIN_TO_JOIN" | "JOIN" | "CANCEL_PARTICIPATION" | "CANCEL_SCHEDULE";

/** 연령대의 초반·중반·후반 (api-guide 일정 상세 `…AgeGroup.phase`) */
export type AgeGroupPhase = "EARLY" | "MID" | "LATE";

/** 홈 목록 탭: 모집 중 / 참여한 일정 / 개설한 일정 (USER_FLOW §5) */
export type ScheduleListTab = "recruiting" | "joined" | "created";
