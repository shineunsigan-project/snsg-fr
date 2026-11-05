"use client";

import { useId } from "react";

import {
  CANCEL_REASON_MAX_LENGTH,
  getCancelReasonLength,
} from "../../schemas/cancelScheduleSchema";
import { DetailAvatar } from "./DetailAvatar";
import { Button } from "@/shared/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/shared/ui/drawer";

type CancelScheduleSheetProps = {
  /** 사유 입력 → 미리보기 (USER_FLOW §7.5). null이면 닫힘 */
  step: "reason" | "preview" | null;
  reason: string;
  onReasonChange: (reason: string) => void;
  /** 비어 있으면(앞뒤 공백 제외) 사유 입력의 [확인]을 막는다 */
  isReasonValid: boolean;
  /** 개설자를 뺀 확정 참여자 수 */
  participantCount: number;
  /** 안내 상자의 아바타 겹침 (상세 참여자 요약과 같은 최대 4개) */
  participantAvatars: (string | null)[];
  hostName: string;
  hostProfileImageUrl: string | null;
  placeName: string;
  /** [닫기]·바깥 스와이프. 요청 중에는 부르지 않는다 */
  onClose: () => void;
  /** 사유 입력 [확인] → 미리보기 */
  onNext: () => void;
  /** 미리보기 [수정] → 사유 입력 */
  onEdit: () => void;
  /** 미리보기 [확인] → 전체 취소 요청 */
  onSubmit: () => void;
  isPending: boolean;
};

/**
 * 일정 전체 취소의 사유 입력·미리보기 시트 (HOST-01 전체 취소-1·-2).
 * TODO(F-20): 사유를 참여자에게 알림으로 전달하는 것은 추후 작업이다. 문구는 시안 그대로 둔다
 */
export function CancelScheduleSheet({
  step,
  reason,
  onReasonChange,
  isReasonValid,
  participantCount,
  participantAvatars,
  hostName,
  hostProfileImageUrl,
  placeName,
  onClose,
  onNext,
  onEdit,
  onSubmit,
  isPending,
}: CancelScheduleSheetProps) {
  const counterId = useId();

  return (
    <Drawer
      open={step !== null}
      onOpenChange={(next) => {
        if (!next && !isPending) onClose();
      }}
      showSwipeHandle
    >
      <DrawerContent className="mx-auto max-w-md rounded-t-3xl border-0 bg-card">
        {/* 낮은 화면·키보드가 올라와 시트가 줄면 내용이 스크롤되고, 버튼은 아래에 남는다 */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-3">
          {step === "preview" ? (
            <>
              <DrawerTitle className="text-xl font-bold">
                참여자에게 이렇게 전달돼요
              </DrawerTitle>
              {/* 확정 참여자가 없으면 알림을 받을 사람이 없어 안내 상자를 뺀다 (사용자 결정 2026-11-05) */}
              {participantCount > 0 && (
                <DrawerDescription className="mt-4 flex items-center gap-3 rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-sm break-keep text-foreground">
                  <span className="flex shrink-0 -space-x-2" aria-hidden>
                    {participantAvatars.map((src, index) => (
                      // 같은 사진(기본 아바타 null 등)이 여러 개일 수 있어 순서로 구분한다
                      <DetailAvatar
                        key={index}
                        src={src}
                        className="size-6 ring-2 ring-danger-soft"
                      />
                    ))}
                  </span>
                  <span>
                    <strong className="font-bold text-danger">
                      확정 참여자 {participantCount}명 전원
                    </strong>
                    에게 아래 내용이 알림으로 전달돼요
                  </span>
                </DrawerDescription>
              )}
              <div className="mt-3 flex flex-col rounded-2xl bg-background px-4 py-4">
                <p className="flex min-w-0 items-center gap-2">
                  <DetailAvatar src={hostProfileImageUrl} />
                  <span className="truncate text-sm font-bold">{hostName}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    개설자
                  </span>
                </p>
                <p className="mt-3 text-md font-bold break-keep">
                  {placeName} 일정이 취소되었어요
                </p>
                <p className="mt-2 text-md/relaxed wrap-break-word break-keep whitespace-pre-line">
                  {reason.trim()}
                </p>
              </div>
            </>
          ) : (
            <>
              <DrawerTitle className="text-xl font-bold">
                취소 사유를 알려주세요
              </DrawerTitle>
              {participantCount > 0 && (
                <DrawerDescription className="mt-1 break-keep">
                  입력한 내용은 확정 참여자에게 전달돼요.
                </DrawerDescription>
              )}
              <div className="mt-4 rounded-2xl border border-input px-4 pt-3.5 pb-3 focus-within:border-primary">
                <textarea
                  aria-label="취소 사유"
                  aria-describedby={counterId}
                  rows={4}
                  value={reason}
                  // 글자 수는 앞뒤 공백을 뺀 길이로 센다(USER_FLOW §7.5). maxLength는 공백까지 세어 기준이 둘이 되므로 쓰지 않고,
                  // 같은 기준으로 200자를 넘기는 입력만 받지 않는다(개설 간략 설명의 "넘으면 입력 안 됨"과 같은 방식)
                  onChange={(event) => {
                    const next = event.target.value;
                    if (getCancelReasonLength(next) <= CANCEL_REASON_MAX_LENGTH)
                      onReasonChange(next);
                  }}
                  className="block w-full resize-none bg-transparent text-md/relaxed break-keep outline-none"
                />
                <p
                  id={counterId}
                  className="mt-1 text-right text-xs text-subtle-foreground tabular-nums"
                >
                  {getCancelReasonLength(reason)}/{CANCEL_REASON_MAX_LENGTH}
                </p>
              </div>
            </>
          )}
        </div>
        {/* safe area가 0인 기기에서도 버튼이 화면 끝에 붙지 않게 아래 여백을 더한다 (ScheduleFilterBar와 같다) */}
        <div className="pb-safe">
          <div className="flex gap-2.5 px-5 pt-4 pb-2">
            {step === "preview" ? (
              <>
                <Button
                  variant="secondary"
                  className="flex-1"
                  disabled={isPending}
                  onClick={onEdit}
                >
                  수정
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  disabled={isPending}
                  onClick={onSubmit}
                >
                  확인
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={onClose}
                >
                  닫기
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  // 사유가 비어 있으면 진행할 수 없다. 문서에 오류 문구가 없어 버튼만 막는다
                  disabled={!isReasonValid}
                  onClick={onNext}
                >
                  확인
                </Button>
              </>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
