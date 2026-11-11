"use client";

import { useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { format, parseISO } from "date-fns";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FormProvider,
  useForm,
  useWatch,
  type FieldErrors,
  type Resolver,
} from "react-hook-form";
import type { z } from "zod";

import {
  NICKNAME_CHANGE_RESTRICTED_CODE,
  USER_NOT_FOUND_CODE,
  type MyProfile,
  type UpdateMyProfileRequest,
} from "../api/myProfile";
import { useMyProfile } from "../hooks/useMyProfile";
import { useNicknameCheck } from "../hooks/useNicknameCheck";
import { useUpdateMyProfile } from "../hooks/useUpdateMyProfile";
import { useUploadMyProfileImage } from "../hooks/useUploadMyProfileImage";
import {
  getProfileImageUploadErrorMessage,
  loadProfileImage,
  PROFILE_IMAGE_UPLOAD_FAILED_MESSAGE,
} from "../lib/profileImage";
import {
  DUPLICATED_NICKNAME_MESSAGE,
  profileSchema,
} from "../schemas/profileSchema";
import {
  ProfileEditHeader,
  ProfileEditView,
  type ProfileEditFormInput,
} from "./ProfileEditView";
import { useIsLoggedIn } from "@/features/auth/hooks/useIsLoggedIn";
import { clearSession } from "@/features/auth/lib/clearSession";
import { toKstDateTime } from "@/features/schedule/lib/scheduleDate";
import {
  getApiErrorCode,
  getApiErrorMessage,
  getApiFieldErrors,
} from "@/shared/lib/api/client";
import { saveLoginRedirect } from "@/shared/lib/kakaoLogin";
import { Button } from "@/shared/ui/button";
import { PageStatus } from "@/shared/ui/PageStatus";
import { showToast } from "@/shared/ui/sonner";

const MY_PATH = "/my";
const EDIT_PATH = "/my/edit";

// 프로필 완성과 같은 스키마에서 고칠 수 있는 칸만 쓴다 (forms 규칙)
const profileEditSchema = profileSchema.pick({ nickname: true, email: true });
type ProfileEditFormValues = z.output<typeof profileEditSchema>;
const editableFields = ["nickname", "email"] as const;
type EditableField = (typeof editableFields)[number];
const isEditableField = (field: string): field is EditableField =>
  editableFields.some((editable) => editable === field);

type ResolverContext = { isNicknameLocked: boolean };

// Zod 스키마를 React Hook Form에 연결한다. 칸마다 첫 번째 오류만 보여준다
// 닉네임이 잠겨 있으면 칸이 없으므로 닉네임 오류는 무시한다
const profileEditResolver: Resolver<
  ProfileEditFormInput,
  ResolverContext,
  ProfileEditFormValues
> = async (values, context) => {
  const result = profileEditSchema.safeParse(values);
  if (result.success) return { values: result.data, errors: {} };

  const errors: FieldErrors<ProfileEditFormInput> = {};
  for (const issue of result.error.issues) {
    const field = String(issue.path[0]);
    if (!isEditableField(field)) continue;
    if (field === "nickname" && context?.isNicknameLocked) continue;
    errors[field] ??= { type: issue.code, message: issue.message };
  }
  if (Object.keys(errors).length === 0) {
    return {
      values: { nickname: values.nickname.trim(), email: values.email.trim() },
      errors: {},
    };
  }
  return { values: {}, errors };
};

/**
 * 닉네임을 다시 바꿀 수 있는 날짜("MM월DD일"). 아직 제한 중일 때만 돌려준다
 * 제한 여부는 서버가 준 nicknameChangeableAt으로만 판단한다(14일을 직접 세지 않는다, USER_FLOW §8.1)
 * 서버 값은 한국 시간 `yyyy-MM-ddTHH:mm:ss`라 같은 형식의 지금 시각과 문자열로 비교한다
 */
function getNicknameLockedUntil(nicknameChangeableAt: string | null) {
  if (!nicknameChangeableAt) return undefined;
  if (nicknameChangeableAt <= toKstDateTime(new Date())) return undefined;
  return format(parseISO(nicknameChangeableAt), "MM월dd일");
}

/**
 * 프로필 수정 MY-02 (USER_FLOW §8.1). MY-01 `수정하기`로 들어온다
 * - 비로그인이거나 조회가 401·404(USER_NOT_FOUND)면 로그인 화면으로 보내고, 로그인 후 이 화면으로 돌아오게 한다 (MY-01과 같다)
 * - 뒤로가기는 확인 팝업 없이 내 정보로 (SHI-158 결정 2026-11-07)
 */
