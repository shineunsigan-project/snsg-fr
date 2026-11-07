import { useMutation, useQueryClient } from "@tanstack/react-query";

import { patchMyProfile } from "../api/myProfile";
import { profileQueryKeys } from "./profileQueryKeys";
import { scheduleQueryKeys } from "@/features/schedule/hooks/scheduleQueryKeys";

/**
 * 내 프로필 수정 (MY-02). 응답이 수정된 프로필이라 내 프로필 캐시를 그 값으로 바꾼다
 * 일정 상세·참여자 명단에 닉네임·사진이 보이므로 일정 쿼리도 무효화한다
 */
export function useUpdateMyProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: patchMyProfile,
    onSuccess: (profile) => {
      queryClient.setQueryData(profileQueryKeys.me, profile);
      return queryClient.invalidateQueries({
        queryKey: scheduleQueryKeys.schedules,
      });
    },
  });
}
