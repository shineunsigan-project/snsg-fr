// 일정 도메인 값. 문자열 리터럴은 여기서만 정의하고 가져다 쓴다 (rules/code-quality.md)

/** 예상 소요: 짧게·보통·길게. 서버 `durationType` 값 그대로다 (기능 요구사항 정의서 v0.3 04 개설). 표시용 값이고 상태 전환 기준이 아니다 */
export type ScheduleDuration = "SHORT" | "NORMAL" | "LONG";

/**
 * 일정 상태: 모집 중 / 모집 마감 / 활동 진행 중 / 일정 완료 / 일정 취소됨 (기능 요구사항 정의서 v0.3 04).
 * 서버가 판정한다 (USER_FLOW §7.1). TODO(API): 목록 API가 정해지면 값을 맞춘다
 */
export type ScheduleStatus =
  "RECRUITING" | "CLOSED" | "IN_PROGRESS" | "COMPLETED" | "CANCELED";

/** 홈 목록 탭: 모집 중 / 참여한 일정 / 개설한 일정 (USER_FLOW §5) */
export type ScheduleListTab = "recruiting" | "joined" | "created";
