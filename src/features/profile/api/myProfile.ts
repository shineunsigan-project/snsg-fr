import type { Gender } from "@/features/auth/types";
import type { AgeGroup } from "@/features/schedule/api/scheduleDetail";
import { apiClient, type ApiSuccess } from "@/shared/lib/api/client";

// 내 정보 API (api-guide "내 정보"). 모두 access token이 필요하다.
// 토큰의 사용자가 없거나 탈퇴했으면 404 USER_NOT_FOUND다(남은 access token으로 부른 경우)

/** 사용자가 없거나 탈퇴했을 때의 code. 로그인 화면으로 보낸다 (api-guide 공통 규칙) */
export const USER_NOT_FOUND_CODE = "USER_NOT_FOUND";

/** 내 프로필 (USER_FLOW §8 MY-01). nicknameChangeableAt 외의 필드는 null이 아니다 */
export type MyProfile = {
  id: string;
  /** 실명. 가입 후 수정 불가 */
  name: string;
  nickname: string;
  /** 가입 후 수정 불가 (SHI-158 결정 Q1) */
  gender: Gender;
  /** `yyyy-MM-dd`. 가입 후 수정 불가 */
  birthDate: string;
  /** 선택 입력. 등록하지 않았으면 빈 문자열 */
  email: string;
  /** 도메인 없는 경로(`/images/...`)나 소셜 사진 주소. 사진을 올린 적이 없으면 기본 이미지 경로다. 화면에서는 toApiImageUrl로 쓴다 */
  profileImageUrl: string;
  /** 오늘(한국 시간) 기준 만 나이의 연령대. 서버가 계산한다 */
  ageGroup: AgeGroup;
  /**
   * 닉네임을 다시 바꿀 수 있는 시각. 한국 시간 `yyyy-MM-ddTHH:mm:ss`(api-guide 날짜·시간).
   * 지금 바꿀 수 있으면 null. 마지막 변경 후 14일(USER_FLOW §8.1)은 서버가 판정한다
   */
  nicknameChangeableAt: string | null;
};

/**
 * 프로필 수정 요청. **바뀐 항목만** 담는다(USER_FLOW §8.1). 이름·성별·생년월일은 보내지 않는다
 * - email: `""`이면 이메일을 지운다
 * - profileImageUrl: postMyProfileImage가 돌려준 경로만 넣는다. 아니면 400 INVALID_PROFILE_IMAGE_URL
 */
export type UpdateMyProfileRequest = {
  nickname?: string;
  email?: string;
  profileImageUrl?: string;
};

/** 닉네임 14일 제한 기간에 닉네임을 바꾸려 할 때의 code (409) */
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
