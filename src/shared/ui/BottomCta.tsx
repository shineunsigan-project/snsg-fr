import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

type BottomCtaProps = {
  /** 전체 폭 버튼. 여러 개면 위에서 아래로 쌓인다 */
  children: ReactNode;
  className?: string;
};

/**
 * 화면 하단에 붙는 전체 폭 버튼 영역 (DESIGN §9.1 Bottom CTA, 시안 CRT-01~06).
 * 스크롤 컨테이너의 마지막 자식으로 두면 하단에 고정되고, 홈 인디케이터 영역(safe area)을 비운다.
 */
export function BottomCta({ children, className }: BottomCtaProps) {
  return (
    <div
      className={cn(
        "sticky bottom-0 flex flex-col gap-2 bg-card px-5 pt-3 pb-safe *:w-full",
        className,
      )}
    >
      {children}
      {/* safe area가 0인 기기에서도 버튼이 화면 끝에 붙지 않게 한다 */}
      <span aria-hidden className="h-0.5" />
    </div>
  );
}
