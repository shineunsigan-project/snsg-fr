/**
 * 새로 개설한 일정 표시 배지. 근거: 화면 명세 CRT-07 시안 기준 (개설한 일정 카드의 `모집 중` 옆).
 * 일정 상태가 아니라 상태 배지와 함께 붙으므로 StatusBadge와 분리하고, 모양은 StatusBadge와 맞춘다.
 */
export function NewBadge() {
  return (
    <span className="inline-flex shrink-0 items-center rounded-md bg-brand px-2 py-0.5 text-xs font-bold text-white">
      NEW
    </span>
  );
}
