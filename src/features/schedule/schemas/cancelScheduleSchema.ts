// 일정 전체 취소 사유 (USER_FLOW §7.5, 정의서 v0.3 04 취소). 입력이 하나뿐이라 RHF 없이 컴포넌트 state로 다룬다 (rules/forms.md)

/** 사유 최대 길이. 앞뒤 공백을 뺀 길이로 센다 */
export const CANCEL_REASON_MAX_LENGTH = 200;

/** 사유 글자 수 = 앞뒤 공백을 뺀 길이. 카운터·입력 제한·검사가 모두 이 값을 쓴다 */
export const getCancelReasonLength = (reason: string) => reason.trim().length;

/** 필수 1~200자(앞뒤 공백 제외). 비어 있으면 진행할 수 없다 */
export function isValidCancelReason(reason: string) {
  const length = getCancelReasonLength(reason);
  return length >= 1 && length <= CANCEL_REASON_MAX_LENGTH;
}
