import { isValid, parseISO } from "date-fns";
import { delay, http, HttpResponse, type AnyHandler } from "msw";

import {
  NICKNAME_CHANGE_RESTRICTED_CODE,
  USER_NOT_FOUND_CODE,
  type MyProfile,
} from "@/features/profile/api/myProfile";
import type {
  NicknameAvailability,
  NicknameUnavailableReason,
} from "@/features/profile/api/nicknameAvailability";
import type {
  SignUpSession,
  SignupRequest,
} from "@/features/profile/api/signup";
import {
  WITHDRAWAL_BLOCKED_CODE,
  type WithdrawalEligibility,
} from "@/features/profile/api/withdraw";
import type { Region } from "@/features/schedule/api/regions";
import {
  INVALID_CURSOR,
  SCHEDULE_PAGE_SIZE,
  type SchedulePage,
} from "@/features/schedule/api/schedules";
import type { Activity } from "@/features/schedule/api/activities";
import type {
  CreateScheduleRequest,
  CreateScheduleResponse,
  Place,
} from "@/features/schedule/api/scheduleCreate";
import type {
  CancelScheduleRequest,
  ScheduleParticipant,
} from "@/features/schedule/api/scheduleDetail";
import { countChars } from "@/features/schedule/lib/charCount";
import { toKstDateTime } from "@/features/schedule/lib/scheduleDate";
import { UUID_PATTERN } from "@/features/schedule/lib/scheduleListParams";
import {
  DEFAULT_PROFILE_IMAGE_PATH,
  MOCK_ACTIVITIES,
  cancelMockSchedule,
  findMockSchedule,
  getMockWithdrawalAvailableAt,
  getViewerRole,
  joinMockSchedule,
  leaveMockSchedule,
  listMine,
  listRecruiting,
  loadMockSchedules,
  mockAvatar,
  mockHostParticipants,
  mockOtherNicknames,
  saveMockSchedules,
  toDetail,
  toPage,
  toParticipants,
  type MockRecruitingQuery,
  type MockRejection,
  type MockSchedule,
} from "./scheduleStore";
import {
  deleteMockProfile,
  isMockLoggedIn,
  isMockWithdrawn,
  loadMockProfile,
  saveMockProfile,
  setMockLoggedIn,
  shouldSkipActiveScheduleCheck,
  toMockMyProfile,
  type StoredMockProfile,
} from "./userStore";
import type {
  ApiFailure,
  ApiSuccess,
  TokenResponse,
} from "@/shared/lib/api/client";

// API 함수와 1:1로 핸들러를 추가한다. 응답은 백엔드 스펙(/v3/api-docs)을 기준으로 작성한다 (TECH_STACK §3.8)
// 실제 서버에 붙일 때는 NEXT_PUBLIC_API_MOCKING=disabled로 끈다
// 카카오 인증 이동(GET /api/v1/auth/kakao/authorize)은 페이지 이동이라 mock할 수 없다.
// mock으로 가입 화면을 보려면 /auth/callback?signUp=true로 들어간다

/** 테스트용: 이 닉네임으로 가입·수정하면 409 DUPLICATED_NICKNAME을 준다 */
const DUPLICATED_NICKNAME = "중복닉네임";

/** 다른 사용자가 쓰는 닉네임인지. 대소문자를 무시한다 (api-guide 가입) */
const isTakenNickname = (nickname: string) =>
  [DUPLICATED_NICKNAME, ...mockOtherNicknames()].some(
    (taken) => taken.toLowerCase() === nickname.toLowerCase(),
  );

// 프로필 입력 규칙 (api-guide "가입 요청의 입력 규칙"). 프로필 수정·닉네임 사용 가능 여부도 같은 규칙이다
const NICKNAME_PATTERN = /^[가-힣a-zA-Z0-9._]{2,10}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MAX_LENGTH = 100;
const NICKNAME_ERROR = "닉네임은 2~10자의 한글·영문·숫자·.·_만 쓸 수 있어요.";
const EMAIL_ERROR = "이메일 형식이 올바르지 않아요.";
/** 사진 업로드 기준 (api-guide 가입): 5MB 이하의 JPG·PNG. 서버는 파일 내용으로, mock은 형식 정보로 판별한다. 5MB를 넘으면 413 */
const PROFILE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const PROFILE_IMAGE_TYPES = ["image/jpeg", "image/png"];
/** 업로드 API가 돌려주는 경로. 수정 요청의 profileImageUrl은 이 경로만 받는다 */
const PROFILE_IMAGE_PATH = "/images/profiles/";
/** 닉네임을 바꾸면 14일(336시간) 동안 다시 바꿀 수 없다 (USER_FLOW §8.1) */
const NICKNAME_LOCK_MS = 14 * 24 * 60 * 60 * 1000;

