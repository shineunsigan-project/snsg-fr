"use client";

import { isAxiosError } from "axios";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useIsLoggedIn } from "@/features/auth/hooks/useIsLoggedIn";
import { ScheduleHistoryView } from "@/features/schedule/components/history/ScheduleHistoryView";
import { useScheduleHistory } from "@/features/schedule/hooks/useScheduleHistory";
import { SCHEDULE_LIST_PATH } from "@/features/schedule/lib/scheduleListParams";
import { saveLoginRedirect } from "@/shared/lib/kakaoLogin";
import { BottomNav, type BottomNavItem } from "@/shared/ui/BottomNav";

const HISTORY_PATH = "/my/history";

/**
 * 참여 이력 MY-01-1 (USER_FLOW §8). 내 정보 `참여 이력 ›`로 들어온다
 * 비로그인이거나 401이면 로그인 화면으로 보내고, 로그인 후 이 화면으로 돌아오게 한다 (USER_FLOW §4.3)
 */
export function ScheduleHistoryScreen() {
  const router = useRouter();
  const isLoggedIn = useIsLoggedIn();
  const history = useScheduleHistory(isLoggedIn === true);
  const isUnauthorized =
    isLoggedIn === false ||
    (isAxiosError(history.error) && history.error.response?.status === 401);

  useEffect(() => {
    if (!isUnauthorized) return;
    saveLoginRedirect(HISTORY_PATH);
    router.replace("/login");
  }, [isUnauthorized, router]);

  const handleNavSelect = (item: BottomNavItem) => {
    if (item === "home") router.push("/");
    if (item === "schedule") router.push(SCHEDULE_LIST_PATH);
    if (item === "create") router.push("/create?step=1");
    if (item === "my") router.push("/my");
  };

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col bg-card">
      <ScheduleHistoryView
        schedules={isUnauthorized ? undefined : history.items}
        isError={history.isInitialError && !isUnauthorized}
        onRetry={() => history.refetch()}
        hasNextPage={history.hasNextPage}
        isFetchingNextPage={history.isFetchingNextPage}
        isFetchNextPageError={history.isFetchNextPageError}
        onLoadMore={() => history.fetchNextPage()}
      />
      <BottomNav
        activeItem="my"
        isLoggedIn={isLoggedIn}
        onItemSelect={handleNavSelect}
      />
    </div>
  );
}
