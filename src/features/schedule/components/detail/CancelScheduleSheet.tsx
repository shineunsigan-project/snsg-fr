"use client";

import { useId } from "react";

import {
  CANCEL_REASON_MAX_LENGTH,
  getCancelReasonLength,
} from "../../schemas/cancelScheduleSchema";
import { Button } from "@/shared/ui/button";
import { Drawer, DrawerContent, DrawerTitle } from "@/shared/ui/drawer";

type CancelScheduleSheetProps = {
  open: boolean;
  reason: string;
  onReasonChange: (reason: string) => void;
  /** 비어 있으면(앞뒤 공백 제외) [확인]을 막는다 */
  isReasonValid: boolean;
  /** [닫기]·바깥 스와이프. 요청 중에는 부르지 않는다 */
  onClose: () => void;
  /** [확인] → 전체 취소 요청 */
  onSubmit: () => void;
  isPending: boolean;
};

/**
 * 일정 전체 취소의 사유 입력 시트 (HOST-01 전체 취소-1).
 * 알림 기능이 없어 사유는 서버에 보내기만 한다. 시안의 "참여자에게 전달" 안내와 미리보기 시트(전체 취소-2)는
 * 알림이 생기면 넣는다 (TODO(F-20), 사용자 결정 2026-11-08)
 */
export function CancelScheduleSheet({
  open,
  reason,
  onReasonChange,
  isReasonValid,
  onClose,
  onSubmit,
  isPending,
}: CancelScheduleSheetProps) {
  const counterId = useId();

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (!next && !isPending) onClose();
      }}
      showSwipeHandle
    >
      <DrawerContent className="mx-auto max-w-md rounded-t-3xl border-0 bg-card">
        {/* 낮은 화면·키보드가 올라와 시트가 줄면 내용이 스크롤되고, 버튼은 아래에 남는다 */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-3">
          <DrawerTitle className="text-xl font-bold">
            취소 사유를 알려주세요
          </DrawerTitle>
          <div className="mt-4 rounded-2xl border border-input px-4 pt-3.5 pb-3 focus-within:border-primary">
            <textarea
              aria-label="취소 사유"
              aria-describedby={counterId}
              rows={4}
              value={reason}
              // 글자 수는 앞뒤 공백을 뺀 길이로 센다(USER_FLOW §7.5). maxLength는 공백까지 세어 기준이 둘이 되므로 쓰지 않고,
              // 같은 기준으로 200자를 넘기는 입력만 받지 않는다(개설 간략 설명의 "넘으면 입력 안 됨"과 같은 방식)
              onChange={(event) => {
                const next = event.target.value;
                if (getCancelReasonLength(next) <= CANCEL_REASON_MAX_LENGTH)
                  onReasonChange(next);
              }}
              className="block w-full resize-none bg-transparent text-md/relaxed break-keep outline-none"
            />
            <p
              id={counterId}
              className="mt-1 text-right text-xs text-subtle-foreground tabular-nums"
            >
              {getCancelReasonLength(reason)}/{CANCEL_REASON_MAX_LENGTH}
            </p>
          </div>
        </div>
        {/* safe area가 0인 기기에서도 버튼이 화면 끝에 붙지 않게 아래 여백을 더한다 (ScheduleFilterBar와 같다) */}
        <div className="pb-safe">
          <div className="flex gap-2.5 px-5 pt-4 pb-2">
            <Button
              variant="secondary"
              className="flex-1"
              disabled={isPending}
              onClick={onClose}
            >
              닫기
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              // 사유가 비어 있으면 진행할 수 없다. 문서에 오류 문구가 없어 버튼만 막는다
              disabled={!isReasonValid || isPending}
              onClick={onSubmit}
            >
              확인
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
