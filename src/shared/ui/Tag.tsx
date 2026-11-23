import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

type TagProps = {
  /** brand: 참여 확정·모집 중 / muted: 모집완료·D-N / solid: NEW와 같은 색의 D-DAY / danger: 참여 이력의 일정 취소됨 / outline: 참여 이력의 참여 */
  tone: "brand" | "muted" | "solid" | "danger" | "outline";
  children: ReactNode;
};

const toneClassName: Record<TagProps["tone"], string> = {
  brand: "bg-brand-soft text-brand",
  muted: "bg-secondary text-muted-foreground",
  solid: "bg-brand text-primary-foreground",
  danger: "bg-danger-soft text-danger-text",
  outline: "border border-border bg-card text-muted-foreground",
};

/** 일정 카드 활동명 옆 표시. `solid`는 NEW와 같은 색의 D-DAY에 쓴다. */
export function Tag({ tone, children }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md px-2 py-1 text-tag font-semibold",
        toneClassName[tone],
      )}
    >
      {children}
    </span>
  );
}
