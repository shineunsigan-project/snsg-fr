import { useMutation, useQueryClient } from "@tanstack/react-query";

import { postSchedule } from "../api/scheduleCreate";
import { scheduleQueryKeys } from "./scheduleQueryKeys";

export function useCreateSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postSchedule,
    // 모집 중·개설한 일정 목록을 다시 불러와 새 일정을 보여준다
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: scheduleQueryKeys.schedules }),
  });
}
