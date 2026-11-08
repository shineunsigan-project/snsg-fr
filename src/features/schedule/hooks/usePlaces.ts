import { useQuery } from "@tanstack/react-query";

import { getPlaces } from "../api/scheduleCreate";
import { scheduleQueryKeys } from "./scheduleQueryKeys";

/**
 * 장소 후보. 화면을 열 때와 지역을 바꿀 때마다 새로 부른다 (api-guide 화면별로 쓰는 API)
 * 지역 코드를 빼면(`전체` 칩) 전체 지역이다. 지역을 아직 정하지 못했으면 부르지 않는다
 */
export function usePlaces({
  categoryId,
  regionCode,
  enabled,
}: {
  categoryId: string | null;
  regionCode: string | undefined;
  enabled: boolean;
}) {
  return useQuery({
    queryKey: scheduleQueryKeys.places(categoryId ?? "", regionCode ?? ""),
    queryFn: () => getPlaces({ categoryId: categoryId ?? "", regionCode }),
    enabled: enabled && categoryId !== null,
    // 결과를 저장하지 않고 열 때마다 새로 부른다
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
    retry: false,
  });
}
