import { addDays, format, parseISO } from "date-fns";

import type { Gender } from "@/features/auth/types";
import type { Activity } from "@/features/schedule/api/activities";

import type {
  AgeGroup,
  ScheduleDetail,
  ScheduleParticipant,
} from "@/features/schedule/api/scheduleDetail";
import type {
  ScheduleListItem,
  SchedulePage,
} from "@/features/schedule/api/schedules";
import { toKstDate, toKstDateTime } from "@/features/schedule/lib/scheduleDate";
import type {
  AgeGroupPhase,
  ScheduleAction,
  ScheduleDuration,
  ScheduleStatus,
  ScheduleViewerRole,
} from "@/features/schedule/types";

// MSW 전용 일정 저장소. 응답 모양·판정은 snsg-be api-guide(develop e746440) 일정 절을 따른다
// 새로고침해도 남게 탭 단위 저장소에 두고, 날짜는 오늘 기준으로 만든 예시 일정으로 시작한다
// 일정 시각은 한국 시간이다. 기기 시간대와 상관없이 한국 날짜·시각으로 만들고 비교한다
// 상태·역할·누를 수 있는 동작·시간 겹침은 서버가 판정하는 값이라 여기(mock 서버)에서만 계산한다

/** mock 저장소의 참여자. 서버처럼 사용자 ID로 본인을 가린다 */
type MockParticipant = {
  userId: number;
  isHost: boolean;
  nickname: string;
  profileImageUrl: string;
  gender: Gender | null;
  ageGroup: AgeGroup | null;
  withdrawn: boolean;
};

/** mock 저장소의 일정. 목록 응답은 toPage, 상세 응답은 toDetail이 서버 모양으로 바꾼다 */
export type MockSchedule = {
  scheduleId: string;
  /** 활동 목록 API의 `id` */
  activityId: string;
  activityName: string;
  title: string;
  /** 한국 시간 `YYYY-MM-DDTHH:mm:ss` */
  startAt: string;
  regionName: string;
  /** 확정 인원 (개설자 포함) */
  participantCount: number;
  capacity: number;
  /** 저장한 상태. 시작·완료에 따른 표시 상태는 조회 때 판정한다(toDisplayStatus) */
  status: ScheduleStatus;
  /** 시·군·구 코드 5자리 */
  regionCode: string;
  placeName: string;
  roadAddress: string;
  /** 상세주소. 없으면 빈 문자열 */
  addressDetail: string;
  latitude: number;
  longitude: number;
  duration: ScheduleDuration;
  description: string;
  /** 개설자 포함 확정 참여자. 개설자가 맨 앞이고 그 뒤는 참여한 순서다 */
  participants: MockParticipant[];
  /** 개설 일시. 한국 시간 `YYYY-MM-DDTHH:mm:ss` (api-guide 목록 `createdAt`) */
  createdAt: string;
  /** 개설자가 취소한 일정의 사유·일시. 취소되지 않았으면 null */
  cancellation: { reason: string; canceledAt: string } | null;
  /** 로그인 사용자가 참여한 일정 */
  joined: boolean;
  /** 로그인 사용자가 개설한 일정 */
  mine: boolean;
};

const STORE_KEY = "mswSchedules.v8";
/** 일정의 점유 시간: 시작 시각부터 12시간 (정의서 v0.3 04 시간 겹침 제한) */
const OCCUPY_MS = 12 * 60 * 60 * 1000;
/** 일정 완료 = 시작 시각 + 12시간 (USER_FLOW §7.1) */
const COMPLETE_AFTER_MS = 12 * 60 * 60 * 1000;
/** 한국 시간 문자열 → 시각(ms) */
const occupyStart = (startAt: string) => Date.parse(`${startAt}+09:00`);

/** 한국 날짜 기준 오늘 + offset일의 time 시각 (`YYYY-MM-DDTHH:mm:ss`) */
const dayAt = (offset: number, time: string) =>
  `${format(addDays(parseISO(toKstDate(new Date())), offset), "yyyy-MM-dd")}T${time}:00`;

