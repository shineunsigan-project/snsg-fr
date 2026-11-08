import { SCHEDULE_STATUS_LABEL } from "../../lib/scheduleDetailView";
import type { ScheduleStatus } from "../../types";
import { DetailAvatar } from "./DetailAvatar";
import { cn } from "@/shared/lib/utils";
import { Tag } from "@/shared/ui/Tag";

/** 상태 태그 색: 모집 중·활동 진행 중은 연두, 마감·완료·취소는 목록 `모집완료`와 같은 회색 (팀 결정 2026-11-04) */
const STATUS_TAG_TONE: Record<ScheduleStatus, "brand" | "muted"> = {
  RECRUITING: "brand",
  IN_PROGRESS: "brand",
  CLOSED: "muted",
  COMPLETED: "muted",
  CANCELED: "muted",
};

type DetailInfoProps = {
  /** 서버가 준 일정 상태. 태그 글자와 색을 정한다 */
  status: ScheduleStatus;
  activityName: string;
  /** 개설자 본인이 보면 `나 (닉네임)` */
  hostName: string;
  hostProfileImageUrl: string | null;
  title: string;
  /** `MM월DD일(요일) HH:MM` */
  dateLabel: string;
  /** `2시간 내외` */
  durationLabel: string;
  participantCount: number;
  capacity: number;
  description: string;
};

/**
 * 상세 정보 블록 (시안 DTL-01·HOST-01): 상태·활동 태그, 가운데 개설자·제목, 시작·예상 소요·모집 인원 3칸, 활동 소개.
 */
export function DetailInfo({
  status,
  activityName,
  hostName,
  hostProfileImageUrl,
  title,
  dateLabel,
  durationLabel,
  participantCount,
  capacity,
  description,
}: DetailInfoProps) {
  const facts = [
    { label: "시작", value: dateLabel },
    { label: "예상 소요", value: durationLabel },
    { label: "모집 인원", value: `${participantCount} / ${capacity}명` },
  ];

  return (
    <section className="flex flex-col px-5 pt-4">
      <p className="flex flex-wrap gap-1.5">
        <Tag tone={STATUS_TAG_TONE[status]}>
          {SCHEDULE_STATUS_LABEL[status]}
        </Tag>
        <Tag tone="muted">{activityName}</Tag>
      </p>
      <div className="mt-3 flex flex-col items-center text-center">
        <DetailAvatar
          src={hostProfileImageUrl}
          className="size-14 ring-2 ring-border"
        />
        <p className="mt-2 max-w-full truncate text-sm font-bold">{hostName}</p>
        <h1 className="mt-4 text-xl font-bold break-keep">{title}</h1>
      </div>
      <dl className="mt-5 flex divide-x divide-border rounded-xl border border-border">
        {facts.map(({ label, value }, index) => (
          <div
            key={label}
            className={cn(
              "flex flex-auto flex-col gap-1 px-3 py-3",
              // 좁은 화면에서는 시작 칸만 줄바꿈하고, 짧은 두 칸은 한 줄로 둔다
              index === 0 ? "min-w-0" : "shrink-0 whitespace-nowrap",
            )}
          >
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="text-md font-bold break-keep">{value}</dd>
          </div>
        ))}
      </dl>
      <h2 className="mt-6 text-base font-bold">활동 소개</h2>
      <p className="mt-3 rounded-2xl bg-background px-5 py-4 text-md/relaxed wrap-break-word break-keep whitespace-pre-line">
        {description}
      </p>
    </section>
  );
}
