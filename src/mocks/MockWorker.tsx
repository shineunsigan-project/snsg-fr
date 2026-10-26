"use client";

import { useEffect } from "react";

import { worker } from "./browser";

// worker는 한 번만 시작할 수 있다. 개발 모드(StrictMode)에서 effect가 두 번 실행돼도 같은 시작을 공유한다
let workerStart: ReturnType<typeof worker.start> | undefined;

export function MockWorker({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    workerStart ??= worker.start({ onUnhandledFrame: "bypass" });
    workerStart.then(onReady);
  }, [onReady]);

  return null;
}
