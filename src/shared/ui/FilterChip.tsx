import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/utils";

type FilterChipProps = Omit<ComponentProps<"button">, "children"> & {
  label: string;
  /** default: 기본 / selected: 값 선택됨 / open: 바텀시트 열림 (DESIGN §9.1, 시안 LIST-01·03) */
  state?: "default" | "selected" | "open";
};

const stateClassName: Record<NonNullable<FilterChipProps["state"]>, string> = {
  default: "border-border bg-card text-foreground",
  selected: "border-stripe bg-brand-soft text-brand",
  // 시트가 열린 칩은 검정 (시안 LIST-03, 팀 결정 Q6)
  open: "border-foreground bg-foreground text-card",
};

/** 보이는 알약은 32px이고, 터치 영역은 버튼 높이 44px로 잡는다 */
export function FilterChip({
  label,
  state = "default",
  className,
  ...props
}: FilterChipProps) {
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      aria-expanded={state === "open"}
      className={cn("flex min-h-11 shrink-0 items-center", className)}
      {...props}
    >
      <span
        className={cn(
          "inline-flex h-8 items-center gap-1 rounded-full border px-3 text-sm font-semibold",
          stateClassName[state],
        )}
      >
        {label}
        {/* 라벨 뒤 작은 ▾ (시안, 팀 결정 Q5) */}
        <span aria-hidden className="text-2xs">
          ▾
        </span>
      </span>
    </button>
  );
}
