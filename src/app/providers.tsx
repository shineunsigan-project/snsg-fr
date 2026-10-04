"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useState, type ReactNode } from "react";

import { Toaster } from "@/shared/ui/sonner";

const isMockingEnabled = process.env.NEXT_PUBLIC_API_MOCKING === "enabled";

// msw/browser는 서버에서 resolve되지 않으므로 클라이언트에서만 불러온다
const MockWorker = dynamic(
  () => import("@/mocks/MockWorker").then((mod) => mod.MockWorker),
  { ssr: false },
);

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
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
