export const profileQueryKeys = {
  /** 내 프로필. 프로필 수정 뒤 무효화한다. 로그아웃·탈퇴하면 clearSession이 지운다 */
  me: ["users", "me"] as const,
  /** 닉네임 사용 가능 여부 (가입·프로필 수정에서 닉네임 칸을 벗어날 때) */
  nicknameAvailability: (nickname: string) =>
    ["users", "nickname-availability", nickname] as const,
};
