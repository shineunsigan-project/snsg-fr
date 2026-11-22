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

/** 홈 인사말 위 오늘 날짜 `11월 20일 금요일`. 한국 날짜 기준 (홈 화면 수정 제안) */
export function formatHomeToday(now: Date = new Date()) {
  return format(parseISO(toKstDate(now)), "M월 d일 EEEE", { locale: ko });
}

/** 새로 열린 일정 행의 날짜 칸 (홈 화면 시안): `11월` · `25` · `수` */
export function formatDateBlock(startAt: string) {
  const date = parseISO(startAt);
  return {
    month: format(date, "M월", { locale: ko }),
    day: format(date, "d"),
    weekday: format(date, "EEE", { locale: ko }),
  };
}

/** 다가오는 일정 카드의 약속 시간 `11월 21일 (토) 19:30` (홈 화면 수정 제안). 다른 목록 카드의 표기와 다르다 */
export function formatUpcomingDateTime(startAt: string) {
  return format(parseISO(startAt), "M월 d일 (EEE) HH:mm", { locale: ko });
}

/**
 * 곧 마감돼요 카드의 약속 시간 (홈 화면 수정 시안): 오늘 `오늘 19:00`, 내일 `내일 14:00`, 이틀~엿새 뒤 `일 18:00`(요일),
 * 그 뒤는 `11월 21일 (토) 19:30`. 한국 날짜끼리 비교한다. 표시만 하고 일정 상태 판정에는 쓰지 않는다.
 * 📝 일주일 넘게 남았을 때 표기는 시안에 없어 다른 카드와 같은 날짜 표기로 둔다. TODO(F-19)
 */
export function formatClosingSoonDateTime(
  startAt: string,
  now: Date = new Date(),
) {
  const days = differenceInCalendarDays(
    parseISO(startAt.slice(0, 10)),
    parseISO(toKstDate(now)),
  );
  const time = startAt.slice(11, 16);
  if (days === 0) return `오늘 ${time}`;
  if (days === 1) return `내일 ${time}`;
  if (days >= 2 && days <= 6) {
    return `${format(parseISO(startAt), "EEE", { locale: ko })} ${time}`;
  }
  return formatUpcomingDateTime(startAt);
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

/**
 * 모집 중 탭의 NEW 배지 기준: 개설일이 오늘과 같은 한국 날짜인지 확인한다.
 * `createdAt`은 오프셋 없는 한국 시간이다.
 */
export function isNewScheduleToday(createdAt: string, now: Date = new Date()) {
  return createdAt.slice(0, 10) === toKstDate(now);
}
