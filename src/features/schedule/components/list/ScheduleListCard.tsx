import type { ScheduleListItem } from "../../api/schedules";
import {
  formatScheduleDateTime,
  getDdayLabel,
  isNewScheduleToday,
} from "../../lib/scheduleDate";
import type { ScheduleListTab, ScheduleStatus } from "../../types";
import { NewBadge } from "@/shared/ui/NewBadge";
import { ScheduleCard } from "@/shared/ui/ScheduleCard";
import { StatusBadge } from "@/shared/ui/StatusBadge";
import { Tag } from "@/shared/ui/Tag";

/** 모집 중·모집 마감. 시작했지만 완료 전인 일정도 서버가 모집 마감으로 준다 (api-guide 일정 목록) */
const isOpen = (status: ScheduleStatus) =>
  status === "RECRUITING" || status === "RECRUITMENT_CLOSED";

/** 취소된 일정 표시 (api-guide `displayStatus` 화면 문구, 사용자 결정 2026-11-10) */
const canceledTag = <Tag tone="muted">일정 취소됨</Tag>;

/**
 * 탭에 따라 카드 표시를 고른다. 배지는 활동명 다음에 왼쪽부터 상태·참여·D-day·NEW 순서로 둔다.
 * 모집 중 탭의 남은 자리 표시 기준은 SHI-189 사용자 결정에 따라 화면에서 인원으로 계산한다.
 */
export function ScheduleListCard({
  schedule,
  tab,
}: {
  schedule: ScheduleListItem;
  tab: ScheduleListTab;
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
    // 배지가 모집완료면 날짜도 회색으로 맞춘다 (서버가 모집 중으로 줘도 남은 자리가 0이면 모집완료로 표시)
    const looksClosed = !isRecruiting || schedule.remainingSeats === 0;
    const recruitingBadge = looksClosed ? (
      <StatusBadge variant="closed" />
    ) : schedule.confirmedCount >= Math.ceil(schedule.capacity / 2) ? (
      <StatusBadge variant="seatsLeft" count={schedule.remainingSeats} />
    ) : (
      <StatusBadge variant="recruiting" />
    );
    return (
      <ScheduleCard
        {...common}
        tags={
          <>
            {recruitingBadge}
            {isNewScheduleToday(schedule.createdAt) && <NewBadge />}
          </>
        }
        isInactive={looksClosed}
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
            {schedule.displayStatus === "CANCELED" && canceledTag}
            {isOpen(schedule.displayStatus) && (
              <Tag tone="brand">참여 확정</Tag>
            )}
            {dday && (
              <Tag tone={dday === "D-DAY" ? "solid" : "muted"}>{dday}</Tag>
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

  // 상태 배지가 없어도 넘겨서 같은 탭 카드의 활동 이름 크기를 맞춘다
  return <ScheduleCard {...common} tags={<>{statusTag}</>} />;
}
