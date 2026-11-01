import { ChevronLeft, X } from "lucide-react";

import { cn } from "@/shared/lib/utils";

/** 진행 막대 칸 수. 6단계(최종 확인)는 모두 채운다 (시안 CRT-01~06) */
const PROGRESS_STEPS = 5;

type CreateStepHeaderProps = {
  step: number;
  /** ✕(1단계)·‹(2~5단계)·‹ 이전(6단계) */
  onBack: () => void;
  /** 상단 `처음으로`. 6단계는 하단에만 있다 */
  onRestart?: () => void;
};

/** 일정 개설 상단: 뒤로·닫기, 처음으로, 진행 막대 (시안 CRT-01~06) */
export function CreateStepHeader({
  step,
  onBack,
  onRestart,
}: CreateStepHeaderProps) {
  const filled = Math.min(step, PROGRESS_STEPS);

  return (
    <header className="sticky top-0 z-10 bg-card px-5 pt-safe">
      <div className="flex h-14 items-center justify-between">
        {step === 6 ? (
          <button
            type="button"
            onClick={onBack}
            className="relative flex h-9 items-center gap-0.5 rounded-full border border-stripe bg-brand-soft pr-3.5 pl-2.5 text-sm font-bold text-brand after:absolute after:-inset-1"
          >
            <ChevronLeft aria-hidden className="size-4" strokeWidth={2.5} />
            이전
          </button>
        ) : (
          <button
            type="button"
            onClick={onBack}
            aria-label={step === 1 ? "닫기" : "이전 단계"}
            className="-ml-2.5 flex size-11 items-center justify-center text-foreground"
          >
            {step === 1 ? (
              <X aria-hidden className="size-6" />
            ) : (
              <ChevronLeft aria-hidden className="size-6" />
            )}
          </button>
        )}
        {onRestart && (
          <button
            type="button"
            onClick={onRestart}
            className="relative h-9 rounded-full bg-secondary px-3.5 text-xs font-semibold text-muted-foreground after:absolute after:-inset-1"
          >
            처음으로
          </button>
        )}
      </div>
      <div
        role="progressbar"
        aria-label="일정 개설 진행"
        aria-valuemin={1}
        aria-valuemax={PROGRESS_STEPS}
        aria-valuenow={filled}
        className="flex gap-1.5 pb-1"
      >
        {Array.from({ length: PROGRESS_STEPS }, (_, index) => (
          <span
            key={index}
            className={cn(
              "h-1 flex-1 rounded-full",
              index < filled ? "bg-primary" : "bg-border",
            )}
          />
        ))}
      </div>
    </header>
  );
}
