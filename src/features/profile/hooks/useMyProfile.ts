import { useQuery } from "@tanstack/react-query";

import { getMyProfile } from "../api/myProfile";
import { profileQueryKeys } from "./profileQueryKeys";

/** 내 프로필 (MY-01). 로그인 상태에서만 부른다 */
export function useMyProfile(enabled: boolean) {
  return useQuery({
    queryKey: profileQueryKeys.me,
    queryFn: getMyProfile,
    enabled,
  });
}
