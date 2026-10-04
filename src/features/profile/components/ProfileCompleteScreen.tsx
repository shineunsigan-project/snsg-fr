"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  Controller,
  useForm,
  useWatch,
  type FieldErrors,
  type Resolver,
} from "react-hook-form";

import { useSignup } from "../hooks/useSignup";
import {
  formatBirthDate,
  getAgeGroup,
  parseBirthDate,
  toIsoBirthDate,
} from "../lib/birthDate";
import {
  genderOptions,
  profileSchema,
  type ProfileFormInput,
  type ProfileFormValues,
} from "../schemas/profileSchema";
import {
  getSignupDraft,
  saveAuthSession,
  SIGNUP_TOKEN_KEY,
} from "@/features/auth/lib/authStorage";
import { toSafeRedirectPath } from "@/features/auth/lib/kakaoOAuth";
import type { SocialUser } from "@/features/auth/types";
import { AvatarEditor } from "@/shared/ui/AvatarEditor";
import { Button } from "@/shared/ui/button";
import { PageStatus } from "@/shared/ui/PageStatus";
import { TextField } from "@/shared/ui/TextField";
import { ToggleButtonGroup } from "@/shared/ui/ToggleButtonGroup";

// Zod 스키마를 React Hook Form에 연결한다. 필드마다 첫 번째 오류만 보여준다
const profileResolver: Resolver<
  ProfileFormInput,
  unknown,
  ProfileFormValues
> = async (values) => {
  const result = profileSchema.safeParse(values);
  if (result.success) return { values: result.data, errors: {} };

  const errors: FieldErrors<ProfileFormInput> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as keyof ProfileFormInput;
    errors[field] ??= { type: issue.code, message: issue.message };
  }
  return { values: {}, errors };
};

const subscribeNothing = () => () => {};

/**
 * 최초 1회 프로필 완성 (USER_FLOW §4.1, DESIGN §3.4, Figma 132:16466)
 * 카카오 로그인에서 신규 회원으로 확인되면 들어온다. 뒤로가기·GNB가 없는 화면이다 (F-13)
 */
export function ProfileCompleteScreen() {
  const router = useRouter();
  // 서버 렌더링에는 sessionStorage가 없어 undefined, 브라우저에서는 가입 토큰 또는 null
  const signupToken = useSyncExternalStore(
    subscribeNothing,
    () => sessionStorage.getItem(SIGNUP_TOKEN_KEY),
    () => undefined,
  );
  const draft = useMemo(
    () => (signupToken ? getSignupDraft() : null),
    [signupToken],
  );
  // 가입이 끝나 가입 토큰을 지운 뒤에는 로그인 화면으로 돌려보내지 않는다
  const isCompleted = useRef(false);
  const { mutateAsync: signup, isPending } = useSignup();
  const [submitError, setSubmitError] = useState<string>();

  useEffect(() => {
    // 가입 진행 정보 없이 들어오면 로그인부터 한다
    if (signupToken === null && !isCompleted.current) {
      router.replace(`/login${window.location.search}`);
    }
  }, [signupToken, router]);

  if (!draft) return <PageStatus message="불러오는 중..." />;

  const handleSubmit = async (values: ProfileFormValues) => {
    setSubmitError(undefined);
    try {
      const { accessToken, refreshToken, user } = await signup({
        signupToken: draft.signupToken,
        name: values.name,
        nickname: values.nickname,
        email: values.email,
        gender: values.gender,
        birthDate: toIsoBirthDate(values.birthDate),
      });
      if (!accessToken || !user) throw new Error("가입 응답에 토큰이 없습니다");

      isCompleted.current = true;
      saveAuthSession({ accessToken, refreshToken, user });
      // 로그인을 요청한 원래 화면으로 돌아간다 (USER_FLOW §4.3)
      const redirect = new URLSearchParams(window.location.search).get(
        "redirect",
      );
      router.replace(toSafeRedirectPath(redirect));
    } catch {
      setSubmitError("저장하지 못했어요. 잠시 후 다시 시도해주세요.");
    }
  };

  return (
    <ProfileCompleteForm
      socialUser={draft.socialUser}
      onSubmit={handleSubmit}
      isSubmitting={isPending}
      submitError={submitError}
    />
  );
}

type ProfileCompleteFormProps = {
  /** 카카오에서 받은 정보. 닉네임·사진을 미리 채운다 */
  socialUser: SocialUser | null;
  onSubmit: (values: ProfileFormValues) => Promise<void>;
  isSubmitting: boolean;
  submitError?: string;
};

