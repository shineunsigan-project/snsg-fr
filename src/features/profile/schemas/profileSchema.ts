import { z } from "zod";

import { getAge, parseBirthDate } from "../lib/birthDate";

// 기능 요구사항 정의서 v0.3 순서 (남성·여성·기타)
export const genderOptions = [
  { value: "MALE", label: "남성" },
  { value: "FEMALE", label: "여성" },
  { value: "OTHER", label: "기타" },
] as const;

// 이름: 2~20자 한글·영문. 띄어쓰기는 영문 사이에만 허용한다 (예: John Smith) (기능 요구사항 정의서 v0.3)
const NAME_PATTERN = /^(?!.* [^a-zA-Z])(?!.*[^a-zA-Z] )[가-힣a-zA-Z ]{2,20}$/;

// 닉네임 기준은 정책 POL-005를 따른다: 2~10자의 한글·영문·숫자·마침표(.)·밑줄(_) (2026-10-11 수정)
// 마침표·밑줄만으로는 만들 수 없다. 한글·영문·숫자가 한 글자 이상 있어야 한다 (팀 결정 2026-10-11)
const NICKNAME_PATTERN = /^(?=.*[가-힣a-zA-Z0-9])[가-힣a-zA-Z0-9._]{2,10}$/;

// 만 18세 이상만 가입할 수 있다 (기능 요구사항 정의서 v0.3, F-14 해결)
const MIN_SIGNUP_AGE = 18;
const EMAIL_MAX_LENGTH = 100;

// 프로필 사진 기준은 백엔드 업로드 API를 따른다: 5MB 이하의 PNG·JPG·WebP (WebP는 팀 결정으로 유지)
export const PROFILE_IMAGE_MAX_MB = 5;
export const PROFILE_IMAGE_TYPES: readonly string[] = [
  "image/png",
  "image/jpeg",
  "image/webp",
];

// 프로필 완성·수정에 같이 쓴다. 문구는 USER_FLOW §4.1 "유효성 검사 문구"를 그대로 옮긴다
// 앞뒤 공백은 자동으로 지운다. 닉네임 중복은 가입 요청의 409(DUPLICATED_NICKNAME)로 확인한다
export const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "이름을 입력해주세요.")
    // TODO: 기획서에 형식 오류 문구가 없어 임시 문구를 쓴다
    .regex(NAME_PATTERN, "이름은 2~20자의 한글·영문만 쓸 수 있어요."),
  nickname: z
    .string()
    .trim()
    .min(1, "닉네임을 입력해주세요.")
    // TODO(F-14): 마침표·밑줄을 넣은 오류 문구가 확정되면 바꾼다
    .regex(
      NICKNAME_PATTERN,
      "닉네임은 2~10자의 한글·영문·숫자·마침표(.)·밑줄(_)만 쓸 수 있어요.",
    ),
  gender: z.enum(["MALE", "FEMALE", "OTHER"], {
    error: "성별을 선택해주세요.",
  }),
  birthDate: z.string().superRefine((digits, ctx) => {
    if (digits.length === 0) {
      ctx.addIssue({ code: "custom", message: "생년월일을 입력해주세요" });
      return;
    }
    // 8자리를 다 채우지 않은 경우도 존재하지 않는 날짜로 본다
    const date = parseBirthDate(digits);
    if (!date) {
      ctx.addIssue({ code: "custom", message: "존재하지 않는 날짜입니다" });
    } else if (getAge(date) < MIN_SIGNUP_AGE) {
      // 오늘 이후 날짜도 여기에 걸린다
      ctx.addIssue({
        code: "custom",
        message: "만 18세 이상만 가입할 수 있어요.",
      });
    }
  }),
  // 선택 입력. 비워 두면 검사하지 않는다. 중복 확인은 하지 않는다
  email: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || z.email().safeParse(value).success,
      "올바른 이메일 형식으로 입력해주세요. (예: name@example.com)",
    )
    // TODO: 기획서에 길이 초과 문구가 없어 임시 문구를 쓴다
    .refine(
      (value) => value.length <= EMAIL_MAX_LENGTH,
      `이메일은 ${EMAIL_MAX_LENGTH}자 이하로 입력해주세요.`,
    ),
});

export type ProfileFormInput = z.input<typeof profileSchema>;
export type ProfileFormValues = z.output<typeof profileSchema>;
