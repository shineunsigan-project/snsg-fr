"use client";

import Link from "next/link";
import { useState } from "react";

import type { Activity } from "../../api/activities";
import type { ScheduleListItem } from "../../api/schedules";
import { useActivities } from "../../hooks/useActivities";
import { useNewlyOpenedSchedules } from "../../hooks/useHomeSchedules";
import { formatDateBlock, isNewScheduleToday } from "../../lib/scheduleDate";
import {
  ACTIVITY_ORDER,
  ACTIVITY_TONE,
  DEFAULT_ACTIVITY_TONE,
} from "./activityTone";
import { HomeSectionError } from "./HomeSectionError";
import { cn } from "@/shared/lib/utils";
import { NewBadge } from "@/shared/ui/NewBadge";
import { Skeleton, SkeletonGroup } from "@/shared/ui/Skeleton";
import { StatusBadge } from "@/shared/ui/StatusBadge";

/** 활동 칩 하나. 보이는 알약은 36px이고 터치 영역은 버튼 높이 44px로 잡는다 */
function ActivityChip({
  label,
  isSelected,
  onClick,
}: {
  label: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={onClick}
      className="flex min-h-11 shrink-0 items-center"
    >
      <span
        className={cn(
          "flex h-9 items-center rounded-full border px-4 text-sm font-semibold",
          isSelected
            ? "border-brand-border bg-brand-soft text-brand"
            : "border-border bg-card text-muted-foreground",
        )}
      >
        {label}
      </span>
    </button>
  );
}

/**
 * 새로 열린 일정 행 (홈 화면 시안). 왼쪽 날짜 칸(활동 색) · 오른쪽: 배지 + 제목 / `활동 · 지역 · 시간` / `인원 · 상태`.
 * 모집완료는 배지 `모집완료`와 회색 인원만 보인다. 남은 자리 표시 기준은 일정 목록(모집 중 탭)과 같다 (SHI-189)
 */
function NewScheduleRow({
  schedule,
  tone,
}: {
  schedule: ScheduleListItem;
  /** 날짜 칸 색 */
  tone: string;
}) {
  const { month, day, weekday } = formatDateBlock(schedule.startAt);
  const isClosed =
    schedule.displayStatus !== "RECRUITING" || schedule.remainingSeats === 0;
  const seatsLabel =
    schedule.confirmedCount >= Math.ceil(schedule.capacity / 2)
      ? `${schedule.remainingSeats}자리 남음`
      : "모집중";
  return (
    <Link
      href={`/schedules/${schedule.id}`}
      className="flex items-stretch gap-3.5 px-4 py-4 focus-visible:outline-3 focus-visible:outline-ring/50"
    >
      <span
        aria-hidden
        className={cn(
          "flex w-13.5 shrink-0 flex-col items-center justify-center rounded-xl font-bold",
          tone,
        )}
      >
        {/* 칸은 오른쪽 글자 영역 높이만큼 꽉 차고, 줄 높이를 정해 세 줄(14 + 24 + 14)이 안에 들어가게 한다 */}
        <span className="text-xs leading-3.5">{month}</span>
        <span className="text-2xl leading-6">{day}</span>
        <span className="text-xs leading-3.5">{weekday}</span>
      </span>
      <span className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <span className="flex min-w-0 items-center gap-1.5">
          {isClosed ? (
            <StatusBadge variant="closed" />
          ) : (
            isNewScheduleToday(schedule.createdAt) && <NewBadge />
          )}
          <span className="truncate text-md font-bold">{schedule.title}</span>
        </span>
        <span className="truncate text-sm text-muted-foreground">
          {schedule.category.name}
          {schedule.regionName && ` · ${schedule.regionName}`}
          {` · ${schedule.startAt.slice(11, 16)}`}
        </span>
        <span
          className={cn(
            "text-sm font-bold",
            isClosed ? "text-muted-foreground" : "text-brand",
          )}
        >
          {schedule.confirmedCount}/{schedule.capacity}명
          {!isClosed && ` · ${seatsLabel}`}
        </span>
      </span>
    </Link>
  );
}

function NewSchedulesSkeleton() {
  return (
    <SkeletonGroup className="flex flex-col gap-4 rounded-3xl border border-border bg-card px-4 py-4">
      {[0, 1, 2].map((index) => (
        <div key={index} className="flex items-center gap-3.5">
          <Skeleton className="h-14.5 w-13.5 shrink-0 rounded-xl" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </SkeletonGroup>
  );
}

/**
 * 새로 열린 일정 (홈 화면 시안): 제목 · 활동 칩(전체 / 보드게임 / 방탈출 / 산책) · 최근 개설 5개.
 * 칩을 고르면 그 활동의 일정만 받는다. 고른 칩은 화면 안에서만 기억한다(주소에 넣지 않는다).
 * `전체`가 0개면 구역 전체를 숨긴다. 고른 활동만 0개면 목록 자리에 안내를 보여 준다. 📝 안내 문구는 시안에 없어 임시 TODO(F-19)
 */
export function NewSchedulesSection() {
  const [activityId, setActivityId] = useState<string | undefined>();
  const { data: activities } = useActivities();
  const { data: allSchedules } = useNewlyOpenedSchedules();
  const {
    data: schedules,
    isError,
    refetch,
  } = useNewlyOpenedSchedules(activityId);

  if (allSchedules?.length === 0) return null;

  // 서버 활동 목록의 code로 칩 순서와 날짜 칸 색을 정한다. 목록에 없는 활동은 칩을 만들지 않는다
  const chips = ACTIVITY_ORDER.flatMap((code) => {
    const activity = activities?.find((item) => item.code === code);
    return activity ? [activity] : [];
  });
  const toneOf = (categoryId: string) => {
    const code = activities?.find(
      (activity: Activity) => activity.id === categoryId,
    )?.code;
    return (code && ACTIVITY_TONE[code]) || DEFAULT_ACTIVITY_TONE;
  };

  return (
    <section
      aria-labelledby="home-new-schedules-title"
      className="flex flex-col gap-1"
    >
      <h2 id="home-new-schedules-title" className="text-lg font-bold">
        새로 열린 일정
      </h2>
      <div className="-mx-5 scrollbar-hidden flex gap-2 overflow-x-auto px-5 pb-2">
        <ActivityChip
          label="전체"
          isSelected={activityId === undefined}
          onClick={() => setActivityId(undefined)}
        />
        {chips.map((activity) => (
          <ActivityChip
            key={activity.id}
            label={activity.name}
            isSelected={activityId === activity.id}
            onClick={() => setActivityId(activity.id)}
          />
        ))}
      </div>
      {schedules === undefined ? (
        isError ? (
          <HomeSectionError onRetry={() => refetch()} />
        ) : (
          <NewSchedulesSkeleton />
        )
      ) : schedules.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">
          조건에 맞는 일정이 없어요.
        </p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card">
          {schedules.map((schedule) => (
            <li key={schedule.id}>
              <NewScheduleRow
                schedule={schedule}
                tone={toneOf(schedule.category.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
