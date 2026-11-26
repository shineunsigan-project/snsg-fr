import type { MetadataRoute } from "next";

import { getScheduleList } from "@/features/schedule/api/schedules";
import { SITE_URL } from "@/shared/lib/seo";
import { cachedForSeconds } from "@/shared/lib/serverCache";

// 빌드 때 만들지 않는다. 빌드 중 일정 API가 안 되면 배포가 실패하고, 빌드 시점의 일정 목록이 그대로 굳기 때문이다.
// 요청 때 만들고, 성공한 결과만 서버 메모리에 1시간 보관한다(아래)
export const dynamic = "force-dynamic";

const CACHE_SECONDS = 3600;

const PAGE_SIZE = 50; // 서버가 한 번에 주는 최대 개수 (api-guide 일정 목록)
const MAX_PAGES = 20; // 일정이 아주 많아져도 사이트맵 생성이 끝없이 이어지지 않게 한다

/**
 * 시작 전·취소되지 않은 일정(모집 중·모집 마감)의 상세 주소.
 * 모집 중 목록 API가 이 일정만 주므로 취소·완료 일정은 자연히 빠진다 (사용자 결정 2026-11-24).
 * 목록 응답에는 `CANCELED`도 올 수 있어(api-guide) noindex 일정이 사이트맵에 섞이지 않게 한 번 더 거른다
 */
async function getSchedulePaths() {
  const paths: string[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const { items, nextCursor } = await getScheduleList({
      tab: "recruiting",
      size: PAGE_SIZE,
      cursor,
    });
    paths.push(
      ...items
        .filter((item) => item.displayStatus !== "CANCELED")
        .map((item) => `/schedules/${item.id}`),
    );
    if (!nextCursor) break;
    cursor = nextCursor;
  }
  return paths;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pagePaths = ["/", "/schedules"];
  // 목록 API가 실패하면 오류를 그대로 낸다(실패한 결과는 보관되지 않는다). 일정 주소가 빠진 사이트맵을 정상으로 내려주지 않는다
  const schedulePaths = await cachedForSeconds(
    "sitemap:schedule-paths",
    CACHE_SECONDS,
    getSchedulePaths,
  );
  // 홈은 canonical·og:url(Next가 슬래시 없이 내보낸다)과 같게 슬래시 없는 대표 주소로 적는다
  return [...pagePaths, ...schedulePaths].map((path) => ({
    url: `${SITE_URL}${path === "/" ? "" : path}`,
  }));
}
