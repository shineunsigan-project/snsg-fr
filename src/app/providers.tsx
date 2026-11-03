"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import dynamic from "next/dynamic";
import { useState, type ReactNode } from "react";

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
