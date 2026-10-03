"use client";

import { useEffect } from "react";

import { worker } from "./browser";

export function MockWorker({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    worker.start({ onUnhandledFrame: "bypass" }).then(onReady);
  }, [onReady]);

  return null;
}
