"use client";

import { ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { useIsLoggedIn } from "../hooks/useIsLoggedIn";
import { startKakaoLogin } from "@/shared/lib/kakaoLogin";
import { PRIVACY_POLICY_URL, TERMS_URL } from "@/shared/lib/legalUrls";
import { canGoBackInApp } from "@/shared/lib/navigation";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { SocialLoginButton } from "@/shared/ui/SocialLoginButton";

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
    // 넓은 화면에서 최대 폭 밖으로 늘어나는 양옆은 페이지 바탕(흰색)이고, 로그인 영역만 검정 바탕 + 이미지다
    <main
      aria-busy={isChecking}
      className="relative isolate mx-auto grid h-dvh max-w-md grid-rows-[1fr_1fr] overflow-y-auto bg-black px-5 pt-safe pb-safe"
    >
      {/* 배경: 검정 바탕 위에 로그인 화면 배경 사진(`login-bg.jpg`)을 불투명도 60%로 깐다. 검정 막(40%)을 얹은 것과 같아 흰 글자가 읽힌다 (사용자 요청 2026-11-23) */}
      <Image
        src="/images/login-bg.jpg"
        alt=""
        fill
        priority
        // 세로로 긴 화면을 채우려고 이미지가 가로 약 1500px로 늘어난다. 작은 이미지가 내려가지 않게 큰 폭을 알려 준다
        sizes="1700px"
        className="-z-10 object-cover opacity-60"
      />

      {/* 화면을 위·아래 절반으로 나눈다. 위 절반: 로고와 문구를 중앙선 바로 위(32px)에 놓는다 (사용자 요청 2026-11-23) */}
      <div className="flex flex-col justify-end pb-6">
        {/* 로고: 가운데, 배경 없이 검정 바탕 위에 바로 놓는다. 색은 필터로 흰색으로 바꾼다. 문구 바로 위(약 24px) */}
        <div className="flex justify-center pb-4">
          <Image
            src="/images/snsg-logo.png"
            alt="쉬는시간"
            width={2720}
            height={937}
            priority
            className="h-10 w-auto brightness-0 invert"
          />
        </div>

        <div className="py-2 text-center">
          <h1 className="text-display font-bold break-keep text-white">
            눈치 보느라 망설였다면,
            <br />
            이번엔 그냥 저질러보세요.
          </h1>
          <p className="mt-3 text-base text-white">
            사람 모아서, 하고 싶은 거 해보세요.
          </p>
        </div>
      </div>

      {/* 아래 절반: 버튼·약관은 세로 중앙선보다 24px 아래에서 시작한다. 중앙선 위로는 올라가지 않는다 */}
      <div className="pt-6">
        <div className={cn("flex flex-col gap-4", isChecking && "invisible")}>
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

        <p className="mt-4 mb-7 text-center text-2xs break-keep text-white">
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
