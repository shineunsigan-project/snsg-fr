"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  FormProvider,
  useForm,
  type FieldErrors,
  type Resolver,
} from "react-hook-form";

import {
  INVALID_CAPACITY,
  INVALID_CATEGORY,
  INVALID_DESCRIPTION,
  INVALID_PLACE,
  INVALID_START_AT,
  INVALID_TITLE,
  SCHEDULE_TIME_CONFLICT,
  USER_NOT_ACTIVE,
} from "../../api/scheduleCreate";
import { scheduleQueryKeys } from "../../hooks/scheduleQueryKeys";
import { useCreateSchedule } from "../../hooks/useCreateSchedule";
import {
  clearDraft,
  createEmptyDraft,
  loadDraft,
  saveDraft,
} from "../../lib/createDraft";
import { saveCreatedNotice } from "../../lib/createdNotice";
import { toScheduleListQuery } from "../../lib/scheduleListParams";
import { toStartAt } from "../../lib/startTime";
import {
  createScheduleSchema,
  type CreateScheduleInput,
  type CreateScheduleValues,
} from "../../schemas/createScheduleSchema";
import { ActivityStep } from "./ActivityStep";
import { CapacityStep } from "./CapacityStep";
import { ConfirmStep } from "./ConfirmStep";
import { ContentStep } from "./ContentStep";
import { CreateStepHeader } from "./CreateStepHeader";
import { DateTimeStep } from "./DateTimeStep";
import { PlaceStep } from "./PlaceStep";
import { useIsLoggedIn } from "@/features/auth/hooks/useIsLoggedIn";
import { setAccessToken } from "@/shared/lib/api/accessToken";
import {
  getApiErrorCode,
  getApiErrorMessage,
  getApiFieldErrors,
} from "@/shared/lib/api/client";
import { saveLoginRedirect } from "@/shared/lib/kakaoLogin";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { PageStatus } from "@/shared/ui/PageStatus";
import { showToast } from "@/shared/ui/sonner";

const LAST_STEP = 6;
/** 토스트 노출 시간 (화면 기능 명세서 00 공통 기준) */
const TOAST_DURATION = 2000;

/** `다음`을 누를 때 검사하는 칸. 활동·장소는 고르지 않으면 `다음`이 비활성이다 */
const STEP_FIELDS: Record<number, Array<keyof CreateScheduleInput>> = {
  3: ["title", "duration", "description"],
};

const stepPath = (step: number) => `/create?step=${step}`;

/** 개설 요청 필드 → 입력 칸과 그 칸이 있는 단계. 칸별 오류(`errors`)를 해당 칸 아래에 보여준다 */
const REQUEST_FIELDS: Partial<
  Record<string, { field: keyof CreateScheduleInput; step: number }>
> = {
  title: { field: "title", step: 3 },
  durationType: { field: "duration", step: 3 },
  description: { field: "description", step: 3 },
};

/** 다시 고르게 할 오류 code → 그 값을 고르는 단계 (api-guide 일정 개설 오류) */
const RESELECT_STEPS: Partial<Record<string, number>> = {
  [INVALID_CATEGORY]: 1,
  [INVALID_PLACE]: 2,
  [INVALID_START_AT]: 4,
  [INVALID_CAPACITY]: 5,
  // 서버의 안전망. 요청 검증을 통과한 값이면 나지 않는다
  [INVALID_TITLE]: 3,
  [INVALID_DESCRIPTION]: 3,
};

const contentSchema = createScheduleSchema.pick({
  title: true,
  duration: true,
  description: true,
});

/** 앞 단계 입력이 빠졌으면 그 단계로 보낸다 (주소로 바로 들어오거나 보관한 입력값이 사라진 경우) */
function getFirstIncompleteStep(values: CreateScheduleInput) {
  if (values.activityId === null) return 1;
  if (values.place === null) return 2;
  if (!contentSchema.safeParse(values).success) return 3;
  return LAST_STEP;
}

function parseStep(value: string | null) {
  const step = Number(value);
  return Number.isInteger(step) && step >= 1 && step <= LAST_STEP ? step : 1;
}

// Zod 스키마를 React Hook Form에 연결한다. 필드마다 첫 번째 오류만 보여준다
const createScheduleResolver: Resolver<
  CreateScheduleInput,
  unknown,
  CreateScheduleValues
> = async (values) => {
  const result = createScheduleSchema.safeParse(values);
  if (result.success) return { values: result.data, errors: {} };

  const errors: FieldErrors<CreateScheduleInput> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as keyof CreateScheduleInput;
    errors[field] ??= { type: issue.code, message: issue.message };
  }
  return { values: {}, errors };
};

