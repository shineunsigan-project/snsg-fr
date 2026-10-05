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
    // 넓은 화면에서 최대 폭 밖으로 늘어나는 양옆은 앱 기본 배경(bg.app)이고, 로그인 영역만 브랜드 녹색이다
    <main className="mx-auto flex h-dvh max-w-md flex-col justify-center-safe overflow-y-auto bg-brand px-5 pt-safe pb-safe">
      {/* 대표 이미지 (DESIGN §3.1) — 폭에 맞춘 5:4 상자 (휴대폰 350×280, 웹에서는 최대 408×326)
          낮은 화면(iPhone SE 등)에서는 이 상자만 줄어들어 아래 버튼·안내가 스크롤 없이 보인다 */}
      <div
        aria-hidden
        className="relative mt-5.5 aspect-5/4 min-h-0 w-full overflow-hidden rounded-3xl bg-background"
      >
        {/* 애니메이션이 SVG 안의 스크립트(SVGator)로 동작한다. <img>로 넣으면 스크립트가 돌지 않아 멈춰 보이므로 <object>로 넣는다 */}
        <object
          type="image/svg+xml"
          data="/images/snsg-loop.svg"
          tabIndex={-1}
          // 상자 크기를 정하지 않고 채우기만 한다 (SVG 자체 크기 때문에 상자가 줄어들지 못하는 것을 막는다)
          className="pointer-events-none absolute inset-0 size-full"
        />
      </div>

      {/* 이미지와 문구 사이는 항상 32px. 화면이 길면 이미지부터 약관까지 묶음 전체가 세로 가운데에 놓인다 */}
      <div className="shrink-0 pt-8">
        <p className="text-md font-medium text-on-brand-accent">쉬는시간</p>
        <h1 className="mt-3 text-display font-bold break-keep text-white">
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

        <p className="mt-4 mb-7 text-center text-2xs break-keep text-on-brand-muted/85">
          로그인 하시면{" "}
          <ExternalTextLink href={PRIVACY_POLICY_URL}>
            개인정보처리방침
          </ExternalTextLink>{" "}
          및 <ExternalTextLink href={TERMS_URL}>이용약관</ExternalTextLink>에
          동의하는 것으로 간주됩니다
        </p>
      </div>
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
