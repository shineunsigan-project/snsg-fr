"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

import { useKakaoLogin } from "../hooks/useKakaoLogin";
import { saveAuthSession, saveSignupDraft } from "../lib/authStorage";
import { toSafeRedirectPath } from "../lib/kakaoOAuth";
import { PageStatus } from "@/shared/ui/PageStatus";

/** 카카오 Redirect URI 화면 — 인가 코드를 꺼내 로그인 API에 넘기고 다음 화면으로 보낸다 */
export function KakaoCallback() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { mutateAsync: login } = useKakaoLogin();
  // 인가 코드는 한 번만 쓸 수 있다. 개발 모드에서 effect가 두 번 실행돼도 요청은 한 번만 보낸다
  const hasRequested = useRef(false);

  useEffect(() => {
    if (hasRequested.current) return;
    hasRequested.current = true;

    const code = searchParams.get("code");
    const redirect = toSafeRedirectPath(searchParams.get("state"));
    const redirectQuery = `redirect=${encodeURIComponent(redirect)}`;

    // TODO(F-3): 실패 화면이 정해지면 alert를 바꾼다. 카카오 취소·오류는 code 없이 error만 붙어서 온다
    const handleFailure = () => {
      alert("로그인에 실패했습니다.");
      router.replace(`/login?${redirectQuery}`);
    };

    if (!code) {
      handleFailure();
      return;
    }

    login({ code })
      .then(
        ({
          authStatus,
          accessToken,
          refreshToken,
          user,
          signupToken,
          requiredFields,
          socialUser,
        }) => {
          // 기존 회원 (또는 가입이 끝난 회원): 토큰을 저장하고 원래 화면으로 돌아간다 (USER_FLOW §4.3)
          if (accessToken && user) {
            saveAuthSession({ accessToken, refreshToken, user });
            router.replace(redirect);
            return;
          }
          // 신규 회원: 가입 토큰과 카카오 정보를 보관하고 프로필 완성으로 간다 (USER_FLOW §4.1)
          if (authStatus === "ADDITIONAL_INFO_REQUIRED" && signupToken) {
            saveSignupDraft({
              signupToken,
              requiredFields: requiredFields ?? [],
              socialUser: socialUser ?? null,
            });
            router.replace(`/signup?${redirectQuery}`);
            return;
          }
          handleFailure();
        },
      )
      .catch(handleFailure);
  }, [searchParams, router, login]);

  return <PageStatus message="로그인 처리 중..." />;
}
