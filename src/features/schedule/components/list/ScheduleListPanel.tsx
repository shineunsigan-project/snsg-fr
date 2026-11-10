"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { INVALID_CURSOR, type ScheduleFilter } from "../../api/schedules";
import { scheduleQueryKeys } from "../../hooks/scheduleQueryKeys";
import { useScheduleList } from "../../hooks/useScheduleList";
import { toScheduleListQuery } from "../../lib/scheduleListParams";
import type { ScheduleListTab } from "../../types";
import { ScheduleListCard } from "./ScheduleListCard";
import { getApiErrorCode } from "@/shared/lib/api/client";
import { saveLoginRedirect } from "@/shared/lib/kakaoLogin";
import { Button } from "@/shared/ui/button";

/**
 * 빈 화면 문구. 참여한·개설한 일정은 시안(LIST-04·05 비로그인 화면) 문구를 그대로 쓰고,
 * 모집 중 결과 없음은 기획에 없어 임의 문구를 쓴다 (TODO(F-19), 사용자 확인 2026-11-02)
 */
const EMPTY_COPY: Record<
  ScheduleListTab,
  { title: string; description: string }
> = {
  recruiting: {
    title: "조건에 맞는 일정이 없어요.",
    description: "필터를 바꿔 보거나,\n직접 일정을 열어보세요.",
  },
  joined: {
    title: "아직 함께한 일정이 없네요.",
    description: "마음에 드는 자리를 하나 골라,\n오늘 누군가와 함께해보세요",
  },
  created: {
    title: "눈치 보느라 망설였다면,\n이번엔 그냥 저질러보세요.",
    description:
      "하고 싶은 일은 당신이 고르고,\n함께할 사람은 쉬는시간이 모아드릴게요.",
  },
};

/** 목록 자리의 빈 화면·안내 (시안 LIST-04·05 비로그인 화면). 화면 가운데에 둔다 */
function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex h-full min-h-64 flex-col items-center justify-center-safe gap-3 px-5 py-10 text-center">
      <p className="text-xl font-bold break-keep whitespace-pre-line">
        {title}
      </p>
      {description && (
        <p className="text-sm break-keep whitespace-pre-line text-muted-foreground">
          {description}
        </p>
      )}
      {action && (
        <Button
          variant="primary"
          className="mt-3 rounded-xl px-6"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}

/**
 * 불러오는 중 (D-5 공통 텍스트 표시).
 * 공통 `PageStatus`는 화면 전체 높이(min-h-dvh)라 탭 안 목록 자리에는 이 표시를 쓴다
 */
function ListLoading() {
  return (
    <p
      role="status"
      className="py-16 text-center text-sm text-muted-foreground"
    >
      불러오는 중...
    </p>
  );
}

/**
 * 탭 하나의 일정 목록 (LIST-01·02·04·05). 20개씩 불러오고 [더 보기]로 이어 붙인다
 * 참여한·개설한 일정은 로그인해야 볼 수 있다. 비로그인이면 안내와 로그인 버튼을 보여준다
 */
export function ScheduleListPanel({
  tab,
  filter,
  isLoggedIn,
  highlightedScheduleId,
}: {
  tab: ScheduleListTab;
  filter: ScheduleFilter;
  /** 로그인 확인 중이면 undefined */
  isLoggedIn: boolean | undefined;
  /** 방금 연 일정. 개설한 일정 탭에서 이 카드만 강조한다 */
  highlightedScheduleId?: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const needsLogin = tab !== "recruiting";
  const {
    data: schedules,
    error,
    isError,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
  } = useScheduleList(tab, filter, !needsLogin || isLoggedIn === true);

  if (needsLogin && isLoggedIn === false) {
    return (
      <EmptyState
        {...EMPTY_COPY[tab]}
        action={{
          label: "로그인 후 사용 가능합니다",
          onClick: () => {
            // 로그인 후 지금 보던 탭·필터 그대로 돌아온다 (USER_FLOW §4.3)
            saveLoginRedirect(toScheduleListQuery(tab, filter));
            router.push("/login");
          },
        }}
      />
    );
  }
  // 첫 페이지를 못 받았을 때만 목록 자리 전체를 오류로 바꾼다. 받은 목록이 있으면 다시 받다 실패해도 그대로 둔다.
  // [더 보기]가 실패하면 그 자리에 `다시 시도`를 보여준다 (팀 결정 2026-11-03, Q2)
  if (schedules === undefined) {
    return isError ? (
      <EmptyState
        title="일정을 불러오지 못했어요."
        action={{ label: "다시 시도", onClick: () => refetch() }}
      />
    ) : (
      <ListLoading />
    );
  }

  if (schedules.length === 0) {
    const emptyAction =
      tab === "joined"
        ? {
            label: "모집 중인 일정 보기",
            onClick: () => router.push(toScheduleListQuery("recruiting", {})),
          }
        : tab === "created"
          ? {
              label: "일정 개설하기",
              onClick: () => router.push("/create?step=1"),
            }
          : undefined;
    return <EmptyState {...EMPTY_COPY[tab]} action={emptyAction} />;
  }

  // 커서가 잘못됐으면(400 INVALID_CURSOR) 받은 목록을 버리고 cursor 없이 처음부터 다시 받는다 (api-guide 일정 목록 오류)
  const loadMore = () =>
    isFetchNextPageError && getApiErrorCode(error) === INVALID_CURSOR
      ? queryClient.resetQueries({
          queryKey: scheduleQueryKeys.list(tab, filter),
          // 필터 없는 키가 다른 필터의 목록까지 지우지 않게 이 목록만
          exact: true,
        })
      : fetchNextPage();

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-3">
        {schedules.map((schedule) => (
          <li key={schedule.id}>
            <ScheduleListCard
              schedule={schedule}
              tab={tab}
              isHighlighted={schedule.id === highlightedScheduleId}
            />
          </li>
        ))}
      </ul>
      {hasNextPage && (
        <Button
          variant="secondary"
          disabled={isFetchingNextPage}
          onClick={loadMore}
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
