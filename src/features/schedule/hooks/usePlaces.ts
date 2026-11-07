import { useQuery } from "@tanstack/react-query";

import { getPlaces } from "../api/scheduleCreate";
import type { Region } from "../api/regions";
import { scheduleQueryKeys } from "./scheduleQueryKeys";

/** 장소 검색. 화면을 열 때와 지역을 바꿀 때마다 새로 검색한다 (기능 요구사항 정의서 v0.3 03 장소 관리) */
export function usePlaces(
  keyword: string | undefined,
  regions: readonly Region[] | undefined,
) {
  return useQuery({
    queryKey: scheduleQueryKeys.places(
      keyword ?? "",
      regions?.map((region) => region.code) ?? [],
    ),
    queryFn: () =>
      getPlaces({ keyword: keyword ?? "", regions: regions ?? [] }),
    enabled: !!keyword && !!regions?.length,
    // 결과를 저장하지 않고 열 때마다 새로 검색한다
    staleTime: 0,
    gcTime: 0,
    // 창으로 돌아올 때마다 다시 검색하지 않는다 (네이버 검색 호출 한도)
    refetchOnWindowFocus: false,
    retry: false,
  });
}
