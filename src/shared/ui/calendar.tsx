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
 * TODO(D-16): 달력은 와이어프레임(CRT-04, LIST-03)만 있고 디자인 UI가 없다.
 * 와이어프레임 배치(가운데 `‹ 2026.09 ›`, 7열 격자)를 기존 토큰으로 옮겼다.
 */
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
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
        // 시안 표기 `2026.09`
        formatCaption: (month, _options, dateLib) =>
          dateLib ? dateLib.format(month, "yyyy.MM") : "",
        ...formatters,
      }}
      classNames={{
        months: "relative",
        month: "flex flex-wrap items-center justify-center gap-y-2",
        month_caption: "flex h-11 items-center px-1",
        caption_label: "text-lg font-bold text-foreground tabular-nums",
        nav: "flex items-center",
        button_previous:
          "flex size-11 items-center justify-center rounded-full text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-disabled:pointer-events-none aria-disabled:text-subtle-foreground",
        button_next:
          "flex size-11 items-center justify-center rounded-full text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-disabled:pointer-events-none aria-disabled:text-subtle-foreground",
        month_grid: "w-full basis-full border-collapse",
        weekdays: "flex",
        weekday: "flex-1 py-1 text-xs font-medium text-subtle-foreground",
        week: "mt-1 flex w-full",
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
  ...props
}: DayButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  // 키보드로 날짜를 옮길 때 포커스를 따라가게 한다 (react-day-picker 기본 DayButton과 같은 동작)
  useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  const isRangeEdge = modifiers.range_start || modifiers.range_end;

  return (
    <button
      ref={ref}
      data-day={day.isoDate}
      className={cn(
        "flex h-11 w-full items-center justify-center rounded-lg text-md text-foreground tabular-nums outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        modifiers.today && "bg-secondary",
        modifiers.outside && "text-subtle-foreground",
        modifiers.disabled && "pointer-events-none text-subtle-foreground",
        modifiers.range_middle && "rounded-none bg-brand-soft text-brand",
        (isRangeEdge || (modifiers.selected && !modifiers.range_middle)) &&
          "bg-primary font-bold text-primary-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Calendar, CalendarDayButton };
