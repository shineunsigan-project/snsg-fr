import { addDays, differenceInHours, format, parseISO } from "date-fns";

import type { Activity } from "@/features/schedule/api/activities";

import type {
  ScheduleFilter,
  ScheduleListItem,
} from "@/features/schedule/api/schedules";
import { toKstDate, toKstDateTime } from "@/features/schedule/lib/scheduleDate";
import type { ScheduleStatus } from "@/features/schedule/types";

// MSW 전용 일정 저장소. TODO(API): 일정 API가 생기면 지운다
// 새로고침해도 남게 탭 단위 저장소에 두고, 날짜는 오늘 기준으로 만든 예시 일정으로 시작한다
// 일정 시각은 한국 시간이다. 기기 시간대와 상관없이 한국 날짜·시각으로 만들고 비교한다

export type MockSchedule = ScheduleListItem & {
  /** 활동 목록 API의 `id` */
  activityId: string;
  /** 시·군·구 코드 5자리 */
  regionCode: string;
  placeName: string;
  /** 개설 일시 (ISO). 같은 시작 시간이면 최근 개설 순, NEW 배지 기준 */
  createdAt: string;
  /** 로그인 사용자가 참여한 일정 */
  joined: boolean;
  /** 로그인 사용자가 개설한 일정 */
  mine: boolean;
};

const STORE_KEY = "mswSchedules.v5";
/** NEW 배지 기준(mock): 개설 후 24시간. 실제 기준은 서버가 정한다 */
const NEW_HOURS = 24;

/** 한국 날짜 기준 오늘 + offset일의 time 시각 (`YYYY-MM-DDTHH:mm:ss`) */
const dayAt = (offset: number, time: string) =>
  `${format(addDays(parseISO(toKstDate(new Date())), offset), "yyyy-MM-dd")}T${time}:00`;

/** 예시 일정 ID. 실제 일정 ID처럼 UUID 모양 문자열로 만든다 */
const mockScheduleId = (number: number) =>
  `01a1a2b3-0000-7000-8000-${String(number).padStart(12, "0")}`;

/** 활동 목록 (api-guide 응답 예시). 화면 기능 명세서 CRT-01 순서: 보드게임 / 방탈출 / 산책 */
export const MOCK_ACTIVITIES: Activity[] = [
  {
    id: "01a19cc6-3d80-7000-8000-000000000001",
    code: "BOARD_GAME",
    name: "보드게임",
  },
  {
    id: "01a19cc6-3d80-7000-8000-000000000002",
    code: "ESCAPE_ROOM",
    name: "방탈출",
  },
  { id: "01a19cc6-3d80-7000-8000-000000000003", code: "WALK", name: "산책" },
];
const ACTIVITIES = MOCK_ACTIVITIES.map(({ id, name }) => ({
  activityId: id,
  activityName: name,
}));
const REGIONS = [
  { regionCode: "11440", regionName: "마포구" },
  { regionCode: "11410", regionName: "서대문구" },
  { regionCode: "11200", regionName: "성동구" },
];
const TITLES = [
  "보드게임 추리 한 판",
  "퇴근 후 전략 게임",
  "주말 오후 파티 게임",
  "처음 만나는 협력 게임",
  "보드게임 입문 모임",
  "공포 테마 같이 깨요",
  "한강 저녁 산책",
  "마지막 열차의 증언",
];

function createSeed(): MockSchedule[] {
  const now = new Date().toISOString();
  // [더 보기]를 확인할 수 있게 모집 중 목록을 20개보다 많이 만든다
  const recruiting = Array.from({ length: 26 }, (_, index): MockSchedule => {
    const activity = ACTIVITIES[index % ACTIVITIES.length];
    const region = REGIONS[index % REGIONS.length];
    const capacity = 4 + (index % 3) * 2;
    const isFull = index % 7 === 2;
    return {
      scheduleId: mockScheduleId(1000 + index),
      ...activity,
      ...region,
      title: TITLES[index % TITLES.length],
      startAt: dayAt(Math.floor(index / 2), index % 2 ? "21:00" : "19:30"),
      placeName: `${region.regionName} 예시 장소 ${index + 1}`,
      participantCount: isFull ? capacity : 1 + (index % (capacity - 1)),
      capacity,
      status: isFull ? "CLOSED" : "RECRUITING",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      joined: false,
      mine: false,
    };
  });
  const joined: MockSchedule[] = [
    { ...recruiting[0], joined: true },
    { ...recruiting[10], joined: true },
    {
      ...recruiting[1],
      scheduleId: mockScheduleId(900),
      title: "지난주 보드게임 모임",
      startAt: dayAt(-6, "19:00"),
      status: "COMPLETED",
      participantCount: 4,
      capacity: 4,
      joined: true,
      createdAt: now,
    },
  ];
  const mine: MockSchedule[] = [
    {
      ...recruiting[5],
      scheduleId: mockScheduleId(901),
      title: "주말 오후 파티 게임",
      participantCount: 5,
      capacity: 5,
      status: "CLOSED",
      mine: true,
    },
  ];
  // 참여한 일정은 모집 중 목록의 같은 일정을 가리킨다
  return [
    ...recruiting.map((schedule) =>
      joined.some((item) => item.scheduleId === schedule.scheduleId)
        ? { ...schedule, joined: true }
        : schedule,
    ),
    joined[2],
    ...mine,
  ];
}

