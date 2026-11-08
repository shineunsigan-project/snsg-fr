"use client";

import { UUID_PATTERN } from "../../lib/scheduleListParams";
import { formatPlaceAddress } from "../../api/scheduleCreate";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { isScheduleNotFound } from "../../api/scheduleDetail";
import { useJoinSchedule } from "../../hooks/useJoinSchedule";
import { useScheduleDetail } from "../../hooks/useScheduleDetail";
import { useScheduleParticipants } from "../../hooks/useScheduleParticipants";
import { formatScheduleDateTime } from "../../lib/scheduleDate";
import {
  canGoBackInApp,
  canViewParticipants,
  getDurationLabel,
  getHostName,
  getParticipantGenderLabel,
  getParticipantSummaryLabel,
  getSummaryAvatars,
  toParticipantRows,
} from "../../lib/scheduleDetailView";
import {
  DETAIL_TOAST_DURATION,
  showActionErrorToast,
} from "./actionErrorToast";
import { CancelParticipationFlow } from "./CancelParticipationFlow";
import { CancelScheduleFlow } from "./CancelScheduleFlow";
import { DetailBottomBar } from "./DetailBottomBar";
import { DetailHeader } from "./DetailHeader";
import { DetailInfo } from "./DetailInfo";
import { ParticipantSection } from "./ParticipantSection";
import { PlaceSection } from "./PlaceSection";
import { useIsLoggedIn } from "@/features/auth/hooks/useIsLoggedIn";
import { saveLoginRedirect } from "@/shared/lib/kakaoLogin";
import { Button } from "@/shared/ui/button";
import { PageStatus } from "@/shared/ui/PageStatus";
import { showToast } from "@/shared/ui/sonner";

/** 주소의 일정 ID(UUID 문자열, api-guide 일정 개설 응답과 같은 형식). 형식이 다르면 없는 일정과 같이 처리한다 */
function parseScheduleId(value: string) {
  return UUID_PATTERN.test(value) ? value : null;
}

/** 클립보드 복사 후 결과 토스트 */
async function copyWithToast(
  text: string,
  messages: { success: string; failure: string },
) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(messages.success, { duration: DETAIL_TOAST_DURATION });
  } catch {
    showToast(messages.failure, {
      variant: "error",
      duration: DETAIL_TOAST_DURATION,
    });
  }
}

/** 상세에서 여는 흐름: 참여 취소(DTL-07) / 일정 전체 취소(HOST-01) */
type DetailFlow = "cancelParticipation" | "cancelSchedule";

/**
 * 일정 상세 (DTL-01~08, HOST-01·02). 로그인 없이도 볼 수 있다.
 * 참여·취소 뒤에는 서버가 준 최신 상태·역할로 다시 그린다 (낙관적 업데이트 없음)
 */
