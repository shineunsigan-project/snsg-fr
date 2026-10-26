import { StatusBadge, type StatusBadgeProps } from "./StatusBadge";
import { cn } from "@/shared/lib/utils";

type ScheduleCardProps = {
  /** 활동 종류 태그 (예: "보드게임"). 시안의 모집완료 카드처럼 없으면 그리지 않는다 */
  category?: string;
  /** 표시용 날짜·시간 문자열 (예: "오늘 21:00", "9월 29일 (화) 15:00") */
  dateLabel: string;
  title: string;
  /** 지역 (예: "마포구"). 있으면 장소 앞에 붙인다 */
  region?: string;
  place: string;
  participantCount: number;
  capacity: number;
  price: number;
  badge: StatusBadgeProps;
};

const priceFormatter = new Intl.NumberFormat("ko-KR");

/** 일정 카드 (DESIGN §3.5, Figma 430:28279). 썸네일 없이 글자만 있다 */
export function ScheduleCard({
  category,
  dateLabel,
  title,
  region,
  place,
  participantCount,
  capacity,
  price,
  badge,
}: ScheduleCardProps) {
  // 모집완료 일정은 날짜를 회색으로 약하게 보여준다 (DESIGN §13)
  const isClosed = badge.variant === "closed";

  return (
    <article className="flex flex-col gap-1 rounded-2xl bg-card px-4 py-3.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {category && (
            <span className="shrink-0 rounded-sm bg-secondary px-1.5 py-0.5 text-xs text-muted-foreground">
              {category}
            </span>
          )}
          <p
            className={cn(
              "truncate text-sm font-semibold",
              isClosed ? "text-subtle-foreground" : "text-primary",
            )}
          >
            {dateLabel}
          </p>
        </div>
        <StatusBadge {...badge} />
      </div>
      <h3 className="truncate text-base font-bold">{title}</h3>
      <p className="truncate text-sm text-subtle-foreground">
        {region && (
          <>
            <span className="font-medium text-muted-foreground">{region}</span>
            {" · "}
          </>
        )}
        {place}
      </p>
      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <span>
          {participantCount}/{capacity}명
        </span>
        <span aria-hidden className="h-3 w-px bg-border" />
        {/* 결제는 현장 후불만 있다 (USER_FLOW §1) */}
        <span>₩{priceFormatter.format(price)} 후불</span>
      </p>
    </article>
  );
}
