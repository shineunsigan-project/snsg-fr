import { countChars } from "../lib/charCount";

// 일정 전체 취소 사유 (USER_FLOW §7.5, api-guide 일정 전체 취소). 입력이 하나뿐이라 RHF 없이 컴포넌트 state로 다룬다 (rules/forms.md)

/** 사유 최대 길이. 앞뒤 공백을 뺀 길이로 센다 (서버 규칙, 사용자 결정 2026-11-11) */
export const CANCEL_REASON_MAX_LENGTH = 100;

/** 사유 글자 수 = 앞뒤 공백을 뺀 글자 수. 이모지는 한 글자다. 카운터·입력 제한·검사가 모두 이 값을 쓴다 */
export const getCancelReasonLength = (reason: string) =>
  countChars(reason.trim());

/** 필수 1~100자(앞뒤 공백 제외). 비어 있으면 진행할 수 없다 */
export function isValidCancelReason(reason: string) {
  const length = getCancelReasonLength(reason);
  return length >= 1 && length <= CANCEL_REASON_MAX_LENGTH;
}