function ProfileCompleteForm({
  socialUser,
  onSubmit,
  isSubmitting,
  submitError,
}: ProfileCompleteFormProps) {
  const socialNickname = socialUser?.nickname;
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormInput, unknown, ProfileFormValues>({
    resolver: profileResolver,
    // 칸을 벗어날 때 검사하고, 오류가 난 칸은 값을 고치는 즉시 다시 검사한다 (USER_FLOW §4.1)
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      nickname: socialNickname ?? "",
      name: "",
      gender: undefined,
      birthDate: "",
      // 이메일은 화면에서 받지 않고 카카오에서 받은 값을 보낸다 (가입 API 필수 항목)
      // TODO(API): 카카오가 이메일을 주지 않는 경우의 처리를 정한다
      email: socialUser?.email ?? "",
    },
  });

  const birthDate = parseBirthDate(useWatch({ control, name: "birthDate" }));
  const ageGroup =
    birthDate && birthDate <= new Date() ? getAgeGroup(birthDate) : undefined;

  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string>();
  const [avatarError, setAvatarError] = useState<string>();

  // 미리보기용 blob URL은 바뀌거나 화면을 떠날 때 해제한다
  useEffect(() => {
    if (!avatarPreviewUrl) return;
    return () => URL.revokeObjectURL(avatarPreviewUrl);
  }, [avatarPreviewUrl]);

  // TODO(API): 고른 파일은 저장 시 업로드한다. 용량 제한(F-14)은 기준이 정해지면 추가한다
  const handleAvatarSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setAvatarError("이미지 파일만 등록할 수 있어요.");
      return;
    }
    setAvatarError(undefined);
    setAvatarPreviewUrl(URL.createObjectURL(file));
  };

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="mx-auto flex min-h-dvh max-w-md flex-col bg-card"
    >
      <div className="flex-1 px-5 pt-safe">
        <h1 className="pt-9 text-2xl leading-8.5 font-bold">
          함께할 사람들에게
          <br />
          보여줄 정보를 확인해주세요
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          일정에는 성별과 연령대만 표시돼요.
        </p>

        <div className="mt-5.5 flex flex-col items-center">
          <AvatarEditor
            imageUrl={avatarPreviewUrl ?? socialUser?.profileImageUrl}
            onFileSelect={handleAvatarSelect}
          />
          {avatarError && (
            // TODO(D-8): 오류 색은 디자인 미확인이라 shadcn 기본 오류 색을 쓴다
            <p role="alert" className="mt-2 text-xs text-destructive">
              {avatarError}
            </p>
          )}
        </div>

        <div className="mt-4.5 flex flex-col gap-3.5 pb-6">
          <TextField
            label="닉네임"
            autoComplete="nickname"
            helperText={
              socialNickname
                ? "카카오 닉네임을 불러왔어요. 바꿀 수 있어요."
                : undefined
            }
            errorMessage={errors.nickname?.message}
            {...register("nickname")}
          />
          <TextField
            label="이름"
            labelHint="다른 사용자에게 공개되지 않아요"
            placeholder="실명을 입력해주세요"
            autoComplete="name"
            errorMessage={errors.name?.message}
            {...register("name")}
          />
          <Controller
            control={control}
            name="gender"
            render={({ field }) => (
              <ToggleButtonGroup
                label="성별"
                name={field.name}
                options={genderOptions}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
                errorMessage={errors.gender?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="birthDate"
            render={({ field }) => (
              // TODO(D-7): 입력 방식(키보드·날짜 피커·휠)이 정해지지 않아 숫자 8자리 입력으로 둔다
              <TextField
                label="생년월일"
                inputMode="numeric"
                placeholder="1996. 04. 12"
                autoComplete="bday"
                ref={field.ref}
                name={field.name}
                value={formatBirthDate(field.value)}
                onChange={(event) =>
                  field.onChange(
                    event.target.value.replace(/\D/g, "").slice(0, 8),
                  )
                }
                onBlur={field.onBlur}
                errorMessage={errors.birthDate?.message}
                trailing={
                  ageGroup && (
                    <span className="shrink-0 text-sm font-bold text-primary">
                      {ageGroup}
                    </span>
                  )
                }
              />
            )}
          />
        </div>
      </div>

      <div className="sticky bottom-0 bg-card px-5 pt-3 pb-safe">
        {submitError && (
          // TODO(D-8): 오류 색은 디자인 미확인이라 shadcn 기본 오류 색을 쓴다
          <p role="alert" className="mb-2 text-center text-xs text-destructive">
            {submitError}
          </p>
        )}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={isSubmitting}
          className="mb-2.5 w-full"
        >
          시작하기
        </Button>
      </div>
    </form>
  );
}
