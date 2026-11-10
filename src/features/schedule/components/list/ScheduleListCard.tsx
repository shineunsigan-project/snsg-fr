import type { ScheduleListItem } from "../../api/schedules";
import {
  formatScheduleDateTime,
  getDdayLabel,
  isNewSchedule,
} from "../../lib/scheduleDate";
import type { ScheduleListTab, ScheduleStatus } from "../../types";
import { NewBadge } from "@/shared/ui/NewBadge";
import { ScheduleCard } from "@/shared/ui/ScheduleCard";
import { Tag } from "@/shared/ui/Tag";

/** 모집 중·모집 마감. 시작했지만 완료 전인 일정도 서버가 모집 마감으로 준다 (api-guide 일정 목록) */
const isOpen = (status: ScheduleStatus) =>
  status === "RECRUITING" || status === "RECRUITMENT_CLOSED";

/** 취소된 일정 표시 (api-guide `displayStatus` 화면 문구, 사용자 결정 2026-11-10) */
const canceledTag = <Tag tone="muted">일정 취소됨</Tag>;

/**
 * 탭에 따라 카드 표시를 고른다 (시안 LIST-01·04·05, CRT-07). 기획·시안에 있는 표시만 붙인다 (팀 결정 Q4)
 * 상태는 서버 `displayStatus` 그대로 쓴다. 목록에는 모집 중·모집 마감·일정 취소됨만 온다
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
    href: `/schedules/${schedule.id}`,
    category: schedule.category.name,
    title: schedule.title,
    region: schedule.regionName,
    dateLabel: formatScheduleDateTime(schedule.startAt),
    participantCount: schedule.confirmedCount,
    capacity: schedule.capacity,
  };

  if (tab === "recruiting") {
    const isRecruiting = schedule.displayStatus === "RECRUITING";
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
    const dday = isOpen(schedule.displayStatus)
      ? getDdayLabel(schedule.startAt)
      : undefined;
    return (
      <ScheduleCard
        {...common}
        // 태그가 없어도 넘겨서 같은 탭 카드의 활동 이름 크기를 맞춘다
        tags={
          <>
            {isOpen(schedule.displayStatus) && (
              <Tag tone="brand">참여 확정</Tag>
            )}
            {schedule.displayStatus === "CANCELED" && canceledTag}
            {dday && (
              <Tag tone={dday === "D-DAY" ? "dark" : "muted"}>{dday}</Tag>
            )}
          </>
        }
      />
    );
  }

  const statusTag =
    schedule.displayStatus === "RECRUITING" ? (
      <Tag tone="brand">모집 중</Tag>
    ) : schedule.displayStatus === "RECRUITMENT_CLOSED" ? (
      <Tag tone="muted">모집완료</Tag>
    ) : schedule.displayStatus === "CANCELED" ? (
      canceledTag
    ) : null;

  return (
    <ScheduleCard
      {...common}
      isHighlighted={isHighlighted}
      tags={
        <>
          {statusTag}
          {isNewSchedule(schedule.createdAt) && <NewBadge />}
        </>
      }
    />
  );
}
