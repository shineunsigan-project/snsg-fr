// 기존 백엔드 로그인·가입 응답 (기존 프로젝트 authSession.js, userProfile.js 기준)
// TODO(API): 실제 응답의 필드 이름은 백엔드 응답 예시로 확인한다. 지금은 기존 앱 기준 이름을 쓴다

export type Gender = "MALE" | "FEMALE";

/** 서비스 사용자 정보 */
export type User = {
  id?: number | string;
  nickname: string;
  name: string;
  email: string;
  gender: Gender | "";
  /** YYYY-MM-DD */
  birthDate: string;
  profileImageUrl: string;
};

/** 카카오에서 받은 사용자 정보 — 신규 회원의 프로필 완성 화면을 미리 채운다 */
export type SocialUser = {
  nickname?: string;
  email?: string;
  profileImageUrl?: string;
};

export type AuthStatus =
  "LOGIN_SUCCESS" | "SIGNUP_SUCCESS" | "ADDITIONAL_INFO_REQUIRED";

/** 로그인 완료 상태 — localStorage에 저장한다 */
export type AuthSession = {
  accessToken: string;
  refreshToken?: string;
  user: User;
};

/** 가입 진행 중 상태 — 프로필 완성까지 sessionStorage에 보관한다 */
export type SignupDraft = {
  signupToken: string;
  requiredFields: string[];
  socialUser: SocialUser | null;
};

/** 로그인(`/api/auth/kakao/callback`)·가입 완료 응답 */
export type AuthResponse = { authStatus: AuthStatus } & Partial<AuthSession> &
  Partial<SignupDraft>;
