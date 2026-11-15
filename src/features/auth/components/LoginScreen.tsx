"use client";

import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { useIsLoggedIn } from "../hooks/useIsLoggedIn";
import { startKakaoLogin } from "@/shared/lib/kakaoLogin";
import { canGoBackInApp } from "@/shared/lib/navigation";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { SocialLoginButton } from "@/shared/ui/SocialLoginButton";

// 개인정보처리방침·이용약관 문서 주소 (기능 요구사항 정의서 v0.3, DESIGN §3.2)
const PRIVACY_POLICY_URL = "https://info.shineunsigan.com/privacy.html";
const TERMS_URL = "https://info.shineunsigan.com/terms.html";

/**
 * 로그인 화면 (Figma 247:21229, DESIGN §3.1)
 * 앱 시작 화면이 아니다. 로그인 실패·재발급 실패, 헤더·GNB 로그인, 탈퇴 이후에 들어온다 (USER_FLOW §3)
 */
export function LoginScreen() {
  const router = useRouter();
  const isLoggedIn = useIsLoggedIn();

  // 로그인한 사람은 이 화면을 쓰지 않는다. 보통은 앱 서버(proxy.ts)가 화면을 그리기 전에 홈으로 보낸다(SHI-186).
  // 표시용 쿠키가 없을 때의 안전장치: 앱 안에서 왔으면 앞 화면으로, 아니면 홈으로 (USER_FLOW §4.2, SHI-185)
  // 저장한 복귀 경로로 보내지 않는다. 같은 화면이 기록에 또 쌓여 뒤로가기를 해도 같은 화면이 반복된다
  const hasLeftRef = useRef(false);
  useEffect(() => {
    if (!isLoggedIn || hasLeftRef.current) return;
    hasLeftRef.current = true;
    if (canGoBackInApp()) router.back();
    else router.replace("/");
  }, [isLoggedIn, router]);

  // 확인 중이거나 나가는 중에는 이미지·문구는 그대로 두고 버튼만 숨긴다(자리는 유지). 버튼이 보였다가 사라지지 않게 한다
  const isChecking = isLoggedIn !== false;

  // 로그인 후 돌아갈 화면은 이 화면으로 보낸 쪽이 저장해 둔다 (USER_FLOW §4.3)
  // 앱 안에서 왔으면 방문 기록의 로그인 화면을 카카오 이동으로 바꾼다(SHI-186). 로그인 뒤 뒤로·앞으로 가기에 끼어들지 않는다.
  // 주소를 직접 열었으면 바꾸지 않는다. 바꾸면 카카오 화면에서 뒤로가기할 때 사이트 밖으로 나간다
  const handleKakaoStart = () =>
    startKakaoLogin({ replaceHistory: canGoBackInApp() });

  return (
    // 넓은 화면에서 최대 폭 밖으로 늘어나는 양옆은 앱 기본 배경(bg.app)이고, 로그인 영역만 브랜드 녹색이다
    <main
      aria-busy={isChecking}
      className="mx-auto flex h-dvh max-w-md flex-col justify-center-safe overflow-y-auto bg-brand px-5 pt-safe pb-safe"
    >
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

        <div
          className={cn("mt-6 flex flex-col gap-4", isChecking && "invisible")}
        >
          <SocialLoginButton asset="kakao-large" onClick={handleKakaoStart} />
          {/* TODO(T-5): 네이버 인증을 연결하면 카카오 버튼 아래에 `naver-large` 버튼을 다시 둔다. 연결 전이라 숨긴다(사용자 결정 2026-11-15) */}
          <Button
            variant="outline-inverse"
            className="rounded-lg text-md"
            nativeButton={false}
            render={<Link href="/" />}
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
    // 새 탭을 열지 않고 같은 창에서 연다. 뒤로가기로 로그인 화면에 돌아온다 (기능 요구사항 정의서 v0.3)
    <a
      href={href}
      className="inline-flex items-center gap-0.5 font-semibold text-white underline underline-offset-2"
    >
      {children}
      <ExternalLink aria-hidden className="size-2.5" />
    </a>
  );
}
