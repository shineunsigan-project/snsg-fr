"use client";

import { useRouter } from "next/navigation";
import { useState, type ComponentProps } from "react";

import { AuthHeaderButton } from "@/features/auth/components/AuthHeaderButton";
import { useIsLoggedIn } from "@/features/auth/hooks/useIsLoggedIn";

import { saveLoginRedirect } from "@/shared/lib/kakaoLogin";
import { AppHeader } from "@/shared/ui/AppHeader";
import { BottomNav, type BottomNavItem } from "@/shared/ui/BottomNav";
import { FilterChip } from "@/shared/ui/FilterChip";
import { LoginRequiredDialog } from "@/shared/ui/LoginRequiredDialog";
import { ScheduleCard } from "@/shared/ui/ScheduleCard";

import { isIosInAppBrowser } from "../lib/isIosInAppBrowser";
import { OpenInSafariSheet } from "./OpenInSafariSheet";

// Safari 안내를 닫으면 이 창(탭)에서는 다시 띄우지 않는다. 링크를 새로 열면 다시 뜬다 (팀 결정 2026-10-11)
// TODO: "7일 동안 안 띄우기" 체크는 논의 중이다
const SAFARI_GUIDE_DISMISSED_KEY = "safariGuideDismissed";

function shouldShowSafariGuide() {
  try {
    if (sessionStorage.getItem(SAFARI_GUIDE_DISMISSED_KEY)) return false;
  } catch {
    // 저장소를 쓸 수 없는 환경이면 닫은 기록 없이 판단한다
  }
  return isIosInAppBrowser();
}

function dismissSafariGuide() {
  try {
    sessionStorage.setItem(SAFARI_GUIDE_DISMISSED_KEY, "1");
  } catch {
    // 저장하지 못하면 다음 진입에 다시 뜬다
  }
}

// TODO(API): 일정 목록 API가 정해지면 쿼리 훅으로 교체한다. 지금은 Figma 홈(430:28279)의 예시 데이터로 레이아웃만 보여준다
const previewSchedules: Array<
  ComponentProps<typeof ScheduleCard> & { id: string }
> = [
  {
    id: "1",
    category: "보드게임",
    dateLabel: "오늘 19:30",
    title: "보드게임 추리 한 판",
    region: "마포구",
    place: "셜록 미스터리 카페 홍대점",
    participantCount: 4,
    capacity: 6,
    price: 25000,
    badge: { variant: "recruiting" },
  },
  {
    id: "2",
    category: "보드게임",
    dateLabel: "오늘 21:00",
    title: "퇴근 후 전략 게임",
    region: "마포구",
    place: "미스터리 하우스 합정",
    participantCount: 2,
    capacity: 6,
    price: 26000,
    badge: { variant: "recruiting" },
  },
  {
    id: "3",
    dateLabel: "9월 29일 (화) 15:00",
    title: "붉은 달의 연회",
    place: "셜록 미스터리 카페 홍대점",
    participantCount: 5,
    capacity: 5,
    price: 28000,
    badge: { variant: "closed" },
  },
  {
    id: "4",
    category: "보드게임",
    dateLabel: "9.30 (수) 19:00",
    title: "처음 만나는 협력 게임",
    region: "마포구",
    place: "추리극장 연남",
    participantCount: 3,
    capacity: 4,
    price: 24000,
    badge: { variant: "seatsLeft", count: 2 },
  },
  {
    id: "5",
    category: "보드게임",
    dateLabel: "10월 1일 (목) 20:00",
    title: "마지막 열차의 증언",
    region: "마포구",
    place: "미스터리 하우스 합정",
    participantCount: 4,
    capacity: 6,
    price: 25000,
    badge: { variant: "recruiting" },
  },
];

/**
 * 홈 = 모집 중 일정 목록 (USER_FLOW §5, DESIGN §3.5, Figma 430:28279)
 * - 참여한·개설한 일정 탭은 없앴다 (팀 결정 2026-10-11)
 * - TODO(F-7): 필터 칩 → 바텀시트, 필터 값은 URL로 관리. 칩 상태는 Figma의 필터 적용 상태를 그대로 보여준다
 * - 비로그인으로 GNB 일정 개설 → 로그인 필요 모달, GNB 로그인 → 로그인 화면 (USER_FLOW §4.2)
 * - GNB 세 번째 항목은 로그인 상태면 내 정보다
 * - 비로그인 + iOS 앱 안 브라우저면 Safari로 열기 안내 바텀시트를 띄운다 (팀 요청 2026-10-11)
 * - TODO: 카드 → 일정 상세
 */
export function ScheduleHome() {
  const router = useRouter();
  const isLoggedIn = useIsLoggedIn();
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [isSafariGuideOpen, setIsSafariGuideOpen] = useState(false);
  const [hasCheckedSafariGuide, setHasCheckedSafariGuide] = useState(false);

  // 로그인 여부는 브라우저에서 화면을 이어받은 뒤에 확정되므로 그때 한 번 판단한다
  if (!hasCheckedSafariGuide && isLoggedIn !== undefined) {
    setHasCheckedSafariGuide(true);
    if (isLoggedIn === false && shouldShowSafariGuide())
      setIsSafariGuideOpen(true);
  }

  const handleNavSelect = (item: BottomNavItem) => {
    if (item === "create") {
      // TODO: 로그인 상태면 일정 개설 1단계로 이동한다 (화면 미구현)
      if (isLoggedIn === false) setIsLoginDialogOpen(true);
      return;
    }
    // TODO: 내 정보 화면이 생기면 이동한다 (화면 미구현)
    if (item === "login") {
      // 로그인을 마치면 홈으로 돌아온다 (USER_FLOW §4.3)
      saveLoginRedirect("/");
      router.push("/login");
    }
  };

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col bg-background">
      <header className="relative z-10 border-b border-border bg-card pt-safe shadow-header">
        <div className="flex items-center justify-between px-5 pt-4">
          <AppHeader />
          <AuthHeaderButton />
        </div>
        <div className="mx-5 mt-3 border-b border-border">
          <h2 className="-mb-px inline-block border-b-2 border-primary px-1 pb-2.5 text-base font-bold">
            모집 중
          </h2>
        </div>
        <div className="flex gap-2 overflow-x-auto px-5 py-3.5">
          <FilterChip label="보드게임" state="selected" />
          <FilterChip label="마포구" state="selected" />
          <FilterChip label="날짜" />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-5 py-4">
        <ul className="flex flex-col gap-3">
          {previewSchedules.map(({ id, ...schedule }) => (
            <li key={id}>
              <ScheduleCard {...schedule} />
            </li>
          ))}
        </ul>
      </main>

      <BottomNav
        activeItem="schedule"
        isLoggedIn={isLoggedIn}
        onItemSelect={handleNavSelect}
      />

      <LoginRequiredDialog
        open={isLoginDialogOpen}
        onOpenChange={setIsLoginDialogOpen}
      />

      <OpenInSafariSheet
        open={isSafariGuideOpen}
        onOpenChange={(open) => {
          setIsSafariGuideOpen(open);
          if (!open) dismissSafariGuide();
        }}
      />
    </div>
  );
}
