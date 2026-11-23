"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";

import type { NextSchedule } from "../../api/homeSchedules";
import { useNextSchedule } from "../../hooks/useHomeSchedules";
import { formatUpcomingDateTime, getDdayLabel } from "../../lib/scheduleDate";
import { getDurationLabel } from "../../lib/scheduleDetailView";
import { MainBanner } from "./MainBanner";
import { toApiImageUrl } from "@/shared/lib/apiImageUrl";
import { Avatar } from "@/shared/ui/Avatar";
import { Skeleton, SkeletonGroup } from "@/shared/ui/Skeleton";

/**
 * 다가오는 내 일정 카드 (홈 화면 수정 시안). 진한 녹색 카드, 카드 전체가 일정 상세로 가는 링크다. 1건만 보여 준다(사용자 결정 2026-11-23).
 * 위: `D-n`(흰 알약) · `다가오는 내 일정` → 제목 → `약속 시간 · 예상 소요` → 구분선 → `참여자 사진(겹침) 장소명 · 확정/정원명`, 오른쪽 `›`.
 * 참여 확정·내가 만든 일정을 구분하지 않는다. 사진이 확정 인원보다 적어도 `+n`은 그리지 않는다(시안에 없다)
 */
function UpcomingCard({ schedule }: { schedule: NextSchedule }) {
  const dday = getDdayLabel(schedule.startAt);
  const duration = getDurationLabel(schedule.durationType);
  return (
    <Link
      href={`/schedules/${schedule.id}`}
      className="flex flex-col gap-1 rounded-3xl bg-brand p-5 text-primary-foreground focus-visible:outline-3 focus-visible:outline-ring/50"
    >
      <div className="flex items-center gap-2">
        {dday && (
          <span className="flex h-6.5 items-center rounded-full bg-card px-2.5 text-sm font-bold text-brand">
            {dday}
          </span>
        )}
        <span className="truncate text-tag font-semibold text-on-brand-accent">
          다가오는 내 일정
        </span>
      </div>
      <h3 className="mt-1 truncate text-xl font-bold">{schedule.title}</h3>
      <p className="text-sm text-on-brand-muted">
        {formatUpcomingDateTime(schedule.startAt)}
        {duration && ` · ${duration}`}
      </p>
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-primary-foreground/15 pt-4 text-sm text-on-brand-muted">
        <div className="flex min-w-0 items-center gap-3">
          <span aria-hidden className="flex shrink-0 -space-x-2">
            {schedule.participantProfileImageUrls.map((path, index) => (
              <Avatar
                key={index}
                src={toApiImageUrl(path)}
                className="ring-2 ring-brand"
              />
            ))}
          </span>
          <p className="min-w-0 truncate">
            {schedule.placeName && `${schedule.placeName} · `}
            <span className="font-bold text-primary-foreground">
              {schedule.confirmedCount}
            </span>
            /{schedule.capacity}명
          </p>
        </div>
        <ChevronRight
          aria-hidden
          className="size-5 shrink-0 text-primary-foreground"
        />
      </div>
    </Link>
  );
}

function UpcomingSkeleton() {
  return (
    <SkeletonGroup className="flex flex-col gap-3">
      <Skeleton className="h-46 rounded-3xl" />
    </SkeletonGroup>
  );
}

/**
 * 홈 맨 위 구역 (LIST-06 · LIST-06-1)
 * - 로그인하고 다가오는 내 일정이 있으면 그 1건을 카드로
 * - 비로그인이거나 다가오는 일정이 없거나 받지 못했으면 메인 배너
 * - 로그인 여부를 확인하기 전(undefined)에는 배너가 번쩍이지 않게 자리 표시만 둔다
 */
export function UpcomingSection({
  isLoggedIn,
}: {
  isLoggedIn: boolean | undefined;
}) {
  const { data, isError } = useNextSchedule(isLoggedIn === true);

  if (isLoggedIn === undefined) return <UpcomingSkeleton />;
  if (!isLoggedIn) return <MainBanner />;
  // 다가오는 일정을 받지 못해도 오류 화면 대신 배너를 보여 준다. 홈이 비어 보이지 않게 한다 (사용자 결정 2026-11-23)
  if (isError || data === null) return <MainBanner />;
  if (data === undefined) return <UpcomingSkeleton />;

  return (
    <section aria-label="다가오는 일정" className="flex flex-col gap-3">
      <UpcomingCard schedule={data} />
    </section>
  );
}
