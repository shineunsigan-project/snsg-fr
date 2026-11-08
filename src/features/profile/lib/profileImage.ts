import {
  PROFILE_IMAGE_MAX_MB,
  PROFILE_IMAGE_TYPES,
} from "../schemas/profileSchema";
import { getApiErrorCode } from "@/shared/lib/api/client";

// 프로필 완성(가입)과 프로필 수정(MY-02)이 같이 쓴다. 문구는 USER_FLOW §4.1 "유효성 검사 문구"
const INVALID_TYPE_MESSAGE = "JPG, PNG 형식의 사진만 올릴 수 있어요.";

/**
 * 고른 사진을 검사하고 미리보기 URL을 만든다. 실패하면 토스트로 보여줄 문구를 돌려준다
 * 성공했을 때 받은 previewUrl은 쓰는 쪽에서 URL.revokeObjectURL로 해제한다
 */
export async function loadProfileImage(
  file: File,
): Promise<{ previewUrl: string } | { errorMessage: string }> {
  // 서버는 파일 내용으로 판별한다. 여기서는 형식 정보로 먼저 걸러 내고, 확장자만 바꾼 파일은 업로드 400으로 안내한다
  if (!PROFILE_IMAGE_TYPES.includes(file.type)) {
    return { errorMessage: INVALID_TYPE_MESSAGE };
  }
  if (file.size > PROFILE_IMAGE_MAX_MB * 1024 * 1024) {
    return {
      errorMessage: `${PROFILE_IMAGE_MAX_MB}MB 이하의 이미지만 등록할 수 있어요.`,
    };
  }
  // 형식은 맞아도 깨진 파일은 미리보기를 그릴 수 없으므로 먼저 열어 본다
  const previewUrl = URL.createObjectURL(file);
  const image = new Image();
  image.src = previewUrl;
  try {
    await image.decode();
  } catch {
    URL.revokeObjectURL(previewUrl);
    return { errorMessage: "사진을 불러올 수 없어요. 다른 사진을 골라주세요." };
  }
  return { previewUrl };
}

/** 사진 업로드 실패를 토스트 문구로. 400 INVALID_PROFILE_IMAGE는 형식 안내, 그 밖은 다시 시도 안내 */
export function getProfileImageUploadErrorMessage(error: unknown) {
  return getApiErrorCode(error) === "INVALID_PROFILE_IMAGE"
    ? INVALID_TYPE_MESSAGE
    : "사진을 올리지 못했어요. 다시 시도해주세요.";
}
