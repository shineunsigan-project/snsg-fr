import { Suspense } from "react";

import { KakaoCallback } from "@/features/auth/components/KakaoCallback";
import { PageStatus } from "@/shared/ui/PageStatus";

// 카카오 Redirect URI (NEXT_PUBLIC_KAKAO_REDIRECT_URI와 같은 경로)
export default function KakaoCallbackPage() {
  return (
    // useSearchParams를 쓰는 화면은 Suspense 경계가 필요하다
    <Suspense fallback={<PageStatus message="로그인 처리 중..." />}>
      <KakaoCallback />
    </Suspense>
  );
}
