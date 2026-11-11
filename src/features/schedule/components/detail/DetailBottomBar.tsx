import { Ban, Lock } from "lucide-react";

import { SCHEDULE_STATUS_LABEL } from "../../lib/scheduleDetailView";
import type {
  ScheduleAction,
  ScheduleStatus,
  ScheduleViewerRole,
} from "../../types";
import { BottomCta } from "@/shared/ui/BottomCta";
import { Button } from "@/shared/ui/button";

type DetailBottomBarProps = {
  /** 서버가 준 표시 상태. 비활성 버튼 문구와 왼쪽 표시를 정한다 */
  status: ScheduleStatus;
  /** 서버가 준 보는 사람의 역할 */
  viewerRole: ScheduleViewerRole;
  /** 서버가 준 지금 누를 수 있는 동작. 들어 있는 동작의 버튼만 활성으로 그린다 */
  availableActions: ScheduleAction[];
  /** 확정 인원 (개설자 포함) */
  confirmedCount: number;
  capacity: number;
  remainingSeats: number;
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
 * 버튼은 서버가 준 `availableActions`로만 고른다 (api-guide 일정 상세). 상태·시각으로 계산하지 않는다.
 * - 누를 수 있는 동작이 없으면 회색 비활성 `⊘ 상태명` (시안 DTL-08). 시작 후 개설자도 같다 (사용자 결정 2026-11-11)
 * - 왼쪽: 개설자 `내가 연 일정 / n / m명`(상태와 상관없이, N5), 확정 참여자 `참여 확정`,
 *   그 밖은 모집 중이면 `N자리 남음`, 아니면 `n / m명`
 */
export function DetailBottomBar({
  status,
  viewerRole,
  availableActions,
  confirmedCount,
  capacity,
  remainingSeats,
  onLogin,
  onJoin,
  isJoinPending = false,
  onCancelParticipation,
  onCancelSchedule,
}: DetailBottomBarProps) {
  const countLabel = `${confirmedCount} / ${capacity}명`;

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
            remainingSeats={remainingSeats}
          />
          <div className="flex min-w-0 flex-1 *:w-full">
            <BarButton
              status={status}
              availableActions={availableActions}
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
  remainingSeats,
}: {
  status: ScheduleStatus;
  viewerRole: ScheduleViewerRole;
  countLabel: string;
  remainingSeats: number;
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
      {/* 취소됨·완료 왼쪽은 시안이 없어 마감과 같게 둔다 */}
      {status === "RECRUITING" ? `${remainingSeats}자리 남음` : countLabel}
    </p>
  );
}

function BarButton({
  status,
  availableActions,
  onLogin,
  onJoin,
  isJoinPending,
  onCancelParticipation,
  onCancelSchedule,
}: Pick<
  DetailBottomBarProps,
  | "status"
  | "availableActions"
  | "onLogin"
  | "onJoin"
  | "isJoinPending"
  | "onCancelParticipation"
  | "onCancelSchedule"
>) {
  // 역할마다 서버가 주는 동작은 하나뿐이다 (api-guide 일정 상세 역할·상태별 표)
  if (availableActions.includes("LOGIN_TO_JOIN")) {
    return (
      <Button variant="primary" size="lg" onClick={onLogin}>
        로그인하고 참여하기
      </Button>
    );
  }
  if (availableActions.includes("JOIN")) {
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
  }
  if (availableActions.includes("CANCEL_PARTICIPATION")) {
    return (
      <Button variant="danger-soft" size="lg" onClick={onCancelParticipation}>
        참여 취소
      </Button>
    );
  }
  if (availableActions.includes("CANCEL_SCHEDULE")) {
    return (
      <Button variant="danger" size="lg" onClick={onCancelSchedule}>
        일정 전체 취소
      </Button>
    );
  }
  return (
    <Button variant="inactive" size="lg" disabled>
      <Ban aria-hidden className="size-5" />
      {SCHEDULE_STATUS_LABEL[status]}
    </Button>
  );
}
