import type { MyProfile } from "@/features/profile/api/myProfile";
import { mockAvatar } from "./scheduleStore";

// MSW 전용 로그인 사용자 저장소. TODO(API): 내 프로필 API가 생기면 지운다
// 수정 결과가 새로고침해도 남게 탭 단위 저장소에 둔다. 저장소를 못 쓰면 이번 요청에만 반영된다

const PROFILE_KEY = "mswMyProfile.v1";
const SESSION_KEY = "mswSession";
/** 확인용 스위치: 이 값이 "true"면 진행 중 일정이 있어도 탈퇴를 허용한다 */
const SKIP_ACTIVE_SCHEDULE_KEY = "mswSkipActiveScheduleCheck";

/** 로그인 사용자(mock). 일정 mock의 ME(딸기스무디, 남성, 20대 후반)와 같은 사람이다 */
const seedProfile = (): MyProfile => ({
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

export function loadMockProfile(): MyProfile {
  const saved = read(PROFILE_KEY);
  if (saved) return JSON.parse(saved);
  const seed = seedProfile();
  saveMockProfile(seed);
  return seed;
}

export function saveMockProfile(profile: MyProfile) {
  write(PROFILE_KEY, JSON.stringify(profile));
}

/** 탈퇴: 계정 정보를 지운다. 다시 가입하면 새 프로필이 된다 */
export function deleteMockProfile() {
  write(PROFILE_KEY, null);
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
