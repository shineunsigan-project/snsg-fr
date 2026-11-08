import { z } from "zod";

import { countChars } from "../lib/charCount";
import type { ScheduleDuration } from "../types";

// 입력 기준은 기능 요구사항 정의서 v0.3 "04 일정 관리 › 개설"과 USER_FLOW §7.7을 따른다
export const TITLE_MAX_LENGTH = 20;
export const DESCRIPTION_MIN_LENGTH = 10;
export const DESCRIPTION_MAX_LENGTH = 500;
/** 개설자 포함 전체 인원 */
export const CAPACITY_MIN = 4;
export const CAPACITY_MAX = 24;
/** 정의서에 기본값이 없어 최소값 4명으로 둔다 (팀 결정, 2026-10-31) */
export const CAPACITY_DEFAULT = 4;

const DURATIONS = [
  "SHORT",
  "NORMAL",
  "LONG",
] as const satisfies readonly ScheduleDuration[];

export const durationOptions: ReadonlyArray<{
  value: ScheduleDuration;
  label: string;
  description: string;
}> = [
  { value: "SHORT", label: "짧게", description: "1시간 내외" },
  { value: "NORMAL", label: "보통", description: "2시간 내외" },
  { value: "LONG", label: "길게", description: "3시간 이상" },
];

export const placeSchema = z.object({
  id: z.string(),
  name: z.string(),
  roadAddress: z.string(),
  addressDetail: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  regionCode: z.string(),
});

/** 기기에 임시 보관하는 입력값 모양. 선택하지 않은 값은 null이다 */
export const createScheduleDraftSchema = z.object({
  activityId: z.string().nullable(),
  place: placeSchema.nullable(),
  title: z.string(),
  duration: z.enum(DURATIONS).nullable(),
  description: z.string(),
  /** 한국 시간 `YYYY-MM-DD` */
  date: z.string(),
  /** 한국 시간 `HH:mm` */
  startTime: z.string(),
  capacity: z.number(),
});

// 1~5단계 전체 검사. 문구는 정의서 원문, 📝 표시는 문서에 없는 임시 문구다
// 활동·장소는 고르지 않으면 `다음`이 비활성이라 문구를 보여주지 않는다
export const createScheduleSchema = z.object({
  activityId: z.string().nullable().pipe(z.string()),
  place: placeSchema.nullable().pipe(placeSchema),
  title: z
    .string()
    .trim()
    // 📝 TODO(F-19): 빈 값 문구 확정 필요
    .min(1, "콘텐츠 활동명을 입력해주세요.")
    .refine((value) => countChars(value) <= TITLE_MAX_LENGTH),
  duration: z
    .enum(DURATIONS)
    .nullable()
    // 📝 TODO(F-19): 미선택 문구 확정 필요
    .pipe(z.enum(DURATIONS, { error: "예상 소요를 선택해주세요." })),
  // 앞뒤 공백을 빼고 센다. 줄바꿈은 포함한다. 빈 값도 10자 미만 문구를 보여준다
  description: z
    .string()
    .trim()
    .refine(
      (value) => countChars(value) >= DESCRIPTION_MIN_LENGTH,
      "10자 이상 적어주세요",
    )
    .refine((value) => countChars(value) <= DESCRIPTION_MAX_LENGTH),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[03]0$/),
  capacity: z.number().int().min(CAPACITY_MIN).max(CAPACITY_MAX),
});

export type CreateScheduleInput = z.input<typeof createScheduleSchema>;
export type CreateScheduleValues = z.output<typeof createScheduleSchema>;
