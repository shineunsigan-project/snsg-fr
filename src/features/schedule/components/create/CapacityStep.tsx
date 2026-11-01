"use client";

import { NumberField } from "@base-ui/react/number-field";
import { Minus, Plus } from "lucide-react";
import { Controller, useFormContext } from "react-hook-form";

import {
  CAPACITY_MAX,
  CAPACITY_MIN,
  type CreateScheduleInput,
  type CreateScheduleValues,
} from "../../schemas/createScheduleSchema";
import { StepTitle } from "./StepTitle";
import { BottomCta } from "@/shared/ui/BottomCta";
import { Button } from "@/shared/ui/button";

const stepperClassName =
  "flex size-14 items-center justify-center rounded-full border border-input bg-card text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:text-subtle-foreground disabled:opacity-50";

/** CRT-05 모집 인원. 개설자 포함 4~24명, 범위 밖 버튼은 비활성 (Base UI NumberField) */
export function CapacityStep({ onNext }: { onNext: () => void }) {
  const { control } = useFormContext<
    CreateScheduleInput,
    unknown,
    CreateScheduleValues
  >();

  return (
    <>
      <main className="flex-1 overflow-y-auto px-5 pb-6">
        <StepTitle description="나를 포함한 전체 인원이에요.">
          몇 명과 함께할까요?
        </StepTitle>

        <Controller
          control={control}
          name="capacity"
          render={({ field }) => (
            <NumberField.Root
              min={CAPACITY_MIN}
              max={CAPACITY_MAX}
              step={1}
              value={field.value}
              onValueChange={(value) => {
                if (value !== null) field.onChange(value);
              }}
              className="mt-12 flex items-center justify-center gap-8"
            >
              <NumberField.Decrement
                aria-label="인원 줄이기"
                className={stepperClassName}
              >
                <Minus aria-hidden className="size-6" />
              </NumberField.Decrement>
              <span className="flex items-baseline">
                {/* −/+로만 바꾼다. 숫자는 보여주기만 하고 스크린리더에는 값이 읽힌다 */}
                <NumberField.Input
                  aria-label="전체 인원"
                  readOnly
                  // 두 자리(10~24명)도 잘리지 않게 숫자 길이에 맞춘다. field-sizing을 지원하지 않는 브라우저는 두 자리 폭(size)
                  size={2}
                  className="field-sizing-content bg-transparent text-center text-6xl font-bold text-brand tabular-nums outline-none"
                />
                <span aria-hidden className="text-lg font-bold text-foreground">
                  명
                </span>
              </span>
              <NumberField.Increment
                aria-label="인원 늘리기"
                className={stepperClassName}
              >
                <Plus aria-hidden className="size-6" />
              </NumberField.Increment>
            </NumberField.Root>
          )}
        />

        <div className="mt-12 rounded-xl bg-brand-soft px-5 py-4">
          <p className="text-xs font-bold text-brand">모집 가능 인원</p>
          <p className="mt-1.5 text-sm break-keep text-foreground">
            나를 포함해 4~24명까지 모집할 수 있어요.
          </p>
        </div>
      </main>

      <BottomCta>
        <Button variant="primary" size="lg" onClick={onNext}>
          다음
        </Button>
      </BottomCta>
    </>
  );
}