export function ProfileEditScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isLoggedIn = useIsLoggedIn();
  const { data: profile, error, refetch } = useMyProfile(isLoggedIn === true);
  const isUserNotFound = getApiErrorCode(error) === USER_NOT_FOUND_CODE;
  const isUnauthorized =
    isLoggedIn === false ||
    isUserNotFound ||
    (isAxiosError(error) && error.response?.status === 401);

  // 사용자가 없거나 탈퇴했으면(404) 로그인 상태를 비운다. 비로그인이 되어도 아래 이동은 isUnauthorized가 그대로라 한 번만 한다
  useEffect(() => {
    if (isUserNotFound) clearSession(queryClient);
  }, [isUserNotFound, queryClient]);

  // 수정 요청의 404도 로그인 상태를 비워(비로그인) 여기서 로그인 화면으로 보낸다
  useEffect(() => {
    if (!isUnauthorized) return;
    saveLoginRedirect(EDIT_PATH);
    router.replace("/login");
  }, [isUnauthorized, router]);

  // 확인 팝업 없이 내 정보로 (SHI-158 결정 2026-11-07). 기록을 바꿔 내 정보에서 뒤로 갔을 때 편집 화면이 다시 나오지 않게 한다
  const goBack = () => router.replace(MY_PATH);

  if (profile && !isUnauthorized) {
    return (
      <ProfileEditForm profile={profile} onBack={goBack} refetch={refetch} />
    );
  }
  if (isUnauthorized || !error) return <PageStatus message="불러오는 중..." />;
  // 401이 아닌 오류는 화면에 두고 다시 시도 (MY-01과 같다)
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-card">
      <ProfileEditHeader onBack={goBack} />
      <main className="flex flex-1 flex-col items-center justify-center gap-3 px-5 text-center">
        {/* 📝 임시 문구 TODO(F-19) */}
        <p className="text-sm text-muted-foreground">
          내 정보를 불러오지 못했어요.
        </p>
        <Button variant="secondary" onClick={() => refetch()}>
          다시 시도
        </Button>
      </main>
    </div>
  );
}

type ProfileEditFormProps = {
  profile: MyProfile;
  onBack: () => void;
  refetch: () => Promise<{ data?: MyProfile }>;
};

