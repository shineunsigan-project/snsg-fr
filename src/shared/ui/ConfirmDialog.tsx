"use client";

import { CheckIcon } from "lucide-react";

import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./dialog";

type ConfirmDialogIcon = "check" | "warning" | "sad";

type ConfirmDialogProps = {
  open: boolean;
  /** [닫기]·Esc. 요청 중에는 부르지 않는다 */
  onClose: () => void;
  title: string;
  description?: string;
  /** 제목 위 아이콘. 없으면 그리지 않는다 (MY-03 로그아웃 확인) */
  icon?: ConfirmDialogIcon;
  /** 확인 버튼 문구. 시안마다 다르다 (`로그아웃`·`탈퇴하기`) */
  confirmLabel?: string;
  onConfirm: () => void;
  /** 있으면 [닫기]를 함께 보여준다 (확인 팝업). 없으면 확인 버튼만 (완료·안내 팝업) */
  hasCloseButton?: boolean;
  /** 닫기 버튼 문구. 시안마다 다르다 (CRT-06 초기화 확인은 `취소`) */
  closeLabel?: string;
  /** 요청 중: 버튼을 막아 두 번 보내지 않는다 */
  isPending?: boolean;
  /** 파괴적 동작의 빨간 확인 버튼 (시안 DTL-07·HOST-01·MY-04) */
  isDestructive?: boolean;
};

/**
 * 가운데 정렬 확인·완료 팝업 (DTL-07, HOST-01 전체 취소, MY-03 로그아웃, MY-04 탈퇴, CRT-06 초기화).
 * 체크 아이콘은 개설 완료 팝업(CRT-07)과 같다
 */
export function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  icon,
  confirmLabel = "확인",
  onConfirm,
  hasCloseButton = false,
  closeLabel = "닫기",
  isPending = false,
  isDestructive = false,
}: ConfirmDialogProps) {
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
        {icon === "check" && (
          <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-brand-soft text-brand">
            <CheckIcon aria-hidden className="size-7" strokeWidth={2.5} />
          </span>
        )}
        {icon === "warning" && (
          <span
            aria-hidden
            className="mb-4 flex size-14 items-center justify-center rounded-full bg-warning-soft text-3xl font-bold text-warning"
          >
            !
          </span>
        )}
        {icon === "sad" && (
          <span aria-hidden className="mb-3 text-5xl leading-none">
            😢
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
              {closeLabel}
            </Button>
          )}
          <Button
            variant={isDestructive ? "danger" : "primary"}
            className="flex-1"
            disabled={isPending}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
