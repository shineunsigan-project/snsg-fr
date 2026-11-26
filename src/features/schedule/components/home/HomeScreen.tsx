"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { AuthHeaderButton } from "@/features/auth/components/AuthHeaderButton";
import { useIsLoggedIn } from "@/features/auth/hooks/useIsLoggedIn";
import {
  detectHomeScreenGuidePlatform,
  markHomeScreenGuideOpenedInApp,
  readHomeScreenGuideRecord,
  saveHomeScreenGuideRecord,
  shouldShowOnHome,
  toHomeScreenGuidePath,
} from "@/features/onboarding/lib/homeScreenGuide";

import { saveLoginRedirect } from "@/shared/lib/kakaoLogin";
import { AppHeader } from "@/shared/ui/AppHeader";
import { BottomNav, type BottomNavItem } from "@/shared/ui/BottomNav";

import { SCHEDULE_LIST_PATH } from "../../lib/scheduleListParams";
import { ActivityTiles } from "./ActivityTiles";
import { ClosingSoonSection } from "./ClosingSoonSection";
import { HomeGreeting } from "./HomeGreeting";
import { NewSchedulesSection } from "./NewSchedulesSection";
import { UpcomingSection } from "./UpcomingSection";

/** 스크롤이 멈춘 뒤 스크롤 막대를 숨기기까지 기다리는 시간 */
const SCROLLBAR_HIDE_DELAY_MS = 800;

/**
 * 홈 `/` (USER_FLOW §5.1, 화면 기능 명세서 LIST-06·06-1). 앱을 열면 로그인 여부와 상관없이 처음 보는 화면이다
 * - 홈 화면 추가 안내: `나중에` 7일 뒤 홈에 처음 들어올 때 한 번 (USER_FLOW §9.1, 결정 Q4)
 */
export function HomeScreen({ heading }: { heading: string }) {
  const router = useRouter();
  const isLoggedIn = useIsLoggedIn();

  // 스크롤 막대는 스크롤하는 동안에만 보인다. 멈추고 잠시 뒤 다시 숨긴다
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollEndTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const handleScroll = () => {
    setIsScrolling(true);
    clearTimeout(scrollEndTimer.current);
    scrollEndTimer.current = setTimeout(
      () => setIsScrolling(false),
      SCROLLBAR_HIDE_DELAY_MS,
    );
  };
  useEffect(() => () => clearTimeout(scrollEndTimer.current), []);

  useEffect(() => {
    if (!shouldShowOnHome(readHomeScreenGuideRecord(), Date.now())) return;
    if (!detectHomeScreenGuidePlatform()) return;
    // 보여주는 순간 기록해 두어, 버튼 없이 뒤로 가도 다시 띄우지 않는다(두 번째는 마지막)
    saveHomeScreenGuideRecord({ status: "done" });
    markHomeScreenGuideOpenedInApp();
    router.push(toHomeScreenGuidePath("home"));
  }, [router]);

  const handleNavSelect = (item: BottomNavItem) => {
    if (item === "schedule") router.push(SCHEDULE_LIST_PATH);
    // 입력하던 값은 유지하고 1단계부터 보여준다
    if (item === "create") router.push("/create?step=1");
    if (item === "my") router.push("/my");
    if (item === "login") {
      saveLoginRedirect("/");
      router.push("/login");
    }
  };

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col bg-card">
      <header className="relative z-10 bg-card pt-safe shadow-header">
        <div className="flex items-center justify-between px-5 py-2">
          {/* 홈의 대표 제목은 화면에 보이지 않고 검색엔진이 읽는다 (SHI-220). 문구는 서버(page.tsx)에서 받는다 */}
          <AppHeader hiddenHeading={heading} />
          <AuthHeaderButton />
        </div>
      </header>
      <main
        onScroll={handleScroll}
        data-scrolling={isScrolling}
        className="min-h-0 flex-1 scrollbar-on-scroll overflow-y-auto"
      >
        {/* 스크롤 영역(main) 안에서 구역이 눌려 줄어들지 않도록 높이가 내용만큼 늘어나는 래퍼를 둔다 */}
        <div className="flex flex-col gap-8 px-5 py-6">
          <HomeGreeting isLoggedIn={isLoggedIn} />
          <UpcomingSection isLoggedIn={isLoggedIn} />
          <ActivityTiles />
          <ClosingSoonSection />
          <NewSchedulesSection />
          {/* 곧 마감돼요가 없어도 모집 현황으로 가는 길은 남긴다 */}
          <Link
            href={SCHEDULE_LIST_PATH}
            className="flex h-12 items-center justify-center rounded-2xl bg-secondary text-base font-bold focus-visible:outline-3 focus-visible:outline-ring/50"
          >
            모집 중인 일정 전체보기
          </Link>
        </div>
      </main>
      <BottomNav
        activeItem="home"
        isLoggedIn={isLoggedIn}
        onItemSelect={handleNavSelect}
      />
    </div>
  );
}