function ProfileEditForm({ profile, onBack, refetch }: ProfileEditFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { mutateAsync: updateMyProfile } = useUpdateMyProfile();
  const { mutateAsync: uploadMyProfileImage } = useUploadMyProfileImage();
  const nicknameLockedUntil = getNicknameLockedUntil(
    profile.nicknameChangeableAt,
  );
  const form = useForm<
    ProfileEditFormInput,
    ResolverContext,
    ProfileEditFormValues
  >({
    resolver: profileEditResolver,
    context: { isNicknameLocked: !!nicknameLockedUntil },
    // 칸을 벗어날 때 그 칸만, 수정 완료를 누르면 전체를 검사한다. 값을 고치면 그 칸의 오류를 지운다 (USER_FLOW §4.1)
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: { nickname: profile.nickname, email: profile.email },
  });
  const { setError, setValue } = form;
  const nickname = useWatch({ control: form.control, name: "nickname" });
  const nicknameCheck = useNicknameCheck(nickname);
  // 지금 닉네임 그대로면 묻지 않는다. 잠겨 있으면 읽기 전용 칸이라 이 핸들러가 불리지 않는다 (SHI-165 결정 4)
  const handleNicknameBlur = (value: string) => {
    if (value.trim() === profile.nickname) return;
    nicknameCheck.check(value);
  };
  // 저장 중 닉네임 제한(409)으로 잠갔는지. 잠금 안내를 빨간 오류로 보여준다 (사용자 결정 2026-11-07 D)
  const [isNicknameLockError, setIsNicknameLockError] = useState(false);

  // 새로 고른 사진. 수정 완료를 누를 때 올리고, 수정이 실패해 다시 누를 때는 올린 경로(uploadedPath)를 다시 쓴다
  const [avatar, setAvatar] = useState<{
    file: File;
    previewUrl: string;
    uploadedPath?: string;
  }>();

  // 미리보기용 blob URL은 바뀌거나 화면을 떠날 때 해제한다. 업로드 경로만 저장할 때는 해제하지 않는다
  const avatarPreviewUrl = avatar?.previewUrl;
  useEffect(() => {
    if (!avatarPreviewUrl) return;
    return () => URL.revokeObjectURL(avatarPreviewUrl);
  }, [avatarPreviewUrl]);

  // 사진 오류는 토스트로 알린다 (가입과 같다)
  const handleImageSelect = async (file: File) => {
    const result = await loadProfileImage(file);
    if ("errorMessage" in result) {
      showToast(result.errorMessage, { variant: "error" });
      return;
    }
    setAvatar({ file, previewUrl: result.previewUrl });
  };

  const showSubmitError = (error: unknown) => {
    // 로그인 만료는 공통 클라이언트가 로그인 화면으로 보낸다
    if (getApiErrorCode(error) === "UNAUTHENTICATED") return;
    // 📝 임시 문구 TODO(F-19)
    showToast("프로필을 수정하지 못했어요. 다시 시도해주세요.", {
      variant: "error",
    });
  };

  const submit = async (values: ProfileEditFormValues) => {
    // 바뀐 항목만 보낸다 (USER_FLOW §8.1). 값은 스키마가 앞뒤 공백을 지운 것이다
    const body: UpdateMyProfileRequest = {};
    if (!nicknameLockedUntil && values.nickname !== profile.nickname) {
      body.nickname = values.nickname;
    }
    // 이메일을 비우면 `""`로 지운다 (api-guide 프로필 수정)
    if (values.email !== profile.email) body.email = values.email;

    // 바뀐 것이 없으면 요청 없이 돌아간다 (SHI-158 결정 2026-11-07)
    if (!avatar && Object.keys(body).length === 0) {
      router.replace(MY_PATH);
      return;
    }

    if (avatar) {
      let profileImageUrl = avatar.uploadedPath;
      if (!profileImageUrl) {
        try {
          profileImageUrl = await uploadMyProfileImage(avatar.file);
        } catch (error) {
          if (getApiErrorCode(error) !== "UNAUTHENTICATED") {
            showToast(getProfileImageUploadErrorMessage(error), {
              variant: "error",
            });
          }
          return;
        }
        const uploadedPath = profileImageUrl;
        setAvatar((current) =>
          current?.file === avatar.file
            ? { ...current, uploadedPath }
            : current,
        );
      }
      body.profileImageUrl = profileImageUrl;
    }

    try {
      await updateMyProfile(body);
    } catch (error) {
      const code = getApiErrorCode(error);
      if (code === USER_NOT_FOUND_CODE) {
        // 사용자가 없거나 탈퇴했다. 로그인 상태를 비우면 화면이 로그인 화면으로 보낸다 (조회 404와 같다)
        clearSession(queryClient);
        return;
      }
      if (code === "DUPLICATED_NICKNAME") {
        // 가입 화면과 같은 문구 (USER_FLOW §4.1)
        setError(
          "nickname",
          { message: DUPLICATED_NICKNAME_MESSAGE },
          { shouldFocus: true },
        );
        return;
      }
      if (code === "INVALID_PROFILE_IMAGE_URL") {
        // 올린 경로를 쓸 수 없다. 버리고 다음 [수정 완료] 때 다시 올린다 (api-guide 프로필 수정)
        setAvatar(
          (current) =>
            current && { file: current.file, previewUrl: current.previewUrl },
        );
        showToast(PROFILE_IMAGE_UPLOAD_FAILED_MESSAGE, { variant: "error" });
        return;
      }
      if (code === "INVALID_NICKNAME" || code === "INVALID_EMAIL") {
        // 서버의 안전망 검사. 해당 칸 아래에 서버 문구를 보여준다
        const field = code === "INVALID_NICKNAME" ? "nickname" : "email";
        const message = getApiErrorMessage(error);
        if (message) {
          setError(field, { message }, { shouldFocus: true });
          return;
        }
      }
      if (code === NICKNAME_CHANGE_RESTRICTED_CODE) {
        // 프로필을 다시 받아 닉네임을 되돌리고 칸을 잠근 뒤 잠금 안내를 오류로 보여준다
        // 이메일·사진 등 다른 변경은 그대로 두어 다시 누르면 나머지만 저장된다
        const { data: refreshed } = await refetch();
        if (getNicknameLockedUntil(refreshed?.nicknameChangeableAt ?? null)) {
          setValue("nickname", refreshed?.nickname ?? profile.nickname);
          setIsNicknameLockError(true);
          return;
        }
        // 다시 받은 프로필에 제한이 없거나 다시 받지 못하면 잠글 날짜가 없으므로 그 밖의 오류처럼 알린다
      }
      const fieldErrors = getApiFieldErrors(error).filter(({ field }) =>
        isEditableField(field),
      );
      if (code === "INVALID_REQUEST" && fieldErrors.length > 0) {
        // 서버 문구를 해당 칸 아래에 보여준다 (forms 규칙)
        fieldErrors.forEach(({ field, message }, index) => {
          if (isEditableField(field)) {
            setError(field, { message }, { shouldFocus: index === 0 });
          }
        });
        return;
      }
      showSubmitError(error);
      return;
    }
    // 뒤로가기로 편집 화면이 다시 나오지 않게 기록을 바꾼다
    router.replace(MY_PATH);
    // 📝 임시 문구 TODO(F-19)
    showToast("프로필을 수정했어요.");
  };

  return (
    <FormProvider {...form}>
      <ProfileEditView
        profile={profile}
        imagePreviewUrl={avatarPreviewUrl}
        onImageSelect={handleImageSelect}
        onBack={onBack}
        onSubmit={form.handleSubmit(submit)}
        isSubmitting={form.formState.isSubmitting}
        nicknameLockedUntil={nicknameLockedUntil}
        isNicknameLockError={isNicknameLockError}
        nicknameCheckMessage={nicknameCheck.message}
        onNicknameBlur={handleNicknameBlur}
        onNicknameChange={nicknameCheck.reset}
      />
    </FormProvider>
  );
}
