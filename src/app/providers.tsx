"use client";

import {
  hashKey,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { isAxiosError } from "axios";
import dynamic from "next/dynamic";
import { useEffect, useState, type ReactNode } from "react";

import { sessionQueryKey } from "@/features/auth/api/session";
import { Toaster } from "@/shared/ui/sonner";

const isMockingEnabled = process.env.NEXT_PUBLIC_API_MOCKING === "enabled";

// msw/browser는 서버에서 resolve되지 않으므로 클라이언트에서만 불러온다
const MockWorker = dynamic(
  () => import("@/mocks/MockWorker").then((mod) => mod.MockWorker),
  { ssr: false },
);

/** 조회 재시도 횟수 (TanStack Query 기본값과 같다) */
const MAX_QUERY_RETRIES = 3;

/**
 * 조회 실패 시 재시도 여부 (팀 결정 2026-11-03, Q10)
 * 4xx는 다시 보내도 결과가 같으므로 바로 오류로 보여준다. 응답이 없거나(네트워크) 5xx일 때만 재시도한다
 */
function shouldRetryQuery(failureCount: number, error: unknown) {
  const status = isAxiosError(error) ? error.response?.status : undefined;
  if (status !== undefined && status >= 400 && status < 500) return false;
  return failureCount < MAX_QUERY_RETRIES;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: shouldRetryQuery } },
      }),
  );
  // 다른 페이지(카카오·약관 등)에 다녀와 뒤로·앞으로 가기를 하면 브라우저가 뒤로가기 캐시(bfcache)로 그 전 화면을 그대로 복원한다.
  // 복원된 화면의 로그인 상태·데이터는 떠날 때 그대로라, 로그인 상태를 다시 확인한 뒤 나머지 데이터를 다시 받는다 (SHI-186)
  // 로그인 상태를 먼저 맞춰야 상세 같은 화면이 새 토큰으로 다시 받는다(순서가 바뀌면 비로그인 응답을 받는다)
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      void queryClient.refetchQueries({ queryKey: sessionQueryKey }).then(() =>
        queryClient.invalidateQueries({
          predicate: (query) => query.queryHash !== hashKey(sessionQueryKey),
        }),
      );
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [queryClient]);

  // mock을 켠 경우 worker가 준비되기 전에 요청이 나가지 않도록 렌더링을 미룬다
  const [isMockReady, setIsMockReady] = useState(!isMockingEnabled);

  if (!isMockReady) {
    return <MockWorker onReady={() => setIsMockReady(true)} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster />
    </QueryClientProvider>
  );
}
