import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

import { StatusBadge, type StatusBadgeProps } from "./StatusBadge";

type ScheduleCardProps = {
  /** 카드를 누르면 가는 일정 상세 경로 */
  href: string;
  /** 활동 이름 (예: "보드게임") */
  category: string;
  /** 활동 이름 옆에 붙는 표시 (참여한 일정: 참여 확정·D-DAY, 개설한 일정: 상태·NEW) */
  tags?: ReactNode;
  /** 오른쪽 위 모집 상태 (모집 중 탭) */
  badge?: StatusBadgeProps;
  title: string;
  /** 시·군·구 (예: "마포구") */
  region: string;
  /** 약속 시간 (예: "09월26일(토) 19:30") */
  dateLabel: string;
  participantCount: number;
  capacity: number;
  /** 모집이 끝난 일정이면 약속 시간을 회색으로 약하게 보여준다 (DESIGN §13, 시안 LIST-01) */
  isInactive?: boolean;
  /** 방금 개설한 일정을 녹색 테두리로 강조한다 (시안 CRT-07) */
  isHighlighted?: boolean;
};

/**
 * 일정 카드 (USER_FLOW §5, 시안 LIST-01·04·05, CRT-07). 썸네일 없이 글자만 있다.
 * 장소명·대표 이미지·비용은 보여주지 않는다. 카드 전체가 상세로 가는 링크다
 */
export function ScheduleCard({
  href,
  category,
  tags,
  badge,
  title,
  region,
  dateLabel,
  participantCount,
  capacity,
  isInactive = false,
  isHighlighted = false,
}: ScheduleCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col gap-1.5 rounded-2xl bg-card px-4 py-3.5 focus-visible:outline-3 focus-visible:outline-ring/50",
        isHighlighted && "ring-2 ring-brand ring-inset",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <span
            className={cn(
              "shrink-0 bg-secondary text-muted-foreground",
              // 태그가 함께 붙는 카드(LIST-04·05)는 활동 이름도 태그 크기로 맞춘다 (시안)
              tags
                ? "rounded-md px-2 py-1 text-tag"
                : "rounded-sm px-1.5 py-0.5 text-xs",
            )}
          >
            {category}
          </span>
          {tags}
        </div>
        {badge && <StatusBadge {...badge} />}
      </div>
      <h3 className="truncate text-base font-bold">{title}</h3>
      <p className="flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
        <span className="shrink-0">{region}</span>
        <span aria-hidden className="text-subtle-foreground">
          ·
        </span>
        <span
          className={cn(
            "truncate font-semibold",
            isInactive ? "text-subtle-foreground" : "text-primary",
          )}
        >
          {dateLabel}
        </span>
        <span aria-hidden className="text-subtle-foreground">
          ·
        </span>
        <span className="shrink-0 font-medium">
          {participantCount}/{capacity}명
        </span>
      </p>
    </Link>
  );
}