const subscribeNothing = () => () => {};

/**
 * 일정 개설 CRT-01~06 (USER_FLOW §7.7). `/create?step=1~6` 한 화면에서 단계를 바꾼다
 * 입력값은 기기(sessionStorage)에 보관하므로 서버 렌더링에서는 그리지 않는다
 */
export function CreateScheduleFlow() {
  const isClient = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );
  if (!isClient) return <PageStatus message="불러오는 중..." />;
  return <CreateScheduleForm />;
}

function CreateScheduleForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const requestedStep = parseStep(useSearchParams().get("step"));
  const isLoggedIn = useIsLoggedIn();
  const { mutate: createSchedule, isPending } = useCreateSchedule();
  const [initialValues] = useState(() => loadDraft() ?? createEmptyDraft());
  const [isRestartOpen, setIsRestartOpen] = useState(false);
  // 서버가 준 칸별 오류. 단계를 옮기면 칸이 새로 그려지며 오류가 사라지므로, 그 단계에 도착한 뒤 넣는다
  const pendingFieldErrorsRef = useRef<{
    step: number;
    errors: Array<{ field: keyof CreateScheduleInput; message: string }>;
  } | null>(null);

  const form = useForm<CreateScheduleInput, unknown, CreateScheduleValues>({
    resolver: createScheduleResolver,
    // 칸을 벗어날 때 그 칸만, `다음`을 누를 때 단계 전체를 검사한다. 입력 중에는 검사하지 않는다
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: initialValues,
  });

  // 입력값이 바뀔 때마다 기기에 보관한다
  useEffect(() => {
    return form.subscribe({
      formState: { values: true },
      callback: ({ values }) => saveDraft(values),
    });
  }, [form]);

  const firstIncompleteStep = getFirstIncompleteStep(form.getValues());
  const step = Math.min(requestedStep, firstIncompleteStep);
  const hasNotifiedLostDraft = useRef(false);

  useEffect(() => {
    if (requestedStep <= firstIncompleteStep) return;
    router.replace(stepPath(firstIncompleteStep));
    // 로그인하고 최종 확인으로 돌아왔는데 입력값이 없다 (화면 기능 명세서 CRT-06)
    if (requestedStep === LAST_STEP && !hasNotifiedLostDraft.current) {
      hasNotifiedLostDraft.current = true;
      showToast("입력 내용이 사라져 처음부터 진행해주세요", {
        variant: "error",
        duration: TOAST_DURATION,
      });
    }
  }, [requestedStep, firstIncompleteStep, router]);

  useEffect(() => {
    const pending = pendingFieldErrorsRef.current;
    if (!pending || step !== pending.step) return;
    pendingFieldErrorsRef.current = null;
    for (const { field, message } of pending.errors) {
      form.setError(field, { message });
    }
  }, [step, form]);

  const goTo = (next: number) => router.push(stepPath(next));
  const openRestart = () => setIsRestartOpen(true);

  const handleBack = () => (step === 1 ? router.push("/") : goTo(step - 1));

  // 확인 팝업에서 [초기화]를 누르면 입력값을 모두 비우고 1단계로 (시안 CRT-06 초기화 수정안, 사용자 결정 2026-11-07)
  const restart = () => {
    setIsRestartOpen(false);
    clearDraft();
    form.reset(createEmptyDraft());
    goTo(1);
  };

  const handleNext = async () => {
    const fields = STEP_FIELDS[step];
    if (fields && !(await form.trigger(fields, { shouldFocus: true }))) return;
    goTo(step + 1);
  };

  const handleOpen = () => {
    if (isPending) return;
    if (!isLoggedIn) {
      // 입력값은 기기에 남겨 두고 로그인 후 이 화면으로 돌아온다. `일정 열기`는 다시 눌러야 한다 (USER_FLOW §4.3)
      saveLoginRedirect(stepPath(LAST_STEP));
      router.push("/login");
      return;
    }

    const result = createScheduleSchema.safeParse(form.getValues());
    if (!result.success) {
      // 보관한 입력값이 없거나 빠진 값이 있다
      clearDraft();
      form.reset(createEmptyDraft());
      router.replace(stepPath(1));
      showToast("입력 내용이 사라져 처음부터 진행해주세요", {
        variant: "error",
        duration: TOAST_DURATION,
      });
      return;
    }

    const { activityId, place, duration, date, startTime, ...values } =
      result.data;
    createSchedule(
      {
        ...values,
        categoryId: activityId,
        placeId: place.id,
        durationType: duration,
        startAt: toStartAt(date, startTime),
      },
      {
        onSuccess: () => {
          clearDraft();
          // 개설한 일정 탭(LIST-05)으로 가서 완료 팝업을 띄운다. 응답에는 일정 ID만 있어 고른 장소명을 넘긴다
          saveCreatedNotice(place.name);
          router.replace(toScheduleListQuery("created", {}));
        },
        onError: (error) => {
          const code = getApiErrorCode(error);
          const fieldErrors = getApiFieldErrors(error);
          // 📝 TODO(F-19): 그 밖의 오류 문구 확정 필요. 화면을 유지하고 다시 누를 수 있다
          const showGenericError = () =>
            showToast("일정을 열지 못했어요. 잠시 후 다시 시도해주세요.", {
              variant: "error",
              duration: TOAST_DURATION,
            });
          if (code === SCHEDULE_TIME_CONFLICT) {
            // 📝 TODO(F-19): 시간 겹침 안내 문구 확정 필요
            showToast("같은 시간대에 참여하거나 개설한 일정이 있어요.", {
              variant: "error",
              duration: TOAST_DURATION,
            });
          } else if (code === USER_NOT_ACTIVE) {
            // 탈퇴한 사용자다. 남은 토큰을 버리고 로그인 화면으로 보낸다. 로그인하면 이 화면으로 돌아온다
            setAccessToken(null);
            saveLoginRedirect(stepPath(LAST_STEP));
            router.push("/login");
          } else if (fieldErrors.length > 0) {
            // 칸별 오류: 해당 칸이 있는 단계로 가서 칸 아래에 문구를 보여준다
            // errors 순서는 정해져 있지 않아, 칸이 있는 오류 중 가장 앞 단계로 간다
            const targets = fieldErrors.flatMap(({ field, message }) => {
              const target = REQUEST_FIELDS[field];
              return target ? [{ ...target, message }] : [];
            });
            const errors = targets.map(({ field, message }) => ({
              field,
              message,
            }));
            const errorStep = targets.length
              ? Math.min(...targets.map(({ step }) => step))
              : undefined;
            if (errorStep) {
              pendingFieldErrorsRef.current = { step: errorStep, errors };
              router.push(stepPath(errorStep));
            } else {
              showGenericError();
            }
          } else if (code && RESELECT_STEPS[code]) {
            // 고를 수 없는 활동·장소·일시·인원: 그 단계로 보내 다시 고르게 한다
            // 📝 TODO(F-19): 화면 문구가 정해지지 않아 서버 message를 보여준다
            if (code === INVALID_CATEGORY) {
              queryClient.invalidateQueries({
                queryKey: scheduleQueryKeys.activities,
              });
              form.setValue("activityId", null);
              form.setValue("place", null);
            } else if (code === INVALID_PLACE) {
              form.setValue("place", null);
            }
            router.push(stepPath(RESELECT_STEPS[code]));
            const message = getApiErrorMessage(error);
            if (message) {
              showToast(message, {
                variant: "error",
                duration: TOAST_DURATION,
              });
            }
          } else if (code !== "UNAUTHENTICATED") {
            // 로그인 만료(UNAUTHENTICATED)는 공통 클라이언트가 로그인 화면으로 보낸다
            showGenericError();
          }
        },
      },
    );
  };

  return (
    <FormProvider {...form}>
      <div className="mx-auto flex h-dvh max-w-md flex-col bg-card">
        <CreateStepHeader
          step={step}
          onBack={handleBack}
          onRestart={step < LAST_STEP ? openRestart : undefined}
        />
        {step === 1 && <ActivityStep onNext={handleNext} />}
        {step === 2 && <PlaceStep onNext={handleNext} />}
        {step === 3 && <ContentStep onNext={handleNext} />}
        {step === 4 && <DateTimeStep onNext={handleNext} />}
        {step === 5 && <CapacityStep onNext={handleNext} />}
        {step === 6 && (
          <ConfirmStep
            onRestart={openRestart}
            onOpen={handleOpen}
            isOpenDisabled={isPending || isLoggedIn === undefined}
          />
        )}
      </div>
      <ConfirmDialog
        open={isRestartOpen}
        onClose={() => setIsRestartOpen(false)}
        title="입력한 내용을 초기화할까요?"
        description={"장소·일시·인원이 모두 지워지고\n첫 단계로 돌아가요."}
        hasCloseButton
        closeLabel="취소"
        confirmLabel="초기화"
        isDestructive
        onConfirm={restart}
      />
    </FormProvider>
  );
}
