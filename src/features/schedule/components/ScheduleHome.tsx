"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { AuthHeaderButton } from "@/features/auth/components/AuthHeaderButton";
import { useIsLoggedIn } from "@/features/auth/hooks/useIsLoggedIn";

import { saveLoginRedirect } from "@/shared/lib/kakaoLogin";
import { cn } from "@/shared/lib/utils";
import { AppHeader } from "@/shared/ui/AppHeader";
import { BottomNav, type BottomNavItem } from "@/shared/ui/BottomNav";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

import type { ScheduleFilter } from "../api/schedules";
import { clearCreatedNotice, readCreatedNotice } from "../lib/createdNotice";
import {
  readScheduleFilter,
  readScheduleTab,
  toScheduleListQuery,
} from "../lib/scheduleListParams";
import type { ScheduleListTab } from "../types";
import { ScheduleCreatedDialog } from "./create/ScheduleCreatedDialog";
import { ScheduleFilterBar } from "./list/ScheduleFilterBar";
import { ScheduleListPanel } from "./list/ScheduleListPanel";

const TAB_LABELS: Array<{ value: ScheduleListTab; label: string }> = [
  { value: "recruiting", label: "모집 중" },
  { value: "joined", label: "참여한 일정" },
  { value: "created", label: "개설한 일정" },
];

/**
 * 홈 = 일정 목록 (USER_FLOW §5, 화면 기능 명세서 LIST-01 ~ LIST-05)
 * - 탭: 모집 중 / 참여한 일정 / 개설한 일정. 탭과 필터 값은 URL에 둔다(기기에 저장하지 않는다)
 * - 필터(활동·지역·날짜)는 모집 중 탭에만 있다
 * - GNB 일정 개설 → 로그인 여부와 상관없이 개설 1단계. 로그인은 `일정 열기`에서 한다 (USER_FLOW §7.7)
 * - GNB 로그인 → 로그인 화면, 로그인 후 지금 보던 탭으로 돌아온다 (USER_FLOW §4.2)
 * - 일정을 열고 오면(개설한 일정 탭) 완료 팝업을 한 번 띄운다 (CRT-07). 장소명은 개설 화면이 탭 단위 저장소에 남긴다
 */
export function ScheduleHome() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = readScheduleTab(searchParams);
  const filter = readScheduleFilter(searchParams);
  const isLoggedIn = useIsLoggedIn();

  // 처음 그릴 때 한 번만 읽는다. 서버 렌더링에서는 저장소가 없어 null이다
  const [createdPlaceName, setCreatedPlaceName] = useState(() =>
    typeof window === "undefined" ? null : readCreatedNotice(),
  );
  // 읽은 값은 바로 지워 새로고침이나 다시 방문했을 때 팝업이 또 뜨지 않게 한다
  useEffect(() => {
    if (createdPlaceName !== null) clearCreatedNotice();
  }, [createdPlaceName]);

  const showList = (nextTab: ScheduleListTab, nextFilter: ScheduleFilter) =>
    router.replace(toScheduleListQuery(nextTab, nextFilter), {
      scroll: false,
    });

  const handleNavSelect = (item: BottomNavItem) => {
    if (item === "create") {
      // 입력하던 값은 유지하고 1단계부터 보여준다
      router.push("/create?step=1");
      return;
    }
    // TODO: 내 정보 화면이 생기면 이동한다 (화면 미구현)
    if (item === "login") {
      saveLoginRedirect(toScheduleListQuery(tab, filter));
      router.push("/login");
    }
  };

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col bg-background">
      <Tabs
        value={tab}
        // Base UI가 값을 any로 넘겨서, 주소를 읽을 때와 같은 함수로 탭 값을 좁힌다
        onValueChange={(value) =>
          showList(
            readScheduleTab(new URLSearchParams({ tab: String(value) })),
            filter,
          )
        }
        className="min-h-0 flex-1 gap-0"
      >
        {/* 모집 중 탭만 흰 헤더 + 그림자, 참여한·개설한 일정 탭은 앱 배경 (시안 LIST-01·04·05) */}
        <header
          className={cn(
            "relative z-10 pt-safe",
            tab === "recruiting" ? "bg-card shadow-header" : "bg-background",
          )}
        >
          <div className="flex items-center justify-between px-5 pt-4">
            <AppHeader />
            <AuthHeaderButton />
          </div>
          <div className="px-5 pt-3">
            {/* 탭 버튼 높이 44px(터치 영역)가 되게 트랙을 52px로 둔다. 시안 트랙은 약 45pt */}
            <TabsList className="h-13 w-full rounded-xl bg-secondary p-1">
              {TAB_LABELS.map(({ value, label }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="h-full rounded-lg text-sm font-semibold text-muted-foreground data-active:bg-card data-active:text-foreground"
                >
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          {tab === "recruiting" && (
            <ScheduleFilterBar
              filter={filter}
              onApply={(next) => showList("recruiting", next)}
            />
          )}
        </header>

        {TAB_LABELS.map(({ value }) => (
          <TabsContent
            key={value}
            value={value}
            className="min-h-0 overflow-y-auto px-5 py-4"
          >
            <ScheduleListPanel
              tab={value}
              filter={filter}
              isLoggedIn={isLoggedIn}
            />
          </TabsContent>
        ))}
      </Tabs>

      <BottomNav
        activeItem="schedule"
        isLoggedIn={isLoggedIn}
        onItemSelect={handleNavSelect}
      />

      <ScheduleCreatedDialog
        open={createdPlaceName !== null}
        placeName={createdPlaceName || undefined}
        onConfirm={() => setCreatedPlaceName(null)}
      />
    </div>
  );
}
