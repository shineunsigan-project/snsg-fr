import { cn } from "@/shared/lib/utils";

export type StatusBadgeProps =
  | { variant: "recruiting" }
  | { variant: "closed" }
  | { variant: "seatsLeft"; count: number };

const variantClassName: Record<StatusBadgeProps["variant"], string> = {
  recruiting: "bg-brand-soft text-brand",
  closed: "bg-secondary text-muted-foreground",
  seatsLeft: "bg-brand-soft text-brand",
};

function getLabel(props: StatusBadgeProps) {
  switch (props.variant) {
    case "recruiting":
      return "모집중";
    case "closed":
      return "모집완료";
    case "seatsLeft":
      return `${props.count}자리 남음`;
  }
}

export function StatusBadge(props: StatusBadgeProps) {
  return (
    <span
      className={cn(
        // 글자는 활동 이름 칩·Tag와 같은 13px (사용자 결정 2026-11-11). 높이 26px은 Tag(py-1 + 13px 줄 높이)와 같다 (SHI-189)
        "inline-flex h-6.5 shrink-0 items-center rounded-md px-2 text-tag font-semibold",
        variantClassName[props.variant],
      )}
    >
      {getLabel(props)}
    </span>
  );
}
