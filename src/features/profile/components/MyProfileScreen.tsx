"use client";

import { useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useRouter } from "next/navigation";
import {
  type ReactNode,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";

import { useIsLoggedIn } from "@/features/auth/hooks/useIsLoggedIn";
import {
  isMobileDevice,
  markHomeScreenGuideOpenedInApp,
  toHomeScreenGuidePath,
} from "@/features/onboarding/lib/homeScreenGuide";
import { useLogout } from "@/features/auth/hooks/useLogout";
import { clearSession } from "@/features/auth/lib/clearSession";
import { getApiErrorCode } from "@/shared/lib/api/client";
import { saveLoginRedirect } from "@/shared/lib/kakaoLogin";
import { BottomNav, type BottomNavItem } from "@/shared/ui/BottomNav";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { PageStatus } from "@/shared/ui/PageStatus";
import { showToast } from "@/shared/ui/sonner";

import { USER_NOT_FOUND_CODE, type MyProfile } from "../api/myProfile";
import { WITHDRAWAL_BLOCKED_CODE } from "../api/withdraw";
import { useMyProfile } from "../hooks/useMyProfile";
import { useWithdraw } from "../hooks/useWithdraw";
import { useWithdrawalEligibility } from "../hooks/useWithdrawalEligibility";
import { MyProfileHeader, MyProfileView } from "./MyProfileView";

const MY_PATH = "/my";

const subscribeNothing = () => () => {};

/**
 * 내 정보 MY-01 (USER_FLOW §8). GNB `내 정보`로 들어온다
 * - 비로그인이거나 조회가 401이면 로그인 화면으로 보내고, 로그인 후 이 화면으로 돌아오게 한다 (USER_FLOW §4.3)
 *   access token 만료(UNAUTHENTICATED)는 공통 클라이언트가 재발급을 시도하고, 실패하면 거기서 로그인 화면으로 보낸다
 *   조회가 404 USER_NOT_FOUND(사용자가 없거나 탈퇴)면 로그인 상태를 비우고 401과 같이 보낸다 (api-guide 내 프로필 조회)
 * - 로그아웃(MY-03): 확인 팝업 → 응답과 상관없이 홈(LIST-02 모집 중)으로. 돌아올 화면은 남기지 않는다 (USER_FLOW §4.4)
 * - 회원 탈퇴(MY-04): 탈퇴 가능 여부 → 불가 팝업 또는 재확인 팝업 → 탈퇴 → 완료 팝업 → 로그인 화면 (SHI-165 결정 1~3)
 */
export function MyProfileScreen() {
  // 기기 종류는 브라우저에서만 안다. 서버 렌더링과 첫 그림에서는 메뉴를 숨긴다
  const isMobile = useSyncExternalStore(
    subscribeNothing,
    isMobileDevice,
    () => false,
  );
  const router = useRouter();
  const queryClient = useQueryClient();
  const isLoggedIn = useIsLoggedIn();
  const { data: profile, error, refetch } = useMyProfile(isLoggedIn === true);
  // 탈퇴하면 로그인 상태를 비우며 받아 둔 프로필도 지운다. 완료 팝업 뒤에 내 정보 화면을 그대로 두려고 누르기 직전 값을 남긴다
  const [withdrawnProfile, setWithdrawnProfile] = useState<MyProfile>();
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isWithdrawBlocked, setIsWithdrawBlocked] = useState(false);
  const { mutate: logout, isPending: isLoggingOut, isIdle } = useLogout();
  const withdrawalEligibility = useWithdrawalEligibility();
  const withdraw = useWithdraw();
  const isUserNotFound = getApiErrorCode(error) === USER_NOT_FOUND_CODE;
  const isUnauthorized =
    isLoggedIn === false ||
    isUserNotFound ||
    (isAxiosError(error) && error.response?.status === 401);
  // 로그아웃·탈퇴로 세션이 비로그인이 되어도 아래의 로그인 화면 이동을 하지 않는다.
  // 로그아웃(이 화면의 useLogout)은 홈으로, 탈퇴는 완료 팝업을 먼저 보여주고 로그인 화면으로 간다
  const isLeaving = !isIdle || withdraw.isPending || withdraw.isSuccess;

  // 사용자가 없거나 탈퇴했으면(404) 로그인 상태를 비운다. 비로그인이 되어도 아래 이동은 isUnauthorized가 그대로라 한 번만 한다
  useEffect(() => {
    if (isUserNotFound) clearSession(queryClient);
  }, [isUserNotFound, queryClient]);

  useEffect(() => {
    if (!isUnauthorized || isLeaving) return;
    saveLoginRedirect(MY_PATH);
    router.replace("/login");
  }, [isUnauthorized, isLeaving, router]);

  const handleNavSelect = (item: BottomNavItem) => {
    if (item === "schedule") router.push("/");
    // 입력하던 값은 유지하고 1단계부터 보여준다 (홈과 같다)
    if (item === "create") router.push("/create?step=1");
  };

  const handleLogout = () =>
    logout(undefined, { onSettled: () => router.replace("/") });

  // 로그인 만료는 공통 클라이언트가 로그인 화면으로 보낸다. 📝 임시 문구 TODO(F-19)
  const showWithdrawError = (withdrawError: unknown) => {
    if (getApiErrorCode(withdrawError) === "UNAUTHENTICATED") return;
    showToast("탈퇴하지 못했어요. 다시 시도해주세요.", { variant: "error" });
  };

  // [회원 탈퇴]: 먼저 탈퇴 가능 여부를 묻는다. 막는 일정이 있으면 불가 팝업, 없으면 재확인 팝업 (SHI-165 결정 1)
  // 탈퇴 가능 시각(availableAt)은 보여주지 않는다 (결정 2)
  const handleWithdrawStart = () =>
    withdrawalEligibility.mutate(undefined, {
      onSuccess: ({ withdrawable }) => {
        if (withdrawable) setIsWithdrawOpen(true);
        else setIsWithdrawBlocked(true);
      },
      onError: showWithdrawError,
    });

  const handleWithdraw = () => {
    setWithdrawnProfile(profile);
    withdraw.mutate(undefined, {
      onSettled: () => setIsWithdrawOpen(false),
      onError: (withdrawError) => {
        // 확인한 뒤 그 사이 일정에 참여한 경우. 서버 message 대신 같은 불가 팝업을 띄운다 (결정 3)
        if (getApiErrorCode(withdrawError) === WITHDRAWAL_BLOCKED_CODE) {
          setIsWithdrawBlocked(true);
        } else {
          showWithdrawError(withdrawError);
        }
      },
    });
  };

  // 탈퇴하면 돌아올 화면이 없으므로 loginRedirect를 남기지 않는다
  const goToLogin = () => router.replace("/login");

  // 탈퇴 응답을 받는 순간 받아 둔 프로필이 지워지므로, 요청 중부터 누르기 직전 값을 보여준다
  const isWithdrawing = withdraw.isPending || withdraw.isSuccess;
  const shownProfile = isWithdrawing
    ? withdrawnProfile
    : isUnauthorized
      ? undefined
      : profile;
  const page = (body: ReactNode) => (
    <div className="mx-auto flex h-dvh max-w-md flex-col bg-background">
      {body}
      <BottomNav
        activeItem="my"
        // 탈퇴 완료 팝업 뒤에는 누르기 직전 화면(로그인 상태의 GNB)을 그대로 둔다 (시안 비교 6번)
        isLoggedIn={isWithdrawing ? true : isLoggedIn}
        onItemSelect={handleNavSelect}
      />
    </div>
  );

  let content;
  if (shownProfile) {
    content = page(
      // View가 남은 높이를 채우고 본문만 스크롤한다
      <MyProfileView
        profile={shownProfile}
        onEdit={() => router.push("/my/edit")}
        // 메뉴로 연 안내는 7일 기록에 영향이 없다 (SHI-160 결정 2026-11-07). PC에는 보여 줄 안내가 없어 메뉴를 숨긴다 (F-23)
        onHomeScreenGuide={
          isMobile
            ? () => {
                markHomeScreenGuideOpenedInApp();
                router.push(toHomeScreenGuidePath("menu"));
              }
            : undefined
        }
        onLogout={() => setIsLogoutOpen(true)}
        onWithdraw={handleWithdrawStart}
        isAccountActionPending={withdrawalEligibility.isPending}
      />,
    );
  } else if (isUnauthorized || !error) {
    content = <PageStatus message="불러오는 중..." />;
  } else {
    // 401이 아닌 오류(5xx·네트워크 등)는 화면에 두고 다시 시도 (일정 상세와 같다, 사용자 결정 2026-11-07)
    content = page(
      <>
        <MyProfileHeader />
        <main className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-5 text-center">
          {/* 📝 임시 문구 TODO(F-19) */}
          <p className="text-sm text-muted-foreground">
            내 정보를 불러오지 못했어요.
          </p>
          <Button variant="secondary" onClick={() => refetch()}>
            다시 시도
          </Button>
        </main>
      </>,
    );
  }

  return (
    <>
      {content}
      <ConfirmDialog
        open={isLogoutOpen}
        onClose={() => setIsLogoutOpen(false)}
        title="로그아웃할까요?"
        confirmLabel="로그아웃"
        hasCloseButton
        onConfirm={handleLogout}
        isPending={isLoggingOut}
      />
      <ConfirmDialog
        open={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        icon="sad"
        title="정말 탈퇴하실 건가요?"
        confirmLabel="탈퇴하기"
        hasCloseButton
        isDestructive
        onConfirm={handleWithdraw}
        isPending={withdraw.isPending}
      />
      <ConfirmDialog
        open={isWithdrawBlocked}
        onClose={() => setIsWithdrawBlocked(false)}
        icon="warning"
        title="진행중인 일정이 있습니다."
        description={
          "모든 일정을 취소하거나, 마지막 일정 시작 시각으로부터\n24시간이 지나야 탈퇴할 수 있어요."
        }
        onConfirm={() => setIsWithdrawBlocked(false)}
      />
      {/* 완료 팝업은 [확인]·Esc 어느 쪽으로 닫아도 로그인 화면으로 간다 */}
      <ConfirmDialog
        open={withdraw.isSuccess}
        onClose={goToLogin}
        icon="check"
        title="회원 탈퇴가 정상 처리되었습니다."
        onConfirm={goToLogin}
      />
    </>
  );
}
