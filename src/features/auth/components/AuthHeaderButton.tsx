"use client";

import { useRouter } from "next/navigation";

import { useIsLoggedIn } from "../hooks/useIsLoggedIn";
import { saveLoginRedirect } from "@/shared/lib/kakaoLogin";

/**
 * 홈 헤더 오른쪽 로그인 버튼 (팀 요청 2026-10-07, Figma 430:28279)
 * 로그인 상태에서는 아무것도 그리지 않는다. 로그아웃은 내 정보에서만 한다 (USER_FLOW §4.2, 팀 결정 2026-10-28)
 */
export function AuthHeaderButton() {
  const router = useRouter();
  const isLoggedIn = useIsLoggedIn();

  // 로그인 여부를 확인하기 전에는 그리지 않는다 (로그인 상태인데 버튼이 잠깐 보이지 않게)
  if (isLoggedIn !== false) return null;

  return (
    // 보이는 알약은 36px이고, 터치 영역은 버튼 높이 44px로 잡는다
    <button
      type="button"
      className="flex min-h-11 items-center"
      onClick={() => {
        // 로그인을 마치면 지금 화면으로 돌아온다 (USER_FLOW §4.3)
        const { pathname, search } = window.location;
        saveLoginRedirect(pathname + search);
        router.push("/login");
      }}
    >
      <span className="flex h-9 items-center rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground">
        로그인
      </span>
    </button>
  );
}
