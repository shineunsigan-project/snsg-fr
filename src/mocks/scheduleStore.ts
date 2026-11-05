import { addDays, differenceInHours, format, parseISO } from "date-fns";

import type { Activity } from "@/features/schedule/api/activities";

import type {
  ScheduleDetail,
  ScheduleParticipant,
} from "@/features/schedule/api/scheduleDetail";
import type {
  ScheduleFilter,
  ScheduleListItem,
} from "@/features/schedule/api/schedules";
import { toKstDate, toKstDateTime } from "@/features/schedule/lib/scheduleDate";
import type {
  ScheduleDuration,
  ScheduleStatus,
  ScheduleViewerRole,
} from "@/features/schedule/types";

// MSW 전용 일정 저장소. TODO(API): 일정 API가 생기면 지운다
// 새로고침해도 남게 탭 단위 저장소에 두고, 날짜는 오늘 기준으로 만든 예시 일정으로 시작한다
// 일정 시각은 한국 시간이다. 기기 시간대와 상관없이 한국 날짜·시각으로 만들고 비교한다
// 상태·역할·시간 겹침은 서버가 판정하는 값이라 여기(mock 서버)에서만 계산한다

export type MockSchedule = ScheduleListItem & {
  /** 활동 목록 API의 `id` */
  activityId: string;
  /** 시·군·구 코드 5자리 */
  regionCode: string;
  placeName: string;
  roadAddress: string;
  latitude: number;
  longitude: number;
  duration: ScheduleDuration;
  description: string;
  /** 개설자 포함 확정 참여자. 개설자가 맨 앞이다 */
  participants: ScheduleParticipant[];
  /** 개설 일시 (ISO). 같은 시작 시간이면 최근 개설 순, NEW 배지 기준 */
  createdAt: string;
  /** 로그인 사용자가 참여한 일정 */
  joined: boolean;
  /** 로그인 사용자가 개설한 일정 */
  mine: boolean;
};

const STORE_KEY = "mswSchedules.v6";
/** NEW 배지 기준(mock): 개설 후 24시간. 실제 기준은 서버가 정한다 */
const NEW_HOURS = 24;
/** 일정의 점유 시간: 시작 시각부터 12시간 (정의서 v0.3 04 시간 겹침 제한) */
const OCCUPY_MS = 12 * 60 * 60 * 1000;

/** 한국 날짜 기준 오늘 + offset일의 time 시각 (`YYYY-MM-DDTHH:mm:ss`) */
const dayAt = (offset: number, time: string) =>
  `${format(addDays(parseISO(toKstDate(new Date())), offset), "yyyy-MM-dd")}T${time}:00`;

