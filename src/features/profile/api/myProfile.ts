import type { Gender } from "@/features/auth/types";
import { apiClient, type ApiSuccess } from "@/shared/lib/api/client";

// TODO(API): 미확정 — 내 프로필 조회·수정·사진 업로드 임시 계약 (SHI-158 결정 Q2, 2026-11-05)
// api-guide(snsg-be develop 64502e4)에 이 API들이 없다. 지금은 MSW로만 응답한다
// 백엔드에 확인할 것: 경로·필드 이름, nicknameChangeableAt 형식, 닉네임 14일 제한 거부 code,
// profileImageUrl에 도메인이 붙는지, 이메일 삭제 표현(아래는 가입 API처럼 `""`으로 가정)

/** 내 프로필 (USER_FLOW §8 MY-01) */
export type MyProfile = {
  /** 실명. 가입 후 수정 불가 */
  name: string;
  nickname: string;
  /** 가입 후 수정 불가 (SHI-158 결정 Q1) */
  gender: Gender;
  /** `yyyy-MM-dd`. 가입 후 수정 불가 */
  birthDate: string;
  /** 선택 입력. 없으면 null */
  email: string | null;
  /** 없으면 null(기본 이미지). 가입 업로드 응답처럼 도메인 없는 경로일 수 있다 */
  profileImageUrl: string | null;
  /**
   * 닉네임을 다시 바꿀 수 있는 시각. 한국 시간 `yyyy-MM-ddTHH:mm:ss`(api-guide 날짜·시간).
   * 제한이 없으면 null. 마지막 변경 후 14일(USER_FLOW §8.1)은 서버가 판정한다
   */
  nicknameChangeableAt: string | null;
};

/**
 * 프로필 수정 요청. **바뀐 항목만** 담는다(USER_FLOW §8.1). 이름·성별·생년월일은 보내지 않는다
 * - email: `""`이면 삭제한다(가입 API의 "`\"\"`이면 없음"과 같게 가정). null은 쓰지 않는다
 * - profileImageUrl: postMyProfileImage가 돌려준 경로만 넣는다
 */
export type UpdateMyProfileRequest = {
  nickname?: string;
  email?: string;
  profileImageUrl?: string;
};

/** 닉네임 14일 제한 기간에 닉네임을 바꾸려 할 때의 code. TODO(API): 임시 이름 */
export const NICKNAME_CHANGE_RESTRICTED_CODE = "NICKNAME_CHANGE_RESTRICTED";

/** 내 프로필 조회 (MY-01, MY-02 기본값) */
export async function getMyProfile() {
  const { data } =
    await apiClient.get<ApiSuccess<MyProfile>>("/api/v1/users/me");
  return data.data;
}

/** 내 프로필 수정 (MY-02). 응답은 수정된 프로필 */
export async function patchMyProfile(body: UpdateMyProfileRequest) {
  const { data } = await apiClient.patch<ApiSuccess<MyProfile>>(
    "/api/v1/users/me",
    body,
  );
  return data.data;
}

/** 로그인 사용자의 프로필 사진 업로드 (MY-02). 5MB 이하 JPG·PNG. 돌려받은 경로를 수정 요청에 넣는다 */
export async function postMyProfileImage(image: File) {
  const body = new FormData();
  body.append("image", image);
  const { data } = await apiClient.post<
    ApiSuccess<{ profileImageUrl: string }>
  >("/api/v1/users/me/profile-image", body);
  return data.data.profileImageUrl;
}
