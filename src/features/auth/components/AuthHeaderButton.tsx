"use client";

import { useRouter } from "next/navigation";

import { useIsLoggedIn } from "../hooks/useIsLoggedIn";
import { useLogout } from "../hooks/useLogout";
import { saveLoginRedirect } from "@/shared/lib/kakaoLogin";

/**
 * 헤더 오른쪽 로그인·로그아웃 버튼 (팀 요청 2026-10-07, 로그인 모양은 Figma 430:28279)
 * TODO(D-13): 로그아웃 시안이 없어 로그인과 같은 모양으로 둔다
 */
export function AuthHeaderButton() {
  const router = useRouter();
  const isLoggedIn = useIsLoggedIn();
  const { mutate: logout, isPending } = useLogout();

  // 로그인 여부를 확인하기 전에는 그리지 않는다 (로그인↔로그아웃 글자가 바뀌어 보이지 않게)
  if (isLoggedIn === undefined) return null;

  // 보이는 알약은 36px이고, 터치 영역은 버튼 높이 44px로 잡는다
  const className = "flex min-h-11 items-center disabled:opacity-50";
  const pill =
    "flex h-9 items-center rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground";

  if (!isLoggedIn) {
    return (
      <button
        type="button"
        className={className}
        onClick={() => {
          // 로그인을 마치면 지금 화면으로 돌아온다 (USER_FLOW §4.3)
          const { pathname, search } = window.location;
          saveLoginRedirect(pathname + search);
          router.push("/login");
        }}
      >
        <span className={pill}>로그인</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      className={className}
      disabled={isPending}
      onClick={() =>
        logout(undefined, {
          // 로그아웃하면 홈으로 간다 (팀 결정 2026-10-11, USER_FLOW §4.2)
          onSettled: () => router.replace("/"),
        })
      }
    >
      <span className={pill}>로그아웃</span>
    </button>
  );
}
