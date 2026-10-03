import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/utils";

type FilterChipProps = Omit<ComponentProps<"button">, "children"> & {
  label: string;
  /** default: 기본 / selected: 값 선택됨 / open: 바텀시트 열림 (DESIGN §9.1) */
  state?: "default" | "selected" | "open";
};

const stateClassName: Record<NonNullable<FilterChipProps["state"]>, string> = {
  default: "border-border bg-card text-foreground",
  selected: "border-stripe bg-brand-soft text-brand",
  open: "border-brand bg-brand text-white",
};

export function FilterChip({
  label,
  state = "default",
  className,
  ...props
}: FilterChipProps) {
  return (
    <button
      type="button"
      aria-expanded={state === "open"}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-1 rounded-full border px-3 text-sm font-semibold",
        stateClassName[state],
        className,
      )}
      {...props}
    >
      {label}
      <span aria-hidden>·</span>
    </button>
  );
}
