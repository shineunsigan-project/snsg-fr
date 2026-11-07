import type { ScheduleDuration } from "../types";

// 일정 시각은 한국 시간 기준이다. 기기 시간대와 상관없이 날짜는 `YYYY-MM-DD`, 시각은 `HH:mm` 문자열로 다룬다

const MINUTES_PER_DAY = 24 * 60;
/** 시작 시각 단위 (기능 요구사항 정의서 v0.3 04 개설) */
const START_TIME_STEP_MINUTES = 30;
/** 시작 시각은 현재 시각으로부터 최소 1시간 뒤 */
const MIN_LEAD_MINUTES = 60;

const DURATION_HOURS: Record<ScheduleDuration, number> = {
  SHORT: 1,
  MEDIUM: 2,
  LONG: 3,
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

const kstFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

const pad = (value: number) => String(value).padStart(2, "0");

function getKstNow() {
  const parts = Object.fromEntries(
    kstFormatter
      .formatToParts(new Date())
      .map((part) => [part.type, part.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    // 초까지 넣어 18:00:30이면 19:00이 아니라 19:30부터 고르게 한다
    minutes:
      Number(parts.hour) * 60 +
      Number(parts.minute) +
      Number(parts.second) / 60,
  };
}

function addDays(date: string, days: number) {
  const [year, month, day] = date.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`;
}

export function toMinutes(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function toTime(minutes: number) {
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

/**
 * 지금 고를 수 있는 가장 이른 시작 일시. 현재 시각 + 1시간 이후 첫 30분 단위
 * 예) 18:10 → 오늘 19:30, 22:40 → 내일 00:00
 */
export function getEarliestStart() {
  const now = getKstNow();
  const minutes =
    Math.ceil((now.minutes + MIN_LEAD_MINUTES) / START_TIME_STEP_MINUTES) *
    START_TIME_STEP_MINUTES;
  return minutes >= MINUTES_PER_DAY
    ? { date: addDays(now.date, 1), time: toTime(minutes - MINUTES_PER_DAY) }
    : { date: now.date, time: toTime(minutes) };
}

export function getKstToday() {
  return getKstNow().date;
}

/** `YYYY-MM-DD` → 달력에 넘길 기기 시간대의 그날 0시 */
export function toCalendarDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** 달력에서 고른 날짜 → `YYYY-MM-DD` */
export function fromCalendarDate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** 날짜 칸 표기 `MM.DD` */
export function formatDateField(date: string) {
  const [, month, day] = date.split("-");
  return `${month}.${day}`;
}

/** 약속 시간 표기 `MM월DD일(요일) HH:MM` (화면 기능 명세서 00 공통 기준) */
export function formatStartAt(date: string, time: string) {
  const [year, month, day] = date.split("-").map(Number);
  const weekday =
    WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  return `${pad(month)}월${pad(day)}일(${weekday}) ${time}`;
}

/** 예상 종료 = 시작 + 예상 소요 (표시만). 자정을 넘으면 `다음 날`을 붙인다 */
export function formatExpectedEnd(time: string, duration: ScheduleDuration) {
  const end = toMinutes(time) + DURATION_HOURS[duration] * 60;
  // TODO(F-19): `약 다음 날 01:30` 표기는 문서에 없는 임시 표기다
  return end >= MINUTES_PER_DAY
    ? `약 다음 날 ${toTime(end - MINUTES_PER_DAY)}`
    : `약 ${toTime(end)}`;
}

/** 일정 생성 요청의 시작 일시 (한국 시간 `YYYY-MM-DDTHH:mm:ss`) */
export function toStartAt(date: string, time: string) {
  return `${date}T${time}:00`;
}