/** 테스트용: 이 활동명으로 일정을 열면 409 SCHEDULE_TIME_CONFLICT를 준다 */
const TIME_CONFLICT_TITLE = "시간겹침";
/** 시작 시각은 요청 시점 + 1시간 이후여야 한다 */
const MIN_LEAD_MS = 60 * 60 * 1000;

/** 지역 목록 (api-guide 응답 예시) */
const mockRegions: Region[] = [
  { code: "11440", name: "마포구" },
  { code: "11410", name: "서대문구" },
  { code: "11200", name: "성동구" },
];

/** 지역 중심 좌표. 장소 후보 예시를 그 주변에 둔다 */
const REGION_CENTERS: Record<string, { latitude: number; longitude: number }> =
  {
    "11440": { latitude: 37.5551, longitude: 126.9227 },
    "11410": { latitude: 37.5596, longitude: 126.9425 },
    "11200": { latitude: 37.5612, longitude: 127.0371 },
  };

/** 장소 후보 예시. 활동·지역마다 3곳. 산책(공원)은 실제 서버처럼 아직 비어 있다 (api-guide 장소 후보) */
const mockPlaces: Array<{ categoryId: string; place: Place }> =
  MOCK_ACTIVITIES.filter((activity) => activity.code !== "WALK")
    .flatMap((activity, activityIndex) =>
      mockRegions.flatMap((region) =>
        [1, 2, 3].map((number) => ({
          activity,
          activityIndex,
          region,
          number,
        })),
      ),
    )
    .map(({ activity, activityIndex, region, number }, index) => {
      const center = REGION_CENTERS[region.code];
      return {
        categoryId: activity.id,
        place: {
          id: `01a178b9-b980-7000-8000-${String(index + 1).padStart(12, "0")}`,
          name: `${region.name} ${activity.name} 예시 ${number}`,
          roadAddress: `서울특별시 ${region.name} 예시로 ${number}`,
          addressDetail: number === 3 ? "" : `${number + 1}층`,
          latitude: center.latitude + (number - 2) * 0.003,
          longitude: center.longitude + (activityIndex - 0.5) * 0.004,
          regionCode: region.code,
        },
      };
    });

/**
 * TODO(원복): 백엔드(ngrok)가 꺼져 있어도 개설 → 목록 반영을 확인하려고, mock에서는 로그인된 상태로 시작한다 (2026-11-02)
 * 비로그인 흐름(로그인 화면 이동·가입)을 확인하려면 false로 둔다
 */
const MOCK_LOGGED_IN = true;

/** 목록 한 페이지 상한. 넘으면 상한으로 맞춘다 (api-guide 일정 목록 `size`) */
const MAX_PAGE_SIZE = 50;
/** `categoryIds`·`regionCodes` 각각 중복을 빼고 받을 수 있는 개수 */
const MAX_FILTER_VALUES = 20;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** 빈 값(`size=`)은 생략과 같다 */
const readParam = (query: URLSearchParams, name: string) =>
  query.get(name) || undefined;

/** 목록 요청의 cursor·size. size가 숫자가 아니면 null (400 INVALID_REQUEST). 범위 밖은 1~50으로 맞춘다 */
function readPage(
  query: URLSearchParams,
): { cursor?: string; size: number } | null {
  const sizeParam = readParam(query, "size");
  const size = sizeParam === undefined ? SCHEDULE_PAGE_SIZE : Number(sizeParam);
  if (!Number.isInteger(size)) return null;
  return {
    cursor: readParam(query, "cursor"),
    size: Math.min(MAX_PAGE_SIZE, Math.max(1, size)),
  };
}

/** 형식이 맞고 실제로 있는 날짜 (`2026-13-01` 제외) */
const isDate = (value: string) =>
  DATE_PATTERN.test(value) && isValid(parseISO(value));

