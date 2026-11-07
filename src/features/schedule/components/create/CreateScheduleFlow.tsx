"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  FormProvider,
  useForm,
  type FieldErrors,
  type Resolver,
} from "react-hook-form";

import {
  INVALID_START_TIME,
  SCHEDULE_TIME_CONFLICT,
} from "../../api/scheduleCreate";
import { useCreateSchedule } from "../../hooks/useCreateSchedule";
import {
  clearDraft,
  createEmptyDraft,
  loadDraft,
  saveDraft,
} from "../../lib/createDraft";
import { saveCreatedScheduleId } from "../../lib/createdNotice";
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
import { getApiErrorCode } from "@/shared/lib/api/client";
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
  const requestedStep = parseStep(useSearchParams().get("step"));
  const isLoggedIn = useIsLoggedIn();
  const { mutate: createSchedule, isPending } = useCreateSchedule();
  const [initialValues] = useState(() => loadDraft() ?? createEmptyDraft());
  const [isRestartOpen, setIsRestartOpen] = useState(false);

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

    const { date, startTime, ...values } = result.data;
    createSchedule(
      { ...values, startAt: toStartAt(date, startTime) },
      {
        onSuccess: ({ scheduleId }) => {
          clearDraft();
          // 팝업 `일정이 열렸어요`는 홈에서 띄운다
          // TODO(LIST-05): 개설한 일정 탭이 생기면 그 탭으로 보낸다
          // 홈에서 개설 완료 팝업을 띄운다. 팝업 내용은 일정 ID로 서버에서 받는다
          saveCreatedScheduleId(scheduleId);
          router.replace("/");
        },
        onError: (error) => {
          const code = getApiErrorCode(error);
          if (code === SCHEDULE_TIME_CONFLICT) {
            // 📝 TODO(F-19): 시간 겹침 안내 문구 확정 필요
            showToast("같은 시간대에 참여하거나 개설한 일정이 있어요.", {
              variant: "error",
              duration: TOAST_DURATION,
            });
          } else if (code === INVALID_START_TIME) {
            // 📝 TODO(F-19): 시작 시각 재검사 실패 문구 확정 필요
            router.push(stepPath(4));
            showToast("시작 시각은 지금부터 1시간 이후로 골라주세요.", {
              variant: "error",
              duration: TOAST_DURATION,
            });
          } else if (code !== "UNAUTHENTICATED") {
            // 로그인 만료(UNAUTHENTICATED)는 공통 클라이언트가 로그인 화면으로 보낸다
            // 📝 TODO(F-19): 그 밖의 오류 문구 확정 필요. 화면을 유지하고 다시 누를 수 있다
            showToast("일정을 열지 못했어요. 잠시 후 다시 시도해주세요.", {
              variant: "error",
              duration: TOAST_DURATION,
            });
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
