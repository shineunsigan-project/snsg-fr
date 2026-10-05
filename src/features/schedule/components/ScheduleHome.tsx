"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type ComponentProps } from "react";

import { useIsLoggedIn } from "@/features/auth/hooks/useIsLoggedIn";

import { AppHeader } from "@/shared/ui/AppHeader";
import { BottomNav, type BottomNavItem } from "@/shared/ui/BottomNav";
import { FilterChip } from "@/shared/ui/FilterChip";
import { LoginRequiredDialog } from "@/shared/ui/LoginRequiredDialog";
import { ScheduleCard } from "@/shared/ui/ScheduleCard";
import { SegmentedTabs } from "@/shared/ui/SegmentedTabs";

const tabs = [
  { value: "recruiting", label: "모집 중" },
  { value: "joined", label: "참여한 일정" },
  { value: "hosted", label: "개설한 일정" },
] as const;

type TabValue = (typeof tabs)[number]["value"];

/** URL의 tab 값 (모르는 값이면 모집 중) — 탭은 URL로 관리한다 (TECH_STACK §3.3) */
function toTabValue(value: string | null): TabValue {
  return tabs.find((tab) => tab.value === value)?.value ?? "recruiting";
}

// TODO(API): 일정 목록 API가 정해지면 쿼리 훅으로 교체한다. 지금은 Figma 홈(200:20789)의 예시 데이터로 레이아웃만 보여준다
const previewSchedules: Array<
  ComponentProps<typeof ScheduleCard> & { id: string }
> = [
  {
    id: "1",
    dateLabel: "오늘 21:00",
    title: "사라진 화가의 아틀리에",
    place: "미스터리 하우스 합정",
    participantCount: 2,
    capacity: 6,
    price: 26000,
    badge: { variant: "recruiting" },
  },
  {
    id: "2",
    dateLabel: "9월 29일 (화) 15:00",
    title: "붉은 달의 연회",
    place: "셜록 미스터리 카페 홍대점",
    participantCount: 5,
    capacity: 5,
    price: 28000,
    badge: { variant: "closed" },
  },
  {
    id: "3",
    dateLabel: "9월 30일 (수) 19:00",
    title: "검은 고양이 살인사건",
    place: "추리극장 연남",
    participantCount: 3,
    capacity: 4,
    price: 24000,
    badge: { variant: "seatsLeft", count: 2 },
  },
  {
    id: "4",
    dateLabel: "10월 1일 (목) 20:00",
    title: "마지막 열차의 증언",
    place: "미스터리 하우스 합정",
    participantCount: 4,
    capacity: 6,
    price: 25000,
    badge: { variant: "recruiting" },
  },
];

/**
 * 홈 = 일정 목록 (USER_FLOW §5, DESIGN §3.5)
 * - 탭 값은 URL로 관리한다 (TECH_STACK §3.3)
 * - 비로그인으로 참여한·개설한 일정 탭을 누르면 탭이 바뀌고 로그인 필요 모달이 뜬다 (USER_FLOW §4.2, tab2.jpg).
 *   새로고침·주소로 들어온 경우에도 처음 한 번 띄운다. 취소하면 모달만 닫히고 그 탭 화면에 남는다
 * - TODO(F-7): 필터 칩 → 바텀시트, 필터 값은 URL로 관리. 칩 상태는 Figma의 필터 적용 상태를 그대로 보여준다
 * - 비로그인으로 GNB 일정 개설·내 정보 → 로그인 필요 모달 (USER_FLOW §4.2)
 * - TODO: 카드 → 일정 상세
 */
export function ScheduleHome() {
  const router = useRouter();
  const tab = toTabValue(useSearchParams().get("tab"));
  const isLoggedIn = useIsLoggedIn();
  // 로그인 필요 모달: 탭·GNB를 누를 때, 그리고 처음 들어왔을 때 한 번 연다
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [hasCheckedEntry, setHasCheckedEntry] = useState(false);

  // 처음 들어왔을 때 한 번: 비로그인으로 참여한·개설한 일정 탭에 있으면 모달을 띄운다 (새로고침·주소 직접 접속)
  // 로그인 여부는 브라우저에서 화면을 이어받은 뒤에 확정되므로 그때 판단한다
  if (!hasCheckedEntry && isLoggedIn !== undefined) {
    setHasCheckedEntry(true);
    if (isLoggedIn === false && tab !== "recruiting")
      setIsLoginDialogOpen(true);
  }

  const changeTab = (value: TabValue) => {
    router.replace(value === "recruiting" ? "/" : `/?tab=${value}`, {
      scroll: false,
    });
    if (value !== "recruiting" && isLoggedIn === false) {
      setIsLoginDialogOpen(true);
    }
  };

  const handleNavSelect = (item: BottomNavItem) => {
    if (item === "schedule") return;
    // TODO: 로그인 상태면 일정 개설 1단계·내 정보 화면으로 이동한다 (화면 미구현)
    if (isLoggedIn === false) setIsLoginDialogOpen(true);
  };

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col bg-background">
      <header className="border-b border-border bg-card pt-safe shadow-xs">
        <div className="flex flex-col gap-4 px-5 pt-4 pb-4">
          <AppHeader />
          <SegmentedTabs
            aria-label="일정 구분"
            items={tabs}
            value={tab}
            onValueChange={changeTab}
          />
          {tab === "recruiting" && (
            <div className="flex gap-2 overflow-x-auto">
              <FilterChip label="머더 미스터리" state="selected" />
              <FilterChip label="마포구" state="selected" />
              <FilterChip label="날짜" />
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-5 py-4">
        <h2 className="sr-only">
          {tabs.find((item) => item.value === tab)?.label}
        </h2>
        {tab === "recruiting" ? (
          <ul className="flex flex-col gap-3">
            {previewSchedules.map(({ id, ...schedule }) => (
              <li key={id}>
                <ScheduleCard {...schedule} />
              </li>
            ))}
          </ul>
        ) : (
          // 비로그인: 리스트 자리(빈 카드) 위에 로그인 필요 모달이 뜬다 (tab2.jpg)
          // 로그인: 리스트 여백만 있는 빈 화면
          // TODO(API): 로그인 상태의 참여한·개설한 일정 목록은 일정 API가 생기면 연결한다
          // TODO(D-6): 목록이 없을 때의 빈 화면(USER_FLOW §7.3) 디자인이 확인되면 바꾼다
          isLoggedIn === false && <ListPlaceholder />
        )}
      </main>

      <BottomNav activeItem="schedule" onItemSelect={handleNavSelect} />

      <LoginRequiredDialog
        open={isLoginDialogOpen}
        onOpenChange={setIsLoginDialogOpen}
      />
    </div>
  );
}

/** 비로그인 상태에서 로그인 필요 모달 뒤에 깔리는 리스트 자리 (Figma 로그인 팝업 캡처 tab2.jpg의 배경) */
function ListPlaceholder() {
  return (
    <ul aria-hidden className="flex flex-col gap-4">
      {[0, 1, 2].map((index) => (
        <li key={index} className="h-28 rounded-2xl bg-card" />
      ))}
    </ul>
  );
}
