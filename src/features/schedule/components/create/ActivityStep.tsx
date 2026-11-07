"use client";

import { Info } from "lucide-react";
import { Controller, useFormContext, useWatch } from "react-hook-form";

import { useActivities } from "../../hooks/useActivities";
import type {
  CreateScheduleInput,
  CreateScheduleValues,
} from "../../schemas/createScheduleSchema";
import { StepTitle } from "./StepTitle";
import { BottomCta } from "@/shared/ui/BottomCta";
import { Button } from "@/shared/ui/button";
import { RadioList, RadioListItem } from "@/shared/ui/RadioList";

/** CRT-01 활동 선택. 미선택이면 `다음` 비활성 */
export function ActivityStep({ onNext }: { onNext: () => void }) {
  const { control, setValue } = useFormContext<
    CreateScheduleInput,
    unknown,
    CreateScheduleValues
  >();
  const activityId = useWatch({ control, name: "activityId" });
  const { data: activities, isPending, isError, refetch } = useActivities();

  return (
    <>
      <main className="flex flex-1 flex-col overflow-y-auto px-5">
        <StepTitle>무엇을 하고 싶나요?</StepTitle>

        <div className="mt-6 flex-1">
          {isPending ? (
            <p role="status" className="text-sm text-muted-foreground">
              불러오는 중...
            </p>
          ) : isError ? (
            // TODO(F-19): 활동 목록 조회 실패 문구 미정. TODO(D-5): 상태 디자인 없음
            <div role="alert" className="flex flex-col items-start gap-3">
              <p className="text-sm text-muted-foreground">
                활동을 불러오지 못했어요.
              </p>
              <Button variant="secondary" onClick={() => refetch()}>
                다시 시도
              </Button>
            </div>
          ) : (
            <Controller
              control={control}
              name="activityId"
              render={({ field }) => (
                <RadioList
                  aria-label="활동"
                  // 고르기 전에도 제어 컴포넌트로 두려고 빈 문자열을 넘긴다
                  value={field.value === null ? "" : String(field.value)}
                  onValueChange={(value) => {
                    // 활동이 바뀌면 장소 검색어도 바뀌므로 고른 장소를 비운다
                    if (Number(value) !== field.value) {
                      setValue("place", null, { shouldDirty: true });
                    }
                    field.onChange(Number(value));
                  }}
                >
                  {activities.map((activity) => (
                    <RadioListItem
                      key={activity.activityId}
                      value={String(activity.activityId)}
                      label={activity.name}
                    />
                  ))}
                </RadioList>
              )}
            />
          )}
        </div>

        <p className="my-4 flex gap-2 rounded-xl bg-brand-soft px-4 py-3.5 text-sm break-keep text-foreground">
          <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-brand" />
          구체적인 콘텐츠는 활동 내용에 적고 참여자와 함께 정해도 돼요.
        </p>
      </main>

      <BottomCta>
        <Button
          variant="primary"
          size="lg"
          disabled={activityId === null}
          onClick={onNext}
        >
          다음
        </Button>
      </BottomCta>
    </>
  );
}
