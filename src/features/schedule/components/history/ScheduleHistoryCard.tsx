import type { HistoryItem } from "../../hooks/useScheduleHistory";
import { formatScheduleDateTime } from "../../lib/scheduleDate";
import { ScheduleCard } from "@/shared/ui/ScheduleCard";
import { Tag } from "@/shared/ui/Tag";

/**
 * 참여 이력 카드 (MY-01-1, 시안 `MY-01-1 참여 이력(지난 일정)`). 활동 · 상태(일정 완료 / 일정 취소됨) · 역할(참여 / 개설) 순이다.
 * 지난 일정이라 D-n · 남은 자리 · NEW는 없고 약속 시간은 회색이다. 취소 사유 시트는 보류했다 (TODO(DTL-05-1), TODO(HOST-01-2))
 */
export function ScheduleHistoryCard({ schedule }: { schedule: HistoryItem }) {
  return (
    <ScheduleCard
      href={`/schedules/${schedule.id}`}
      category={schedule.category.name}
      tags={
        <>
          {schedule.displayStatus === "CANCELED" ? (
            <Tag tone="danger">일정 취소됨</Tag>
          ) : (
            <Tag tone="muted">일정 완료</Tag>
          )}
          {schedule.role === "host" ? (
            <Tag tone="brand">개설</Tag>
          ) : (
            <Tag tone="outline">참여</Tag>
          )}
        </>
      }
      title={schedule.title}
      region={schedule.regionName}
      dateLabel={formatScheduleDateTime(schedule.startAt)}
      participantCount={schedule.confirmedCount}
      capacity={schedule.capacity}
      isInactive
    />
  );
}
