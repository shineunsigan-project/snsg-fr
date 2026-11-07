export const profileQueryKeys = {
  /** 내 프로필. 프로필 수정 뒤 무효화한다. 로그아웃하면 useLogout이 지운다 */
  me: ["users", "me"] as const,
};
