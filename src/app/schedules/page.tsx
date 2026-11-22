import { Suspense } from "react";

import { ScheduleListScreen } from "@/features/schedule/components/ScheduleListScreen";

export default function ScheduleListPage() {
  return (
    // 탭 값을 URL(useSearchParams)에서 읽으므로 Suspense 경계가 필요하다
    <Suspense>
      <ScheduleListScreen />
    </Suspense>
  );
}
