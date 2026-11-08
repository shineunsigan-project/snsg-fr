"use client";

import { CheckIcon } from "lucide-react";

import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/ui/dialog";

type ScheduleCreatedDialogProps = {
  open: boolean;
  /** 개설한 일정의 장소명. 받지 못하면 장소명 없이 안내한다 */
  placeName?: string;
  onConfirm: () => void;
};

/**
 * CRT-07 개설 완료 팝업 (시안 CRT-07)
 * 개설한 일정 탭(LIST-05) 위에 띄운다. 확인을 누르면 그 탭에 머문다
 */
export function ScheduleCreatedDialog({
  open,
  placeName,
  onConfirm,
}: ScheduleCreatedDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onConfirm();
      }}
      disablePointerDismissal
    >
      <DialogContent className="flex max-w-80 flex-col items-center rounded-3xl px-5 pt-7 pb-5 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-brand-soft text-brand">
          <CheckIcon aria-hidden className="size-7" strokeWidth={2.5} />
        </span>
        <DialogTitle className="mt-4 text-lg">일정이 열렸어요</DialogTitle>
        <DialogDescription className="mt-3 break-keep">
          {placeName ? `${placeName} 일정이` : "일정이"} 모집을 시작했어요.
          <br />
          개설한 일정에서 모집 현황을 확인할 수 있어요.
        </DialogDescription>
        <DialogClose
          render={<Button variant="primary" className="mt-6 w-full" />}
        >
          확인
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
