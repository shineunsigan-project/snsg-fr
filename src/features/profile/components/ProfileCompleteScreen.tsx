"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Controller,
  useForm,
  useWatch,
  type FieldErrors,
  type Resolver,
} from "react-hook-form";

import type { SignUpSession } from "../api/signup";
import { useSignup } from "../hooks/useSignup";
import { useSignUpSession } from "../hooks/useSignUpSession";
import { useUploadProfileImage } from "../hooks/useUploadProfileImage";
import {
  formatBirthDate,
  getAgeGroup,
  parseBirthDate,
  toIsoBirthDate,
} from "../lib/birthDate";
import {
  genderOptions,
  PROFILE_IMAGE_MAX_MB,
  PROFILE_IMAGE_TYPES,
  profileSchema,
  type ProfileFormInput,
  type ProfileFormValues,
} from "../schemas/profileSchema";
import { getApiErrorCode } from "@/shared/lib/api/client";
import { getLoginRedirect } from "@/shared/lib/kakaoLogin";
import { AvatarEditor } from "@/shared/ui/AvatarEditor";
import { Button } from "@/shared/ui/button";
import { PageStatus } from "@/shared/ui/PageStatus";
import { showToast } from "@/shared/ui/sonner";
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

// 가입 세션(30분)이 지났거나 인증이 잘못됐으면 카카오 로그인부터 다시 한다
const isSignUpSessionExpired = (error: unknown) => {
  const code = getApiErrorCode(error);
  return code === "INVALID_SIGNUP_TOKEN" || code === "INVALID_SOCIAL_CODE";
};

function restartLogin(router: ReturnType<typeof useRouter>) {
  // TODO(F-3): 실패 화면이 정해지면 alert를 바꾼다
  alert("로그인에 실패했습니다.");
  router.replace("/login");
}

/**
 * 최초 1회 프로필 완성 (USER_FLOW §4.1, DESIGN §3.4, Figma 132:16466)
 * 카카오 로그인에서 신규 회원으로 확인되면 들어온다. 뒤로가기·GNB가 없는 화면이다 (F-13)
 * 가입 세션에서 카카오 닉네임·사진을 받아 기본값으로 채운다
 */
export function ProfileCompleteScreen() {
  const router = useRouter();
  const { data: session, error, isPending } = useSignUpSession();
  const isExpired = isSignUpSessionExpired(error);

  useEffect(() => {
    if (isExpired) restartLogin(router);
  }, [isExpired, router]);

  if (isPending || isExpired) return <PageStatus message="불러오는 중..." />;
  // 그 밖의 조회 실패는 기본값 없이 입력받는다 (닉네임·사진을 비워 보내면 서버가 카카오 정보를 쓴다)
  return <ProfileCompleteForm session={session} />;
}

