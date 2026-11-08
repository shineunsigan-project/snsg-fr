import { delay, http, HttpResponse, type AnyHandler } from "msw";

import type {
  SignUpSession,
  SignupRequest,
} from "@/features/profile/api/signup";
import type { Region } from "@/features/schedule/api/regions";
import type { ScheduleListItem } from "@/features/schedule/api/schedules";
import type { Activity } from "@/features/schedule/api/activities";
import type {
  CreateScheduleRequest,
  CreateScheduleResponse,
  Place,
} from "@/features/schedule/api/scheduleCreate";
import type {
  ApiFailure,
  ApiSuccess,
  TokenResponse,
} from "@/shared/lib/api/client";

// API 함수와 1:1로 핸들러를 추가한다. 응답은 백엔드 스펙(/v3/api-docs)을 기준으로 작성한다 (TECH_STACK §3.8)
// 실제 서버에 붙일 때는 NEXT_PUBLIC_API_MOCKING=disabled로 끈다
// 카카오 인증 이동(GET /api/v1/auth/kakao/authorize)은 페이지 이동이라 mock할 수 없다.
// mock으로 가입 화면을 보려면 /auth/callback?signUp=true로 들어간다

/** 테스트용: 이 닉네임으로 가입하면 409 DUPLICATED_NICKNAME을 준다 */
const DUPLICATED_NICKNAME = "중복닉네임";

/** 테스트용: 이 활동명으로 일정을 열면 409 SCHEDULE_TIME_CONFLICT를 준다 */
const TIME_CONFLICT_TITLE = "시간겹침";
/** 시작 시각은 요청 시점 + 1시간 이후여야 한다 */
const MIN_LEAD_MS = 60 * 60 * 1000;

/** 활동 목록 (api-guide 응답 예시). 화면 기능 명세서 CRT-01 순서: 보드게임 / 방탈출 / 산책 */
const mockActivities: Activity[] = [
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
const mockPlaces: Array<{ categoryId: string; place: Place }> = mockActivities
  .filter((activity) => activity.code !== "WALK")
  .flatMap((activity, activityIndex) =>
    mockRegions.flatMap((region) =>
      [1, 2, 3].map((number) => ({ activity, activityIndex, region, number })),
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

/** 만든 일정. 새로고침해도 남게 탭 단위 저장소에 둔다 */
const SCHEDULES_KEY = "mswSchedules";
function loadMockSchedules(): ScheduleListItem[] {
  try {
    return JSON.parse(sessionStorage.getItem(SCHEDULES_KEY) ?? "[]");
  } catch {
    return [];
  }
}
function saveMockSchedules(schedules: ScheduleListItem[]) {
  sessionStorage.setItem(SCHEDULES_KEY, JSON.stringify(schedules));
}

/** 카카오 정보 (임시 닉네임) */
const mockSignUpSession: SignUpSession = {
  nickname: "딸기스무디",
  profileImageUrl:
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="#578627"/><text x="40" y="52" font-size="32" text-anchor="middle" fill="#fff" font-family="sans-serif">딸</text></svg>',
    ),
};

const failure = (status: number, code: string, message: string) =>
  HttpResponse.json<ApiFailure>(
    { isSuccess: false, code, message },
    { status },
  );

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
      data: mockActivities,
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
      if (!mockActivities.some((activity) => activity.id === categoryId)) {
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
      return failure(401, "UNAUTHENTICATED", "로그인이 필요합니다.");
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
    // 목록(임시 계약)은 숫자 ID를 쓴다. 개설 응답은 api-guide대로 UUID다
    const listId =
      Math.max(0, ...schedules.map((schedule) => schedule.scheduleId)) + 1;
    saveMockSchedules([
      ...schedules,
      {
        scheduleId: listId,
        activityName:
          mockActivities.find((activity) => activity.id === body.categoryId)
            ?.name ?? "",
        title: body.title,
        startAt: body.startAt,
        place: {
          name: place.name,
          regionName: mockRegions.find(({ code }) => code === place.regionCode)
            ?.name,
        },
        // 개설자 = 확정 인원 1명 (USER_FLOW §7.7)
        participantCount: 1,
        capacity: body.capacity,
        status: "RECRUITING",
      },
    ]);
    return HttpResponse.json<ApiSuccess<CreateScheduleResponse>>(
      { isSuccess: true, data: { scheduleId: crypto.randomUUID() } },
      { status: 201 },
    );
  }),

  // getSchedules — TODO(API): 임시 계약. 시작이 빠른 순
  http.get("*/api/v1/schedules", () =>
    HttpResponse.json<ApiSuccess<ScheduleListItem[]>>({
      isSuccess: true,
      data: loadMockSchedules().sort((a, b) =>
        a.startAt.localeCompare(b.startAt),
      ),
    }),
  ),

  // refreshAccessToken — mock에는 refresh token 쿠키가 없어 항상 비로그인으로 시작한다
  http.post<never, never, ApiSuccess<TokenResponse> | ApiFailure>(
    "*/api/v1/auth/tokens",
    () =>
      MOCK_LOGGED_IN
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

  // postProfileImage
  http.post("*/api/v1/auth/signup/profile-image", async ({ request }) => {
    const image = (await request.formData()).get("image");
    if (!(image instanceof File)) {
      return failure(400, "INVALID_REQUEST", "요청 형식이 올바르지 않습니다.");
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
      if (body.nickname === DUPLICATED_NICKNAME) {
        return failure(
          409,
          "DUPLICATED_NICKNAME",
          "이미 사용 중인 닉네임입니다.",
        );
      }
      return HttpResponse.json({
        isSuccess: true,
        data: { accessToken: "mock-access-token" },
      });
    },
  ),
];
