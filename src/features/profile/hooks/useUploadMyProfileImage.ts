import { useMutation } from "@tanstack/react-query";

import { postMyProfileImage } from "../api/myProfile";

/** 로그인 사용자의 프로필 사진 업로드 (MY-02). 돌려받은 경로를 프로필 수정 요청에 넣는다 */
export function useUploadMyProfileImage() {
  return useMutation({ mutationFn: postMyProfileImage });
}
