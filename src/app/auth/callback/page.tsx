import { Suspense } from "react";

import { AuthCallback } from "@/features/auth/components/AuthCallback";
import { PageStatus } from "@/shared/ui/PageStatus";

// 카카오 인증 후 서버가 돌려보내는 주소 (백엔드 FRONTEND_REDIRECT_URI)
export default function AuthCallbackPage() {
  return (
    // useSearchParams를 쓰는 화면은 Suspense 경계가 필요하다
    <Suspense fallback={<PageStatus message="로그인 처리 중..." />}>
      <AuthCallback />
    </Suspense>
  );
}
