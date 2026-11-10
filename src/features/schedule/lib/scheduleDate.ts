import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";

// 일정 시각은 한국 시간이다. 기기 시간대와 상관없이 한국 날짜로 계산한다 (sv-SE 표기 = `YYYY-MM-DD HH:mm:ss`)
const KST_DATE_TIME = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

/** 한국 시간 `YYYY-MM-DDTHH:mm:ss` (일정 `startAt`과 같은 형식) */
export function toKstDateTime(date: Date) {
  return KST_DATE_TIME.format(date).replace(" ", "T");
}

/** 한국 날짜 `YYYY-MM-DD` */
export function toKstDate(date: Date) {
  return toKstDateTime(date).slice(0, 10);
}

/** 약속 시간 표기 `MM월DD일(요일) HH:MM`. 당일 일정도 같은 형식 (기능 요구사항 정의서 v0.3 04) */
export function formatScheduleDateTime(startAt: string) {
  return format(parseISO(startAt), "MM월dd일(EEE) HH:mm", { locale: ko });
}

/**
 * 참여한 일정의 시작까지 남은 날 (시안 LIST-04). 오늘이면 `D-DAY`, 이후면 `D-N`, 지난 일정은 없다.
 * 한국 날짜끼리 비교한다. 표시만 하고 일정 상태 판정에는 쓰지 않는다
 */
export function getDdayLabel(startAt: string, now: Date = new Date()) {
  const days = differenceInCalendarDays(
    parseISO(startAt.slice(0, 10)),
    parseISO(toKstDate(now)),
  );
  if (days < 0) return undefined;
  return days === 0 ? "D-DAY" : `D-${days}`;
}

/** NEW 배지 기준: 개설 후 24시간 (사용자 결정 2026-11-10) */
const NEW_BADGE_MS = 24 * 60 * 60 * 1000;

/**
 * 개설한 일정 탭의 NEW 배지를 붙일지. `createdAt`은 오프셋 없는 한국 시간이다.
 * 서버가 소수 초를 6자리까지 줄 수 있어 `Date.parse` 대신 parseISO로 읽는다(브라우저마다 다르게 읽지 않게)
 */
export function isNewSchedule(createdAt: string, now: Date = new Date()) {
  return (
    now.getTime() - parseISO(`${createdAt}+09:00`).getTime() < NEW_BADGE_MS
  );
}
