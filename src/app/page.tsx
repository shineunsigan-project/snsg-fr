import { Suspense } from "react";

import { ScheduleHome } from "@/features/schedule/components/ScheduleHome";

export default function Home() {
  return (
    // 탭 값을 URL(useSearchParams)에서 읽으므로 Suspense 경계가 필요하다
    <Suspense>
      <ScheduleHome />
    </Suspense>
  );
}
