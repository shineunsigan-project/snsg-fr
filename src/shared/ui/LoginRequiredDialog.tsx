"use client";

import { Button } from "./button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./dialog";

type LoginRequiredDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 카카오 로그인 연결 지점. 로그인 화면 이동은 다음 작업에서 연결한다 (USER_FLOW §4.2) */
  onKakaoLogin?: () => void;
};

/**
 * 로그인 필요 모달 (DESIGN §3.8, Figma 132:16158)
 * 진입점이 여러 화면에 있고 디자인·문구가 모두 같으므로 문구를 고정한다 (USER_FLOW §4.2)
 */
export function LoginRequiredDialog({
  open,
  onOpenChange,
  onKakaoLogin,
}: LoginRequiredDialogProps) {
  return (
    // 바깥 클릭으로 닫는 동작은 디자인에 없어 막는다. 취소 버튼과 Esc로 닫는다
    <Dialog open={open} onOpenChange={onOpenChange} disablePointerDismissal>
      <DialogContent className="max-w-80 rounded-3xl px-5 pt-6 pb-5 text-center">
        <DialogTitle className="text-lg">로그인이 필요합니다.</DialogTitle>
        <DialogDescription className="mt-1">
          카카오 로그인 후 이용해주세요.
        </DialogDescription>
        <div className="mt-5 grid grid-cols-12 gap-2.5">
          <DialogClose
            render={<Button variant="secondary" className="col-span-5" />}
          >
            취소
          </DialogClose>
          <Button variant="kakao" className="col-span-7" onClick={onKakaoLogin}>
            카카오 로그인
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
