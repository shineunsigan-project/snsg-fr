import { useMutation } from "@tanstack/react-query";

import { postKakaoCallback } from "../api/kakaoLogin";

export function useKakaoLogin() {
  return useMutation({ mutationFn: postKakaoCallback });
}
