"use client";

import { useState } from "react";

import { useCancelParticipation } from "../../hooks/useCancelParticipation";
import { showActionErrorToast } from "./actionErrorToast";
import { DetailDialog } from "./DetailDialog";

/**
 * 참여 취소 (DTL-07): 확인 팝업 → 요청 → 완료 팝업 → 미참여자 상세 (USER_FLOW §7.4).
 * 성공하면 훅이 상세를 다시 받아 하단이 미참여자로 바뀐다
 */
export function CancelParticipationFlow({
  scheduleId,
  open,
  onClose,
}: {
  scheduleId: string;
  /** 확인 팝업을 연다 */
  open: boolean;
  onClose: () => void;
}) {
  const cancelParticipation = useCancelParticipation(scheduleId);
  const [isDone, setIsDone] = useState(false);

  const handleConfirm = () =>
    cancelParticipation.mutate(undefined, {
      onSuccess: () => {
        onClose();
        setIsDone(true);
      },
      onError: (error) => {
        onClose();
        // 📝 TODO(F-19): 활동 진행 중 이후 등 취소할 수 없는 상태 (정의서 v0.3 04 취소)
        showActionErrorToast(
          error,
          "이미 시작된 일정은 참여를 취소할 수 없어요.",
        );
      },
    });

  return (
    <>
      <DetailDialog
        open={open}
        onClose={onClose}
        title="참여를 취소할까요?"
        description="이 일정에서 빠지고, 참여자 명단에서도 제외돼요."
        hasCloseButton
        isDestructive
        isPending={cancelParticipation.isPending}
        onConfirm={handleConfirm}
      />
      {/* 완료 문구는 시안 그대로 (팀 결정 N2) */}
      <DetailDialog
        open={isDone}
        onClose={() => setIsDone(false)}
        title="일정이 정상 취소되었습니다."
        onConfirm={() => setIsDone(false)}
      />
    </>
  );
}
