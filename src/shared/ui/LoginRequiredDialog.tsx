"use client";

import { saveLoginRedirect, startKakaoLogin } from "@/shared/lib/kakaoLogin";

import { Button } from "./button";
import { SocialLoginButton } from "./SocialLoginButton";
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
};

/**
 * 로그인 필요 모달 (DESIGN §3.8, Figma 132:16158)
 * 진입점이 여러 화면에 있고 디자인·문구가 모두 같으므로 문구와 이동을 여기서 처리한다 (USER_FLOW §4.2)
 */
export function LoginRequiredDialog({
  open,
  onOpenChange,
}: LoginRequiredDialogProps) {
  // 로그인 화면을 거치지 않고 바로 카카오 인증으로 간다 (팀 결정 2026-10-06, USER_FLOW §4.2)
  // TODO: GNB 일정 개설 → 개설 1단계 등 트리거별 목적지는 해당 화면이 생기면 반영한다 (USER_FLOW §4.3)
  const handleKakaoLogin = () => {
    // 쿼리에 담긴 화면 상태까지 그대로 돌아온다
    const { pathname, search } = window.location;
    saveLoginRedirect(pathname + search);
    startKakaoLogin();
  };

  return (
    // 바깥 클릭으로 닫는 동작은 디자인에 없어 막는다. 취소 버튼과 Esc로 닫는다 (D-12)
    <Dialog open={open} onOpenChange={onOpenChange} disablePointerDismissal>
      <DialogContent className="max-w-80 rounded-3xl px-5 pt-6 pb-5 text-center">
        <DialogTitle className="text-lg">로그인이 필요합니다.</DialogTitle>
        <DialogDescription className="mt-1">
          카카오 로그인 후 이용해주세요.
        </DialogDescription>
        <div className="mt-5 flex gap-2.5">
          <DialogClose
            render={<Button variant="secondary" className="flex-1" />}
          >
            취소
          </DialogClose>
          <SocialLoginButton asset="kakao-small" onClick={handleKakaoLogin} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
