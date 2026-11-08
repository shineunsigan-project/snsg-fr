"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { CheckIcon, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import type { DateRange } from "react-day-picker";

import type { ScheduleFilter } from "../../api/schedules";
import { useActivities } from "../../hooks/useActivities";
import { useRegions } from "../../hooks/useRegions";
import { toKstDate } from "../../lib/scheduleDate";
import { Button } from "@/shared/ui/button";
import { Calendar } from "@/shared/ui/calendar";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
} from "@/shared/ui/drawer";
import { FilterChip } from "@/shared/ui/FilterChip";
import { Switch } from "@/shared/ui/switch";
import { TimeWheelPicker } from "@/shared/ui/TimeWheelPicker";

type SheetKind = "activity" | "region" | "date";

const toDateParam = (date: Date) => format(date, "yyyy-MM-dd");
const toChipDate = (date: string) => format(parseISO(date), "MM.dd");
/** `시작 시각 설정`을 켤 때 처음 보여주는 시각 (시안 LIST-03: 오후 6:00) */
const DEFAULT_START_TIME = "18:00";
/** 지역 `전체` = 지역을 고르지 않음 */
const ALL_REGIONS = "";
/** 활동을 고르지 않은 상태. 어느 항목과도 같지 않은 값으로 RadioGroup을 제어 상태로 둔다 */
const NO_ACTIVITY = "";

/** 날짜 표기: 하루면 `09.27`, 기간이면 `09.27{separator}09.30` */
function formatDateRange(
  startDate: string,
  endDate: string | undefined,
  separator: string,
) {
  return endDate && endDate !== startDate
    ? `${toChipDate(startDate)}${separator}${toChipDate(endDate)}`
    : toChipDate(startDate);
}

/**
 * 모집 중 목록의 필터 칩 + 하단 시트 (LIST-03, USER_FLOW §5 필터)
 * 칩을 누르면 시트가 열리고, `적용하기`를 눌러야 목록에 반영된다. `초기화`는 시트 안의 선택만 지운다
 */