export function loadMockSchedules(): MockSchedule[] {
  try {
    const saved = sessionStorage.getItem(STORE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // 저장소를 못 쓰면 예시로 시작한다
  }
  const seed = createSeed();
  saveMockSchedules(seed);
  return seed;
}

export function saveMockSchedules(schedules: MockSchedule[]) {
  try {
    sessionStorage.setItem(STORE_KEY, JSON.stringify(schedules));
  } catch {
    // 저장소를 못 쓰면 이번 요청에만 반영된다
  }
}

const isUpcoming = (status: ScheduleStatus) =>
  status === "RECRUITING" || status === "CLOSED" || status === "IN_PROGRESS";

/**
 * 서버가 하는 상태 판정 흉내: 시작 시각이 지난 모집 중·모집 마감 일정은 활동 진행 중이다.
 * 완료 처리는 하지 않는다 (mock 전용)
 */
function withStartedStatus(schedule: MockSchedule, now: string): MockSchedule {
  const isOpen =
    schedule.status === "RECRUITING" || schedule.status === "CLOSED";
  return isOpen && schedule.startAt <= now
    ? { ...schedule, status: "IN_PROGRESS" }
    : schedule;
}

/** 모집 중 탭: 아직 시작하지 않은 모집 중·모집 마감 일정. 시작 빠른 순, 같으면 최근 개설 순 */
export function listRecruiting(filter: ScheduleFilter) {
  const now = toKstDateTime(new Date());
  return loadMockSchedules()
    .map((schedule) => withStartedStatus(schedule, now))
    .filter(
      (schedule) =>
        schedule.status === "RECRUITING" || schedule.status === "CLOSED",
    )
    .filter((schedule) => {
      const date = schedule.startAt.slice(0, 10);
      return (
        (!filter.activityId || schedule.activityId === filter.activityId) &&
        (!filter.regionCode ||
          schedule.regionCode.startsWith(filter.regionCode)) &&
        (!filter.startDate || date >= filter.startDate) &&
        (!filter.endDate || date <= filter.endDate) &&
        (!filter.startTime ||
          schedule.startAt.slice(11, 16) >= filter.startTime)
      );
    })
    .sort(
      (a, b) =>
        a.startAt.localeCompare(b.startAt) ||
        b.createdAt.localeCompare(a.createdAt),
    );
}

/** 참여한·개설한 탭: 진행 예정은 시작 빠른 순, 그 아래 지난 일정은 시작 최근 순 */
export function listMine(kind: "joined" | "mine") {
  const now = toKstDateTime(new Date());
  const schedules = loadMockSchedules()
    .filter((schedule) => schedule[kind])
    .map((schedule) => withStartedStatus(schedule, now));
  const upcoming = schedules
    .filter((schedule) => isUpcoming(schedule.status))
    .sort((a, b) => a.startAt.localeCompare(b.startAt));
  const past = schedules
    .filter((schedule) => !isUpcoming(schedule.status))
    .sort((a, b) => b.startAt.localeCompare(a.startAt));
  return [...upcoming, ...past];
}

/** 응답 모양으로 자른다. 저장소 전용 필드는 빼고 NEW 여부를 붙인다 */
export function toPage(schedules: MockSchedule[], page: number, size: number) {
  const start = page * size;
  return {
    schedules: schedules
      .slice(start, start + size)
      .map((schedule): ScheduleListItem => ({
        scheduleId: schedule.scheduleId,
        activityName: schedule.activityName,
        title: schedule.title,
        startAt: schedule.startAt,
        regionName: schedule.regionName,
        participantCount: schedule.participantCount,
        capacity: schedule.capacity,
        status: schedule.status,
        isNew:
          schedule.mine &&
          differenceInHours(new Date(), new Date(schedule.createdAt)) <
            NEW_HOURS,
      })),
    hasNext: start + size < schedules.length,
  };
}
