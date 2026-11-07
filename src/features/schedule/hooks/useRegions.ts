import { useQuery } from "@tanstack/react-query";

import { getRegions } from "../api/regions";
import { scheduleQueryKeys } from "./scheduleQueryKeys";

export function useRegions() {
  return useQuery({
    queryKey: scheduleQueryKeys.regions,
    queryFn: getRegions,
  });
}
