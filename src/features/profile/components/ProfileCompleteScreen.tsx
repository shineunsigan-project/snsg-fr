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

import { DEFAULT_PROFILE_IMAGE_URL, type SignUpSession } from "../api/signup";
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
  getProfileImageUploadErrorMessage,
  loadProfileImage,
} from "../lib/profileImage";
import {
  genderOptions,
  profileSchema,
  type ProfileFormInput,
  type ProfileFormValues,
} from "../schemas/profileSchema";
import {
  detectHomeScreenGuidePlatform,
  readHomeScreenGuideRecord,
  recordHomeScreenGuideShownAfterSignup,
  shouldShowAfterSignup,
  toHomeScreenGuidePath,
} from "@/features/onboarding/lib/homeScreenGuide";
import { getApiErrorCode, getApiFieldErrors } from "@/shared/lib/api/client";
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

/** 서버가 errors로 알려 주는 가입 요청 필드 중 화면에 칸이 있는 것 */
const profileFields = [
  "name",
  "nickname",
  "gender",
  "birthDate",
  "email",
] as const;
type ProfileField = (typeof profileFields)[number];
const isProfileField = (field: string): field is ProfileField =>
  profileFields.some((profileField) => profileField === field);

// 가입 세션(15분)이 지났거나 인증이 잘못됐으면 카카오 로그인부터 다시 한다
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
    // 칸을 벗어날 때 그 칸만 검사하고, 시작하기를 누르면 전체를 검사한다. 입력 중에는 검사하지 않는다
    // 값을 고치면 그 칸의 오류 문구만 지운다 (기능 요구사항 정의서 v0.3, USER_FLOW §4.1)
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: {
      name: "",
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

  // 미리보기용 blob URL은 바뀌거나 화면을 떠날 때 해제한다
  // 업로드 경로만 저장할 때는 해제하지 않도록 previewUrl에만 반응한다
  const avatarPreviewUrl = avatar?.previewUrl;
  useEffect(() => {
    if (!avatarPreviewUrl) return;
    return () => URL.revokeObjectURL(avatarPreviewUrl);
  }, [avatarPreviewUrl]);

  // 사진 오류는 토스트로 알린다 (기능 요구사항 정의서 v0.3)
  const handleAvatarSelect = async (file: File) => {
    const result = await loadProfileImage(file);
    if ("errorMessage" in result) {
      showToast(result.errorMessage, { variant: "error" });
      return;
    }
    setAvatar({ file, previewUrl: result.previewUrl });
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
        showToast(getProfileImageUploadErrorMessage(error), {
          variant: "error",
        });
        return;
      }
    }

    try {
      await signup({
        name: values.name,
        nickname: values.nickname,
        gender: values.gender,
        birthDate: toIsoBirthDate(values.birthDate),
        email: values.email || undefined,
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
      // 화면 검사를 통과했지만 서버 기준과 다를 때. 해당 칸 아래에 서버 문구를 보여준다
      if (getApiErrorCode(error) === "UNDERAGE") {
        setError(
          "birthDate",
          { message: "만 18세 이상만 가입할 수 있어요." },
          { shouldFocus: true },
        );
        return;
      }
      const fieldErrors = getApiFieldErrors(error).filter(
        (fieldError): fieldError is { field: ProfileField; message: string } =>
          isProfileField(fieldError.field),
      );
      if (fieldErrors.length > 0) {
        fieldErrors.forEach(({ field, message }, index) =>
          setError(field, { message }, { shouldFocus: index === 0 }),
        );
        return;
      }
      setSubmitError("저장하지 못했어요. 잠시 후 다시 시도해주세요.");
      return;
    }
    // 노출 시간 2초는 제안값이다 (USER_FLOW §4.1)
    showToast("회원가입이 완료되었어요. 환영해요!", { duration: 2000 });
    // 로그인을 요청한 원래 화면으로 돌아간다 (USER_FLOW §4.3)
    // 홈 화면 추가 안내 대상이면 안내를 먼저 보여주고, 안내가 복귀 경로로 보낸다 (USER_FLOW §9.1)
    if (
      detectHomeScreenGuidePlatform() &&
      shouldShowAfterSignup(readHomeScreenGuideRecord())
    ) {
      recordHomeScreenGuideShownAfterSignup();
      router.replace(toHomeScreenGuidePath("signup"));
      return;
    }
    router.replace(getLoginRedirect());
  };

  return (
    <form
      noValidate
      onSubmit={handleSubmit(submit)}
      className="mx-auto flex min-h-dvh max-w-md flex-col bg-card"
    >
      <div className="flex-1 px-5 pt-safe">
        {/* 제목·소개는 시안 AUTH-03·04 (결정 2026-11-07) */}
        <h1 className="pt-9 text-2xl leading-8.5 font-bold break-keep">
          프로필을 완성해주세요
        </h1>
        <p className="mt-2 text-sm break-keep text-muted-foreground">
          {/* 줄바꿈 위치는 시안 AUTH-03과 같게 둔다 (사용자 결정 2026-11-07) */}
          일정에는 성별과 연령대만 표시돼요. 이름과 이메일은
          <br />
          공개되지 않아요.
        </p>

        <div className="mt-5.5 flex flex-col items-center">
          <AvatarEditor
            imageUrl={
              avatarPreviewUrl ??
              session?.profileImageUrl ??
              DEFAULT_PROFILE_IMAGE_URL
            }
            onFileSelect={handleAvatarSelect}
          />
        </div>

        {/* 입력 순서는 기능 요구사항 정의서 v0.3을 따른다: 이름 → 닉네임 → 성별 → 생년월일 → 이메일 */}
        <div className="mt-4.5 flex flex-col gap-3.5 pb-6">
          <TextField
            label="이름"
            autoComplete="name"
            placeholder="이름을 입력해주세요"
            helperText="이름은 가입 후 바꿀 수 없어요."
            errorMessage={errors.name?.message}
            {...register("name", { onChange: () => clearErrors("name") })}
          />
          <TextField
            label="닉네임"
            autoComplete="nickname"
            placeholder="닉네임을 입력해주세요"
            helperTone="success"
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
                placeholder="YYYY. MM. DD"
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
          {/* TODO(D-14): 시안에 없는 칸이라 기존 입력 칸 모양으로 둔다. 선택 입력 표시 방식은 디자인 미정 */}
          <TextField
            label="이메일 (선택)"
            type="email"
            inputMode="email"
            autoComplete="email"
            errorMessage={errors.email?.message}
            {...register("email", { onChange: () => clearErrors("email") })}
          />
        </div>
      </div>

      <div className="sticky bottom-0 bg-card px-5 pt-3 pb-safe">
        {submitError && (
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
