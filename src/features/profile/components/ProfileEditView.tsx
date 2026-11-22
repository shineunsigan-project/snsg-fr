"use client";

import { ChevronLeft } from "lucide-react";
import { useId, type FormEventHandler, type ReactNode } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import type { MyProfile } from "../api/myProfile";
import type { NicknameCheckMessage } from "../hooks/useNicknameCheck";
import { formatBirthDate } from "../lib/birthDate";
import {
  genderOptions,
  NICKNAME_MAX_LENGTH,
  type ProfileFormInput,
} from "../schemas/profileSchema";

import { formatAgeGroup } from "@/features/schedule/lib/scheduleDetailView";
import { toApiImageUrl } from "@/shared/lib/apiImageUrl";
import { AvatarEditor } from "@/shared/ui/AvatarEditor";
import { BottomCta } from "@/shared/ui/BottomCta";
import { Button } from "@/shared/ui/button";
import { FieldLabel, FieldMessage, TextField } from "@/shared/ui/TextField";

/** MY-02에서 고칠 수 있는 칸. 이름·성별·생년월일은 가입 후 수정 불가 (USER_FLOW §8.1, SHI-158 결정 Q1) */
export type ProfileEditFormInput = Pick<ProfileFormInput, "nickname" | "email">;

type ProfileEditViewProps = {
  profile: MyProfile;
  /** 새로 고른 사진의 미리보기 URL. 없으면 profile.profileImageUrl(서버 경로) */
  imagePreviewUrl?: string;
  onImageSelect: (file: File) => void;
  onBack: () => void;
  /** 컨테이너가 `handleSubmit(...)`을 넘긴다 */
  onSubmit: FormEventHandler<HTMLFormElement>;
  isSubmitting: boolean;
  /** 닉네임 14일 제한 중이면 다시 바꿀 수 있는 날짜(표시용 "MM월DD일"). 있으면 닉네임 칸을 잠근다 */
  nicknameLockedUntil?: string;
  /** 저장 중 닉네임 제한(409)을 받아 잠갔으면 잠금 안내를 빨간 오류로 보여준다 */
  isNicknameLockError?: boolean;
  /** 닉네임 칸을 벗어날 때 확인한 사용 가능 여부 결과. 입력 검사 오류가 있으면 그쪽을 보여준다 */
  nicknameCheckMessage?: NicknameCheckMessage;
  /** 닉네임 칸을 벗어날 때. 컨테이너가 사용 가능 여부를 물을지 정한다 */
  onNicknameBlur?: (value: string) => void;
  /** 닉네임 값을 고칠 때. 사용 가능 여부 결과를 지운다 */
  onNicknameChange?: () => void;
};

/**
 * MY-02 프로필 수정 화면 모양 (시안 `MY-02 프로필 수정`).
 * nickname·email은 상위 FormProvider(react-hook-form)에 등록한다. 제출·API는 컨테이너가 붙인다
 */
