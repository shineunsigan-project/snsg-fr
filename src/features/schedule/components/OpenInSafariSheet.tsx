"use client";

import { Button } from "@/shared/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/shared/ui/drawer";
import { showToast } from "@/shared/ui/sonner";

type OpenInSafariSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * iOS 앱 안 브라우저에서 Safari로 열도록 안내하는 바텀시트 (Figma 430:28246, 팀 요청 2026-10-11)
 * 시안은 가운데 팝업이지만 바텀시트로 바꿨다 (팀 결정 2026-10-11)
 */
export function OpenInSafariSheet({
  open,
  onOpenChange,
}: OpenInSafariSheetProps) {
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast("링크가 복사되었습니다.");
    } catch {
      // TODO: 복사에 실패했을 때의 안내는 정해지지 않았다
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="px-5 pt-6 text-center">
        <DrawerTitle className="text-xl leading-7 break-keep">
          Safari에서 열면
          <br />더 편하게 쓸 수 있어요
        </DrawerTitle>
        <DrawerDescription className="mt-2 break-keep">
          앱 안 브라우저에서는 로그인 상태가 유지되지 않고 일정 알림을 받을 수
          없어요.
        </DrawerDescription>

        <ol className="mt-5 rounded-xl bg-secondary px-4 text-left text-sm text-muted-foreground">
          <li className="flex items-center gap-3 border-b border-border py-3.5">
            <StepNumber value={1} />
            <span className="break-keep">오른쪽 위 ··· 누르기</span>
          </li>
          <li className="flex items-center gap-3 py-3.5">
            <StepNumber value={2} />
            <span className="break-keep">
              <strong className="font-bold text-foreground">
                ‘Safari로 열기’
              </strong>{" "}
              또는{" "}
              <strong className="font-bold text-foreground">
                ‘외부 브라우저에서 열기’
              </strong>{" "}
              선택
            </span>
          </li>
        </ol>

        <Button
          variant="primary"
          size="lg"
          className="mt-5 w-full"
          onClick={copyLink}
        >
          링크 복사하기
        </Button>
        <DrawerClose className="mx-auto mt-1 mb-2 flex min-h-11 items-center px-4 text-sm text-muted-foreground">
          여기서 둘러볼게요
        </DrawerClose>
      </DrawerContent>
    </Drawer>
  );
}

function StepNumber({ value }: { value: number }) {
  return (
    <span
      aria-hidden
      className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
    >
      {value}
    </span>
  );
}
