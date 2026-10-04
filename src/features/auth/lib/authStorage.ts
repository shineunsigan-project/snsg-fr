import type { AuthSession, SignupDraft } from "../types";
import { TOKEN_STORAGE_KEY } from "@/shared/lib/api/client";

// 기존 프로젝트와 같은 저장소·키를 쓴다
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_KEY = "user";
const GUEST_KEY = "guest";
export const SIGNUP_TOKEN_KEY = "signupToken";
const REQUIRED_FIELDS_KEY = "requiredFields";
const SOCIAL_USER_KEY = "socialUser";

/** 로그인 완료: 토큰·사용자 정보를 저장하고 가입 진행 정보·둘러보기 표시를 지운다 */
export function saveAuthSession({
  accessToken,
  refreshToken,
  user,
}: AuthSession) {
  localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  sessionStorage.removeItem(GUEST_KEY);
  clearSignupDraft();
}

/** 신규 회원: 프로필 완성에 필요한 정보를 보관한다 */
export function saveSignupDraft({
  signupToken,
  requiredFields,
  socialUser,
}: SignupDraft) {
  sessionStorage.setItem(SIGNUP_TOKEN_KEY, signupToken);
  sessionStorage.setItem(REQUIRED_FIELDS_KEY, JSON.stringify(requiredFields));
  sessionStorage.setItem(SOCIAL_USER_KEY, JSON.stringify(socialUser));
}

export function getSignupDraft(): SignupDraft | null {
  const signupToken = sessionStorage.getItem(SIGNUP_TOKEN_KEY);
  if (!signupToken) return null;
  return {
    signupToken,
    requiredFields:
      parseJson<string[]>(sessionStorage.getItem(REQUIRED_FIELDS_KEY)) ?? [],
    socialUser: parseJson<SignupDraft["socialUser"]>(
      sessionStorage.getItem(SOCIAL_USER_KEY),
    ),
  };
}

export function clearSignupDraft() {
  sessionStorage.removeItem(SIGNUP_TOKEN_KEY);
  sessionStorage.removeItem(REQUIRED_FIELDS_KEY);
  sessionStorage.removeItem(SOCIAL_USER_KEY);
}

/** 로그인 없이 둘러보기 */
export function markGuest() {
  sessionStorage.setItem(GUEST_KEY, "true");
}

function parseJson<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}
