import type { MyProfile } from "@/features/profile/api/myProfile";
import { getAge, parseBirthDate } from "@/features/profile/lib/birthDate";
import type { AgeGroupPhase } from "@/features/schedule/types";
import { mockAvatar } from "./scheduleStore";

// MSW 전용 로그인 사용자 저장소. 내 정보 API(api-guide "내 정보")를 흉내 낸다
// 수정 결과가 새로고침해도 남게 탭 단위 저장소에 둔다. 저장소를 못 쓰면 이번 요청에만 반영된다

/** 저장하는 프로필. 연령대는 서버처럼 응답할 때 오늘 기준으로 계산한다 */
export type StoredMockProfile = Omit<MyProfile, "ageGroup">;

const PROFILE_KEY = "mswMyProfile.v2";
const SESSION_KEY = "mswSession";
const WITHDRAWN_KEY = "mswWithdrawn";
/** 확인용 스위치: 이 값이 "true"면 탈퇴를 막는 일정이 있어도 탈퇴를 허용한다 */
const SKIP_ACTIVE_SCHEDULE_KEY = "mswSkipActiveScheduleCheck";

/** 로그인 사용자(mock). 일정 mock의 ME(딸기스무디, 남성, 20대 후반)와 같은 사람이다 */
const seedProfile = (): StoredMockProfile => ({
  id: "01a19cc6-3d80-7000-8000-000000000001",
  name: "김민준",
  nickname: "딸기스무디",
  gender: "MALE",
  birthDate: "1998-03-14",
  email: "strawberry@example.com",
  profileImageUrl: mockAvatar("딸", "#578627"),
  nicknameChangeableAt: null,
});

function read(key: string) {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, value);
  } catch {
    // 저장소를 못 쓰면 이번 요청에만 반영된다
  }
}

export function loadMockProfile(): StoredMockProfile {
  const saved = read(PROFILE_KEY);
  if (saved) return JSON.parse(saved);
  const seed = seedProfile();
  saveMockProfile(seed);
  return seed;
}

/** 저장하면(가입 포함) 탈퇴 표시를 지운다 */
export function saveMockProfile(profile: StoredMockProfile) {
  write(PROFILE_KEY, JSON.stringify(profile));
  write(WITHDRAWN_KEY, null);
}

/** 응답 형태: 연령대를 오늘(한국 시간 대신 기기 날짜, mock) 기준 만 나이로 붙인다. 18·19세는 10대 후반 */
export function toMockMyProfile(profile: StoredMockProfile): MyProfile {
  const birthDate = parseBirthDate(profile.birthDate.replaceAll("-", ""));
  const age = birthDate ? getAge(birthDate) : 0;
  const unit = age % 10;
  const phase: AgeGroupPhase = unit <= 3 ? "EARLY" : unit <= 6 ? "MID" : "LATE";
  return {
    ...profile,
    ageGroup: { decade: Math.floor(age / 10) * 10, phase },
  };
}

/** 탈퇴: 계정 정보를 지우고 탈퇴 표시를 남긴다. 남은 access token으로 부르면 404 USER_NOT_FOUND. 다시 가입하면 새 프로필이 된다 */
export function deleteMockProfile() {
  write(PROFILE_KEY, null);
  write(WITHDRAWN_KEY, "true");
}

export function isMockWithdrawn() {
  return read(WITHDRAWN_KEY) === "true";
}

/** mock 세션의 로그인 여부. 로그인·로그아웃한 적이 없으면 기본값을 쓴다 */
export function isMockLoggedIn(defaultValue: boolean) {
  const saved = read(SESSION_KEY);
  return saved === null ? defaultValue : saved === "in";
}

export function setMockLoggedIn(loggedIn: boolean) {
  write(SESSION_KEY, loggedIn ? "in" : "out");
}

export function shouldSkipActiveScheduleCheck() {
  return read(SKIP_ACTIVE_SCHEDULE_KEY) === "true";
}
