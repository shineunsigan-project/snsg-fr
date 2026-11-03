import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

type TagProps = {
  /** brand: 참여 확정·모집 중 / muted: 모집완료·D-N / dark: D-DAY (시안 LIST-04·05) */
  tone: "brand" | "muted" | "dark";
  children: ReactNode;
};

const toneClassName: Record<TagProps["tone"], string> = {
  brand: "bg-brand-soft text-brand",
  muted: "bg-secondary text-muted-foreground",
  dark: "bg-foreground text-card",
};

/** 참여한·개설한 일정 카드 왼쪽 위에 붙는 표시 (참여 확정, D-DAY, 상태). 모집 중 탭의 StatusBadge보다 크다 (시안 LIST-04·05) */
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