/** 글자 하나가 들어간 단색 프로필 사진 */
export const mockAvatar = (letter: string, color: string) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="${color}"/><text x="40" y="52" font-size="32" text-anchor="middle" fill="#fff" font-family="sans-serif">${letter}</text></svg>`,
  );

type ActiveParticipant = Extract<ScheduleParticipant, { isWithdrawn: false }>;

/** 로그인 사용자(mock). 닉네임은 가입 mock의 카카오 닉네임과 같다 */
const ME: ActiveParticipant = {
  userId: 1,
  isHost: false,
  isWithdrawn: false,
  nickname: "딸기스무디",
  profileImageUrl: mockAvatar("딸", "#578627"),
  gender: "MALE",
  ageGroup: "20대 후반",
};

/** 다른 사용자. 앞 사람이 개설자가 된다 */
const OTHERS: ActiveParticipant[] = [
  ["민트초코", "FEMALE", "20대 후반", mockAvatar("민", "#2f9e8f")],
  ["하늘", "FEMALE", "30대 초반", mockAvatar("하", "#4c7bd9")],
  ["밤양갱", "MALE", "20대 후반", null],
  ["구름", "MALE", "30대 초반", mockAvatar("구", "#8a8f98")],
  ["라떼", "FEMALE", "20대 중반", mockAvatar("라", "#a0703c")],
  ["솜사탕", "FEMALE", "30대 중반", null],
  ["도토리", "MALE", "20대 초반", mockAvatar("도", "#c2410c")],
  ["바닐라", "MALE", "30대 후반", null],
].map(
  (
    [nickname, gender, ageGroup, profileImageUrl],
    index,
  ): ActiveParticipant => ({
    userId: 100 + index,
    isHost: false,
    isWithdrawn: false,
    nickname: nickname ?? "",
    profileImageUrl,
    gender: gender === "MALE" ? "MALE" : "FEMALE",
    ageGroup: ageGroup ?? "",
  }),
);

const WITHDRAWN: ScheduleParticipant = {
  userId: 199,
  isHost: false,
  isWithdrawn: true,
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
    host?: ActiveParticipant;
    withMe?: boolean;
    extra?: ScheduleParticipant[];
    offset?: number;
  } = {},
): ScheduleParticipant[] {
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
  /** 일정 취소됨 (내가 개설) */
  canceled: mockScheduleId(105),
  /** 일정 완료, 내가 참여, 명단에 탈퇴한 사용자 */
  completed: mockScheduleId(106),
  /** 활동 진행 중, 내가 참여 */
  inProgress: mockScheduleId(107),
  /** 화면엔 모집 중 5/6이지만 참여하면 다른 사람이 먼저 채워 409 RECRUIT_CLOSED */
  lastSeatTaken: mockScheduleId(108),
  /** 모집 중, 내가 참여한 103과 시간이 겹쳐 참여하면 409 SCHEDULE_TIME_CONFLICT */
  timeConflict: mockScheduleId(109),
} as const;

function createSamples(base: MockSchedule): MockSchedule[] {
  const sample = (
    scheduleId: string,
    overrides: Partial<MockSchedule> & { participants: ScheduleParticipant[] },
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
      status: "CLOSED",
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
      // 전체 취소하면 확정 참여자는 모두 미참여자가 되고 개설자만 남는다
      participants: makeParticipants(1, { host: ME }),
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
    sample(ids.inProgress, {
      title: "지금 진행 중인 보드게임",
      // 시작 시각이 지난 모집 마감 일정 → 조회 때 활동 진행 중으로 바뀐다
      startAt: toKstDateTime(new Date(Date.now() - 60 * 60 * 1000)),
      capacity: 4,
      status: "CLOSED",
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
  ];
}

function createSeed(): MockSchedule[] {
  const now = new Date().toISOString();
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
      latitude,
      longitude,
      duration: "NORMAL",
      description: DESCRIPTION,
      participantCount,
      capacity,
      status: isFull ? "CLOSED" : "RECRUITING",
      participants: makeParticipants(participantCount, { offset: index }),
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
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
    status: "CLOSED",
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

// ---- 일정 상세·참여 (mock 서버 판정) ----

/** 상태를 판정한 일정. 없으면 undefined (404) */
export function findMockSchedule(scheduleId: string) {
  const schedule = loadMockSchedules().find(
    (item) => item.scheduleId === scheduleId,
  );
  return schedule && withStartedStatus(schedule, toKstDateTime(new Date()));
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

/** `20대 후반` → 정렬용 숫자 */
const ageRank = (ageGroup: string) =>
  parseInt(ageGroup, 10) * 10 +
  ["초반", "중반", "후반"].findIndex((part) => ageGroup.endsWith(part));

export function toDetail(
  schedule: MockSchedule,
  viewerRole: ScheduleViewerRole,
): ScheduleDetail {
  const host = schedule.participants.find((item) => item.isHost);
  const active = schedule.participants.filter(
    (item): item is ActiveParticipant => !item.isWithdrawn,
  );
  const ages = active
    .map((item) => item.ageGroup)
    .sort((a, b) => ageRank(a) - ageRank(b));
  return {
    scheduleId: schedule.scheduleId,
    status: schedule.status,
    viewerRole,
    activityName: schedule.activityName,
    title: schedule.title,
    host: {
      nickname: host && !host.isWithdrawn ? host.nickname : "탈퇴한 사용자",
      profileImageUrl: host && !host.isWithdrawn ? host.profileImageUrl : null,
    },
    startAt: schedule.startAt,
    duration: schedule.duration,
    participantCount: schedule.participantCount,
    capacity: schedule.capacity,
    description: schedule.description,
    participantSummary: {
      maleCount: active.filter((item) => item.gender === "MALE").length,
      femaleCount: active.filter((item) => item.gender === "FEMALE").length,
      ageGroupRange: ages.length
        ? { youngest: ages[0], oldest: ages[ages.length - 1] }
        : null,
      profileImageUrls: schedule.participants.map((item) =>
        item.isWithdrawn ? null : item.profileImageUrl,
      ),
    },
    place: {
      name: schedule.placeName,
      roadAddress: schedule.roadAddress,
      latitude: schedule.latitude,
      longitude: schedule.longitude,
    },
  };
}

/** mock 서버의 거부 사유. 핸들러가 상태 코드·code로 바꾼다 */
export type MockRejection =
  | "NOT_FOUND"
  | "RECRUIT_CLOSED"
  | "SCHEDULE_TIME_CONFLICT"
  /** TODO(API): 아래는 백엔드 code가 없다 */
  | "FORBIDDEN"
  | "NOT_ALLOWED";

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

const occupyStart = (startAt: string) => Date.parse(`${startAt}+09:00`);

/** 내가 확정 참여자·개설자인 진행 예정 일정 중 점유 시간이 겹치는 것이 있는지 (정의서 v0.3 04) */
function hasTimeConflict(target: MockSchedule) {
  const now = toKstDateTime(new Date());
  return loadMockSchedules()
    .map((item) => withStartedStatus(item, now))
    .some(
      (item) =>
        item.scheduleId !== target.scheduleId &&
        (item.joined || item.mine) &&
        isUpcoming(item.status) &&
        Math.abs(occupyStart(item.startAt) - occupyStart(target.startAt)) <
          OCCUPY_MS,
    );
}

/** 참여: 즉시 확정. 정원이 차면 모집 마감 */
export function joinMockSchedule(scheduleId: string): MockRejection | null {
  const schedule = findMockSchedule(scheduleId);
  if (!schedule) return "NOT_FOUND";
  // 개설자 본인·이미 참여 중은 거부한다 (정의서 v0.3 04 참여)
  if (schedule.mine || schedule.joined) return "NOT_ALLOWED";
  if (scheduleId === SAMPLE_SCHEDULE_IDS.lastSeatTaken) {
    // 다른 사람이 마지막 자리를 먼저 차지한 상황을 흉내 낸다 → 최신 상태(모집 마감)로 다시 그려지는지 확인
    updateSchedule(scheduleId, (item) => ({
      ...item,
      participants: makeParticipants(item.capacity, { offset: 4 }),
      participantCount: item.capacity,
      status: "CLOSED",
    }));
    return "RECRUIT_CLOSED";
  }
  if (
    schedule.status !== "RECRUITING" ||
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
      status: participantCount >= item.capacity ? "CLOSED" : item.status,
      joined: true,
    };
  });
  return null;
}

/** 참여 취소: 모집 중·모집 마감일 때만. 마감이었으면 모집 중으로 되돌린다(시작 전만 여기까지 온다) */
export function leaveMockSchedule(scheduleId: string): MockRejection | null {
  const schedule = findMockSchedule(scheduleId);
  if (!schedule) return "NOT_FOUND";
  if (!schedule.joined) return "NOT_ALLOWED";
  if (schedule.status !== "RECRUITING" && schedule.status !== "CLOSED") {
    return "NOT_ALLOWED";
  }
  updateSchedule(scheduleId, (item) => ({
    ...item,
    participants: item.participants.filter(
      (participant) => participant.userId !== ME.userId,
    ),
    participantCount: item.participantCount - 1,
    status: "RECRUITING",
    joined: false,
  }));
  return null;
}

/** 일정 전체 취소(개설자): 모집 중·모집 마감일 때만. 확정 참여자는 모두 미참여자가 된다 */
export function cancelMockSchedule(scheduleId: string): MockRejection | null {
  const schedule = findMockSchedule(scheduleId);
  if (!schedule) return "NOT_FOUND";
  if (!schedule.mine) return "FORBIDDEN";
  if (schedule.status !== "RECRUITING" && schedule.status !== "CLOSED") {
    return "NOT_ALLOWED";
  }
  updateSchedule(scheduleId, (item) => ({
    ...item,
    participants: item.participants.filter((participant) => participant.isHost),
    participantCount: 1,
    status: "CANCELED",
  }));
  return null;
}
