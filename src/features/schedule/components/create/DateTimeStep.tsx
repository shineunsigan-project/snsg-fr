"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import {
  formatDateField,
  formatExpectedEnd,
  fromCalendarDate,
  getEarliestStart,
  getKstToday,
  getLatestStartDate,
  toCalendarDate,
  toMinutes,
} from "../../lib/startTime";
import {
  durationOptions,
  type CreateScheduleInput,
  type CreateScheduleValues,
} from "../../schemas/createScheduleSchema";
import { StepTitle } from "./StepTitle";
import { BottomCta } from "@/shared/ui/BottomCta";
import { Button } from "@/shared/ui/button";
import { Calendar } from "@/shared/ui/calendar";
import { TimeWheelPicker } from "@/shared/ui/TimeWheelPicker";

/**
 * CRT-04 날짜·시작 시각. 오늘 이전 날짜, 지금 + 1시간 이전 시각, 오늘 + 30일 뒤 날짜는 고를 수 없다.
 * 서버가 `일정 열기` 때 다시 검사한다
 */
export function DateTimeStep({ onNext }: { onNext: () => void }) {
  const { control, setValue } = useFormContext<
    CreateScheduleInput,
    unknown,
    CreateScheduleValues
  >();
  const date = useWatch({ control, name: "date" });
  const startTime = useWatch({ control, name: "startTime" });
  const duration = useWatch({ control, name: "duration" });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarId = useId();
  // 이 화면을 연 시각 기준. 머무는 동안 지난 시각은 서버가 거부한다
  const [earliest] = useState(getEarliestStart);
  const [today] = useState(getKstToday);
  const [latestDate] = useState(getLatestStartDate);
  const minTime = date === earliest.date ? earliest.time : undefined;

  // 보관해 둔 날짜·시각이 고를 수 있는 범위 밖이면 가장 가까운 값으로 맞춘다
  useEffect(() => {
    if (date > latestDate) {
      setValue("date", latestDate);
    } else if (date < earliest.date) {
      setValue("date", earliest.date);
      setValue("startTime", earliest.time);
    } else if (
      date === earliest.date &&
      toMinutes(startTime) < toMinutes(earliest.time)
    ) {
      setValue("startTime", earliest.time);
    }
  }, [date, startTime, earliest, latestDate, setValue]);

  const selectDate = (day: Date) => {
    setValue("date", fromCalendarDate(day));
    setIsCalendarOpen(false);
  };

  const durationOption = durationOptions.find(
    (option) => option.value === duration,
  );

  return (
    <>
      <main className="flex-1 overflow-y-auto px-5 pb-6">
        <StepTitle>언제 시작할까요?</StepTitle>

        <div className="mt-6">
          <div className="flex items-baseline justify-between">
            <p className="text-xs font-bold text-muted-foreground">날짜</p>
            <p className="text-xs text-subtle-foreground">
              눌러서 달력에서 선택
            </p>
          </div>
          <button
            type="button"
            aria-expanded={isCalendarOpen}
            aria-controls={calendarId}
            aria-label={`날짜 ${formatDateField(date)}${date === today ? " 오늘" : ""}, 달력 열기`}
            onClick={() => setIsCalendarOpen((open) => !open)}
            className="mt-2 flex h-13 w-full items-center gap-2 rounded-lg border border-input bg-card px-4 text-left focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <span className="text-lg font-bold text-foreground tabular-nums">
              {formatDateField(date)}
            </span>
            {date === today && (
              <span className="text-xs text-muted-foreground">오늘</span>
            )}
            <ChevronDown
              aria-hidden
              className="ml-auto size-5 text-muted-foreground"
            />
          </button>
          {isCalendarOpen && (
            <div
              id={calendarId}
              className="mt-2 rounded-lg border border-input bg-card px-2 py-3"
            >
              <Calendar
                mode="single"
                required
                selected={toCalendarDate(date)}
                onSelect={selectDate}
                defaultMonth={toCalendarDate(date)}
                today={toCalendarDate(today)}
                startMonth={toCalendarDate(today)}
                endMonth={toCalendarDate(latestDate)}
                disabled={[
                  { before: toCalendarDate(earliest.date) },
                  { after: toCalendarDate(latestDate) },
                ]}
              />
            </div>
          )}
        </div>

        <div className="mt-6">
          <div className="flex items-baseline justify-between">
            <p className="text-xs font-bold text-muted-foreground">시작 시각</p>
            <p className="text-xs text-subtle-foreground">30분 단위</p>
          </div>
          <div className="mt-2">
            <TimeWheelPicker
              aria-label="시작 시각"
              value={startTime}
              min={minTime}
              onValueChange={(value) => setValue("startTime", value)}
            />
          </div>
        </div>

        {durationOption && (
          <div className="mt-6 rounded-xl bg-brand-soft px-5 py-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">예상 소요</p>
                <p className="mt-1 text-base font-bold text-foreground">
                  {durationOption.description}{" "}
                  <span className="text-xs font-semibold text-brand">
                    {durationOption.label}
                  </span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">예상 종료</p>
                <p className="mt-1 text-base font-bold text-brand tabular-nums">
                  {formatExpectedEnd(startTime, durationOption.value)}
                </p>
              </div>
            </div>
            <p className="mt-3 border-t border-stripe pt-3 text-xs text-muted-foreground">
              3단계에서 선택한 소요시간 기준이에요
            </p>
          </div>
        )}
      </main>

      <BottomCta>
        <Button variant="primary" size="lg" onClick={onNext}>
          다음
        </Button>
      </BottomCta>
    </>
  );
}