function ProfileCompleteForm({ session }: { session?: SignUpSession }) {
  const router = useRouter();
  const { mutateAsync: signup } = useSignup();
  const { mutateAsync: uploadProfileImage } = useUploadProfileImage();
  const [submitError, setSubmitError] = useState<string>();
  const {
    control,
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormInput, unknown, ProfileFormValues>({
    resolver: profileResolver,
    // 입력 중에는 검사하지 않고 시작하기를 누를 때만 검사한다 (팀 결정 2026-10-11, USER_FLOW §4.1)
    // 값을 고치면 그 칸의 오류 문구만 지운다
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: {
      nickname: session?.nickname ?? "",
      gender: undefined,
      birthDate: "",
      email: "",
    },
  });

  const birthDate = parseBirthDate(useWatch({ control, name: "birthDate" }));
  // 카카오 닉네임을 한 번이라도 바꾸면 불러왔다는 안내를 지운다. 되돌려도 다시 보이지 않는다 (팀 결정 2026-10-11)
  const [isNicknameEdited, setIsNicknameEdited] = useState(false);
  const showKakaoNicknameHint = !!session?.nickname && !isNicknameEdited;
  const ageGroup =
    birthDate && birthDate <= new Date() ? getAgeGroup(birthDate) : undefined;

  // 새로 고른 사진. 시작하기를 누를 때 올리고, 가입이 실패해 다시 누를 때는 올린 경로(uploadedPath)를 다시 쓴다
  const [avatar, setAvatar] = useState<{
    file: File;
    previewUrl: string;
    uploadedPath?: string;
  }>();
  const [avatarError, setAvatarError] = useState<string>();

  // 미리보기용 blob URL은 바뀌거나 화면을 떠날 때 해제한다
  // 업로드 경로만 저장할 때는 해제하지 않도록 previewUrl에만 반응한다
  const avatarPreviewUrl = avatar?.previewUrl;
  useEffect(() => {
    if (!avatarPreviewUrl) return;
    return () => URL.revokeObjectURL(avatarPreviewUrl);
  }, [avatarPreviewUrl]);

  const handleAvatarSelect = (file: File) => {
    if (!PROFILE_IMAGE_TYPES.includes(file.type)) {
      setAvatarError("이미지 파일만 등록할 수 있어요.");
      return;
    }
    if (file.size > PROFILE_IMAGE_MAX_MB * 1024 * 1024) {
      setAvatarError(
        `${PROFILE_IMAGE_MAX_MB}MB 이하의 이미지만 등록할 수 있어요.`,
      );
      return;
    }
    setAvatarError(undefined);
    setAvatar({ file, previewUrl: URL.createObjectURL(file) });
  };

  const submit = async (values: ProfileFormValues) => {
    setSubmitError(undefined);

    let profileImageUrl = avatar?.uploadedPath;
    if (avatar && !profileImageUrl) {
      try {
        profileImageUrl = await uploadProfileImage(avatar.file);
        const uploadedPath = profileImageUrl;
        setAvatar((current) =>
          current?.file === avatar.file
            ? { ...current, uploadedPath }
            : current,
        );
      } catch (error) {
        if (isSignUpSessionExpired(error)) {
          restartLogin(router);
          return;
        }
        setAvatarError("사진을 올리지 못했어요. 다시 시도해주세요.");
        return;
      }
    }

    try {
      await signup({
        nickname: values.nickname,
        gender: values.gender,
        birthDate: toIsoBirthDate(values.birthDate),
        profileImageUrl,
      });
    } catch (error) {
      if (getApiErrorCode(error) === "DUPLICATED_NICKNAME") {
        setError(
          "nickname",
          {
            message: "이미 사용 중인 닉네임이에요. 다른 닉네임을 입력해주세요.",
          },
          { shouldFocus: true },
        );
        return;
      }
      if (isSignUpSessionExpired(error)) {
        restartLogin(router);
        return;
      }
      setSubmitError("저장하지 못했어요. 잠시 후 다시 시도해주세요.");
      return;
    }
    // 노출 시간 2초는 제안값이다 (USER_FLOW §4.1)
    showToast("회원가입이 완료되었어요. 환영해요!", { duration: 2000 });
    // 로그인을 요청한 원래 화면으로 돌아간다 (USER_FLOW §4.3)
    router.replace(getLoginRedirect());
  };

  return (
    <form
      noValidate
      onSubmit={handleSubmit(submit)}
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
            imageUrl={avatarPreviewUrl ?? session?.profileImageUrl}
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
              showKakaoNicknameHint
                ? "카카오 닉네임을 불러왔어요. 바꿀 수 있어요."
                : undefined
            }
            errorMessage={errors.nickname?.message}
            {...register("nickname", {
              onChange: (event) => {
                clearErrors("nickname");
                if (event.target.value !== session?.nickname)
                  setIsNicknameEdited(true);
              },
            })}
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
                onChange={(value) => {
                  clearErrors("gender");
                  field.onChange(value);
                }}
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
                onChange={(event) => {
                  clearErrors("birthDate");
                  field.onChange(
                    event.target.value.replace(/\D/g, "").slice(0, 8),
                  );
                }}
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