/** 목록 응답. 커서를 해석할 수 없으면 400 INVALID_CURSOR */
function listResponse(
  schedules: MockSchedule[],
  page: { cursor?: string; size: number },
) {
  const data = toPage(schedules, page.cursor, page.size);
  return data
    ? HttpResponse.json<ApiSuccess<SchedulePage>>({ isSuccess: true, data })
    : failure(400, INVALID_CURSOR, "목록을 처음부터 다시 불러주세요.");
}

const invalidRequest = () =>
  failure(400, "INVALID_REQUEST", "요청 형식이 올바르지 않습니다.");

/** 필드 검증 실패 형식 (api-guide 응답 봉투) */
const invalidFields = (errors: { field: string; message: string }[]) =>
  HttpResponse.json(
    {
      isSuccess: false,
      code: "INVALID_REQUEST",
      message: "요청 형식이 올바르지 않습니다.",
      errors,
    },
    { status: 400 },
  );

/** 카카오 정보 (임시 닉네임) */
const mockSignUpSession: SignUpSession = {
  nickname: "딸기스무디",
  profileImageUrl: mockAvatar("딸", "#578627"),
};

const failure = (status: number, code: string, message: string) =>
  HttpResponse.json<ApiFailure>(
    { isSuccess: false, code, message },
    { status },
  );

const unauthenticated = () =>
  failure(401, "UNAUTHENTICATED", "로그인이 필요합니다.");

/** 내 정보 API의 로그인 검사: 토큰이 있고 mock 세션이 로그아웃·탈퇴되지 않았다 */
const isSignedIn = (request: Request) =>
  Boolean(request.headers.get("Authorization")) &&
  isMockLoggedIn(MOCK_LOGGED_IN);

/**
 * 내 정보 API의 인증 검사. 토큰이 없거나 mock 세션이 로그아웃됐으면 401,
 * 탈퇴한 사용자의 남은 토큰이면 404 USER_NOT_FOUND (api-guide 공통 규칙). 통과하면 null
 */
function rejectMe(request: Request) {
  if (request.headers.get("Authorization") && isMockWithdrawn()) {
    return failure(404, USER_NOT_FOUND_CODE, "사용자를 찾을 수 없습니다.");
  }
  return isSignedIn(request) ? null : unauthenticated();
}

/** 사진 업로드 (가입·프로필 수정 공통). 5MB 초과는 크기 한도에서 먼저 걸려 413 INVALID_REQUEST, 그다음 형식 400 */
async function uploadProfileImage(request: Request) {
  const image = (await request.formData()).get("image");
  if (!(image instanceof File)) return invalidRequest();
  if (image.size > PROFILE_IMAGE_MAX_BYTES) {
    return failure(413, "INVALID_REQUEST", "요청 형식이 올바르지 않습니다.");
  }
  if (!PROFILE_IMAGE_TYPES.includes(image.type)) {
    return failure(
      400,
      "INVALID_PROFILE_IMAGE",
      "JPG, PNG 형식의 사진만 올릴 수 있어요.",
    );
  }
  return HttpResponse.json({
    isSuccess: true,
    data: { profileImageUrl: `${PROFILE_IMAGE_PATH}mock-${image.name}` },
  });
}

/** mock 서버의 거부 사유 → 응답. 상태 코드·message는 api-guide 예시 그대로 */
const REJECTIONS: Record<MockRejection, () => HttpResponse<ApiFailure>> = {
  SCHEDULE_NOT_FOUND: () =>
    failure(404, "SCHEDULE_NOT_FOUND", "찾을 수 없는 일정이에요."),
  HOST_CANNOT_JOIN: () =>
    failure(409, "HOST_CANNOT_JOIN", "내가 연 일정에는 참여할 수 없어요."),
  ALREADY_JOINED: () =>
    failure(409, "ALREADY_JOINED", "이미 참여한 일정이에요."),
  RECRUIT_CLOSED: () =>
    failure(409, "RECRUIT_CLOSED", "모집이 끝난 일정이에요."),
  SCHEDULE_TIME_CONFLICT: () =>
    failure(
      409,
      "SCHEDULE_TIME_CONFLICT",
      "앞뒤 12시간 안에 참여하는 다른 일정이 있어요.",
    ),
  HOST_CANNOT_LEAVE: () =>
    failure(
      409,
      "HOST_CANNOT_LEAVE",
      "내가 연 일정은 참여를 취소할 수 없어요. 일정 전체 취소를 이용해주세요.",
    ),
  NOT_PARTICIPANT: () =>
    failure(409, "NOT_PARTICIPANT", "참여 중인 일정이 아니에요."),
  PARTICIPATION_NOT_CANCELABLE: () =>
    failure(
      409,
      "PARTICIPATION_NOT_CANCELABLE",
      "취소되었거나 끝난 일정은 참여를 취소할 수 없어요.",
    ),
  NOT_HOST: () => failure(403, "NOT_HOST", "내가 연 일정만 취소할 수 있어요."),
  SCHEDULE_NOT_CANCELABLE: () =>
    failure(
      409,
      "SCHEDULE_NOT_CANCELABLE",
      "이미 취소됐거나 시작한 일정은 취소할 수 없어요.",
    ),
};

