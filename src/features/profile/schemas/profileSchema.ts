import { z } from "zod";

import { parseBirthDate } from "../lib/birthDate";

export const genderOptions = [
  { value: "FEMALE", label: "여성" },
  { value: "MALE", label: "남성" },
] as const;

// 닉네임 기준은 정책 POL-005를 따른다: 2~10자의 한글·영문·숫자·마침표(.)·밑줄(_) (2026-10-11 수정)
// 마침표·밑줄만으로는 만들 수 없다. 한글·영문·숫자가 한 글자 이상 있어야 한다 (팀 결정 2026-10-11)
const NICKNAME_PATTERN = /^(?=.*[가-힣a-zA-Z0-9])[가-힣a-zA-Z0-9._]{2,10}$/;

// 프로필 사진 기준은 백엔드 업로드 API를 따른다: 5MB 이하의 PNG·JPG·WebP
export const PROFILE_IMAGE_MAX_MB = 5;
export const PROFILE_IMAGE_TYPES: readonly string[] = [
  "image/png",
  "image/jpeg",
  "image/webp",
];

// 프로필 완성·수정에 같이 쓴다. 문구는 USER_FLOW §4.1 "유효성 검사 문구"를 그대로 옮긴다
// TODO(F-14): 가입 가능 최소 나이 기준이 정해지면 추가한다
// 닉네임 중복은 가입 요청의 409(DUPLICATED_NICKNAME)로 확인한다
export const profileSchema = z.object({
  nickname: z
    .string()
    .trim()
    .min(1, "닉네임을 입력해주세요.")
    // TODO(F-14): 마침표·밑줄을 넣은 오류 문구가 확정되면 바꾼다
    .regex(
      NICKNAME_PATTERN,
      "닉네임은 2~10자의 한글·영문·숫자·마침표(.)·밑줄(_)만 쓸 수 있어요.",
    ),
  gender: z.enum(["FEMALE", "MALE"], { error: "성별을 선택해주세요." }),
  birthDate: z.string().superRefine((digits, ctx) => {
    if (digits.length === 0) {
      ctx.addIssue({ code: "custom", message: "생년월일을 입력해주세요." });
    } else if (digits.length < 8) {
      ctx.addIssue({
        code: "custom",
        message: "생년월일 8자리를 입력해주세요. (예: 1996. 04. 12)",
      });
    } else {
      const date = parseBirthDate(digits);
      if (!date) {
        ctx.addIssue({
          code: "custom",
          message: "올바른 날짜를 입력해주세요.",
        });
      } else if (date > new Date()) {
        ctx.addIssue({
          code: "custom",
          message: "오늘 이후 날짜는 입력할 수 없어요.",
        });
      }
    }
  }),
  // 선택 입력. 비워 두면 검사하지 않는다. 입력칸은 프로필 수정 화면에만 있다 (USER_FLOW §8)
  email: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || z.email().safeParse(value).success,
      "올바른 이메일 형식으로 입력해주세요. (예: name@example.com)",
    ),
});

export type ProfileFormInput = z.input<typeof profileSchema>;
export type ProfileFormValues = z.output<typeof profileSchema>;
