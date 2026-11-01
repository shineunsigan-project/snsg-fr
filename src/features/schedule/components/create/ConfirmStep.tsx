"use client";

import { useFormContext, useWatch } from "react-hook-form";

import { useActivities } from "../../hooks/useActivities";
import { formatStartAt } from "../../lib/startTime";
import {
  durationOptions,
  type CreateScheduleInput,
  type CreateScheduleValues,
} from "../../schemas/createScheduleSchema";
import { StepTitle } from "./StepTitle";
import { BottomCta } from "@/shared/ui/BottomCta";
import { Button } from "@/shared/ui/button";

type ConfirmStepProps = {
  onRestart: () => void;
  onOpen: () => void;
  /** 개설 요청 중이거나 로그인 여부를 확인하는 중이면 누를 수 없다 */
  isOpenDisabled: boolean;
};

/** CRT-06 최종 확인. 1~5단계 입력값 요약 */
export function ConfirmStep({
  onRestart,
  onOpen,
  isOpenDisabled,
}: ConfirmStepProps) {
  const { control } = useFormContext<
    CreateScheduleInput,
    unknown,
    CreateScheduleValues
  >();
  const values = useWatch({ control });
  const { data: activities } = useActivities();
  const activityName = activities?.find(
    (activity) => activity.activityId === values.activityId,
  )?.name;
  const durationLabel = durationOptions.find(
    (option) => option.value === values.duration,
  )?.description;

  const rows = [
    { label: "장소", value: values.place?.name },
    {
      label: "일시",
      value:
        values.date && values.startTime
          ? formatStartAt(values.date, values.startTime)
          : undefined,
    },
    { label: "예상 소요", value: durationLabel },
    {
      label: "인원",
      value: values.capacity ? `${values.capacity}명` : undefined,
    },
  ];

  return (
    <>
      <main className="flex flex-1 flex-col overflow-y-auto">
        <div className="bg-card px-5 pb-6">
          <StepTitle>이렇게 일정을 열까요?</StepTitle>
        </div>
        <div className="flex-1 bg-background px-5 py-5">
          <section
            aria-label="일정 요약"
            className="overflow-hidden rounded-2xl bg-card"
          >
            <div className="px-5 py-4">
              <p className="text-lg font-bold break-keep text-foreground">
                {values.title?.trim()}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {activityName}
              </p>
            </div>
            <dl>
              {rows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between gap-4 border-t border-border px-5 py-4"
                >
                  <dt className="shrink-0 text-sm text-muted-foreground">
                    {row.label}
                  </dt>
                  <dd className="min-w-0 truncate text-sm font-bold text-foreground tabular-nums">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
          <p className="mt-4 text-xs leading-5 break-keep text-muted-foreground">
            개설 후에는 일정을 수정할 수 없어요.
            <br />
            변경이 필요하면 전체 일정을 취소하고 새로 열어주세요.
          </p>
        </div>
      </main>

      <BottomCta>
        <Button variant="secondary" size="lg" onClick={onRestart}>
          처음으로
        </Button>
        <Button
          variant="primary"
          size="lg"
          disabled={isOpenDisabled}
          onClick={onOpen}
        >
          일정 열기
        </Button>
      </BottomCta>
    </>
  );
}
