import {
  isScheduleActionRejected,
  isScheduleNotFound,
} from "../../api/scheduleDetail";
import { getApiErrorCode, getApiErrorMessage } from "@/shared/lib/api/client";
import { showToast } from "@/shared/ui/sonner";

/** 토스트 노출 시간 (시안 DTL-04 "토스트 2초", 개설 화면과 같다) */
export const DETAIL_TOAST_DURATION = 2000;

/**
 * 참여·참여 취소·전체 취소 실패 안내 (팀 결정 Q8). 상세는 훅이 결과와 상관없이 다시 받는다.
 * - 지금 상태 때문에 거부된 code(409 등)는 서버 `message`를 그대로 보여준다 (사용자 결정 2026-11-11)
 * - 404 SCHEDULE_NOT_FOUND: 다시 받은 상세가 홈 + "찾을 수 없는 일정이에요"를 띄우므로 따로 띄우지 않는다
 * - 로그인 만료(UNAUTHENTICATED): 공통 클라이언트가 재발급하고, 실패하면 로그인 화면으로 보낸다
 */
export function showActionErrorToast(error: unknown) {
  if (
    getApiErrorCode(error) === "UNAUTHENTICATED" ||
    isScheduleNotFound(error)
  ) {
    return;
  }
  const serverMessage = isScheduleActionRejected(error)
    ? getApiErrorMessage(error)
    : undefined;
  showToast(
    // 📝 TODO(F-19): 5xx·네트워크 등 그 밖의 실패 문구는 임시다
    serverMessage || "요청을 처리하지 못했어요. 다시 시도해주세요.",
    { variant: "error", duration: DETAIL_TOAST_DURATION },
  );
}
