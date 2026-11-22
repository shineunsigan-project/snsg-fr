"use client";

import { useMyProfile } from "@/features/profile/hooks/useMyProfile";
import { Skeleton } from "@/shared/ui/Skeleton";

import { formatHomeToday } from "../../lib/scheduleDate";

/**
 * 홈 맨 위 인사말 (홈 화면 수정 제안): 오늘 날짜 + `{닉네임}님, 이번 주말엔 누구랑 쉬어갈까요?`.
 * 비로그인이거나 닉네임을 못 받았으면 `님,` 없이 같은 질문만 보여 준다. 📝 비로그인 문구는 추정 TODO(F-19)
 */
export function HomeGreeting({
  isLoggedIn,
}: {
  isLoggedIn: boolean | undefined;
}) {
  const { data: profile, isPending } = useMyProfile(isLoggedIn === true);
  const isWaitingNickname =
    isLoggedIn === undefined || (isLoggedIn && isPending);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-muted-foreground">
        {formatHomeToday()}
      </p>
      {isWaitingNickname ? (
        <Skeleton className="h-18 w-4/5" />
      ) : (
        <h2 className="text-2xl leading-9 font-bold break-keep">
          {profile ? `${profile.nickname}님, ` : ""}이번 주말엔
          <br />
          누구랑 쉬어갈까요?
        </h2>
      )}
    </div>
  );
}
