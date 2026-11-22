"use client";

import { Dice3, Key, TreePine, type LucideIcon } from "lucide-react";
import Link from "next/link";

import type { Activity } from "../../api/activities";
import { useActivities } from "../../hooks/useActivities";
import { toScheduleListQuery } from "../../lib/scheduleListParams";
import { ACTIVITY_TONE } from "./activityTone";
import { HomeSectionError } from "./HomeSectionError";
import { Skeleton, SkeletonGroup } from "@/shared/ui/Skeleton";

/**
 * 활동 버튼 3개: 보드게임 · 방탈출 · 산책 (홈 화면 수정 시안). 타일 안 왼쪽 위에 아이콘, 왼쪽 아래에 활동 이름.
 * 구역 제목은 `어떤 활동을 찾으세요?`다(사용자 결정 2026-11-22, 시안의 `뭐 하고 쉴까요` 대신).
 * 활동은 서버 활동 목록의 `code`로 찾고, 이름은 서버 활동 이름(`산책` 등)을 그대로 보여 준다.
 * 아이콘은 시안 모양에 가까운 lucide다. lucide는 상자 안에 여백이 있어, 시안에서 잰 그림 크기(주사위 24px · 열쇠 22px · 나무 세로 25px)가 나오도록 아이콘마다 상자 크기를 다르게 둔다. TODO(D-4)
 */
const TILES: ReadonlyArray<{
  code: string;
  Icon: LucideIcon;
  /** 아이콘 상자 크기 */
  iconSize: string;
}> = [
  { code: "BOARD_GAME", Icon: Dice3, iconSize: "size-8" },
  { code: "ESCAPE_ROOM", Icon: Key, iconSize: "size-6.5" },
  { code: "WALK", Icon: TreePine, iconSize: "size-7.5" },
];

function findActivity(activities: Activity[], code: string) {
  return activities.find((activity) => activity.code === code);
}

/** 누르면 일정 목록(모집 현황)으로 가고 그 활동 필터가 켜진다 (USER_FLOW §5.1) */
export function ActivityTiles() {
  const { data: activities, isError, refetch } = useActivities();

  return (
    <section
      aria-labelledby="home-activity-title"
      className="flex flex-col gap-3"
    >
      <h2 id="home-activity-title" className="text-lg font-bold">
        어떤 활동을 찾으세요?
      </h2>
      {activities === undefined ? (
        isError ? (
          <HomeSectionError onRetry={() => refetch()} />
        ) : (
          <SkeletonGroup className="grid grid-cols-3 gap-2.5">
            {TILES.map(({ code }) => (
              <Skeleton key={code} className="aspect-square rounded-2xl" />
            ))}
          </SkeletonGroup>
        )
      ) : (
        <ul className="grid grid-cols-3 gap-2.5">
          {TILES.map(({ code, Icon, iconSize }) => {
            const activity = findActivity(activities, code);
            // 서버 활동 목록에 없는 활동(비활성)은 버튼을 만들지 않는다
            if (!activity) return null;
            return (
              <li key={code}>
                <Link
                  href={toScheduleListQuery("recruiting", {
                    activityId: activity.id,
                  })}
                  className={`flex aspect-square flex-col justify-between rounded-2xl p-4 focus-visible:outline-3 focus-visible:outline-ring/50 ${ACTIVITY_TONE[code]}`}
                >
                  <Icon aria-hidden className={iconSize} strokeWidth={2} />
                  <span className="text-sm font-bold break-keep">
                    {activity.name}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
