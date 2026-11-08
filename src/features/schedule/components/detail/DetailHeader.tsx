import { ChevronLeft } from "lucide-react";

type DetailHeaderProps = {
  /** 뒤로 (팀 결정 Q7) */
  onBack: () => void;
  /** 상세 링크 복사 (DTL-04) */
  onShare: () => void;
};

/**
 * 상세 상단: 회색 원형 뒤로 버튼, 회색 pill `공유` (USER_FLOW §7.2, 시안 DTL-01·04). `제보`는 범위 밖.
 * 보이는 크기는 36px이고 누르는 영역은 44px이다
 */
export function DetailHeader({ onBack, onShare }: DetailHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-card px-3 pt-safe">
      <div className="flex h-14 items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          aria-label="뒤로"
          className="group flex size-11 items-center justify-center outline-none"
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-secondary text-foreground group-focus-visible:ring-3 group-focus-visible:ring-ring/50">
            <ChevronLeft aria-hidden className="size-5" />
          </span>
        </button>
        <button
          type="button"
          onClick={onShare}
          className="group flex min-h-11 items-center outline-none"
        >
          {/* 마우스를 올리면 흰 바탕 + 녹색 테두리 (시안 DTL-04). 누르는 순간만 보이면 깜빡임처럼 보여 hover로 둔다 (사용자 결정 2026-11-08).
              Tailwind의 hover는 마우스가 있는 기기에서만 적용되어 휴대폰에서는 표시가 없다 */}
          <span className="flex h-9 items-center rounded-full bg-secondary px-3.5 text-sm font-bold group-hover:bg-card group-hover:ring-2 group-hover:ring-primary group-hover:ring-inset group-focus-visible:ring-3 group-focus-visible:ring-ring/50">
            공유
          </span>
        </button>
      </div>
    </header>
  );
}
