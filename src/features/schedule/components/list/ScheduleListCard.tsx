import type { ScheduleListItem } from "../../api/schedules";
import { formatScheduleDateTime, getDdayLabel } from "../../lib/scheduleDate";
import type { ScheduleListTab, ScheduleStatus } from "../../types";
import { NewBadge } from "@/shared/ui/NewBadge";
import { ScheduleCard } from "@/shared/ui/ScheduleCard";
import { Tag } from "@/shared/ui/Tag";

/** 앞으로 할 일정 (모집 중·모집완료). 진행 중·완료·취소 일정에는 상태 태그를 붙이지 않는다 (팀 결정 Q4) */
const isUpcoming = (status: ScheduleStatus) =>
  status === "RECRUITING" || status === "CLOSED";

/**
 * 탭에 따라 카드 표시를 고른다 (시안 LIST-01·04·05, CRT-07). 기획·시안에 있는 표시만 붙인다 (팀 결정 Q4)
 * TODO(F-21): 진행 중·완료·취소 일정의 카드 표시는 기획에 없다
 * TODO(D-9): `N자리 남음` 배지는 보류 (2026-11-02)
 */
export function ScheduleListCard({
  schedule,
  tab,
  isHighlighted = false,
}: {
  schedule: ScheduleListItem;
  tab: ScheduleListTab;
  /** 방금 연 일정 (개설한 일정 탭). 시안의 녹색 테두리를 개설 직후에만 보여준다 (사용자 결정 2026-11-08) */
  isHighlighted?: boolean;
}) {
  const common = {
    category: schedule.activityName,
    title: schedule.title,
    region: schedule.regionName,
    dateLabel: formatScheduleDateTime(schedule.startAt),
    participantCount: schedule.participantCount,
    capacity: schedule.capacity,
  };

  if (tab === "recruiting") {
    const isRecruiting = schedule.status === "RECRUITING";
    return (
      <ScheduleCard
        {...common}
        badge={{ variant: isRecruiting ? "recruiting" : "closed" }}
        // 모집완료 날짜 회색은 모집 중 탭에서만 (시안 LIST-01, LIST-05는 녹색)
        isInactive={!isRecruiting}
      />
    );
  }

  if (tab === "joined") {
    const dday = isUpcoming(schedule.status)
      ? getDdayLabel(schedule.startAt)
      : undefined;
    return (
      <ScheduleCard
        {...common}
        // 태그가 없어도 넘겨서 같은 탭 카드의 활동 이름 크기를 맞춘다
        tags={
          <>
            {isUpcoming(schedule.status) && <Tag tone="brand">참여 확정</Tag>}
            {dday && (
              <Tag tone={dday === "D-DAY" ? "dark" : "muted"}>{dday}</Tag>
            )}
          </>
        }
      />
    );
  }

  const statusTag =
    schedule.status === "RECRUITING" ? (
      <Tag tone="brand">모집 중</Tag>
    ) : schedule.status === "CLOSED" ? (
      <Tag tone="muted">모집완료</Tag>
    ) : null;

  return (
    <ScheduleCard
      {...common}
      isHighlighted={isHighlighted}
      tags={
        <>
          {statusTag}
          {schedule.isNew && <NewBadge />}
        </>
      }
    />
  );
}