export function ScheduleDetailScreen({
  scheduleIdParam,
}: {
  scheduleIdParam: string;
}) {
  const router = useRouter();
  const scheduleId = parseScheduleId(scheduleIdParam);
  const isLoggedIn = useIsLoggedIn();
  // 역할이 토큰에 따라 달라지므로 로그인 복구가 끝난 뒤 부른다
  const {
    data: detail,
    error,
    refetch,
  } = useScheduleDetail(scheduleId, isLoggedIn !== undefined);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [openFlow, setOpenFlow] = useState<DetailFlow | null>(null);
  const join = useJoinSchedule(scheduleId ?? "");
  const canExpand = detail ? canViewParticipants(detail.viewerRole) : false;
  // 참여 취소·로그아웃으로 펼칠 수 없는 역할이 되면 펼침을 닫는다. 다시 참여해도 저절로 펼쳐지지 않는다
  // (렌더 중 이전 값과 비교해 바로 맞춘다 — effect로 한 번 더 그리지 않는다)
  const [prevCanExpand, setPrevCanExpand] = useState(canExpand);
  if (prevCanExpand !== canExpand) {
    setPrevCanExpand(canExpand);
    if (!canExpand) setIsParticipantsOpen(false);
  }
  const participants = useScheduleParticipants(
    scheduleId ?? "",
    canExpand && isParticipantsOpen,
  );

  // 일정 없음·삭제·잘못된 주소 → 홈(모집 중) + 토스트 (USER_FLOW §7.2)
  const isNotFound = scheduleId === null || isScheduleNotFound(error);
  const hasNotifiedNotFound = useRef(false);
  useEffect(() => {
    // 잘못된 ID는 첫 화면에서 바로 여기로 온다. 앱 첫 로딩(로그인 복구)이 끝난 뒤에 보내, 서버 404와 같은 때에 토스트를 띄운다.
    // 첫 화면 그리기 직후에 띄우면 토스트 영역(Providers의 Toaster)이 아직 준비되지 않아 보이지 않는다
    if (!isNotFound || isLoggedIn === undefined || hasNotifiedNotFound.current)
      return;
    hasNotifiedNotFound.current = true;
    router.replace("/");
    showToast("찾을 수 없는 일정이에요", {
      variant: "error",
      duration: DETAIL_TOAST_DURATION,
    });
  }, [isNotFound, isLoggedIn, router]);

  // 앱 안에서 이동해 왔으면 뒤로, 아니면 홈(모집 중) (팀 결정 Q7)
  const handleBack = () =>
    canGoBackInApp() ? router.back() : router.push("/");

  // 로그인 후 이 상세로만 돌아온다. 참여는 자동으로 실행하지 않는다 (USER_FLOW §4.3)
  const handleLogin = () => {
    saveLoginRedirect(`/schedules/${scheduleId}`);
    router.push("/login");
  };

  // 확인 팝업 없이 바로 확정한다(선착순). 성공 안내는 없고 다시 받은 상세가 DTL-05로 그려진다 (USER_FLOW §7.3)
  // 버튼이 막히기 전(다시 그리기 전)에 연달아 눌러도 한 번만 보낸다
  const isJoiningRef = useRef(false);
  const handleJoin = () => {
    if (isJoiningRef.current) return;
    isJoiningRef.current = true;
    join.mutate(undefined, {
      onError: (error) => showActionErrorToast(error),
      onSettled: () => {
        isJoiningRef.current = false;
      },
    });
  };

  const handleShare = () =>
    copyWithToast(`${window.location.origin}/schedules/${scheduleId}`, {
      success: "링크가 복사되었습니다",
      // 📝 임시 문구 TODO(F-19)
      failure: "링크를 복사하지 못했어요.",
    });

  if (isNotFound) return <PageStatus message="불러오는 중..." />;

  if (!detail) {
    // 404가 아닌 오류(5xx·네트워크 등)는 화면에 두고 다시 시도 (화면 기능 명세서 공통 예외)
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-card">
        <DetailHeader onBack={handleBack} onShare={handleShare} />
        {error ? (
          <div className="flex flex-col items-center gap-3 px-5 py-16 text-center">
            {/* 📝 임시 문구 TODO(F-19) */}
            <p className="text-sm text-muted-foreground">
              일정을 불러오지 못했어요.
            </p>
            <Button variant="secondary" onClick={() => refetch()}>
              다시 시도
            </Button>
          </div>
        ) : (
          <p
            role="status"
            className="py-16 text-center text-sm text-muted-foreground"
          >
            불러오는 중...
          </p>
        )}
      </div>
    );
  }

  const address = formatPlaceAddress(detail.place);

  return (
    // 화면 전체가 스크롤되고 헤더는 위에 붙는다. 넓은 화면에서는 모바일 폭(max-w-md)으로 가운데 둔다
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-card">
      <DetailHeader onBack={handleBack} onShare={handleShare} />
      <main className="flex-1">
        <DetailInfo
          status={detail.status}
          activityName={detail.activityName}
          hostName={getHostName(detail)}
          hostProfileImageUrl={detail.host.profileImageUrl}
          title={detail.title}
          dateLabel={formatScheduleDateTime(detail.startAt)}
          durationLabel={getDurationLabel(detail.duration)}
          participantCount={detail.participantCount}
          capacity={detail.capacity}
          description={detail.description}
        />
        <ParticipantSection
          participantCount={detail.participantCount}
          summaryLabel={getParticipantSummaryLabel(detail.participantSummary)}
          genderLabel={getParticipantGenderLabel(detail.participantSummary)}
          avatars={getSummaryAvatars(detail.participantSummary)}
          canExpand={canExpand}
          isExpanded={isParticipantsOpen}
          onToggle={() => setIsParticipantsOpen((open) => !open)}
          rows={
            participants.data ? toParticipantRows(participants.data) : undefined
          }
          isRowsError={participants.isError}
          onRetryRows={() => participants.refetch()}
        />
        <PlaceSection
          name={detail.place.name}
          address={address}
          latitude={detail.place.latitude}
          longitude={detail.place.longitude}
          onCopyAddress={() =>
            copyWithToast(address, {
              // 📝 임시 문구 TODO(F-19)
              success: "주소가 복사되었어요.",
              failure: "주소를 복사하지 못했어요.",
            })
          }
        />
      </main>
      {/* 컨테이너의 마지막 자식이라 화면 아래에 붙고 홈 인디케이터 영역을 비운다 */}
      <DetailBottomBar
        status={detail.status}
        viewerRole={detail.viewerRole}
        participantCount={detail.participantCount}
        capacity={detail.capacity}
        onLogin={handleLogin}
        onJoin={handleJoin}
        isJoinPending={join.isPending}
        onCancelParticipation={() => setOpenFlow("cancelParticipation")}
        onCancelSchedule={() => setOpenFlow("cancelSchedule")}
      />
      <CancelParticipationFlow
        scheduleId={detail.scheduleId}
        open={openFlow === "cancelParticipation"}
        onClose={() => setOpenFlow(null)}
      />
      <CancelScheduleFlow
        scheduleId={detail.scheduleId}
        open={openFlow === "cancelSchedule"}
        onClose={() => setOpenFlow(null)}
        // 확정 인원은 개설자를 포함한다 (정의서 v0.3 04). 표시만 한다
        // TODO(API): 개설자를 뺀 확정 참여자 수를 서버가 줄지 미정
        participantCount={detail.participantCount - 1}
      />
    </div>
  );
}