export function ProfileEditView({
  profile,
  imagePreviewUrl,
  onImageSelect,
  onBack,
  onSubmit,
  isSubmitting,
  nicknameLockedUntil,
  isNicknameLockError = false,
  nicknameCheckMessage,
  onNicknameBlur,
  onNicknameChange,
}: ProfileEditViewProps) {
  const {
    control,
    register,
    clearErrors,
    formState: { errors },
  } = useFormContext<ProfileEditFormInput>();
  const nickname = useWatch({ control, name: "nickname" }) ?? "";

  const genderLabel = genderOptions.find(
    (option) => option.value === profile.gender,
  )?.label;
  const birthDigits = profile.birthDate.replaceAll("-", "");
  const isNicknameAvailable = nicknameCheckMessage?.tone === "success";

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      className="mx-auto flex min-h-dvh max-w-md flex-col bg-card"
    >
      <ProfileEditHeader onBack={onBack} />

      <div className="flex-1 px-5">
        <div className="mt-5 flex flex-col items-center">
          <AvatarEditor
            imageUrl={
              imagePreviewUrl ??
              toApiImageUrl(profile.profileImageUrl) ??
              undefined
            }
            onFileSelect={onImageSelect}
          />
        </div>

        {/* 순서는 시안·가입 화면과 같다: 이름 → 닉네임 → 성별 → 생년월일 → 이메일 */}
        <div className="mt-4.5 flex flex-col gap-3.5 pb-6">
          <ReadOnlyField
            label="이름"
            labelNote="· 수정 불가"
            value={profile.name}
            helperText="이름은 가입 후 수정할 수 없어요."
          />
          {nicknameLockedUntil ? (
            <ReadOnlyField
              label="닉네임"
              value={profile.nickname}
              // TODO(F-19): 임시 문구 (SHI-158 결정 2026-11-07)
              helperText={`${nicknameLockedUntil}부터 다시 바꿀 수 있어요.`}
              helperTone={isNicknameLockError ? "error" : "default"}
            />
          ) : (
            <TextField
              label="닉네임"
              autoComplete="nickname"
              placeholder="닉네임을 입력해주세요"
              // 처음·입력 중에는 14일 제한 안내, 칸을 벗어나 사용 가능하면 그 자리에 녹색 결과 문구(시안 MY-02·화면 명세 "AUTH-03 규칙", 사용자 결정 2026-11-12)
              helperText={
                isNicknameAvailable
                  ? nicknameCheckMessage.message
                  : "닉네임을 바꾸면 14일 동안 다시 바꿀 수 없어요."
              }
              helperTone={isNicknameAvailable ? "success" : "default"}
              errorMessage={
                errors.nickname?.message ??
                (nicknameCheckMessage?.tone === "error"
                  ? nicknameCheckMessage.message
                  : undefined)
              }
              trailing={
                <span className="shrink-0 text-sm text-subtle-foreground">
                  {nickname.length}/{NICKNAME_MAX_LENGTH}
                </span>
              }
              {...register("nickname", {
                onChange: () => {
                  clearErrors("nickname");
                  onNicknameChange?.();
                },
                onBlur: (event) => onNicknameBlur?.(event.target.value),
              })}
            />
          )}
          {/* 시안의 `1회 수정 가능`·성별 버튼·안내 문구는 쓰지 않는다 (SHI-158 결정 Q1) */}
          <ReadOnlyField
            label="성별"
            labelNote="· 수정 불가"
            value={genderLabel ?? ""}
          />
          <ReadOnlyField
            label="생년월일"
            labelNote="· 수정 불가"
            value={formatBirthDate(birthDigits)}
            helperText="생년월일은 가입 후 수정할 수 없어요."
            // 연령대는 서버가 한국 시간 기준으로 계산한 값을 쓴다 (SHI-165 결정 6)
            trailing={
              <span className="shrink-0 text-sm font-bold text-primary">
                {formatAgeGroup(profile.ageGroup)}
              </span>
            }
          />
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

      <BottomCta>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={isSubmitting}
        >
          수정 완료
        </Button>
      </BottomCta>
    </form>
  );
}

/** MY-02 제목줄. 불러오기 실패 화면에서도 쓴다 */
export function ProfileEditHeader({ onBack }: { onBack: () => void }) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-card px-5 pt-safe">
      <div className="flex h-14 items-center">
        <button
          type="button"
          onClick={onBack}
          aria-label="뒤로 가기"
          className="-ml-2.5 flex size-11 shrink-0 items-center justify-center text-foreground"
        >
          <ChevronLeft aria-hidden className="size-6" />
        </button>
        <h1 className="flex-1 text-center text-lg font-bold">프로필 수정</h1>
        {/* 제목이 가운데 오도록 뒤로 버튼과 같은 폭을 비운다 */}
        <span aria-hidden className="-mr-2.5 size-11 shrink-0" />
      </div>
    </header>
  );
}

type ReadOnlyFieldProps = {
  label: string;
  labelNote?: string;
  value: string;
  helperText?: string;
  helperTone?: "default" | "error";
  trailing?: ReactNode;
};

/** 가입 후 수정할 수 없는 값. TextField와 같은 구조에 회색 칸 (시안 MY-02). 키보드로 들어오면 회색 링으로 위치를 보인다 */
function ReadOnlyField({
  label,
  labelNote,
  value,
  helperText,
  helperTone = "default",
  trailing,
}: ReadOnlyFieldProps) {
  const id = useId();
  const messageId = `${id}-message`;

  return (
    <div>
      <FieldLabel htmlFor={id} label={label} note={labelNote} />
      <div className="mt-2 flex h-13 items-center gap-2 rounded-lg border border-input bg-muted px-4 focus-within:ring-3 focus-within:ring-ring/50">
        <input
          id={id}
          readOnly
          value={value}
          aria-describedby={helperText ? messageId : undefined}
          aria-invalid={helperTone === "error" ? true : undefined}
          className="min-w-0 flex-1 truncate bg-transparent text-md text-muted-foreground outline-none"
        />
        {trailing}
      </div>
      {helperText && (
        <FieldMessage id={messageId} tone={helperTone} message={helperText} />
      )}
    </div>
  );
}
