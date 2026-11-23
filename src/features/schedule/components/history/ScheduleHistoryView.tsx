import { ChevronLeft } from "lucide-react";
import Link from "next/link";

import type { HistoryItem } from "../../hooks/useScheduleHistory";
import { ScheduleHistoryCard } from "./ScheduleHistoryCard";
import { Button } from "@/shared/ui/button";
import { Skeleton, SkeletonGroup } from "@/shared/ui/Skeleton";

/** 참여 이력 제목줄. 뒤로 `‹`는 내 정보로 간다 (시안 MY-01-1) */
export function ScheduleHistoryHeader() {
  return (
    <header className="relative z-10 bg-card px-5 pt-safe shadow-header">
      <div className="flex h-14 items-center">
        <Link
          href="/my"
          aria-label="뒤로 가기"
          className="-ml-2.5 flex size-11 shrink-0 items-center justify-center text-foreground"
        >
          <ChevronLeft aria-hidden className="size-6" />
        </Link>
        <h1 className="flex-1 text-center text-lg font-bold">참여 이력</h1>
        {/* 제목이 가운데 오도록 뒤로 버튼과 같은 폭을 비운다 */}
        <span aria-hidden className="-mr-2.5 size-11 shrink-0" />
      </div>
    </header>
  );
}

/** 불러오는 중. 카드와 같은 크기·간격으로 4장 */
export function ScheduleHistorySkeleton() {
  return (
    <SkeletonGroup className="flex flex-col gap-3 px-5 py-4">
      <Skeleton className="h-4 w-28" />
      {[0, 1, 2, 3].map((index) => (
        <div
          key={index}
          className="flex flex-col gap-2.5 rounded-2xl border border-border bg-card px-4 py-3.5"
        >
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </SkeletonGroup>
  );
}

type ScheduleHistoryViewProps = {
  /** 아직 받지 못했으면 undefined */
  schedules: HistoryItem[] | undefined;
  /** 첫 페이지를 받지 못했다 */
  isError: boolean;
  onRetry: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isFetchNextPageError: boolean;
  onLoadMore: () => void;
};

/**
 * MY-01-1 참여 이력 화면 모양. 페이지가 h-dvh 컨테이너와 하단 GNB 사이에 넣으므로 남은 높이를 채우고 본문만 스크롤한다
 * `지난 일정 n`의 n은 서버가 총 개수를 주지 않아 지금까지 불러온 개수다 (사용자 결정 2026-11-23)
 */
export function ScheduleHistoryView({
  schedules,
  isError,
  onRetry,
  hasNextPage,
  isFetchingNextPage,
  isFetchNextPageError,
  onLoadMore,
}: ScheduleHistoryViewProps) {
  let body;
  if (schedules === undefined) {
    body = isError ? (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-5 text-center">
        {/* 📝 임시 문구 TODO(F-19) */}
        <p className="text-sm text-muted-foreground">
          참여 이력을 불러오지 못했어요.
        </p>
        <Button variant="secondary" onClick={onRetry}>
          다시 시도
        </Button>
      </div>
    ) : (
      <ScheduleHistorySkeleton />
    );
  } else if (schedules.length === 0) {
    body = (
      <p className="flex min-h-0 flex-1 items-center justify-center px-5 text-center text-base font-semibold text-muted-foreground">
        아직 지난 일정이 없어요
      </p>
    );
  } else {
    body = (
      <div className="flex flex-col gap-3 px-5 py-4">
        <p className="text-sm font-semibold text-muted-foreground">
          지난 일정 {schedules.length} · 최근 순
        </p>
        <ul className="flex flex-col gap-3">
          {schedules.map((schedule) => (
            <li key={`${schedule.role}-${schedule.id}`}>
              <ScheduleHistoryCard schedule={schedule} />
            </li>
          ))}
        </ul>
        {hasNextPage && (
          <Button
            variant="secondary"
            disabled={isFetchingNextPage}
            onClick={onLoadMore}
          >
            {isFetchingNextPage
              ? "불러오는 중..."
              : isFetchNextPageError
                ? "다시 시도"
                : "더 보기"}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ScheduleHistoryHeader />
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {body}
      </main>
    </div>
  );
}
