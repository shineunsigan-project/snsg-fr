"use client";

import { CheckIcon } from "lucide-react";

import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/ui/dialog";

type DetailDialogProps = {
  open: boolean;
  /** [닫기]·Esc. 요청 중에는 부르지 않는다 */
  onClose: () => void;
  title: string;
  description?: string;
  /** [확인] */
  onConfirm: () => void;
  /** 있으면 [닫기]를 함께 보여준다 (확인 팝업). 없으면 체크 아이콘 + [확인]만 (완료 팝업) */
  hasCloseButton?: boolean;
  /** 요청 중: 버튼을 막아 두 번 보내지 않는다 */
  isPending?: boolean;
  /** 취소 확인 팝업의 빨간 [확인] (시안 DTL-07·HOST-01) */
  isDestructive?: boolean;
};

/**
 * 상세의 확인·완료 팝업 (DTL-07-1·07-2, HOST-01 전체 취소 확인·완료).
 * 가운데 정렬 제목·본문. 완료 팝업의 체크 아이콘은 개설 완료 팝업(CRT-07)과 같다
 */
export function DetailDialog({
  open,
  onClose,
  title,
  description,
  onConfirm,
  hasCloseButton = false,
  isPending = false,
  isDestructive = false,
}: DetailDialogProps) {
  return (
    // 바깥 클릭으로 닫는 동작은 디자인에 없어 막는다 (D-12, LoginRequiredDialog와 같다)
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !isPending) onClose();
      }}
      disablePointerDismissal
    >
      <DialogContent className="flex max-w-80 flex-col items-center rounded-3xl px-5 pt-7 pb-5 text-center">
        {!hasCloseButton && (
          <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-brand-soft text-brand">
            <CheckIcon aria-hidden className="size-7" strokeWidth={2.5} />
          </span>
        )}
        <DialogTitle className="text-lg break-keep">{title}</DialogTitle>
        {description && (
          <DialogDescription className="mt-2 break-keep whitespace-pre-line">
            {description}
          </DialogDescription>
        )}
        <div className="mt-6 flex w-full gap-2.5">
          {hasCloseButton && (
            <Button
              variant="secondary"
              className="flex-1"
              disabled={isPending}
              onClick={onClose}
            >
              닫기
            </Button>
          )}
          <Button
            variant={isDestructive ? "danger" : "primary"}
            className="flex-1"
            disabled={isPending}
            onClick={onConfirm}
          >
            확인
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
