"use client";

import { useId } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";

import {
  DESCRIPTION_MAX_LENGTH,
  durationOptions,
  TITLE_MAX_LENGTH,
  type CreateScheduleInput,
  type CreateScheduleValues,
} from "../../schemas/createScheduleSchema";
import { StepTitle } from "./StepTitle";
import { cn } from "@/shared/lib/utils";
import { BottomCta } from "@/shared/ui/BottomCta";
import { Button } from "@/shared/ui/button";
import { RadioList, RadioListItem } from "@/shared/ui/RadioList";
import { TextField } from "@/shared/ui/TextField";

/**
 * CRT-03 활동 내용 입력. 칸을 벗어날 때 그 칸만, `다음`을 누를 때 이 단계 전체를 검사한다.
 * 값을 고치면 그 칸의 오류를 지운다 (프로필 완성과 같은 방식)
 */
export function ContentStep({ onNext }: { onNext: () => void }) {
  const {
    control,
    register,
    clearErrors,
    formState: { errors },
  } = useFormContext<CreateScheduleInput, unknown, CreateScheduleValues>();
  const title = useWatch({ control, name: "title" });
  const duration = useWatch({ control, name: "duration" });
  const description = useWatch({ control, name: "description" });
  const durationLabelId = useId();
  const durationErrorId = useId();
  const descriptionId = useId();
  const descriptionMessageId = useId();

  const durationDescription = durationOptions.find(
    (option) => option.value === duration,
  )?.description;
  const descriptionMessage =
    errors.description?.message ??
    (description === ""
      ? "비용·준비물처럼 참여자가 미리 알아야 할 내용도 함께 적어주세요."
      : undefined);

  return (
    <>
      <main className="flex-1 overflow-y-auto px-5 pb-6">
        {/* 시안 CRT-03의 제목·보조 문구 (정의서에는 제목이 없다) */}
        <StepTitle description="일정 상세의 '활동 소개'에 그대로 보여요.">
          어떤 활동을 원하시나요?
        </StepTitle>

        <div className="mt-6 flex flex-col gap-6">
          <TextField
            label="콘텐츠 활동명"
            maxLength={TITLE_MAX_LENGTH}
            helperText="입력한 활동명이 일정 제목으로 쓰여요."
            errorMessage={errors.title?.message}
            trailing={
              <span className="shrink-0 text-xs text-subtle-foreground tabular-nums">
                {title.length}/{TITLE_MAX_LENGTH}
              </span>
            }
            {...register("title", { onChange: () => clearErrors("title") })}
          />

          <div>
            <p
              id={durationLabelId}
              className="text-xs font-bold text-muted-foreground"
            >
              예상 소요시간
            </p>
            <Controller
              control={control}
              name="duration"
              render={({ field }) => (
                <RadioList
                  aria-labelledby={durationLabelId}
                  aria-invalid={errors.duration ? true : undefined}
                  aria-describedby={
                    errors.duration ? durationErrorId : undefined
                  }
                  className="mt-2"
                  value={field.value ?? ""}
                  onValueChange={(value) => {
                    clearErrors("duration");
                    field.onChange(
                      durationOptions.find((option) => option.value === value)
                        ?.value ?? null,
                    );
                  }}
                  inputRef={field.ref}
                >
                  {durationOptions.map((option) => (
                    <RadioListItem
                      key={option.value}
                      value={option.value}
                      label={option.label}
                      description={option.description}
                    />
                  ))}
                </RadioList>
              )}
            />
            {errors.duration?.message ? (
              // TODO(D-8): 오류 색은 디자인 미확인이라 shadcn 기본 오류 색을 쓴다
              <p id={durationErrorId} className="mt-2 text-xs text-destructive">
                {errors.duration.message}
              </p>
            ) : (
              durationDescription && (
                <p className="mt-2 text-xs text-muted-foreground">
                  정확하지 않아도 괜찮아요. 참여자에게는 &apos;
                  {durationDescription}&apos;로 보여요.
                </p>
              )
            )}
          </div>

          <div>
            <label
              htmlFor={descriptionId}
              className="block text-xs font-bold text-muted-foreground"
            >
              간략 설명글
            </label>
            <div
              className={cn(
                "mt-2 rounded-lg border bg-card px-4 pt-3.5 pb-3 focus-within:ring-3 focus-within:ring-ring/50",
                errors.description ? "border-destructive" : "border-input",
              )}
            >
              {/* 500자를 넘으면 더 입력되지 않는다 */}
              <textarea
                id={descriptionId}
                rows={4}
                maxLength={DESCRIPTION_MAX_LENGTH}
                aria-invalid={errors.description ? true : undefined}
                aria-describedby={
                  descriptionMessage ? descriptionMessageId : undefined
                }
                // 내용에 맞춰 늘어나되 최대 높이를 넘으면 칸 안에서 스크롤한다. field-sizing을 지원하지 않는 브라우저는 4줄 고정
                className="block field-sizing-content max-h-40 min-h-24 w-full resize-none overflow-y-auto bg-transparent text-md text-foreground outline-none"
                {...register("description", {
                  onChange: () => clearErrors("description"),
                })}
              />
              <p className="mt-1 text-right text-xs text-subtle-foreground tabular-nums">
                {description.length}/{DESCRIPTION_MAX_LENGTH}
              </p>
            </div>
            {descriptionMessage && (
              <p
                id={descriptionMessageId}
                className={cn(
                  "mt-2 text-xs",
                  errors.description
                    ? "text-destructive"
                    : "text-muted-foreground",
                )}
              >
                {descriptionMessage}
              </p>
            )}
          </div>
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
