import { Suspense } from "react";

import { CreateScheduleFlow } from "@/features/schedule/components/create/CreateScheduleFlow";
import { NO_INDEX_METADATA } from "@/shared/lib/seo";

export const metadata = NO_INDEX_METADATA;

export default function CreateSchedulePage() {
  return (
    // 단계(step)·지역(region)을 URL(useSearchParams)에서 읽으므로 Suspense 경계가 필요하다
    <Suspense>
      <CreateScheduleFlow />
    </Suspense>
  );
}
