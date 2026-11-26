import type { Metadata } from "next";

import {
  getActivities,
  type Activity,
} from "@/features/schedule/api/activities";
import {
  getScheduleDetail,
  isScheduleNotFound,
  type ScheduleDetail,
} from "@/features/schedule/api/scheduleDetail";
import { ScheduleDetailScreen } from "@/features/schedule/components/detail/ScheduleDetailScreen";
import { formatScheduleDateTime } from "@/features/schedule/lib/scheduleDate";
import { UUID_PATTERN } from "@/features/schedule/lib/scheduleListParams";
import { cachedForSeconds } from "@/shared/lib/serverCache";
import {
  getActivityOgImage,
  NO_INDEX_METADATA,
  OG_IMAGES,
  SITE_INTRO,
  SITE_TAGLINE,
  socialMetadata,
} from "@/shared/lib/seo";

/**
 * 일정 공유 제목·설명은 PM 문구 그대로다 (사용자 결정 2026-11-24).
 * 화면 컴포넌트는 데이터를 화면이 뜬 뒤에 받으므로, 검색엔진·카카오톡 미리보기가 읽을 값은 여기서 서버가 미리 받아 채운다
 */
export async function generateMetadata({
  params,
}: PageProps<"/schedules/[scheduleId]">): Promise<Metadata> {
  const { scheduleId } = await params;
  // 형식이 틀린 주소는 서버에 묻지 않고 검색에서 뺀다
  if (!UUID_PATTERN.test(scheduleId)) return NO_INDEX_METADATA;

  let detail: ScheduleDetail;
  let activities: Activity[];
  // 조회 실패만 잡는다. 아래 문구 조립의 코드 오류까지 삼키지 않는다
  try {
    // 홈·목록 카드가 미리 불러올 때마다 이 함수가 실행되므로 짧게 보관한다. 상세는 1분, 거의 안 바뀌는 활동 목록은 1시간
    [detail, activities] = await Promise.all([
      cachedForSeconds(`schedule:${scheduleId}`, 60, () =>
        getScheduleDetail(scheduleId),
      ),
      // 활동 목록이 실패해도 일정 문구는 내려준다. 이미지만 대표 이미지로 둔다
      cachedForSeconds("activities", 3600, getActivities).catch(() => []),
    ]);
  } catch (error) {
    if (isScheduleNotFound(error)) return NO_INDEX_METADATA;
    // 서버 오류처럼 일시적인 실패는 색인 상태를 건드리지 않고 상위(layout)의 제목·설명 기본값을 쓴다.
    // 다만 주소(canonical·og:url)는 홈이 아니라 이 일정으로 둔다. 홈 주소가 카카오톡 미리보기·검색에 남지 않게 한다
    const fallbackPath = `/schedules/${scheduleId.toLowerCase()}`;
    return {
      alternates: { canonical: fallbackPath },
      ...socialMetadata({
        title: SITE_TAGLINE,
        description: SITE_INTRO,
        path: fallbackPath,
        image: OG_IMAGES.boardGame,
      }),
    };
  }

  const activityCode = activities.find(
    (activity) => activity.id === detail.category.id,
  )?.code;

  // 활동 정보를 찾을 수 없으면 활동 이름이 빈 문자열로 온다
  const activity = detail.category.name ? `[${detail.category.name}] ` : "";
  const title = `${activity}${detail.title} · ${formatScheduleDateTime(detail.startAt)}`;
  // 지역 정보를 찾을 수 없으면 구가 빈 문자열로 온다
  const place = [detail.place.regionName, detail.place.name]
    .filter(Boolean)
    .join(" ");
  const description = `${place} · ${detail.capacity}명 모집 | 쉬는시간에서 모임을 보고 바로 참여해 보세요.`;
  // 주소창의 값이 아니라 서버가 준 id로 정한다. 대문자 등 다른 표기의 주소도 같은 일정 하나로 모인다
  const path = `/schedules/${detail.id}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    // 취소·완료된 일정은 검색에서 뺀다. 공유 미리보기는 그대로 보인다 (사용자 결정 2026-11-24)
    ...(detail.displayStatus === "CANCELED" ||
    detail.displayStatus === "COMPLETED"
      ? NO_INDEX_METADATA
      : {}),
    ...socialMetadata({
      title,
      description,
      path,
      image: getActivityOgImage(activityCode),
    }),
  };
}

export default async function ScheduleDetailPage({
  params,
}: PageProps<"/schedules/[scheduleId]">) {
  const { scheduleId } = await params;
  return <ScheduleDetailScreen scheduleIdParam={scheduleId} />;
}
