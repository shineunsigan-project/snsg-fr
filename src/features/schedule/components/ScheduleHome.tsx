"use client";

import { useState, type ComponentProps } from "react";

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
 * - 참여한·개설한 일정 탭 → 로그인 필요 모달 (USER_FLOW §4.2). 취소하면 모집 중 탭에 그대로 남는다
 *   TODO: 인증 상태가 생기면 로그인한 사용자는 모달 없이 탭을 전환하고, 탭 값은 URL로 관리한다 (TECH_STACK §3.3)
 * - TODO(F-7): 필터 칩 → 바텀시트, 필터 값은 URL로 관리. 칩 상태는 Figma의 필터 적용 상태를 그대로 보여준다
 * - GNB 일정 개설·내 정보 → 로그인 필요 모달 (USER_FLOW §4.2)
 * - TODO: 카드 → 일정 상세
 */
export function ScheduleHome() {
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);

  const handleTabChange = (value: (typeof tabs)[number]["value"]) => {
    // 인증 상태 확인은 아직 없다. 로그인이 필요한 탭은 항상 모달을 띄운다
    if (value !== "recruiting") setIsLoginDialogOpen(true);
  };

  const handleNavSelect = (item: BottomNavItem) => {
    // 인증 상태 확인은 아직 없다. 일정 개설·내 정보는 항상 모달을 띄운다
    if (item !== "schedule") setIsLoginDialogOpen(true);
  };

  // TODO: 로그인 화면으로 이동하고 돌아올 화면을 redirect 파라미터로 넘긴다 (USER_FLOW §4.2, §4.3)
  const handleKakaoLogin = () => {};

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col bg-background">
      <header className="border-b border-border bg-card pt-safe shadow-xs">
        <div className="flex flex-col gap-4 px-5 pt-4 pb-4">
          <AppHeader />
          <SegmentedTabs
            aria-label="일정 구분"
            items={tabs}
            value="recruiting"
            onValueChange={handleTabChange}
          />
          <div className="flex gap-2 overflow-x-auto">
            <FilterChip label="머더 미스터리" state="selected" />
            <FilterChip label="마포구" state="selected" />
            <FilterChip label="날짜" />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-5 py-4">
        <h2 className="sr-only">모집 중인 일정</h2>
        <ul className="flex flex-col gap-3">
          {previewSchedules.map(({ id, ...schedule }) => (
            <li key={id}>
              <ScheduleCard {...schedule} />
            </li>
          ))}
        </ul>
      </main>

      <BottomNav activeItem="schedule" onItemSelect={handleNavSelect} />

      <LoginRequiredDialog
        open={isLoginDialogOpen}
        onOpenChange={setIsLoginDialogOpen}
        onKakaoLogin={handleKakaoLogin}
      />
    </div>
  );
}
