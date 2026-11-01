import { delay, http, HttpResponse, type AnyHandler } from "msw";

import type {
  SignUpSession,
  SignupRequest,
} from "@/features/profile/api/signup";
import type { Region } from "@/features/schedule/api/regions";
import type {
  Activity,
  CreateScheduleRequest,
  CreateScheduleResponse,
  CreatedSchedule,
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

// TODO(API): 미확정 — 활동 목록 임시 계약. 화면 기능 명세서 CRT-01 순서: 보드게임 / 방탈출 / 산책
const mockActivities: Activity[] = [
  { activityId: 1, name: "보드게임", searchKeyword: "보드게임카페" },
  { activityId: 2, name: "방탈출", searchKeyword: "방탈출카페" },
  { activityId: 3, name: "산책", searchKeyword: "산책" },
];

/** 지역 목록 (api-guide 응답 예시) */
const mockRegions: Region[] = [
  { code: "11440", name: "마포구" },
  { code: "11410", name: "서대문구" },
  { code: "11200", name: "성동구" },
];

let nextScheduleId = 1;
/** 만든 일정의 장소명 (개설 완료 조회용) */
const createdPlaceNames = new Map<number, string>();

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
  // getActivities — TODO(API): 임시 계약
  http.get("*/api/v1/activities", () =>
    HttpResponse.json<ApiSuccess<Activity[]>>({
      isSuccess: true,
      data: mockActivities,
    }),
  ),

  // postSchedule — TODO(API): 임시 계약. 로그인해야 한다
  // 장소 검색(/api/places)은 이 앱의 Route Handler가 네이버로 보내므로 mock하지 않는다
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
        "INVALID_START_TIME",
        "시작 시각은 현재 시각으로부터 1시간 이후여야 합니다.",
      );
    }
    const scheduleId = nextScheduleId++;
    createdPlaceNames.set(scheduleId, body.place.name);
    return HttpResponse.json({ isSuccess: true, data: { scheduleId } });
  }),

  // getCreatedSchedule — TODO(API): 임시 계약
  http.get<{ scheduleId: string }>(
    "*/api/v1/schedules/:scheduleId/created",
    ({ params }) => {
      const scheduleId = Number(params.scheduleId);
      const placeName = createdPlaceNames.get(scheduleId);
      if (!placeName) {
        return failure(404, "SCHEDULE_NOT_FOUND", "일정을 찾을 수 없습니다.");
      }
      return HttpResponse.json<ApiSuccess<CreatedSchedule>>({
        isSuccess: true,
        data: { scheduleId, place: { name: placeName } },
      });
    },
  ),

  // refreshAccessToken — mock에는 refresh token 쿠키가 없어 항상 비로그인으로 시작한다
  http.post("*/api/v1/auth/tokens", () =>
    failure(401, "INVALID_REFRESH_TOKEN", "다시 로그인해야 합니다."),
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
