import type { Metadata } from "next";
import { Suspense } from "react";

import { ScheduleListScreen } from "@/features/schedule/components/ScheduleListScreen";
import {
  OG_IMAGES,
  SCHEDULE_LIST_DESCRIPTION,
  SCHEDULE_LIST_TITLE,
  socialMetadata,
} from "@/shared/lib/seo";

export const metadata: Metadata = {
  title: SCHEDULE_LIST_TITLE,
  description: SCHEDULE_LIST_DESCRIPTION,
  // `?tab=`·필터가 붙은 주소도 이 주소 하나로 모아 검색에 올린다
  alternates: { canonical: "/schedules" },
  ...socialMetadata({
    title: SCHEDULE_LIST_TITLE,
    description: SCHEDULE_LIST_DESCRIPTION,
    path: "/schedules",
    image: OG_IMAGES.boardGame,
  }),
};

export default function ScheduleListPage() {
  return (
    <>
      {/* 화면에는 안 보이는 대표 제목. 아래 화면은 Suspense 안이라 첫 HTML에 빠지므로 바깥에 둔다 */}
      <h1 className="sr-only">{SCHEDULE_LIST_TITLE}</h1>
      {/* 탭 값을 URL(useSearchParams)에서 읽으므로 Suspense 경계가 필요하다 */}
      <Suspense>
        <ScheduleListScreen />
      </Suspense>
    </>
  );
}
