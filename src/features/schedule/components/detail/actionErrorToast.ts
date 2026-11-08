import { SCHEDULE_TIME_CONFLICT } from "../../api/scheduleCreate";
import {
  isScheduleConflict,
  isScheduleNotFound,
  RECRUIT_CLOSED,
} from "../../api/scheduleDetail";
import { getApiErrorCode } from "@/shared/lib/api/client";
import { showToast } from "@/shared/ui/sonner";

/** 토스트 노출 시간 (시안 DTL-04 "토스트 2초", 개설 화면과 같다) */
export const DETAIL_TOAST_DURATION = 2000;

/**
 * 참여·참여 취소·전체 취소 실패 안내 (팀 결정 Q8). 화면은 그대로 두고, 409·404면 훅이 최신 상태를 다시 받는다.
 * 📝 TODO(F-19): 문구는 모두 임시다
 * - 404: 다시 받은 상세가 홈 + "찾을 수 없는 일정이에요"를 띄우므로 따로 띄우지 않는다
 * - 로그인 만료(UNAUTHENTICATED): 공통 클라이언트가 로그인 화면으로 보낸다
 */
export function showActionErrorToast(
  error: unknown,
  /** 그 밖의 409 문구. TODO(API): 거부 사유별 code가 정해지면 code로 나눈다. 없으면 일반 실패 문구 */
  conflictMessage?: string,
) {
  const code = getApiErrorCode(error);
  if (code === "UNAUTHENTICATED" || isScheduleNotFound(error)) return;
  let message = "요청을 처리하지 못했어요. 다시 시도해주세요.";
  if (code === RECRUIT_CLOSED) message = "모집이 마감된 일정이에요.";
  // 개설 화면(CRT-06)과 같은 문구
  else if (code === SCHEDULE_TIME_CONFLICT)
    message = "같은 시간대에 참여하거나 개설한 일정이 있어요.";
  else if (conflictMessage && isScheduleConflict(error))
    message = conflictMessage;
  showToast(message, { variant: "error", duration: DETAIL_TOAST_DURATION });
}
