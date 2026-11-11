"use client";

import { useRef, useState } from "react";

import {
  INVALID_CANCEL_REASON,
  isScheduleActionRejected,
  isScheduleNotFound,
} from "../../api/scheduleDetail";
import { useCancelSchedule } from "../../hooks/useCancelSchedule";
import { isValidCancelReason } from "../../schemas/cancelScheduleSchema";
import {
  DETAIL_TOAST_DURATION,
  showActionErrorToast,
} from "./actionErrorToast";
import { CancelScheduleSheet } from "./CancelScheduleSheet";

import {
  getApiErrorCode,
  getApiErrorMessage,
  getApiFieldErrors,
} from "@/shared/lib/api/client";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { showToast } from "@/shared/ui/sonner";

/** 사유가 서버 검증에 걸렸다(400). 화면이 같은 규칙으로 막으므로 정상 흐름에서는 나지 않는다 */
const isInvalidReason = (error: unknown) => {
  const code = getApiErrorCode(error);
  return code === "INVALID_REQUEST" || code === INVALID_CANCEL_REASON;
};

type Step = "confirm" | "reason";

/**
 * 일정 전체 취소 (HOST-01, 팀 결정 N4): 확인 팝업 → 사유 입력 → 요청 → 완료 팝업 (USER_FLOW §7.5).
 * 알림 기능이 없어 사유는 서버에 보내기만 하고, "참여자에게 전달" 안내·미리보기는 보여주지 않는다
 * (TODO(F-20): 알림 기능을 추가할 때 시안의 미리보기와 전달 문구를 다시 넣는다. 목록은 USER_FLOW §7.5, 사용자 결정 2026-11-08)
 */
export function CancelScheduleFlow({
  scheduleId,
  open,
  onClose,
  participantCount,
}: {
  scheduleId: string;
  /** 확인 팝업부터 시작한다 */
  open: boolean;
  onClose: () => void;
  /** 개설자를 뺀 확정 참여자 수 (확인 팝업 문구) */
  participantCount: number;
}) {
  const cancelSchedule = useCancelSchedule(scheduleId);
  const [step, setStep] = useState<Step>("confirm");
  const [reason, setReason] = useState("");
  const [isDoneOpen, setIsDoneOpen] = useState(false);

  const close = () => {
    onClose();
    setStep("confirm");
    setReason("");
  };

  // isPending은 다음 렌더에 반영되어 아주 빠른 두 번 누름을 못 막는다. 참여하기와 같이 ref로 한 번만 보낸다
  const isSubmittingRef = useRef(false);
  const handleSubmit = () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    cancelSchedule.mutate(reason, {
      onSuccess: () => {
        close();
        setIsDoneOpen(true);
      },
      onError: (error) => {
        if (isInvalidReason(error)) {
          // 시트와 사유를 두고 다시 적게 한다. 문구는 errors[0].message, 없으면 message (api-guide 일정 전체 취소)
          // 시트에 오류 문구 자리가 없어(사용자 결정 2026-11-11 #11) 토스트로 보여준다
          showToast(
            getApiFieldErrors(error)[0]?.message ??
              getApiErrorMessage(error) ??
              "요청을 처리하지 못했어요. 다시 시도해주세요.",
            { variant: "error", duration: DETAIL_TOAST_DURATION },
          );
          return;
        }
        // 403·409(이미 취소·시작됨 등)·404는 다시 받은 상세로 그리므로 흐름을 닫는다.
        // 5xx·네트워크 오류는 입력한 사유를 두고 다시 누를 수 있다 (사용자 결정 2026-11-11 #10)
        if (isScheduleActionRejected(error) || isScheduleNotFound(error))
          close();
        showActionErrorToast(error);
      },
      onSettled: () => {
        isSubmittingRef.current = false;
      },
    });
  };

  return (
    <>
      <ConfirmDialog
        open={open && step === "confirm"}
        onClose={close}
        title="일정을 전체 취소할까요?"
        // 확정 참여자가 없으면 취소될 참여가 없어 참여자 문구를 뺀다 (사용자 결정 2026-11-05)
        description={
          participantCount > 0
            ? `확정 참여자 ${participantCount}명의 참여가 모두 취소되고, 취소한 일정은 되돌릴 수 없어요.`
            : "취소한 일정은 되돌릴 수 없어요."
        }
        hasCloseButton
        isDestructive
        onConfirm={() => setStep("reason")}
      />
      <CancelScheduleSheet
        open={open && step === "reason"}
        reason={reason}
        onReasonChange={setReason}
        isReasonValid={isValidCancelReason(reason)}
        onClose={close}
        onSubmit={handleSubmit}
        isPending={cancelSchedule.isPending}
      />
      {/* TODO(F-20): 알림 기능을 추가할 때 둘째 줄 "참여자 N명에게 취소 사유를 전달했어요."(시안)를 넣는다. 넣을 목록은 USER_FLOW §7.5 */}
      <ConfirmDialog
        open={isDoneOpen}
        onClose={() => setIsDoneOpen(false)}
        icon="check"
        title="일정이 정상 취소되었습니다."
        onConfirm={() => setIsDoneOpen(false)}
      />
    </>
  );
}
