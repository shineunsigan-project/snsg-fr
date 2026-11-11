import { ChevronRight } from "lucide-react";

import type { MyProfile } from "../api/myProfile";
import { formatBirthDate } from "../lib/birthDate";
import { genderOptions } from "../schemas/profileSchema";

import { toApiImageUrl } from "@/shared/lib/apiImageUrl";
import { Avatar } from "@/shared/ui/Avatar";
import { Button } from "@/shared/ui/button";

type MyProfileViewProps = {
  profile: MyProfile;
  onEdit: () => void;
  /** `홈 화면에 추가하는 방법 ›` — 홈 화면 추가 안내(ONB-01·01-1)를 다시 연다 (SHI-160). 없으면 메뉴를 숨긴다(PC, F-23) */
  onHomeScreenGuide?: () => void;
  onLogout: () => void;
  onWithdraw: () => void;
  /** 탈퇴 가능 여부를 확인하는 중이면 [회원 탈퇴]를 막는다(api-guide 탈퇴). 팝업이 겹치지 않게 [로그아웃]도 막는다 */
  isAccountActionPending?: boolean;
};

/** 내 정보 제목줄. 불러오기 실패 화면에서도 같이 쓴다 */
export function MyProfileHeader() {
  return (
    <header className="border-b border-border bg-card px-5 pt-safe">
      <h1 className="flex h-16 items-center text-2xl font-bold">내 정보</h1>
    </header>
  );
}

/**
 * MY-01 내 정보 화면 모양 (시안 `MY-01 내정보 프로필`). 탭(알림함|프로필)은 만들지 않는다 (SHI-158 결정).
 * 페이지가 h-dvh 컨테이너와 하단 GNB 사이에 넣으므로 남은 높이를 채우고 본문만 스크롤한다
 */
export function MyProfileView({
  profile,
  onEdit,
  onHomeScreenGuide,
  onLogout,
  onWithdraw,
  isAccountActionPending = false,
}: MyProfileViewProps) {
  const genderLabel = genderOptions.find(
    (option) => option.value === profile.gender,
  )?.label;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <MyProfileHeader />

      <main className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <section className="rounded-3xl bg-card p-5">
          <div className="flex items-center gap-4">
            <Avatar
              // 서버 기본 이미지 경로도 그대로 보여준다 (SHI-164 결정 7)
              src={toApiImageUrl(profile.profileImageUrl)}
              alt="프로필 사진"
              className="size-16"
            />
            <div className="min-w-0 flex-1 text-sm text-muted-foreground">
              <p className="truncate text-lg font-bold text-foreground">
                {profile.nickname}
              </p>
              <p className="mt-0.5 truncate">이름 {profile.name}</p>
              <p className="mt-0.5">
                {genderLabel} ·{" "}
                {formatBirthDate(profile.birthDate.replaceAll("-", ""))}
              </p>
              {profile.email && (
                <p className="mt-0.5 truncate">{profile.email}</p>
              )}
            </div>
          </div>
          <Button
            variant="secondary"
            className="mt-4 h-11 w-full text-sm"
            onClick={onEdit}
          >
            수정하기
          </Button>
        </section>

        <section className="mt-4 overflow-hidden rounded-3xl bg-card">
          {/* 정의서 UI 예시대로 로그아웃 위에. MY-01 시안에 없어 로그아웃 줄 모양을 따른다 (SHI-160 결정) */}
          {onHomeScreenGuide && (
            <button
              type="button"
              onClick={onHomeScreenGuide}
              className="flex min-h-14 w-full items-center gap-2 border-b border-border px-5 text-left text-base"
            >
              <span className="flex-1">홈 화면에 추가하는 방법</span>
              <ChevronRight
                aria-hidden
                className="size-5 shrink-0 text-subtle-foreground"
              />
            </button>
          )}
          <button
            type="button"
            onClick={onLogout}
            disabled={isAccountActionPending}
            className="flex min-h-14 w-full items-center px-5 text-left text-base"
          >
            로그아웃
          </button>
          <button
            type="button"
            onClick={onWithdraw}
            disabled={isAccountActionPending}
            className="flex min-h-14 w-full items-center border-t border-border px-5 text-left text-base text-subtle-foreground"
          >
            회원 탈퇴
          </button>
        </section>
      </main>
    </div>
  );
}
