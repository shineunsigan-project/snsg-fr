import { Ban, Lock } from "lucide-react";

import { SCHEDULE_STATUS_LABEL } from "../../lib/scheduleDetailView";
import type { ScheduleStatus, ScheduleViewerRole } from "../../types";
import { BottomCta } from "@/shared/ui/BottomCta";
import { Button } from "@/shared/ui/button";

type DetailBottomBarProps = {
  /** 서버가 준 일정 상태 */
  status: ScheduleStatus;
  /** 서버가 준 보는 사람의 역할 */
  viewerRole: ScheduleViewerRole;
  participantCount: number;
  capacity: number;
  /** 조회자 `로그인하고 참여하기` */
  onLogin: () => void;
  /** 미참여자 `참여하기` */
  onJoin: () => void;
  /** 참여 요청 중: `참여하기`를 막아 두 번 보내지 않는다 */
  isJoinPending?: boolean;
  /** 확정 참여자 `참여 취소` */
  onCancelParticipation: () => void;
  /** 개설자 `일정 전체 취소` */
  onCancelSchedule: () => void;
};

/**
 * 상세 하단 고정 영역: 왼쪽 표시 + 버튼 (USER_FLOW §7.2 하단 버튼 표, 시안 DTL-01·04·05·08, HOST-01).
 * 서버가 준 상태·역할을 버튼으로 바꾸기만 한다. 누를 수 있는지는 서버가 다시 판정한다.
 * - 확정 참여자·개설자의 모집 마감은 모집 중과 같다
 * - 일정 취소됨·완료는 회색 `⊘ 상태명`, 활동 진행 중은 `● 활동 진행 중` (팀 결정 Q3)
 * - 왼쪽: 개설자 `내가 연 일정 / n / m명`(상태와 상관없이, N5), 확정 참여자 `참여 확정`,
 *   그 밖은 모집 중이면 `N자리 남음`, 아니면 `n / m명`
 */
export function DetailBottomBar({
  status,
  viewerRole,
  participantCount,
  capacity,
  onLogin,
  onJoin,
  isJoinPending = false,
  onCancelParticipation,
  onCancelSchedule,
}: DetailBottomBarProps) {
  const countLabel = `${participantCount} / ${capacity}명`;

  return (
    // 참여·취소 버튼이 모인 곳. 화면 읽기 프로그램과 e2e가 이름으로 찾는다
    <div role="region" aria-label="참여 영역" className="sticky bottom-0 z-10">
      {/* 조회자 안내는 모집 중일 때만 (팀 결정 Q4) */}
      {viewerRole === "GUEST" && status === "RECRUITING" && (
        <p className="flex items-center gap-2 bg-brand-soft px-5 py-2.5 text-tag break-keep text-muted-foreground">
          <Lock aria-hidden className="size-4 shrink-0" />
          <span>
            일정 정보는 누구나 볼 수 있어요.{" "}
            <strong className="font-bold text-foreground">
              참여는 로그인 후
            </strong>{" "}
            가능해요.
          </span>
        </p>
      )}
      <BottomCta className="static border-t border-border">
        <div className="flex items-center gap-4">
          <BarLabel
            status={status}
            viewerRole={viewerRole}
            countLabel={countLabel}
            remaining={capacity - participantCount}
          />
          <div className="flex min-w-0 flex-1 *:w-full">
            <BarButton
              status={status}
              viewerRole={viewerRole}
              onLogin={onLogin}
              onJoin={onJoin}
              isJoinPending={isJoinPending}
              onCancelParticipation={onCancelParticipation}
              onCancelSchedule={onCancelSchedule}
            />
          </div>
        </div>
      </BottomCta>
    </div>
  );
}

function BarLabel({
  status,
  viewerRole,
  countLabel,
  remaining,
}: {
  status: ScheduleStatus;
  viewerRole: ScheduleViewerRole;
  countLabel: string;
  remaining: number;
}) {
  if (viewerRole === "HOST") {
    return (
      <p className="flex shrink-0 flex-col">
        <span className="text-xs font-bold text-brand">내가 연 일정</span>
        <span className="text-lg font-bold">{countLabel}</span>
      </p>
    );
  }
  if (viewerRole === "PARTICIPANT") {
    return <p className="shrink-0 text-md font-bold text-brand">참여 확정</p>;
  }
  return (
    <p className="shrink-0 text-md font-bold">
      {/* 남은 자리는 표시용 뺄셈. 상태 판정은 서버 값으로 한다. 취소됨·완료·진행 중 왼쪽은 시안이 없어 마감과 같게 둔다 */}
      {status === "RECRUITING" ? `${remaining}자리 남음` : countLabel}
    </p>
  );
}

function BarButton({
  status,
  viewerRole,
  onLogin,
  onJoin,
  isJoinPending,
  onCancelParticipation,
  onCancelSchedule,
}: Omit<DetailBottomBarProps, "participantCount" | "capacity">) {
  const isMember = viewerRole === "PARTICIPANT" || viewerRole === "HOST";

  if (status === "IN_PROGRESS") {
    return (
      <Button variant="in-progress" size="lg" disabled>
        <span aria-hidden className="size-2.5 rounded-full bg-primary" />
        {SCHEDULE_STATUS_LABEL[status]}
      </Button>
    );
  }
  if (
    status === "CANCELED" ||
    status === "COMPLETED" ||
    (status === "CLOSED" && !isMember)
  ) {
    return (
      <Button variant="inactive" size="lg" disabled>
        <Ban aria-hidden className="size-5" />
        {SCHEDULE_STATUS_LABEL[status]}
      </Button>
    );
  }

  // 모집 중, 또는 확정 참여자·개설자의 모집 마감
  switch (viewerRole) {
    case "GUEST":
      return (
        <Button variant="primary" size="lg" onClick={onLogin}>
          로그인하고 참여하기
        </Button>
      );
    case "NON_PARTICIPANT":
      return (
        <Button
          variant="primary"
          size="lg"
          disabled={isJoinPending}
          onClick={onJoin}
        >
          참여하기
        </Button>
      );
    case "PARTICIPANT":
      return (
        <Button variant="danger-soft" size="lg" onClick={onCancelParticipation}>
          참여 취소
        </Button>
      );
    case "HOST":
      return (
        <Button variant="danger" size="lg" onClick={onCancelSchedule}>
          일정 전체 취소
        </Button>
      );
  }
}
