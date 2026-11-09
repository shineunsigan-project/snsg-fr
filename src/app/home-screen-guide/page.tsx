import { Suspense } from "react";

import { HomeScreenGuideScreen } from "@/features/onboarding/components/HomeScreenGuideScreen";

export default function HomeScreenGuidePage() {
  return (
    // 들어온 곳(from)을 URL(useSearchParams)에서 읽으므로 Suspense 경계가 필요하다
    <Suspense>
      <HomeScreenGuideScreen />
    </Suspense>
  );
}
