"use client";

import { ExternalLink } from "lucide-react";
import Link from "next/link";

import { markGuest } from "../lib/authStorage";
import { getKakaoAuthorizeUrl, toSafeRedirectPath } from "../lib/kakaoOAuth";
import { Button } from "@/shared/ui/button";
import { SocialLoginButton } from "@/shared/ui/SocialLoginButton";

// 개인정보처리방침·이용약관 문서 주소 (DESIGN §3.2)
const PRIVACY_POLICY_URL = "https://shineunsigan.com/privacy.html";
const TERMS_URL = "https://shineunsigan.com/terms.html";

/**
 * 로그인 화면 (Figma 247:21229, DESIGN §3.1)
 * 앱 시작 화면이 아니다. 로그인 필요 모달의 `카카오 로그인`, 로그아웃·탈퇴 이후에만 들어온다 (USER_FLOW §3)
 */
export function LoginScreen() {
  // 실제 카카오 인증 페이지로 이동한다. 로그인 후 돌아올 화면(redirect)은 state로 넘긴다 (USER_FLOW §4.3)
  const handleKakaoStart = () => {
    const redirect = new URLSearchParams(window.location.search).get(
      "redirect",
    );
    window.location.assign(getKakaoAuthorizeUrl(toSafeRedirectPath(redirect)));
  };
  // TODO: 네이버 인증을 연결한다 (TECH_STACK T-5)
  const handleNaverStart = () => {};

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col bg-brand px-5 pt-safe pb-safe">
      {/* TODO: 대표 이미지 에셋을 받으면 교체한다 (DESIGN §3.1) */}
      <div
        aria-hidden
        className="mt-5.5 min-h-40 flex-1 rounded-3xl bg-background"
      />

      <p className="mt-8 text-md font-medium text-on-brand-accent">쉬는시간</p>
      <h1 className="mt-3 text-display font-bold text-white">
        눈치 보느라 망설였다면,
        <br />
        이번엔 그냥 저질러보세요.
      </h1>
      <p className="mt-3 text-base text-on-brand-muted">
        사람 모아서, 하고 싶은 거 해보세요.
      </p>

      <div className="mt-6 flex flex-col gap-4">
        <SocialLoginButton asset="kakao-large" onClick={handleKakaoStart} />
        <SocialLoginButton asset="naver-large" onClick={handleNaverStart} />
        <Button
          variant="outline-inverse"
          className="rounded-lg text-md"
          nativeButton={false}
          render={<Link href="/" onClick={markGuest} />}
        >
          로그인 없이 둘러보기
        </Button>
      </div>

      <p className="mt-4 mb-7 text-center text-2xs text-on-brand-muted/85">
        로그인 하시면{" "}
        <ExternalTextLink href={PRIVACY_POLICY_URL}>
          개인정보처리방침
        </ExternalTextLink>{" "}
        및 <ExternalTextLink href={TERMS_URL}>이용약관</ExternalTextLink>에
        동의하는 것으로 간주됩니다
      </p>
    </main>
  );
}

function ExternalTextLink({
  href,
  children,
}: {
  href: string;
  children: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-0.5 font-semibold text-white underline underline-offset-2"
    >
      {children}
      <ExternalLink aria-hidden className="size-2.5" />
      <span className="sr-only">(새 창)</span>
    </a>
  );
}
