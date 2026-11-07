import { useMutation, useQueryClient } from "@tanstack/react-query";

import { postSchedule } from "../api/scheduleCreate";
import { scheduleQueryKeys } from "./scheduleQueryKeys";

export function useCreateSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postSchedule,
    // TODO(LIST-05): 개설한 일정 목록이 생기면 새 일정이 보이는지 확인한다
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: scheduleQueryKeys.schedules }),
  });
}
