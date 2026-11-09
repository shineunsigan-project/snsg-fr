"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import {
  detectHomeScreenGuidePlatform,
  getMobileOs,
  nextHomeScreenGuideRecord,
  readHomeScreenGuideSource,
  saveHomeScreenGuideRecord,
  clearHomeScreenGuideOpenedInApp,
  isHomeScreenGuideOpenedInApp,
  type HomeScreenGuidePlatform,
  type HomeScreenGuideSource,
} from "../lib/homeScreenGuide";
import { HomeScreenGuide } from "./HomeScreenGuide";
import { getLoginRedirect } from "@/shared/lib/kakaoLogin";
import { PageStatus } from "@/shared/ui/PageStatus";

const noopSubscribe = () => () => {};

/**
 * 보여줄 안내 종류. 서버 렌더링 중에는 undefined, 보여주지 않으면 null
 * - 가입 직후·7일 뒤 홈: 대상(모바일 브라우저, 앱 안·홈 화면 실행 제외)일 때만
 * - 내 정보 메뉴: 사용자가 직접 열었으므로 OS만 본다
 */
function usePlatform(source: HomeScreenGuideSource) {
  return useSyncExternalStore<HomeScreenGuidePlatform | null | undefined>(
    noopSubscribe,
    () =>
      source === "menu"
        ? getMobileOs(navigator.userAgent, navigator.maxTouchPoints)
        : detectHomeScreenGuidePlatform(),
    () => undefined,
  );
}

/**
 * 홈 화면 추가 안내 ONB-01·01-1 (USER_FLOW §9.1). 가입 직후(replace)·7일 뒤 홈(push)·내 정보 메뉴(push)가 같이 쓴다 (결정 Q1)
 * 들어온 곳은 `from` 쿼리로 받는다. 가입 직후의 복귀 경로는 URL에 넣지 않고 loginRedirect(탭 저장소)를 그대로 쓴다
 * 새로고침해도 쿼리·탭 저장소가 남아 같은 동작을 한다
 */
export function HomeScreenGuideScreen() {
  const router = useRouter();
  // 쿼리가 없거나 잘못됐으면 기록을 바꾸지 않는 메뉴처럼 다룬다
  const source =
    readHomeScreenGuideSource(useSearchParams().get("from")) ?? "menu";
  const platform = usePlatform(source);
  // 처음 그릴 때 한 번 읽는다. 홈·내 정보에서 push로 왔으면 true
  const [isOpenedInApp] = useState(() =>
    typeof window === "undefined" ? false : isHomeScreenGuideOpenedInApp(),
  );
  // 읽을 때 지우면 Suspense로 첫 그림이 버려졌을 때 다시 읽은 값이 false가 된다. 화면을 떠날 때 지운다
  useEffect(() => clearHomeScreenGuideOpenedInApp, []);
  // 버튼을 빨리 두 번 누르거나 개발 모드에서 effect가 두 번 실행돼도 한 번만 이동한다
  // (뒤로가기가 두 번 되면 홈·내 정보를 지나 앞 화면이나 사이트 밖으로 나간다)
  const hasLeftRef = useRef(false);

  const leave = () => {
    if (hasLeftRef.current) return;
    hasLeftRef.current = true;
    // 가입 직후: 원래 보던 화면으로. 뒤로가기로 안내가 다시 나오지 않게 기록을 바꾼다 (USER_FLOW §4.3)
    if (source === "signup") router.replace(getLoginRedirect());
    // 7일 뒤 홈·내 정보 메뉴: 안내를 연 화면으로 돌아간다. 뒤로가기라 탭·필터가 그대로 남는다
    else if (isOpenedInApp) router.back();
    // 주소를 직접 열었거나 새로고침했으면 앞 화면이 사이트 밖일 수 있어 안내를 연 화면 주소로 바꾼다
    else router.replace(source === "home" ? "/" : "/my");
  };

  // 대상이 아니면 안내 없이 바로 돌아간다(가입 직후에 PC·앱 안 브라우저 등).
  // PC에서는 내 정보 메뉴를 숨기므로(F-23) 메뉴 안내는 주소를 직접 열었을 때만 여기로 온다
  const shouldLeave = platform === null;
  useEffect(() => {
    if (shouldLeave) leave();
  });

  if (!platform) return <PageStatus message="불러오는 중..." />;

  const handle = (action: "confirm" | "later") => {
    const record = nextHomeScreenGuideRecord(source, action, Date.now());
    if (record) saveHomeScreenGuideRecord(record);
    leave();
  };

  return (
    <HomeScreenGuide
      platform={platform}
      onConfirm={() => handle("confirm")}
      onLater={() => handle("later")}
    />
  );
}
