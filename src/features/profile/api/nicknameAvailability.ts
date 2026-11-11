import { apiClient, type ApiSuccess } from "@/shared/lib/api/client";

/** 닉네임을 쓸 수 없는 이유. INVALID_FORMAT은 빈 값 포함 형식 오류, DUPLICATED는 사용 중·보호 중(구분하지 않는다) */
export type NicknameUnavailableReason = "INVALID_FORMAT" | "DUPLICATED";

export type NicknameAvailability = {
  available: boolean;
  /** available이 true면 null */
  reason: NicknameUnavailableReason | null;
};

/**
 * 닉네임 사용 가능 여부 (api-guide "닉네임 사용 가능 여부"). 가입(AUTH-03)·프로필 수정(MY-02)에서 닉네임 칸을 벗어날 때 부른다.
 * 토큰은 선택이다. 가입 중에는 토큰이 없고, 로그인 상태(MY-02)면 공통 클라이언트가 붙여 본인의 현재 닉네임이 true로 온다.
 * 토큰이 틀려도 401이 오지 않는다. 결과는 안내용이고 가입·수정 API가 저장할 때 다시 검사한다(409 DUPLICATED_NICKNAME)
 */
export async function getNicknameAvailability(nickname: string) {
  const { data } = await apiClient.get<ApiSuccess<NicknameAvailability>>(
    "/api/v1/users/nickname-availability",
    { params: { nickname } },
  );
  return data.data;
}
