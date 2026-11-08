import { delay, http, HttpResponse, type AnyHandler } from "msw";

import {
  NICKNAME_CHANGE_RESTRICTED_CODE,
  type MyProfile,
} from "@/features/profile/api/myProfile";
import type {
  SignUpSession,
  SignupRequest,
} from "@/features/profile/api/signup";
import { HAS_ACTIVE_SCHEDULE_CODE } from "@/features/profile/api/withdraw";
import type { Region } from "@/features/schedule/api/regions";
import {
  SCHEDULE_PAGE_SIZE,
  type ScheduleFilter,
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
  ScheduleDetail,
  ScheduleParticipant,
} from "@/features/schedule/api/scheduleDetail";
import { toKstDateTime } from "@/features/schedule/lib/scheduleDate";
import {
  MOCK_ACTIVITIES,
  cancelMockSchedule,
  findMockSchedule,
  getViewerRole,
  hasActiveMockSchedule,
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
  type MockRejection,
} from "./scheduleStore";
import {
  deleteMockProfile,
  isMockLoggedIn,
  loadMockProfile,
  saveMockProfile,
  setMockLoggedIn,
  shouldSkipActiveScheduleCheck,
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

// 프로필 입력 규칙 (api-guide "가입 요청의 입력 규칙"). 프로필 수정도 같은 규칙으로 가정한다 (TODO(API))
const NICKNAME_PATTERN = /^[가-힣a-zA-Z0-9._]{2,10}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MAX_LENGTH = 100;
const NICKNAME_ERROR = "닉네임은 2~10자의 한글·영문·숫자·.·_만 쓸 수 있어요.";
const EMAIL_ERROR = "이메일 형식이 올바르지 않아요.";
/** 사진 업로드 기준 (api-guide 가입): 5MB 이하의 JPG·PNG. 서버는 파일 내용으로, mock은 형식 정보로 판별한다 */
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

/** 한 번에 요청할 수 있는 최대 개수 (mock 전용 상한) */
const MAX_PAGE_SIZE = 100;

/** 목록 요청의 page·size. 0 이상 정수 page, 1~상한 정수 size가 아니면 null (400) */
function readPage(query: URLSearchParams): [number, number] | null {
  const page = Number(query.get("page") ?? 0);
  const size = Number(query.get("size") ?? SCHEDULE_PAGE_SIZE);
  const isValid =
    Number.isInteger(page) &&
    page >= 0 &&
    Number.isInteger(size) &&
    size >= 1 &&
    size <= MAX_PAGE_SIZE;
  return isValid ? [page, size] : null;
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

/** TODO(API): 백엔드 code가 정해지지 않은 거부. 화면은 어떤 code 분기에도 걸리지 않는 일반 실패로 다룬다 */
const UNDEFINED_CODE = "TODO_API_UNDEFINED";

/** mock 서버의 거부 사유 → 응답. 404의 code도 미정이라 임시 이름을 쓴다 */
const REJECTIONS: Record<MockRejection, () => HttpResponse<ApiFailure>> = {
  NOT_FOUND: () =>
    failure(404, "SCHEDULE_NOT_FOUND", "일정을 찾을 수 없습니다."),
  RECRUIT_CLOSED: () =>
    failure(409, "RECRUIT_CLOSED", "모집이 마감된 일정입니다."),
  SCHEDULE_TIME_CONFLICT: () =>
    failure(409, "SCHEDULE_TIME_CONFLICT", "시간이 겹치는 일정이 있습니다."),
  FORBIDDEN: () => failure(403, UNDEFINED_CODE, "권한이 없습니다."),
  NOT_ALLOWED: () => failure(409, UNDEFINED_CODE, "처리할 수 없는 요청입니다."),
};

const done = (rejection: MockRejection | null) =>
  rejection
    ? REJECTIONS[rejection]()
    : // 돌려줄 값이 없으면 data가 빠진다 (api-guide 응답 봉투)
      HttpResponse.json({ isSuccess: true });

/** 전체 취소 사유: 앞뒤 공백 제외 1~200자 (USER_FLOW §7.5) */
const CANCEL_REASON_MAX = 200;

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
        capacity: body.capacity,
        status: "RECRUITING",
        createdAt: new Date().toISOString(),
        joined: false,
        mine: true,
      },
    ]);
    return HttpResponse.json<ApiSuccess<CreateScheduleResponse>>(
      { isSuccess: true, data: { scheduleId } },
      { status: 201 },
    );
  }),

  // getScheduleList(모집 중) — TODO(API): 임시 계약. 필터·20개씩
  http.get<never, never, ApiSuccess<SchedulePage> | ApiFailure>(
    "*/api/v1/schedules",
    ({ request }) => {
      const query = new URL(request.url).searchParams;
      const page = readPage(query);
      if (!page) return invalidRequest();
      const filter: ScheduleFilter = {
        activityId: query.get("activityId") ?? undefined,
        regionCode: query.get("regionCode") ?? undefined,
        startDate: query.get("startDate") ?? undefined,
        endDate: query.get("endDate") ?? undefined,
        startTime: query.get("startTime") ?? undefined,
      };
      return HttpResponse.json<ApiSuccess<SchedulePage>>({
        isSuccess: true,
        data: toPage(listRecruiting(filter), ...page),
      });
    },
  ),

  // getScheduleList(참여한·개설한) — TODO(API): 임시 계약. 로그인해야 한다
  ...(["joined", "created"] as const).map((tab) =>
    http.get<never, never, ApiSuccess<SchedulePage> | ApiFailure>(
      `*/api/v1/users/me/schedules/${tab}`,
      ({ request }) => {
        if (!request.headers.get("Authorization")) return unauthenticated();
        const page = readPage(new URL(request.url).searchParams);
        if (!page) return invalidRequest();
        return HttpResponse.json<ApiSuccess<SchedulePage>>({
          isSuccess: true,
          data: toPage(listMine(tab === "joined" ? "joined" : "mine"), ...page),
        });
      },
    ),
  ),

  // getScheduleDetail — TODO(API): 임시 계약. 로그인하지 않아도 된다(역할 GUEST)
  http.get<{ scheduleId: string }>(
    "*/api/v1/schedules/:scheduleId",
    ({ request, params }) => {
      const schedule = findMockSchedule(params.scheduleId);
      if (!schedule) return REJECTIONS.NOT_FOUND();
      const role = getViewerRole(
        schedule,
        Boolean(request.headers.get("Authorization")),
      );
      return HttpResponse.json<ApiSuccess<ScheduleDetail>>({
        isSuccess: true,
        data: toDetail(schedule, role),
      });
    },
  ),

  // getScheduleParticipants — TODO(API): 임시 계약. 확정 참여자·개설자만 (F-6)
  http.get<{ scheduleId: string }>(
    "*/api/v1/schedules/:scheduleId/participants",
    ({ request, params }) => {
      const schedule = findMockSchedule(params.scheduleId);
      if (!schedule) return REJECTIONS.NOT_FOUND();
      const role = getViewerRole(
        schedule,
        Boolean(request.headers.get("Authorization")),
      );
      if (role === "GUEST" || role === "NON_PARTICIPANT") {
        return REJECTIONS.FORBIDDEN();
      }
      return HttpResponse.json<ApiSuccess<ScheduleParticipant[]>>({
        isSuccess: true,
        data: schedule.participants,
      });
    },
  ),

  // postParticipation — TODO(API): 임시 계약. 로그인해야 한다
  http.post<{ scheduleId: string }>(
    "*/api/v1/schedules/:scheduleId/participants",
    async ({ request, params }) => {
      // 연속 클릭 방지를 눈으로 확인할 수 있게 조금 기다린다
      await delay(800);
      if (!request.headers.get("Authorization")) return unauthenticated();
      return done(joinMockSchedule(params.scheduleId));
    },
  ),

  // deleteParticipation — TODO(API): 임시 계약. 로그인해야 한다
  http.delete<{ scheduleId: string }>(
    "*/api/v1/schedules/:scheduleId/participants/me",
    async ({ request, params }) => {
      await delay(800);
      if (!request.headers.get("Authorization")) return unauthenticated();
      return done(leaveMockSchedule(params.scheduleId));
    },
  ),

  // cancelSchedule — TODO(API): 임시 계약. 개설자만, 사유 1~200자
  http.post<{ scheduleId: string }, CancelScheduleRequest>(
    "*/api/v1/schedules/:scheduleId/cancel",
    async ({ request, params }) => {
      await delay(800);
      if (!request.headers.get("Authorization")) return unauthenticated();
      const { reason } = await request.json();
      const trimmed = typeof reason === "string" ? reason.trim() : "";
      if (trimmed.length < 1 || trimmed.length > CANCEL_REASON_MAX) {
        // 필드 검증 실패 형식 (api-guide 응답 봉투). 문구는 mock용이다
        return HttpResponse.json(
          {
            isSuccess: false,
            code: "INVALID_REQUEST",
            message: "요청 형식이 올바르지 않습니다.",
            errors: [
              {
                field: "reason",
                message: `취소 사유는 1~${CANCEL_REASON_MAX}자로 입력해 주세요.`,
              },
            ],
          },
          { status: 400 },
        );
      }
      return done(cancelMockSchedule(params.scheduleId));
    },
  ),

  // deleteTokens(로그아웃) — 응답 본문에 data가 없다 (api-guide 로그아웃)
  http.delete("*/api/v1/auth/tokens", () => {
    setMockLoggedIn(false);
    return HttpResponse.json({ isSuccess: true });
  }),

  // getMyProfile — TODO(API): 임시 계약. 로그인해야 한다
  http.get<never, never, ApiSuccess<MyProfile> | ApiFailure>(
    "*/api/v1/users/me",
    ({ request }) => {
      if (!isSignedIn(request)) return unauthenticated();
      return HttpResponse.json({ isSuccess: true, data: loadMockProfile() });
    },
  ),

  // patchMyProfile — TODO(API): 임시 계약. 바뀐 항목만 받는다. 이름·성별·생년월일은 거부한다
  http.patch<never, Record<string, unknown>>(
    "*/api/v1/users/me",
    async ({ request }) => {
      await delay(800);
      if (!isSignedIn(request)) return unauthenticated();
      const body = await request.json();
      const { nickname, email, profileImageUrl } = body;
      const hasReadOnlyField = ["name", "gender", "birthDate"].some(
        (field) => field in body,
      );
      const isTyped = [nickname, email, profileImageUrl].every(
        (value) => value === undefined || typeof value === "string",
      );
      if (hasReadOnlyField || !isTyped) return invalidRequest();

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
      const next: MyProfile = { ...profile };
      if (typeof nickname === "string" && nickname !== profile.nickname) {
        const { nicknameChangeableAt } = profile;
        if (
          nicknameChangeableAt &&
          Date.parse(`${nicknameChangeableAt}+09:00`) > Date.now()
        ) {
          return failure(
            409,
            NICKNAME_CHANGE_RESTRICTED_CODE,
            "닉네임은 변경 후 14일 동안 다시 바꿀 수 없어요.",
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
      if (typeof email === "string") next.email = email || null;
      if (typeof profileImageUrl === "string") {
        next.profileImageUrl = profileImageUrl;
      }
      saveMockProfile(next);
      return HttpResponse.json<ApiSuccess<MyProfile>>({
        isSuccess: true,
        data: next,
      });
    },
  ),

  // postMyProfileImage — TODO(API): 임시 계약. 5MB 이하 JPG·PNG
  http.post("*/api/v1/users/me/profile-image", async ({ request }) => {
    if (!isSignedIn(request)) return unauthenticated();
    const image = (await request.formData()).get("image");
    if (!(image instanceof File)) return invalidRequest();
    if (
      image.size > PROFILE_IMAGE_MAX_BYTES ||
      !PROFILE_IMAGE_TYPES.includes(image.type)
    ) {
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
  }),

  // deleteMyAccount — 실제 API(api-guide 탈퇴). 진행 중 일정 409는 TODO(API): 임시 code로 mock에서만 재현한다
  // 확인용: sessionStorage.mswSkipActiveScheduleCheck = "true"면 진행 중 일정이 있어도 탈퇴된다
  http.delete("*/api/v1/users/me", async ({ request }) => {
    await delay(800);
    if (!isSignedIn(request)) return unauthenticated();
    if (hasActiveMockSchedule() && !shouldSkipActiveScheduleCheck()) {
      return failure(
        409,
        HAS_ACTIVE_SCHEDULE_CODE,
        "진행중인 일정이 있어 탈퇴할 수 없습니다.",
      );
    }
    // 탈퇴하면 refresh token이 무효가 된다. 다시 쓰려면 가입부터 한다
    deleteMockProfile();
    setMockLoggedIn(false);
    return HttpResponse.json({ isSuccess: true });
  }),

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

  // postProfileImage — 5MB 이하 JPG·PNG (api-guide 가입)
  http.post("*/api/v1/auth/signup/profile-image", async ({ request }) => {
    const image = (await request.formData()).get("image");
    if (!(image instanceof File)) {
      return failure(400, "INVALID_REQUEST", "요청 형식이 올바르지 않습니다.");
    }
    if (
      image.size > PROFILE_IMAGE_MAX_BYTES ||
      !PROFILE_IMAGE_TYPES.includes(image.type)
    ) {
      return failure(
        400,
        "INVALID_PROFILE_IMAGE",
        "JPG, PNG 형식의 사진만 올릴 수 있어요.",
      );
    }
    return HttpResponse.json({
      isSuccess: true,
      data: { profileImageUrl: `/images/profiles/mock-${image.name}` },
    });
  }),

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
        name: body.name,
        nickname: body.nickname ?? mockSignUpSession.nickname ?? "",
        gender: body.gender,
        birthDate: body.birthDate,
        email: body.email || null,
        profileImageUrl:
          body.profileImageUrl ?? mockSignUpSession.profileImageUrl ?? null,
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
