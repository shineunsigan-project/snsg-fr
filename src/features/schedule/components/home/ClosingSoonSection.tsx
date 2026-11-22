"use client";

import Link from "next/link";

import type { ScheduleListItem } from "../../api/schedules";
import { useActivities } from "../../hooks/useActivities";
import { useClosingSoonSchedules } from "../../hooks/useHomeSchedules";
import {
  formatClosingSoonDateTime,
  getDdayLabel,
} from "../../lib/scheduleDate";
import { SCHEDULE_LIST_PATH } from "../../lib/scheduleListParams";
import { ACTIVITY_TONE, DEFAULT_ACTIVITY_TONE } from "./activityTone";
import { HomeSectionError } from "./HomeSectionError";
import { Skeleton, SkeletonGroup } from "@/shared/ui/Skeleton";

/**
 * 곧 마감돼요 카드 (홈 화면 수정 시안). 흰 카드, 카드 전체가 일정 상세로 가는 링크다.
 * 위: 활동 칩(활동 색) · `D-n`, 제목 / 아래: `약속 시간 · 지역`, 모집 인원 막대, `N자리 남음`
 */
function ClosingSoonCard({
  schedule,
  tone,
}: {
  schedule: ScheduleListItem;
  /** 활동 칩 색 */
  tone: string;
}) {
  const dday = getDdayLabel(schedule.startAt);
  const filledPercent = Math.min(
    100,
    Math.round((schedule.confirmedCount / schedule.capacity) * 100),
  );
  return (
    <Link
      href={`/schedules/${schedule.id}`}
      className="flex h-full flex-col justify-between gap-3 rounded-2xl border border-border bg-card p-4 focus-visible:outline-3 focus-visible:outline-ring/50"
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`rounded-md px-2.5 py-1 text-tag font-semibold ${tone}`}
          >
            {schedule.category.name}
          </span>
          {dday && (
            <span className="shrink-0 text-sm font-bold text-brand">
              {dday}
            </span>
          )}
        </div>
        <h3 className="truncate text-base font-bold">{schedule.title}</h3>
      </div>
      <div className="flex flex-col gap-2">
        <p className="truncate text-sm text-muted-foreground">
          {formatClosingSoonDateTime(schedule.startAt)}
          {schedule.regionName && ` · ${schedule.regionName}`}
        </p>
        {/* 모집된 인원 비율. 자리 수는 아래 글자가 말하므로 화면 읽기 도구에는 읽히지 않는다 */}
        <div aria-hidden className="h-1.5 rounded-full bg-brand-soft">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${filledPercent}%` }}
          />
        </div>
        <p className="text-sm font-bold text-brand">
          {schedule.remainingSeats}자리 남음
        </p>
      </div>
    </Link>
  );
}

/**
 * 곧 마감돼요: 서버의 마감 임박 순(`sort=CLOSING_SOON`) 10개를 받은 순서대로, 가로 슬라이드 (LIST-06).
 * `전체보기`는 필터 없이 일정 목록으로 간다(사용자 결정 2026-11-21).
 * 0개면 구역 전체를 숨긴다. 불러오는 중에는 자리를 잡아 둔다
 */
export function ClosingSoonSection() {
  const { data: schedules, isError, refetch } = useClosingSoonSchedules();
  const { data: activities } = useActivities();

  if (schedules?.length === 0) return null;

  // 칩 색은 서버 활동 목록의 code로 정한다. 활동 목록을 못 받았으면 기본 색이다
  const toneOf = (categoryId: string) => {
    const code = activities?.find(
      (activity) => activity.id === categoryId,
    )?.code;
    return (code && ACTIVITY_TONE[code]) || DEFAULT_ACTIVITY_TONE;
  };

  return (
    <section
      aria-labelledby="home-closing-soon-title"
      className="flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <h2 id="home-closing-soon-title" className="text-lg font-bold">
          곧 마감돼요
        </h2>
        <Link
          href={SCHEDULE_LIST_PATH}
          className="flex min-h-11 items-center text-sm text-muted-foreground"
        >
          전체보기
        </Link>
      </div>
      {schedules === undefined ? (
        isError ? (
          <HomeSectionError onRetry={() => refetch()} />
        ) : (
          <SkeletonGroup className="flex gap-3 overflow-hidden">
            {[0, 1].map((index) => (
              <Skeleton
                key={index}
                className="h-42 w-50 shrink-0 rounded-2xl"
              />
            ))}
          </SkeletonGroup>
        )
      ) : (
        <ul className="-mx-5 scrollbar-hidden flex snap-x gap-3 overflow-x-auto px-5">
          {schedules.map((schedule) => (
            <li key={schedule.id} className="w-50 shrink-0 snap-start">
              <ClosingSoonCard
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
