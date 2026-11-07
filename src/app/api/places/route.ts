import { NextResponse, type NextRequest } from "next/server";

import type { Region } from "@/features/schedule/api/regions";
import type { Place } from "@/features/schedule/api/scheduleCreate";
import type { ApiFailure, ApiSuccess } from "@/shared/lib/api/client";

// 일정 개설 장소 검색 (CRT-02). 네이버 검색 API(지역)는 Client Secret이 필요하고 브라우저 CORS를 허용하지 않아 서버에서만 호출한다
// TODO(API): 백엔드 장소 API가 생기면 이 Route Handler를 지우고 백엔드로 바꾼다
const NAVER_LOCAL_SEARCH_URL = "https://openapi.naver.com/v1/search/local.json";
// 지역 검색 API가 한 번에 주는 최대 개수 (네이버 개발자 문서: display 최대 5)
const NAVER_LOCAL_DISPLAY = 5;
// 활동 키워드(예: 보드게임카페)만 받는다. 임의의 긴 검색어로 쓰이지 않게 길이를 제한한다
const KEYWORD_MAX_LENGTH = 20;
// 지역은 `코드 5자리:시군구 이름`(예: 11440:마포구)으로 받는다. 검색어에 이름이 들어가므로 형식을 제한한다
const REGION_PATTERN = /^(\d{5}):([가-힣]{1,10})$/;
// 서비스 지역 수보다 넉넉한 상한. 한 요청이 네이버 검색을 지나치게 많이 부르지 않게 한다
const REGION_MAX_COUNT = 10;

type NaverLocalItem = {
  title: string;
  address: string;
  roadAddress: string;
  mapx: string;
  mapy: string;
};

const failure = (status: number, code: string, message: string) =>
  NextResponse.json<ApiFailure>(
    { isSuccess: false, code, message },
    { status },
  );

const stripTags = (text: string) => text.replace(/<[^>]*>/g, "");

export async function GET(request: NextRequest) {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return failure(
      503,
      "PLACE_SEARCH_NOT_CONFIGURED",
      "장소 검색 키가 설정되지 않았습니다.",
    );
  }

  const keyword = request.nextUrl.searchParams.get("keyword")?.trim() ?? "";
  const regionParams = request.nextUrl.searchParams.getAll("region");
  // `전체`는 지역마다 각각 검색해 합친다. TODO(F-18): `전체` 칩의 검색어가 정해지면 바꾼다
  const targets = regionParams.flatMap((param): Region[] => {
    const match = REGION_PATTERN.exec(param);
    return match ? [{ code: match[1], name: match[2] }] : [];
  });
  if (
    !keyword ||
    keyword.length > KEYWORD_MAX_LENGTH ||
    targets.length === 0 ||
    targets.length !== regionParams.length ||
    targets.length > REGION_MAX_COUNT
  ) {
    return failure(400, "INVALID_REQUEST", "요청 형식이 올바르지 않습니다.");
  }

  try {
    const results = await Promise.all(
      targets.map(async (target) => {
        const url = new URL(NAVER_LOCAL_SEARCH_URL);
        url.searchParams.set("query", `${target.name} ${keyword}`);
        url.searchParams.set("display", String(NAVER_LOCAL_DISPLAY));
        const response = await fetch(url, {
          headers: {
            "X-Naver-Client-Id": clientId,
            "X-Naver-Client-Secret": clientSecret,
          },
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error(`naver local search ${response.status}`);
        }
        const body: { items?: NaverLocalItem[] } = await response.json();
        return (body.items ?? []).flatMap((item): Place[] => {
          const roadAddress = item.roadAddress || item.address;
          // 주소가 선택한 구에 속하는 장소만 남긴다 (기능 요구사항 정의서 v0.3 03 장소 관리)
          if (!roadAddress.split(" ").includes(target.name)) return [];
          // 확인 필요: mapx·mapy는 WGS84 경도·위도 × 10^7 정수 문자열로 알고 있다 (2023년 이후 문서 기준)
          const longitude = Number(item.mapx) / 1e7;
          const latitude = Number(item.mapy) / 1e7;
          if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
            return [];
          }
          return [
            {
              name: stripTags(item.title),
              roadAddress,
              latitude,
              longitude,
              // TODO(API): 법정동 10자리는 주소→코드 변환 API가 정해지면 채운다. 지금은 시·군·구 5자리
              regionCode: target.code,
            },
          ];
        });
      }),
    );

    // 같은 장소(장소명 + 주소 일치)는 하나만 남긴다
    const places = new Map<string, Place>();
    for (const place of results.flat()) {
      places.set(`${place.name}|${place.roadAddress}`, place);
    }
    return NextResponse.json<ApiSuccess<Place[]>>({
      isSuccess: true,
      data: [...places.values()],
    });
  } catch (error) {
    // 키·응답 본문은 남기지 않는다
    console.error(
      "[api/places]",
      error instanceof Error ? error.message : "unknown",
    );
    return failure(502, "PLACE_SEARCH_FAILED", "장소를 검색하지 못했습니다.");
  }
}
