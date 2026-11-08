"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useEffect, useRef, type ComponentProps } from "react";
import { DayPicker, type DayButtonProps } from "react-day-picker";
import { ko } from "react-day-picker/locale";

import { cn } from "@/shared/lib/utils";

type CalendarProps = ComponentProps<typeof DayPicker>;

/**
 * 월 달력 (shadcn Calendar 기반, react-day-picker).
 * 선택 방식(`mode`), 비활성 날짜(`disabled`) 등 DayPicker 기능은 그대로 넘긴다.
 * 예: 오늘 이전 비활성 → `disabled={{ before: new Date() }}`, 기간 선택(LIST-03) → `mode="range"`.
 *
 * 시안: LIST-03 날짜·시간 시트(2026-11-02 추가). 가운데 `2026년 9월`, 양 끝 `‹ ›`, 일요일 빨간색, 오늘 테두리 원,
 * 기간은 양 끝 녹색 원 + 사이 연두 띠, 다른 달 날짜는 비운다. CRT-04는 따로 시안이 없어 같은 모양을 쓴다.
 * 이번 달 이전으로 못 가게 하려면 `startMonth`를 넘긴다
 */
function Calendar({
  className,
  classNames,
  showOutsideDays = false,
  navLayout = "around",
  locale = ko,
  formatters,
  components,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      navLayout={navLayout}
      locale={locale}
      className={cn("w-full", className)}
      formatters={{
        // 시안 표기 `2026년 9월` (LIST-03 날짜·시간)
        formatCaption: (month, _options, dateLib) =>
          dateLib ? dateLib.format(month, "yyyy년 M월") : "",
        ...formatters,
      }}
      classNames={{
        months: "relative",
        // `‹ ›`는 달력 양 끝, 제목은 가운데 (시안 LIST-03 날짜·시간)
        month: "flex flex-wrap items-center justify-between gap-y-2",
        month_caption: "flex h-11 items-center px-1",
        caption_label: "text-lg font-bold text-foreground tabular-nums",
        nav: "flex items-center",
        button_previous:
          "flex size-11 items-center justify-center rounded-full text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-disabled:pointer-events-none aria-disabled:text-subtle-foreground",
        button_next:
          "flex size-11 items-center justify-center rounded-full text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-disabled:pointer-events-none aria-disabled:text-subtle-foreground",
        month_grid: "w-full basis-full border-collapse",
        weekdays: "flex",
        // 일요일은 빨간색 (시안 LIST-03 날짜·시간)
        weekday:
          "flex-1 py-1 text-xs font-medium text-subtle-foreground first:text-destructive",
        // 줄 사이 여백 없이 터치 영역(44px)만큼만 둔다. 시안 줄 높이(약 39pt)에 가깝게 줄인다 (팀 결정 Q8)
        week: "flex w-full",
        day: "flex-1 p-0 text-center",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: chevronClassName }) =>
          orientation === "left" ? (
            <ChevronLeftIcon className={cn("size-5", chevronClassName)} />
          ) : (
            <ChevronRightIcon className={cn("size-5", chevronClassName)} />
          ),
        DayButton: CalendarDayButton,
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({
  day,
  modifiers,
  className,
  children,
  ...props
}: DayButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  // 키보드로 날짜를 옮길 때 포커스를 따라가게 한다 (react-day-picker 기본 DayButton과 같은 동작)
  useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  const isRangeEdge = modifiers.range_start || modifiers.range_end;
  // 시작일과 종료일이 다르면 양 끝 원에서 안쪽으로 연두 띠를 잇는다 (시안 LIST-03 날짜·시간)
  const hasBand = modifiers.range_start !== modifiers.range_end;

  // 터치 영역은 버튼(칸 폭 × 44px)이 맡고, 원은 칸이 44px보다 좁으면(320px 화면 등) 칸 폭에 맞춰 줄인다.
  // 기간 띠는 원과 같은 높이로 그린다
  return (
    <button
      ref={ref}
      data-day={day.isoDate}
      className={cn(
        "group/day flex h-11 w-full items-center justify-center text-md text-foreground tabular-nums outline-none",
        modifiers.disabled && "pointer-events-none",
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          "flex w-full justify-center",
          modifiers.range_middle && "bg-brand-soft",
          hasBand &&
            modifiers.range_start &&
            "bg-linear-to-r from-transparent from-50% to-brand-soft to-50%",
          hasBand &&
            modifiers.range_end &&
            "bg-linear-to-l from-transparent from-50% to-brand-soft to-50%",
        )}
      >
        <span
          className={cn(
            "flex aspect-square w-full max-w-11 items-center justify-center rounded-full group-focus-visible/day:ring-3 group-focus-visible/day:ring-ring/50",
            // 오늘은 테두리 원 (시안 LIST-03 날짜·시간)
            modifiers.today && "ring-1 ring-primary/50 ring-inset",
            (modifiers.outside || modifiers.disabled) &&
              "text-subtle-foreground",
            modifiers.range_middle && "font-semibold text-brand",
            (isRangeEdge || (modifiers.selected && !modifiers.range_middle)) &&
              "bg-primary font-bold text-primary-foreground",
          )}
        >
          {children}
        </span>
      </span>
    </button>
  );
}

export { Calendar, CalendarDayButton };
