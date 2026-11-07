import { useQuery } from "@tanstack/react-query";

import { getActivities } from "../api/scheduleCreate";
import { scheduleQueryKeys } from "./scheduleQueryKeys";

export function useActivities() {
  return useQuery({
    queryKey: scheduleQueryKeys.activities,
    queryFn: getActivities,
  });
}