export function ScheduleFilterBar({
  filter,
  onApply,
}: {
  filter: ScheduleFilter;
  onApply: (filter: ScheduleFilter) => void;
}) {
  const { data: activities } = useActivities();
  const { data: regions } = useRegions();
  const [openSheet, setOpenSheet] = useState<SheetKind | null>(null);
  // 시트 안에서 고르는 중인 값. 시트를 열 때 지금 필터로 채운다
  const [draft, setDraft] = useState<ScheduleFilter>(filter);
  const startTimeLabelId = useId();

  // `시작 시각 설정`을 켜면 휠이 시트 아래로 가려지지 않게 보이는 곳까지 스크롤한다 (팀 결정 Q8)
  const wheelRef = useRef<HTMLDivElement>(null);
  const shouldRevealWheel = useRef(false);
  const isStartTimeOn = draft.startTime !== undefined;
  useEffect(() => {
    if (!isStartTimeOn || !shouldRevealWheel.current) return;
    shouldRevealWheel.current = false;
    wheelRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [isStartTimeOn]);

  const open = (sheet: SheetKind) => {
    setDraft(filter);
    setOpenSheet(sheet);
  };
  const apply = (next: ScheduleFilter) => {
    onApply(next);
    setOpenSheet(null);
  };

  const activityName = activities?.find(
    (activity) => activity.id === filter.activityId,
  )?.name;
  const regionName = regions?.find(
    (region) => region.code === filter.regionCode,
  )?.name;
  // 날짜·시간 칩: `09.27~09.30`, `18:00 이후`, 둘 다면 함께. 칩 표기는 시안이 없어 짧게 쓴다
  const dateLabel =
    [
      filter.startDate &&
        formatDateRange(filter.startDate, filter.endDate, "~"),
      filter.startTime && `${filter.startTime} 이후`,
    ]
      .filter(Boolean)
      .join(" · ") || undefined;

  const chipState = (sheet: SheetKind, hasValue: boolean) =>
    openSheet === sheet ? "open" : hasValue ? "selected" : "default";

  const dateRange: DateRange | undefined = draft.startDate
    ? {
        from: parseISO(draft.startDate),
        // 종료일을 아직 안 골랐으면 비워 둔다. 다음 날짜를 누르면 종료일이 된다
        to: draft.endDate ? parseISO(draft.endDate) : undefined,
      }
    : undefined;
  // 오늘은 기기 시간대가 아니라 한국 날짜로 본다 (일정 시각은 한국 시간)
  const today = parseISO(toKstDate(new Date()));

  return (
    <>
      <div
        role="group"
        aria-label="필터"
        className="flex gap-2 overflow-x-auto px-5 py-2"
      >
        <FilterChip
          label={activityName ?? "활동"}
          state={chipState("activity", activityName !== undefined)}
          onClick={() => open("activity")}
        />
        <FilterChip
          label={regionName ?? "지역"}
          state={chipState("region", regionName !== undefined)}
          onClick={() => open("region")}
        />
        <FilterChip
          label={dateLabel ?? "날짜"}
          state={chipState("date", dateLabel !== undefined)}
          onClick={() => open("date")}
        />
      </div>

      <FilterSheet
        title="활동"
        open={openSheet === "activity"}
        onClose={() => setOpenSheet(null)}
        onReset={() => setDraft({ ...draft, activityId: undefined })}
        onApply={() => apply({ ...filter, activityId: draft.activityId })}
      >
        <OptionList
          label="활동"
          options={(activities ?? []).map((activity) => ({
            value: activity.id,
            label: activity.name,
          }))}
          value={draft.activityId ?? NO_ACTIVITY}
          onChange={(value) => setDraft({ ...draft, activityId: value })}
        />
      </FilterSheet>

      <FilterSheet
        title="지역"
        open={openSheet === "region"}
        onClose={() => setOpenSheet(null)}
        onReset={() => setDraft({ ...draft, regionCode: undefined })}
        onApply={() => apply({ ...filter, regionCode: draft.regionCode })}
      >
        {/* 지역은 하나만 고른다 (팀 결정 2026-11-02) */}
        <OptionList
          label="지역"
          // 맨 위 `전체`는 지역을 고르지 않은 상태다 (시안 LIST-03 지역)
          options={[
            { value: ALL_REGIONS, label: "전체" },
            ...(regions ?? []).map((region) => ({
              value: region.code,
              label: region.name,
            })),
          ]}
          value={draft.regionCode ?? ALL_REGIONS}
          onChange={(value) =>
            setDraft({ ...draft, regionCode: value || undefined })
          }
        />
      </FilterSheet>

      <FilterSheet
        title="날짜·시간"
        open={openSheet === "date"}
        onClose={() => setOpenSheet(null)}
        onReset={() =>
          setDraft({
            ...draft,
            startDate: undefined,
            endDate: undefined,
            startTime: undefined,
          })
        }
        onApply={() =>
          apply({
            ...filter,
            startDate: draft.startDate,
            endDate: draft.startDate
              ? (draft.endDate ?? draft.startDate)
              : undefined,
            startTime: draft.startTime,
          })
        }
      >
        <section aria-label="날짜" className="flex flex-col gap-2 px-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-muted-foreground">날짜</h3>
            {draft.startDate && (
              // 시안 표기 `09.27 – 09.30 · 4일`
              <p className="text-sm font-bold text-primary tabular-nums">
                {formatDateRange(draft.startDate, draft.endDate, " – ")} ·{" "}
                {differenceInCalendarDays(
                  parseISO(draft.endDate ?? draft.startDate),
                  parseISO(draft.startDate),
                ) + 1}
                일
              </p>
            )}
          </div>
          <div className="rounded-2xl border border-border px-3 pb-2">
            <Calendar
              mode="range"
              // 같은 날을 두 번 눌러도 선택을 지우지 않고 그 하루로 둔다 (명세, 팀 결정 Q1)
              required
              // 기간을 다 고른 뒤 누르면 그 날짜부터 새 기간을 고른다 (끝만 옮기지 않는다)
              resetOnSelect
              selected={dateRange}
              onSelect={(range) =>
                setDraft({
                  ...draft,
                  startDate: range.from ? toDateParam(range.from) : undefined,
                  endDate: range.to ? toDateParam(range.to) : undefined,
                })
              }
              // 오늘 이전 날짜와 이번 달 이전 달은 고를 수 없다
              today={today}
              disabled={{ before: today }}
              startMonth={today}
              defaultMonth={dateRange?.from}
            />
          </div>
        </section>

        <section
          aria-label="시작 시각"
          className="flex flex-col gap-3 px-5 pt-5"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-muted-foreground">
              시작 시각
            </h3>
            <p className="text-xs text-subtle-foreground">
              이 시각 이후에 시작하는 일정
            </p>
          </div>
          <div className="flex min-h-11 items-center justify-between">
            <span id={startTimeLabelId} className="text-base font-semibold">
              시작 시각 설정
            </span>
            <Switch
              size="lg"
              aria-labelledby={startTimeLabelId}
              checked={isStartTimeOn}
              onCheckedChange={(checked) => {
                shouldRevealWheel.current = checked;
                setDraft({
                  ...draft,
                  startTime: checked ? DEFAULT_START_TIME : undefined,
                });
              }}
            />
          </div>
          {draft.startTime !== undefined && (
            // 휠 오른쪽에 `이후`를 붙인다 (시안)
            <div ref={wheelRef} className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <TimeWheelPicker
                  aria-label="시작 시각"
                  value={draft.startTime}
                  onValueChange={(startTime) =>
                    setDraft({ ...draft, startTime })
                  }
                />
              </div>
              <span
                aria-hidden
                className="shrink-0 pr-4 text-base font-bold text-primary"
              >
                이후
              </span>
            </div>
          )}
        </section>
      </FilterSheet>
    </>
  );
}

function FilterSheet({
  title,
  open,
  onClose,
  onReset,
  onApply,
  children,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  onReset: () => void;
  onApply: () => void;
  children: ReactNode;
}) {
  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      showSwipeHandle
    >
      <DrawerContent className="mx-auto max-w-md rounded-t-3xl border-0 bg-card">
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <DrawerTitle className="text-xl font-bold">{title}</DrawerTitle>
          <DrawerClose
            aria-label="닫기"
            className="-mr-2.5 flex size-11 items-center justify-center text-foreground"
          >
            <X aria-hidden className="size-6" />
          </DrawerClose>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {/* 초기화 : 적용하기 = 1 : 2 (시안). safe area가 0인 기기에서도 버튼이 화면 끝에 붙지 않게 아래 여백을 더한다 */}
        <div className="pb-safe">
          <div className="grid grid-cols-3 gap-2 px-5 pt-4 pb-2">
            <Button variant="secondary" onClick={onReset}>
              초기화
            </Button>
            <Button variant="primary" className="col-span-2" onClick={onApply}>
              적용하기
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

/** 하나만 고르는 목록 (시안 LIST-03: 이름 + 오른쪽 체크 원, 줄 구분선). 방향키로 옮겨 고른다 */
function OptionList({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <RadioGroup<string>
      aria-label={label}
      value={value}
      onValueChange={onChange}
      className="flex flex-col px-5"
    >
      {options.map((option) => (
        <OptionItem key={option.value} {...option} />
      ))}
    </RadioGroup>
  );
}

function OptionItem({ value, label }: { value: string; label: string }) {
  const labelId = useId();
  return (
    <label className="flex min-h-14 cursor-pointer items-center justify-between border-b border-border text-base text-foreground has-data-checked:font-bold has-data-checked:text-primary">
      <span id={labelId}>{label}</span>
      <Radio.Root
        value={value}
        aria-labelledby={labelId}
        className="flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-input outline-none focus-visible:ring-3 focus-visible:ring-ring/50 data-checked:border-primary data-checked:bg-primary"
      >
        <Radio.Indicator className="flex text-primary-foreground data-unchecked:hidden">
          <CheckIcon aria-hidden className="size-3.5" strokeWidth={3} />
        </Radio.Indicator>
      </Radio.Root>
    </label>
  );
}