/** 글자 하나가 들어간 단색 프로필 사진 */
export const mockAvatar = (letter: string, color: string) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="${color}"/><text x="40" y="52" font-size="32" text-anchor="middle" fill="#fff" font-family="sans-serif">${letter}</text></svg>`,
  );

/** 서버 기본 프로필 사진 경로(도메인 없음). 사진이 없거나 탈퇴한 사용자에게 준다. 이미지는 handlers가 응답한다 */
export const DEFAULT_PROFILE_IMAGE_PATH = "/images/default-profile.png";

const ageGroup = (decade: number, phase: AgeGroupPhase): AgeGroup => ({
  decade,
  phase,
});

/** 로그인 사용자(mock). 닉네임은 가입 mock의 카카오 닉네임과 같다 */
const ME: MockParticipant = {
  userId: 1,
  isHost: false,
  nickname: "딸기스무디",
  profileImageUrl: mockAvatar("딸", "#578627"),
  gender: "MALE",
  ageGroup: ageGroup(20, "LATE"),
  withdrawn: false,
};

/** 다른 사용자. 앞 사람이 개설자가 된다 */
const OTHERS: MockParticipant[] = (
  [
    ["민트초코", "FEMALE", ageGroup(20, "LATE"), mockAvatar("민", "#2f9e8f")],
    ["하늘", "FEMALE", ageGroup(30, "EARLY"), mockAvatar("하", "#4c7bd9")],
    ["밤양갱", "MALE", ageGroup(20, "LATE"), null],
    ["구름", "MALE", ageGroup(30, "EARLY"), mockAvatar("구", "#8a8f98")],
    ["라떼", "FEMALE", ageGroup(20, "MID"), mockAvatar("라", "#a0703c")],
    ["솜사탕", "FEMALE", ageGroup(30, "MID"), null],
    ["도토리", "MALE", ageGroup(20, "EARLY"), mockAvatar("도", "#c2410c")],
    ["바닐라", "MALE", ageGroup(30, "LATE"), null],
  ] satisfies [string, Gender, AgeGroup, string | null][]
).map(([nickname, gender, age, image], index) => ({
  userId: 100 + index,
  isHost: false,
  nickname,
  profileImageUrl: image ?? DEFAULT_PROFILE_IMAGE_PATH,
  gender,
  ageGroup: age,
  withdrawn: false,
}));

/** 다른 사용자가 쓰는 닉네임 (닉네임 중복 판정용) */
export const mockOtherNicknames = () => OTHERS.map(({ nickname }) => nickname);

/** 탈퇴한 참여자: 닉네임·사진은 서버 기본값, 연령대 null, 성별은 그대로 (api-guide 참여자 명단) */
const WITHDRAWN: MockParticipant = {
  userId: 199,
  isHost: false,
  nickname: "탈퇴한 사용자",
  profileImageUrl: DEFAULT_PROFILE_IMAGE_PATH,
  gender: "MALE",
  ageGroup: null,
  withdrawn: true,
};

/** 개설자를 맨 앞에 두고 count명이 되도록 다른 사용자를 채운다 */
function makeParticipants(
  count: number,
  {
    host = OTHERS[0],
    withMe = false,
    extra = [],
    offset = 0,
  }: {
    host?: MockParticipant;
    withMe?: boolean;
    extra?: MockParticipant[];
    offset?: number;
  } = {},
): MockParticipant[] {
  const fixed = [...(withMe && host !== ME ? [ME] : []), ...extra];
  const pool = OTHERS.filter((user) => user !== host);
  const others = Array.from(
    { length: Math.max(0, count - 1 - fixed.length) },
    (_, index) => pool[(index + offset) % pool.length],
  );
  return [{ ...host, isHost: true }, ...fixed, ...others];
}

/** 예시 일정 ID. 실제 일정 ID처럼 UUID 모양 문자열로 만든다. 끝자리 번호로 어떤 예시인지 알아볼 수 있다 */
export const mockScheduleId = (number: number) =>
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
  {
    regionCode: "11440",
    regionName: "마포구",
    latitude: 37.5563,
    longitude: 126.9236,
  },
  {
    regionCode: "11410",
    regionName: "서대문구",
    latitude: 37.5579,
    longitude: 126.9368,
  },
  {
    regionCode: "11200",
    regionName: "성동구",
    latitude: 37.5446,
    longitude: 127.0559,
  },
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
const DESCRIPTION =
  "처음 오셔도 괜찮아요. 규칙은 시작 전에 같이 읽어요.\n음료는 각자 주문해요.";

/** 시안·결정 확인용 예시 일정 ID (상세 화면에서 바로 열어 본다) */
export const SAMPLE_SCHEDULE_IDS = {
  /** 모집 중, 나는 미참여, 참여자 5명(아바타 최대 4개) */
  recruiting: mockScheduleId(101),
  /** 모집 마감 6/6, 나는 미참여 */
  closed: mockScheduleId(102),
  /** 내가 확정 참여, 모집 중 */
  joined: mockScheduleId(103),
  /** 내가 개설, 모집 중 */
  mine: mockScheduleId(104),
  /** 일정 취소됨 (내가 개설). 참여자 기록·인원은 그대로 남는다 */
  canceled: mockScheduleId(105),
  /** 일정 완료, 내가 참여, 명단에 탈퇴한 사용자 */
  completed: mockScheduleId(106),
  /** 시작 후 완료 전(모집 마감), 내가 참여: 참여 취소는 아직 된다 */
  started: mockScheduleId(107),
  /** 화면엔 모집 중 5/6이지만 참여하면 다른 사람이 먼저 채워 409 RECRUIT_CLOSED */
  lastSeatTaken: mockScheduleId(108),
  /** 모집 중, 내가 참여한 103과 시간이 겹쳐 참여하면 409 SCHEDULE_TIME_CONFLICT */
  timeConflict: mockScheduleId(109),
  /** 시작 후 완료 전(모집 마감), 내가 개설: 일정 전체 취소가 비활성 */
  hostStarted: mockScheduleId(110),
} as const;

function createSamples(base: MockSchedule): MockSchedule[] {
  const sample = (
    scheduleId: string,
    overrides: Partial<MockSchedule> & { participants: MockParticipant[] },
  ): MockSchedule => ({
    ...base,
    scheduleId,
    participantCount: overrides.participants.length,
    ...overrides,
  });
  const ids = SAMPLE_SCHEDULE_IDS;
  return [
    sample(ids.recruiting, {
      title: "보드게임 추리 한 판",
      startAt: dayAt(3, "19:30"),
      capacity: 6,
      participants: makeParticipants(5),
    }),
    sample(ids.closed, {
      title: "마감된 보드게임 모임",
      startAt: dayAt(2, "19:30"),
      capacity: 6,
      status: "RECRUITMENT_CLOSED",
      participants: makeParticipants(6, { offset: 1 }),
    }),
    sample(ids.joined, {
      title: "내가 참여한 보드게임",
      startAt: dayAt(4, "19:30"),
      capacity: 6,
      joined: true,
      participants: makeParticipants(4, { withMe: true }),
    }),
    sample(ids.mine, {
      title: "내가 연 보드게임",
      startAt: dayAt(6, "19:30"),
      capacity: 6,
      mine: true,
      participants: makeParticipants(3, { host: ME }),
    }),
    sample(ids.canceled, {
      title: "취소된 보드게임",
      startAt: dayAt(7, "19:30"),
      capacity: 6,
      status: "CANCELED",
      mine: true,
      // 전체 취소해도 참여 기록·확정 인원은 그대로 남는다 (api-guide 일정 전체 취소)
      participants: makeParticipants(4, { host: ME }),
      cancellation: {
        reason: "개인 사정으로 일정을 취소하게 됐어요. 죄송해요.",
        canceledAt: toKstDateTime(new Date(Date.now() - 60 * 60 * 1000)),
      },
    }),
    sample(ids.completed, {
      title: "지난 보드게임 모임",
      startAt: dayAt(-3, "19:30"),
      capacity: 6,
      status: "COMPLETED",
      joined: true,
      participants: makeParticipants(5, {
        withMe: true,
        extra: [WITHDRAWN],
        offset: 2,
      }),
    }),
    sample(ids.started, {
      title: "지금 진행 중인 보드게임",
      // 시작 시각이 지났고 완료 전 → 조회 때 모집 마감으로 온다
      startAt: toKstDateTime(new Date(Date.now() - 60 * 60 * 1000)),
      capacity: 4,
      status: "RECRUITMENT_CLOSED",
      joined: true,
      participants: makeParticipants(4, { withMe: true, offset: 3 }),
    }),
    sample(ids.lastSeatTaken, {
      title: "마지막 한 자리",
      startAt: dayAt(3, "14:00"),
      capacity: 6,
      participants: makeParticipants(5, { offset: 4 }),
    }),
    sample(ids.timeConflict, {
      title: "시간이 겹치는 보드게임",
      startAt: dayAt(4, "21:00"),
      capacity: 6,
      participants: makeParticipants(2, { offset: 5 }),
    }),
    sample(ids.hostStarted, {
      title: "내가 연 진행 중인 모임",
      startAt: toKstDateTime(new Date(Date.now() - 2 * 60 * 60 * 1000)),
      capacity: 4,
      mine: true,
      participants: makeParticipants(3, { host: ME, offset: 2 }),
    }),
  ];
}

function createSeed(): MockSchedule[] {
  const now = toKstDateTime(new Date());
  // [더 보기]를 확인할 수 있게 모집 중 목록을 20개보다 많이 만든다
  const recruiting = Array.from({ length: 26 }, (_, index): MockSchedule => {
    const activity = ACTIVITIES[index % ACTIVITIES.length];
    const { latitude, longitude, ...region } = REGIONS[index % REGIONS.length];
    const capacity = 4 + (index % 3) * 2;
    const isFull = index % 7 === 2;
    const participantCount = isFull ? capacity : 1 + (index % (capacity - 1));
    return {
      scheduleId: mockScheduleId(1000 + index),
      ...activity,
      ...region,
      title: TITLES[index % TITLES.length],
      startAt: dayAt(Math.floor(index / 2), index % 2 ? "21:00" : "19:30"),
      placeName: `${region.regionName} 예시 장소 ${index + 1}`,
      roadAddress: `서울 ${region.regionName} 예시로 ${index + 1}`,
      addressDetail: index % 2 ? "2층" : "",
      latitude,
      longitude,
      duration: "NORMAL",
      description: DESCRIPTION,
      participantCount,
      capacity,
      status: isFull ? "RECRUITMENT_CLOSED" : "RECRUITING",
      participants: makeParticipants(participantCount, { offset: index }),
      createdAt: toKstDateTime(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)),
      cancellation: null,
      joined: false,
      mine: false,
    };
  });
  const join = (schedule: MockSchedule, offset: number): MockSchedule => {
    const participants = makeParticipants(schedule.participantCount, {
      withMe: true,
      offset,
    });
    return { ...schedule, participants, joined: true };
  };
  const completed: MockSchedule = {
    ...join({ ...recruiting[1], participantCount: 4 }, 1),
    scheduleId: mockScheduleId(900),
    title: "지난주 보드게임 모임",
    startAt: dayAt(-6, "19:00"),
    status: "COMPLETED",
    capacity: 4,
    createdAt: now,
  };
  const mine: MockSchedule = {
    ...recruiting[5],
    scheduleId: mockScheduleId(901),
    title: "주말 오후 파티 게임",
    participantCount: 5,
    capacity: 5,
    status: "RECRUITMENT_CLOSED",
    participants: makeParticipants(5, { host: ME }),
    mine: true,
  };
  // 참여한 일정은 모집 중 목록의 같은 일정을 가리킨다
  return [
    ...recruiting.map((schedule, index) =>
      index === 0 || index === 10 ? join(schedule, index) : schedule,
    ),
    completed,
    mine,
    ...createSamples({
      ...recruiting[0],
      placeName: "보드게임카페 A",
      roadAddress: "서울 마포구 와우산로 00",
      addressDetail: "3층",
      createdAt: now,
    }),
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

/** 개설 요청으로 저장할 때 개설자 = 로그인 사용자 1명 (USER_FLOW §7.7) */
export const mockHostParticipants = () => makeParticipants(1, { host: ME });

/**
 * 서버가 하는 표시 상태 판정 흉내 (api-guide 일정 상세 `displayStatus`):
 * 취소됨 > 완료(시작 + 12시간) > 시작 후 모집 마감 > 저장한 상태
 */
function toDisplayStatus(
  schedule: MockSchedule,
  now = Date.now(),
): ScheduleStatus {
  if (schedule.status === "CANCELED") return "CANCELED";
  const start = occupyStart(schedule.startAt);
  if (schedule.status === "COMPLETED" || start + COMPLETE_AFTER_MS <= now) {
    return "COMPLETED";
  }
  if (start <= now) return "RECRUITMENT_CLOSED";
  return schedule.status;
}

const hasStarted = (schedule: MockSchedule) =>
  occupyStart(schedule.startAt) <= Date.now();

/** 목록 정렬: 시작 빠른 순, 같으면 일정 id 순 (api-guide 일정 목록) */
const byStartAt = (a: MockSchedule, b: MockSchedule) =>
  a.startAt.localeCompare(b.startAt) ||
  a.scheduleId.localeCompare(b.scheduleId);

/** 모집 중 목록의 거르기 조건. 날짜는 이미 하루·기간으로 맞춘 값이다 */
export type MockRecruitingQuery = {
  categoryIds: string[];
  regionCodes: string[];
  startDate?: string;
  endDate?: string;
};

/** 모집 중 탭: 시작 전이고 취소되지 않은 일정. 정원이 찬 일정은 모집 마감으로 함께 온다 */
export function listRecruiting(query: MockRecruitingQuery) {
  const now = toKstDateTime(new Date());
  return loadMockSchedules()
    .filter(
      (schedule) =>
        (schedule.status === "RECRUITING" ||
          schedule.status === "RECRUITMENT_CLOSED") &&
        schedule.startAt > now,
    )
    .filter((schedule) => {
      const date = schedule.startAt.slice(0, 10);
      return (
        (!query.categoryIds.length ||
          query.categoryIds.includes(schedule.activityId)) &&
        (!query.regionCodes.length ||
          query.regionCodes.includes(schedule.regionCode)) &&
        (!query.startDate || date >= query.startDate) &&
        (!query.endDate || date <= query.endDate)
      );
    })
    .sort(byStartAt);
}

/**
 * 참여한·개설한 탭: 완료(시작 + 12시간) 전 일정. 시작했지만 완료 전이면 모집 마감으로,
 * 취소된 일정은 완료 시각 전까지 일정 취소됨으로 온다 (api-guide 일정 목록)
 */
export function listMine(kind: "joined" | "mine") {
  const now = Date.now();
  return loadMockSchedules()
    .filter(
      (schedule) =>
        schedule[kind] &&
        schedule.status !== "COMPLETED" &&
        occupyStart(schedule.startAt) + COMPLETE_AFTER_MS > now,
    )
    .map((schedule): MockSchedule =>
      schedule.status === "CANCELED" || occupyStart(schedule.startAt) > now
        ? schedule
        : { ...schedule, status: "RECRUITMENT_CLOSED" },
    )
    .sort(byStartAt);
}

/** 탈퇴를 막는 일정 판정의 기준: 마지막 일정 시작 시각 + 24시간 (USER_FLOW §4.5) */
const WITHDRAW_BLOCK_MS = 24 * 60 * 60 * 1000;

/**
 * 서버가 하는 탈퇴 가능 판정 흉내 (api-guide 탈퇴, mock 전용): 내가 참여·개설한 일정 중 취소되지 않았고
 * 시작 시각 + 24시간이 아직 지나지 않은 일정이 있으면, 그중 가장 늦은 시작 + 24시간(한국 시간)을 돌려준다. 없으면 null
 */
export function getMockWithdrawalAvailableAt() {
  const now = Date.now();
  const blockedUntil = loadMockSchedules()
    .filter(
      (schedule) =>
        (schedule.joined || schedule.mine) && schedule.status !== "CANCELED",
    )
    .map(
      (schedule) => Date.parse(`${schedule.startAt}+09:00`) + WITHDRAW_BLOCK_MS,
    )
    .filter((until) => until > now);
  return blockedUntil.length > 0
    ? toKstDateTime(new Date(Math.max(...blockedUntil)))
    : null;
}

/** 커서 = 다음 페이지가 시작하는 위치. 서버처럼 불투명한 문자열로 보이게 base64url로 감싼다 (mock 전용) */
const CURSOR_PREFIX = "next:";

const encodeCursor = (start: number) =>
  btoa(`${CURSOR_PREFIX}${start}`)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

/** 해석할 수 없으면 null (400 INVALID_CURSOR) */
function decodeCursor(cursor: string) {
  try {
    const text = atob(cursor.replace(/-/g, "+").replace(/_/g, "/"));
    const match = /^next:(\d+)$/.exec(text);
    return match ? Number(match[1]) : null;
  } catch {
    return null;
  }
}

/** 응답 모양으로 자른다. cursor가 없으면 처음부터. 커서를 해석할 수 없으면 null */
export function toPage(
  schedules: MockSchedule[],
  cursor: string | undefined,
  size: number,
): SchedulePage | null {
  const start = cursor ? decodeCursor(cursor) : 0;
  if (start === null) return null;
  const end = start + size;
  return {
    items: schedules.slice(start, end).map((schedule): ScheduleListItem => ({
      id: schedule.scheduleId,
      category: { id: schedule.activityId, name: schedule.activityName },
      title: schedule.title,
      regionName: schedule.regionName,
      startAt: schedule.startAt,
      confirmedCount: schedule.participantCount,
      capacity: schedule.capacity,
      remainingSeats: schedule.capacity - schedule.participantCount,
      displayStatus: schedule.status,
      createdAt: schedule.createdAt,
    })),
    nextCursor: end < schedules.length ? encodeCursor(end) : null,
  };
}

// ---- 일정 상세·참여 (mock 서버 판정, api-guide 일정 상세~일정 전체 취소) ----

/** 저장된 일정. 없으면 undefined (404) */
export function findMockSchedule(scheduleId: string) {
  return loadMockSchedules().find((item) => item.scheduleId === scheduleId);
}

/** 보는 사람의 역할. 토큰이 없으면 조회자 */
export function getViewerRole(
  schedule: MockSchedule,
  loggedIn: boolean,
): ScheduleViewerRole {
  if (!loggedIn) return "GUEST";
  if (schedule.mine) return "HOST";
  return schedule.joined ? "PARTICIPANT" : "NON_PARTICIPANT";
}

/** 역할·상태별로 누를 수 있는 동작 (api-guide 일정 상세 역할·상태별 표) */
function getAvailableActions(
  schedule: MockSchedule,
  role: ScheduleViewerRole,
): ScheduleAction[] {
  const status = toDisplayStatus(schedule);
  const isOpen = status === "RECRUITING" || status === "RECRUITMENT_CLOSED";
  switch (role) {
    case "GUEST":
      return status === "RECRUITING" ? ["LOGIN_TO_JOIN"] : [];
    case "NON_PARTICIPANT":
      return status === "RECRUITING" ? ["JOIN"] : [];
    case "PARTICIPANT":
      return isOpen ? ["CANCEL_PARTICIPATION"] : [];
    case "HOST":
      return isOpen && !hasStarted(schedule) ? ["CANCEL_SCHEDULE"] : [];
  }
}

/** 연령대 비교: 십의 자리, 같으면 초반 < 중반 < 후반 */
const PHASE_ORDER: AgeGroupPhase[] = ["EARLY", "MID", "LATE"];
const ageRank = ({ decade, phase }: AgeGroup) =>
  decade * 10 + PHASE_ORDER.indexOf(phase);

/** 상세 응답. 화면 타입에 없는 `cancellation`도 서버처럼 담는다 */
export function toDetail(
  schedule: MockSchedule,
  viewerRole: ScheduleViewerRole,
): ScheduleDetail & { cancellation: MockSchedule["cancellation"] } {
  const host = schedule.participants.find((item) => item.isHost) ?? WITHDRAWN;
  const ages = schedule.participants
    .flatMap((item) =>
      item.withdrawn || !item.ageGroup ? [] : [item.ageGroup],
    )
    .sort((a, b) => ageRank(a) - ageRank(b));
  return {
    id: schedule.scheduleId,
    title: schedule.title,
    description: schedule.description,
    startAt: schedule.startAt,
    createdAt: schedule.createdAt,
    durationType: schedule.duration,
    category: { id: schedule.activityId, name: schedule.activityName },
    host: {
      nickname: host.nickname,
      profileImageUrl: host.profileImageUrl,
      withdrawn: host.withdrawn,
    },
    confirmedCount: schedule.participantCount,
    capacity: schedule.capacity,
    remainingSeats: schedule.capacity - schedule.participantCount,
    participantSummary: {
      count: schedule.participantCount,
      // 탈퇴한 참여자도 성별대로 센다
      maleCount: schedule.participants.filter((item) => item.gender === "MALE")
        .length,
      femaleCount: schedule.participants.filter(
        (item) => item.gender === "FEMALE",
      ).length,
      minAgeGroup: ages[0] ?? null,
      maxAgeGroup: ages[ages.length - 1] ?? null,
    },
    place: {
      name: schedule.placeName,
      roadAddress: schedule.roadAddress,
      addressDetail: schedule.addressDetail,
      latitude: schedule.latitude,
      longitude: schedule.longitude,
      regionName: schedule.regionName,
    },
    displayStatus: toDisplayStatus(schedule),
    viewerRole,
    availableActions: getAvailableActions(schedule, viewerRole),
    cancellation: schedule.cancellation,
  };
}

/** 참여자 명단 응답. 개설자 맨 앞, 그 뒤 참여한 순서 */
export const toParticipants = (schedule: MockSchedule): ScheduleParticipant[] =>
  schedule.participants.map(({ userId, ...participant }) => ({
    ...participant,
    isMe: userId === ME.userId,
  }));

/** mock 서버의 거부 사유. 핸들러가 상태 코드·message로 바꾼다. 값은 서버 code 그대로 */
export type MockRejection =
  | "SCHEDULE_NOT_FOUND"
  | "HOST_CANNOT_JOIN"
  | "ALREADY_JOINED"
  | "RECRUIT_CLOSED"
  | "SCHEDULE_TIME_CONFLICT"
  | "HOST_CANNOT_LEAVE"
  | "NOT_PARTICIPANT"
  | "PARTICIPATION_NOT_CANCELABLE"
  | "NOT_HOST"
  | "SCHEDULE_NOT_CANCELABLE";

function updateSchedule(
  scheduleId: string,
  update: (schedule: MockSchedule) => MockSchedule,
) {
  saveMockSchedules(
    loadMockSchedules().map((item) =>
      item.scheduleId === scheduleId ? update(item) : item,
    ),
  );
}

/** 내가 개설했거나 참여 확정한 예정 일정 중 시작 시각이 12시간 미만으로 떨어진 것이 있는지. 취소된 일정은 빠진다 */
function hasTimeConflict(target: MockSchedule) {
  return loadMockSchedules().some(
    (item) =>
      item.scheduleId !== target.scheduleId &&
      (item.joined || item.mine) &&
      item.status !== "CANCELED" &&
      toDisplayStatus(item) !== "COMPLETED" &&
      Math.abs(occupyStart(item.startAt) - occupyStart(target.startAt)) <
        OCCUPY_MS,
  );
}

/** 참여: 즉시 확정. 정원이 차면 모집 마감. 거부 순서는 api-guide 참여 */
export function joinMockSchedule(scheduleId: string): MockRejection | null {
  const schedule = findMockSchedule(scheduleId);
  if (!schedule) return "SCHEDULE_NOT_FOUND";
  if (schedule.mine) return "HOST_CANNOT_JOIN";
  if (schedule.joined) return "ALREADY_JOINED";
  if (scheduleId === SAMPLE_SCHEDULE_IDS.lastSeatTaken) {
    // 다른 사람이 마지막 자리를 먼저 차지한 상황을 흉내 낸다 → 최신 상태(모집 마감)로 다시 그려지는지 확인
    updateSchedule(scheduleId, (item) => ({
      ...item,
      participants: makeParticipants(item.capacity, { offset: 4 }),
      participantCount: item.capacity,
      status: "RECRUITMENT_CLOSED",
    }));
    return "RECRUIT_CLOSED";
  }
  if (
    toDisplayStatus(schedule) !== "RECRUITING" ||
    schedule.participantCount >= schedule.capacity
  ) {
    return "RECRUIT_CLOSED";
  }
  if (hasTimeConflict(schedule)) return "SCHEDULE_TIME_CONFLICT";
  updateSchedule(scheduleId, (item) => {
    const participantCount = item.participantCount + 1;
    return {
      ...item,
      participants: [...item.participants, ME],
      participantCount,
      status:
        participantCount >= item.capacity ? "RECRUITMENT_CLOSED" : item.status,
      joined: true,
    };
  });
  return null;
}

/**
 * 참여 취소: 완료 전까지 된다. 시작 전에 취소하면 모집이 다시 열리고, 시작 후 취소는 다시 열지 않는다.
 * 거부 순서는 api-guide 참여 취소
 */
export function leaveMockSchedule(scheduleId: string): MockRejection | null {
  const schedule = findMockSchedule(scheduleId);
  if (!schedule) return "SCHEDULE_NOT_FOUND";
  if (schedule.mine) return "HOST_CANNOT_LEAVE";
  if (!schedule.joined) return "NOT_PARTICIPANT";
  const status = toDisplayStatus(schedule);
  if (status === "CANCELED" || status === "COMPLETED") {
    return "PARTICIPATION_NOT_CANCELABLE";
  }
  updateSchedule(scheduleId, (item) => ({
    ...item,
    participants: item.participants.filter(
      (participant) => participant.userId !== ME.userId,
    ),
    participantCount: item.participantCount - 1,
    status: hasStarted(item) ? item.status : "RECRUITING",
    joined: false,
  }));
  return null;
}

/**
 * 일정 전체 취소(개설자): 취소·완료되지 않았고 시작 전일 때만. 참여 기록·확정 인원은 그대로 둔다.
 * 거부 순서는 api-guide 일정 전체 취소
 */
export function cancelMockSchedule(
  scheduleId: string,
  reason: string,
): MockRejection | null {
  const schedule = findMockSchedule(scheduleId);
  if (!schedule) return "SCHEDULE_NOT_FOUND";
  if (!schedule.mine) return "NOT_HOST";
  const status = toDisplayStatus(schedule);
  if (
    (status !== "RECRUITING" && status !== "RECRUITMENT_CLOSED") ||
    hasStarted(schedule)
  ) {
    return "SCHEDULE_NOT_CANCELABLE";
  }
  updateSchedule(scheduleId, (item) => ({
    ...item,
    status: "CANCELED",
    cancellation: { reason, canceledAt: toKstDateTime(new Date()) },
  }));
  return null;
}