const done = (rejection: MockRejection | null) =>
  rejection
    ? REJECTIONS[rejection]()
    : // 돌려줄 값이 없으면 data가 빠진다 (api-guide 응답 봉투)
      HttpResponse.json({ isSuccess: true });

/** 전체 취소 사유: 앞뒤 공백을 뺀 글자 수 1~100자, 이모지 한 글자 (api-guide 일정 전체 취소) */
const CANCEL_REASON_MAX = 100;

/** 서버 기본 프로필 사진(회색 원). 실제 서버의 `/images/default-profile.png` 대신 응답한다 */
const DEFAULT_PROFILE_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="#c9ccd1"/><circle cx="40" cy="32" r="14" fill="#fff"/><rect x="16" y="52" width="48" height="28" rx="14" fill="#fff"/></svg>';

export const handlers: AnyHandler[] = [
  // getRegions
  http.get("*/api/v1/regions", () =>
    HttpResponse.json<ApiSuccess<Region[]>>({
      isSuccess: true,
      data: mockRegions,
    }),
  ),
  // getActivities
  http.get("*/api/v1/activity-categories", () =>
    HttpResponse.json<ApiSuccess<Activity[]>>({
      isSuccess: true,
      data: MOCK_ACTIVITIES,
    }),
  ),

  // getPlaces — 장소 후보. 지역을 빼면 전체 지역
  http.get<never, never, ApiSuccess<Place[]> | ApiFailure>(
    "*/api/v1/place-candidates",
    ({ request }) => {
      const query = new URL(request.url).searchParams;
      const categoryId = query.get("categoryId");
      const regionCode = query.get("regionCode");
      if (!categoryId) {
        return failure(
          400,
          "INVALID_REQUEST",
          "요청 형식이 올바르지 않습니다.",
        );
      }
      if (!MOCK_ACTIVITIES.some((activity) => activity.id === categoryId)) {
        return failure(
          400,
          "INVALID_CATEGORY",
          "선택할 수 없는 활동이에요. 활동을 다시 골라주세요.",
        );
      }
      if (
        regionCode !== null &&
        !mockRegions.some(({ code }) => code === regionCode)
      ) {
        return failure(
          400,
          "INVALID_REGION",
          "선택할 수 없는 지역이에요. 지역을 다시 골라주세요.",
        );
      }
      return HttpResponse.json<ApiSuccess<Place[]>>({
        isSuccess: true,
        data: mockPlaces
          .filter(
            (item) =>
              item.categoryId === categoryId &&
              (regionCode === null || item.place.regionCode === regionCode),
          )
          .map((item) => item.place),
      });
    },
  ),

  // postSchedule — 로그인해야 한다. 성공하면 201
  http.post<
    never,
    CreateScheduleRequest,
    ApiSuccess<CreateScheduleResponse> | ApiFailure
  >("*/api/v1/schedules", async ({ request }) => {
    // 연속 클릭 방지를 눈으로 확인할 수 있게 조금 기다린다
    await delay(800);
    if (!request.headers.get("Authorization")) {
      return unauthenticated();
    }
    const body = await request.json();
    if (body.title === TIME_CONFLICT_TITLE) {
      return failure(
        409,
        "SCHEDULE_TIME_CONFLICT",
        "시간이 겹치는 일정이 있습니다.",
      );
    }
    // 시작 일시는 한국 시간이다
    if (Date.parse(`${body.startAt}+09:00`) < Date.now() + MIN_LEAD_MS) {
      return failure(
        400,
        "INVALID_START_AT",
        "시작 일시는 지금부터 1시간 이후, 30일 이내에서 30분 단위로 골라주세요.",
      );
    }
    const candidate = mockPlaces.find((item) => item.place.id === body.placeId);
    const place = candidate?.place;
    if (!place || candidate.categoryId !== body.categoryId) {
      return failure(
        400,
        "INVALID_PLACE",
        "선택할 수 없는 장소예요. 장소를 다시 골라주세요.",
      );
    }
    const schedules = loadMockSchedules();
    const scheduleId = crypto.randomUUID();
    saveMockSchedules([
      ...schedules,
      {
        scheduleId,
        activityId: body.categoryId,
        activityName:
          MOCK_ACTIVITIES.find((activity) => activity.id === body.categoryId)
            ?.name ?? "",
        title: body.title,
        startAt: body.startAt,
        regionCode: place.regionCode,
        regionName:
          mockRegions.find(({ code }) => code === place.regionCode)?.name ?? "",
        placeName: place.name,
        roadAddress: place.roadAddress,
        addressDetail: place.addressDetail,
        latitude: place.latitude,
        longitude: place.longitude,
        duration: body.durationType,
        description: body.description,
        participants: mockHostParticipants(),
        // 개설자 = 확정 인원 1명 (USER_FLOW §7.7)
        participantCount: 1,
        cancellation: null,
        capacity: body.capacity,
        status: "RECRUITING",
        createdAt: toKstDateTime(new Date()),
        joined: false,
        mine: true,
      },
    ]);
    return HttpResponse.json<ApiSuccess<CreateScheduleResponse>>(
      { isSuccess: true, data: { scheduleId } },
      { status: 201 },
    );
  }),

  // getScheduleList(모집 중) — 로그인 필요 없음. 활동·지역(반복 가능)·날짜 필터, 커서로 20개씩
  http.get<never, never, ApiSuccess<SchedulePage> | ApiFailure>(
    "*/api/v1/schedules",
    ({ request }) => {
      const query = new URL(request.url).searchParams;
      const page = readPage(query);
      const categoryIds = [...new Set(query.getAll("categoryIds"))];
      const regionCodes = [...new Set(query.getAll("regionCodes"))];
      const startDate = readParam(query, "startDate");
      const endDate = readParam(query, "endDate");
      if (
        !page ||
        categoryIds.length > MAX_FILTER_VALUES ||
        regionCodes.length > MAX_FILTER_VALUES ||
        categoryIds.some((id) => id !== "" && !UUID_PATTERN.test(id)) ||
        [startDate, endDate].some((date) => date !== undefined && !isDate(date))
      ) {
        return invalidRequest();
      }
      if (startDate && endDate && endDate < startDate) {
        return failure(
          400,
          "INVALID_DATE_FILTER",
          "끝 날짜는 시작 날짜보다 앞설 수 없어요.",
        );
      }
      // 한쪽 날짜만 오면 그날 하루다
      const filter: MockRecruitingQuery = {
        categoryIds,
        regionCodes,
        startDate: startDate ?? endDate,
        endDate: endDate ?? startDate,
      };
      return listResponse(listRecruiting(filter), page);
    },
  ),

  // getScheduleList(참여한·개설한) — 로그인해야 한다. 필터는 받지 않는다
  ...(
    [
      ["participating", "joined"],
      ["hosted", "mine"],
    ] as const
  ).map(([path, kind]) =>
    http.get<never, never, ApiSuccess<SchedulePage> | ApiFailure>(
      `*/api/v1/schedules/${path}`,
      ({ request }) => {
        if (!request.headers.get("Authorization")) return unauthenticated();
        const page = readPage(new URL(request.url).searchParams);
        if (!page) return invalidRequest();
        return listResponse(listMine(kind), page);
      },
    ),
  ),

  // 서버 기본 프로필 사진. 상세·명단의 사진 경로는 API 서버 주소를 붙여 부른다
  http.get(
    `*${DEFAULT_PROFILE_IMAGE_PATH}`,
    () =>
      new HttpResponse(DEFAULT_PROFILE_SVG, {
        headers: { "Content-Type": "image/svg+xml" },
      }),
  ),

  // getScheduleDetail — 토큰은 선택. 없거나 틀리면 GUEST, 401 없음
  http.get<{ scheduleId: string }>(
    "*/api/v1/schedules/:scheduleId",
    ({ request, params }) => {
      const schedule = findMockSchedule(params.scheduleId);
      if (!schedule) return REJECTIONS.SCHEDULE_NOT_FOUND();
      const role = getViewerRole(schedule, isSignedIn(request));
      return HttpResponse.json({
        isSuccess: true,
        data: toDetail(schedule, role),
      });
    },
  ),

  // getScheduleParticipants — 로그인 필요. 개설자·확정 참여자만 (그 밖 403)
  http.get<{ scheduleId: string }>(
    "*/api/v1/schedules/:scheduleId/participants",
    ({ request, params }) => {
      if (!request.headers.get("Authorization")) return unauthenticated();
      const schedule = findMockSchedule(params.scheduleId);
      if (!schedule) return REJECTIONS.SCHEDULE_NOT_FOUND();
      const role = getViewerRole(schedule, true);
      if (role !== "HOST" && role !== "PARTICIPANT") {
        return failure(
          403,
          "PARTICIPANT_LIST_FORBIDDEN",
          "참여한 일정만 참여자 명단을 볼 수 있어요.",
        );
      }
      return HttpResponse.json<ApiSuccess<ScheduleParticipant[]>>({
        isSuccess: true,
        data: toParticipants(schedule),
      });
    },
  ),

  // postParticipation — 로그인 필요. 성공하면 data 없음
  http.post<{ scheduleId: string }>(
    "*/api/v1/schedules/:scheduleId/participants",
    async ({ request, params }) => {
      // 연속 클릭 방지를 눈으로 확인할 수 있게 조금 기다린다
      await delay(800);
      if (!request.headers.get("Authorization")) return unauthenticated();
      return done(joinMockSchedule(params.scheduleId));
    },
  ),

  // deleteParticipation — 로그인 필요. 성공하면 data 없음
  http.delete<{ scheduleId: string }>(
    "*/api/v1/schedules/:scheduleId/participants/me",
    async ({ request, params }) => {
      await delay(800);
      if (!request.headers.get("Authorization")) return unauthenticated();
      return done(leaveMockSchedule(params.scheduleId));
    },
  ),

  // cancelSchedule — 로그인 필요, 개설자만, 사유 1~100자(앞뒤 공백 제외)
  http.post<{ scheduleId: string }, CancelScheduleRequest>(
    "*/api/v1/schedules/:scheduleId/cancellation",
    async ({ request, params }) => {
      await delay(800);
      if (!request.headers.get("Authorization")) return unauthenticated();
      const { reason } = await request.json();
      const trimmed = typeof reason === "string" ? reason.trim() : "";
      const length = countChars(trimmed);
      if (length < 1 || length > CANCEL_REASON_MAX) {
        return invalidFields([
          { field: "reason", message: "취소 사유는 1~100자로 적어주세요." },
        ]);
      }
      return done(cancelMockSchedule(params.scheduleId, trimmed));
    },
  ),

  // deleteTokens(로그아웃) — 응답 본문에 data가 없다 (api-guide 로그아웃)
  http.delete("*/api/v1/auth/tokens", () => {
    setMockLoggedIn(false);
    return HttpResponse.json({ isSuccess: true });
  }),

  // getMyProfile — 로그인해야 한다. 탈퇴한 사용자의 남은 토큰이면 404 USER_NOT_FOUND
  http.get<never, never, ApiSuccess<MyProfile> | ApiFailure>(
    "*/api/v1/users/me",
    ({ request }) => {
      const rejected = rejectMe(request);
      if (rejected) return rejected;
      return HttpResponse.json({
        isSuccess: true,
        data: toMockMyProfile(loadMockProfile()),
      });
    },
  ),

  // patchMyProfile — 바뀐 항목만 받는다. 이름·성별·생년월일은 넣어도 무시한다 (api-guide 프로필 수정)
  // 검사 순서: 형식 → 사진 경로 → 닉네임 변경 제한 → 닉네임 중복. 하나라도 실패하면 아무것도 저장하지 않는다
  http.patch<never, Record<string, unknown>>(
    "*/api/v1/users/me",
    async ({ request }) => {
      await delay(800);
      const rejected = rejectMe(request);
      if (rejected) return rejected;
      const body = await request.json();
      const { nickname, email, profileImageUrl } = body;
      const isTyped = [nickname, email, profileImageUrl].every(
        (value) =>
          value === undefined || value === null || typeof value === "string",
      );
      if (!isTyped) return invalidRequest();

      const errors: { field: string; message: string }[] = [];
      if (typeof nickname === "string" && !NICKNAME_PATTERN.test(nickname)) {
        errors.push({ field: "nickname", message: NICKNAME_ERROR });
      }
      // 빈 문자열은 삭제다. 공백만 있거나 앞뒤 공백이 있으면 거부한다
      if (
        typeof email === "string" &&
        email !== "" &&
        (email !== email.trim() ||
          email.length > EMAIL_MAX_LENGTH ||
          !EMAIL_PATTERN.test(email))
      ) {
        errors.push({ field: "email", message: EMAIL_ERROR });
      }
      if (errors.length > 0) return invalidFields(errors);

      // 업로드 API가 준 경로만 받는다. 빈 문자열(사진 지우기)도 거부한다
      if (
        typeof profileImageUrl === "string" &&
        !profileImageUrl.startsWith(PROFILE_IMAGE_PATH)
      ) {
        return failure(
          400,
          "INVALID_PROFILE_IMAGE_URL",
          "업로드한 사진 경로가 아닙니다.",
        );
      }

      const profile = loadMockProfile();
      const next: StoredMockProfile = { ...profile };
      // 현재 값과 정확히 같으면 바꾸지 않은 것으로 본다. 대소문자만 달라도 변경이다
      if (typeof nickname === "string" && nickname !== profile.nickname) {
        const { nicknameChangeableAt } = profile;
        if (
          nicknameChangeableAt &&
          Date.parse(`${nicknameChangeableAt}+09:00`) > Date.now()
        ) {
          return failure(
            409,
            NICKNAME_CHANGE_RESTRICTED_CODE,
            "닉네임은 14일에 한 번만 바꿀 수 있어요.",
          );
        }
        if (isTakenNickname(nickname)) {
          return failure(
            409,
            "DUPLICATED_NICKNAME",
            "이미 사용 중인 닉네임입니다.",
          );
        }
        next.nickname = nickname;
        next.nicknameChangeableAt = toKstDateTime(
          new Date(Date.now() + NICKNAME_LOCK_MS),
        );
      }
      if (typeof email === "string") next.email = email;
      if (typeof profileImageUrl === "string") {
        next.profileImageUrl = profileImageUrl;
      }
      saveMockProfile(next);
      return HttpResponse.json<ApiSuccess<MyProfile>>({
        isSuccess: true,
        data: toMockMyProfile(next),
      });
    },
  ),

  // postMyProfileImage — 5MB 이하 JPG·PNG. 5MB를 넘으면 413 INVALID_REQUEST (api-guide 프로필 사진 업로드)
  http.post("*/api/v1/users/me/profile-image", async ({ request }) => {
    const rejected = rejectMe(request);
    if (rejected) return rejected;
    return uploadProfileImage(request);
  }),

  // checkWithdrawal — 탈퇴를 막는 일정이 있으면 withdrawable false와 탈퇴 가능 시각 (api-guide 탈퇴 가능 여부)
  // 확인용: sessionStorage.mswSkipActiveScheduleCheck = "true"면 막는 일정이 있어도 탈퇴할 수 있다
  http.get<never, never, ApiSuccess<WithdrawalEligibility> | ApiFailure>(
    "*/api/v1/users/me/withdrawal-eligibility",
    async ({ request }) => {
      await delay(400);
      const rejected = rejectMe(request);
      if (rejected) return rejected;
      const availableAt = shouldSkipActiveScheduleCheck()
        ? null
        : getMockWithdrawalAvailableAt();
      return HttpResponse.json({
        isSuccess: true,
        data: { withdrawable: availableAt === null, availableAt },
      });
    },
  ),

  // withdraw — 같은 기준으로 다시 확인해 막는 일정이 있으면 409 WITHDRAWAL_BLOCKED. 두 번째 요청은 404 USER_NOT_FOUND (api-guide 탈퇴)
  // 남은 일정 확인이 사용자 확인보다 먼저다: 이미 탈퇴했어도 막는 일정이 남아 있으면 404가 아니라 409
  http.delete("*/api/v1/users/me", async ({ request }) => {
    await delay(800);
    const rejected = rejectMe(request);
    // 토큰 문제(401)는 먼저, 이미 탈퇴(404)는 막는 일정 확인 뒤에 돌려준다
    if (rejected && !isMockWithdrawn()) return rejected;
    if (getMockWithdrawalAvailableAt() && !shouldSkipActiveScheduleCheck()) {
      return failure(
        409,
        WITHDRAWAL_BLOCKED_CODE,
        "모든 일정 취소 혹은 진행 중 이후 24시간이 지나야 탈퇴할 수 있어요.",
      );
    }
    if (rejected) return rejected;
    // 탈퇴하면 refresh token이 무효가 된다. 다시 쓰려면 가입부터 한다
    deleteMockProfile();
    setMockLoggedIn(false);
    return HttpResponse.json({ isSuccess: true });
  }),

  // checkNicknameAvailability — 형식 → 본인의 현재 닉네임(토큰이 있을 때) → 사용 중 순서로 판정한다. 형식 오류·중복도 200
  // mock에서는 다른 사용자 닉네임만 사용 중으로 본다(가입 mock과 같다). 토큰이 틀려도 401을 주지 않는다
  http.get<never, never, ApiSuccess<NicknameAvailability> | ApiFailure>(
    "*/api/v1/users/nickname-availability",
    async ({ request }) => {
      await delay(400);
      const nickname = new URL(request.url).searchParams.get("nickname");
      if (nickname === null) return invalidRequest();
      const isMine =
        isSignedIn(request) &&
        !isMockWithdrawn() &&
        loadMockProfile().nickname.toLowerCase() === nickname.toLowerCase();
      const reason: NicknameUnavailableReason | null = !NICKNAME_PATTERN.test(
        nickname,
      )
        ? "INVALID_FORMAT"
        : !isMine && isTakenNickname(nickname)
          ? "DUPLICATED"
          : null;
      return HttpResponse.json({
        isSuccess: true,
        data: { available: reason === null, reason },
      });
    },
  ),

  // refreshAccessToken — mock에는 refresh token 쿠키가 없다. 로그아웃·탈퇴·가입 결과를 mock 세션에 둔다
  http.post<never, never, ApiSuccess<TokenResponse> | ApiFailure>(
    "*/api/v1/auth/tokens",
    () =>
      isMockLoggedIn(MOCK_LOGGED_IN)
        ? HttpResponse.json<ApiSuccess<TokenResponse>>({
            isSuccess: true,
            data: { accessToken: "mock-access-token" },
          })
        : failure(401, "INVALID_REFRESH_TOKEN", "다시 로그인해야 합니다."),
  ),

  // getSignUpSession
  http.get("*/api/v1/auth/signup/session", () =>
    HttpResponse.json<ApiSuccess<SignUpSession>>({
      isSuccess: true,
      data: mockSignUpSession,
    }),
  ),

  // postProfileImage — 5MB 이하 JPG·PNG, 5MB를 넘으면 413 (api-guide 가입)
  http.post("*/api/v1/auth/signup/profile-image", ({ request }) =>
    uploadProfileImage(request),
  ),

  // postSignup — 이름·성별·생년월일은 필수, 닉네임·이메일은 선택
  http.post<never, SignupRequest, ApiSuccess<TokenResponse> | ApiFailure>(
    "*/api/v1/auth/signup",
    async ({ request }) => {
      const body = await request.json();
      if (!body.name || !body.gender || !body.birthDate) {
        return failure(
          400,
          "INVALID_REQUEST",
          "요청 형식이 올바르지 않습니다.",
        );
      }
      if (body.nickname && isTakenNickname(body.nickname)) {
        return failure(
          409,
          "DUPLICATED_NICKNAME",
          "이미 사용 중인 닉네임입니다.",
        );
      }
      // 가입하면 그 프로필로 로그인한다. 최초 닉네임은 14일 제한에 넣지 않는다 (USER_FLOW §8.1)
      saveMockProfile({
        id: crypto.randomUUID(),
        name: body.name,
        nickname: body.nickname ?? mockSignUpSession.nickname ?? "",
        gender: body.gender,
        birthDate: body.birthDate,
        email: body.email ?? "",
        // 사진이 없으면 서버 기본 이미지 경로 (api-guide 가입)
        profileImageUrl:
          body.profileImageUrl ??
          mockSignUpSession.profileImageUrl ??
          DEFAULT_PROFILE_IMAGE_PATH,
        nicknameChangeableAt: null,
      });
      setMockLoggedIn(true);
      return HttpResponse.json({
        isSuccess: true,
        data: { accessToken: "mock-access-token" },
      });
    },
  ),
];
