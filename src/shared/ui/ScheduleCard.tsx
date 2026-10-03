import { ImagePlaceholder } from "./ImagePlaceholder";
import { StatusBadge, type StatusBadgeProps } from "./StatusBadge";
import { cn } from "@/shared/lib/utils";

type ScheduleCardProps = {
  /** 표시용 날짜·시간 문자열 (예: "오늘 21:00", "9월 29일 (화) 15:00") */
  dateLabel: string;
  title: string;
  place: string;
  participantCount: number;
  capacity: number;
  price: number;
  badge: StatusBadgeProps;
};

const priceFormatter = new Intl.NumberFormat("ko-KR");

export function ScheduleCard({
  dateLabel,
  title,
  place,
  participantCount,
  capacity,
  price,
  badge,
}: ScheduleCardProps) {
  // 모집완료 일정은 썸네일과 날짜를 회색으로 약하게 보여준다 (DESIGN §13)
  const isClosed = badge.variant === "closed";

  return (
    <article className="flex gap-3 rounded-2xl bg-card p-3">
      <ImagePlaceholder
        muted={isClosed}
        className="size-22 shrink-0 rounded-xl"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 py-0.5">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "truncate text-sm font-semibold",
              isClosed ? "text-subtle-foreground" : "text-primary",
            )}
          >
            {dateLabel}
          </p>
          <StatusBadge {...badge} />
        </div>
        <h3 className="truncate text-base font-bold">{title}</h3>
        <p className="truncate text-sm text-subtle-foreground">{place}</p>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <span>
            {participantCount}/{capacity}명
          </span>
          <span aria-hidden className="h-3 w-px bg-border" />
          {/* 결제는 현장 후불만 있다 (USER_FLOW §1) */}
          <span>₩{priceFormatter.format(price)} 후불</span>
        </p>
      </div>
    </article>
  );
}
