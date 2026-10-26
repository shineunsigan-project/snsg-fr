"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { useIsLoggedIn } from "../hooks/useIsLoggedIn";
import { getLoginRedirect } from "@/shared/lib/kakaoLogin";
import { PageStatus } from "@/shared/ui/PageStatus";

/**
 * 카카오 인증을 마친 서버가 돌려보내는 화면 (USER_FLOW §4.2)
 * - 신규 회원(`?signUp=true`, 가입 토큰 쿠키가 있음): 프로필 완성으로 간다
 * - 기존 회원(refresh token 쿠키가 있음): access token을 받아 원래 화면으로 돌아간다
 */
export function AuthCallback() {
  const isSignUp = useSearchParams().get("signUp") === "true";
  return isSignUp ? <SignUpCallback /> : <LoginCallback />;
}

function SignUpCallback() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/signup");
  }, [router]);

  return <PageStatus message="로그인 처리 중..." />;
}

function LoginCallback() {
  const router = useRouter();
  // 재발급 API(POST /api/v1/auth/tokens)로 access token을 받는다
  const isLoggedIn = useIsLoggedIn();

  useEffect(() => {
    if (isLoggedIn === undefined) return;
    if (isLoggedIn) {
      router.replace(getLoginRedirect());
      return;
    }
    // TODO(F-3): 실패 화면이 정해지면 alert를 바꾼다
    alert("로그인에 실패했습니다.");
    router.replace("/login");
  }, [isLoggedIn, router]);

  return <PageStatus message="로그인 처리 중..." />;
}
