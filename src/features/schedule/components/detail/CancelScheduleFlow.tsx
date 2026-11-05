"use client";

import { useState } from "react";

import {
  isScheduleConflict,
  isScheduleNotFound,
} from "../../api/scheduleDetail";
import { useCancelSchedule } from "../../hooks/useCancelSchedule";
import { isValidCancelReason } from "../../schemas/cancelScheduleSchema";
import { showActionErrorToast } from "./actionErrorToast";
import { CancelScheduleSheet } from "./CancelScheduleSheet";
import { DetailDialog } from "./DetailDialog";

type Step = "confirm" | "reason" | "preview";

/**
 * 일정 전체 취소 (HOST-01, 팀 결정 N4): 확인 팝업 → 사유 입력 → 미리보기 → 요청 → 완료 팝업 (USER_FLOW §7.5).
 * 사유는 서버에 보내기만 한다. TODO(F-20): 참여자에게 알림으로 전달하는 것은 추후 작업이다
 */
export function CancelScheduleFlow({
  scheduleId,
  open,
  onClose,
  participantCount,
  participantAvatars,
  hostName,
  hostProfileImageUrl,
  placeName,
}: {
  scheduleId: string;
  /** 확인 팝업부터 시작한다 */
  open: boolean;
  onClose: () => void;
  /** 개설자를 뺀 확정 참여자 수 (표시용) */
  participantCount: number;
  participantAvatars: (string | null)[];
  /** 참여자가 받는 내용이라 `나 (닉네임)`이 아닌 닉네임 */
  hostName: string;
  hostProfileImageUrl: string | null;
  placeName: string;
}) {
  const cancelSchedule = useCancelSchedule(scheduleId);
  const [step, setStep] = useState<Step>("confirm");
  const [reason, setReason] = useState("");
  /** 완료 팝업의 참여자 수. 취소 뒤 다시 받은 상세에는 참여자가 없어 요청할 때 값을 남긴다 */
  const [notifiedCount, setNotifiedCount] = useState<number | null>(null);

  const close = () => {
    onClose();
    setStep("confirm");
    setReason("");
  };

  const handleSubmit = () => {
    const count = participantCount;
    cancelSchedule.mutate(reason, {
      onSuccess: () => {
        close();
        setNotifiedCount(count);
      },
      onError: (error) => {
        // 409(이미 시작·취소됨)·404는 최신 상태를 다시 그리므로 흐름을 닫는다. 그 밖에는 입력한 사유를 두고 다시 누를 수 있다
        if (isScheduleConflict(error) || isScheduleNotFound(error)) close();
        showActionErrorToast(error);
      },
    });
  };

  return (
    <>
      <DetailDialog
        open={open && step === "confirm"}
        onClose={close}
        title="일정을 전체 취소할까요?"
        // 확정 참여자가 없으면 취소될 참여·전달할 알림이 없어 참여자 문구를 뺀다 (사용자 결정 2026-11-05)
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
        step={open && step !== "confirm" ? step : null}
        reason={reason}
        onReasonChange={setReason}
        isReasonValid={isValidCancelReason(reason)}
        participantCount={participantCount}
        participantAvatars={participantAvatars}
        hostName={hostName}
        hostProfileImageUrl={hostProfileImageUrl}
        placeName={placeName}
        onClose={close}
        onNext={() => setStep("preview")}
        onEdit={() => setStep("reason")}
        onSubmit={handleSubmit}
        isPending={cancelSchedule.isPending}
      />
      {/* TODO(F-20): 알림 기능이 없어 실제로 전달하지 않는다. 문구는 시안 그대로 둔다 */}
      <DetailDialog
        open={notifiedCount !== null}
        onClose={() => setNotifiedCount(null)}
        title="일정이 정상 취소되었습니다."
        description={
          notifiedCount
            ? `참여자 ${notifiedCount}명에게 취소 사유를 전달했어요.`
            : undefined
        }
        onConfirm={() => setNotifiedCount(null)}
      />
    </>
  );
}
