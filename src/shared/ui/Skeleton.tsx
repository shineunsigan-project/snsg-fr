import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

/**
 * 불러오는 중 자리 표시 한 칸 (D-5, SHI-188). 크기·모양은 className으로 정한다(shadcn Skeleton과 같은 사용법)
 * 화면 읽기 도구에는 읽히지 않는다. "불러오는 중" 안내는 감싸는 SkeletonGroup이 한 번만 한다
 */
export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn(
        "animate-pulse rounded-md bg-skeleton motion-reduce:animate-none",
        className,
      )}
      {...props}
    />
  );
}

/**
 * 스켈레톤 묶음. 화면 읽기 도구에 "불러오는 중"을 한 번 알린다.
 * 빠른 응답에서 번쩍이지 않게 200ms 동안 투명하게 둔다(`animate-skeleton-appear`, globals.css). 자리는 처음부터 차지해 배치가 밀리지 않는다
 */
export function SkeletonGroup({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div role="status" className={cn("animate-skeleton-appear", className)}>
      <span className="sr-only">불러오는 중</span>
      {children}
    </div>
  );
}

/**
 * 화면 전체 준비·이동 중 자리 표시 (SHI-188 Q4, 사용자 결정 2026-11-16: 불러오는 중 표시를 스켈레톤으로 통일).
 * 기기 저장값 읽기·기기 판별처럼 그릴 화면 배치가 정해지기 전에 쓴다. 제목 한 줄과 내용 칸 셋
 */
export function PageSkeleton() {
  return (
    <SkeletonGroup className="mx-auto flex min-h-dvh max-w-md flex-col gap-4 bg-card px-5 pt-safe">
      <Skeleton className="mt-16 h-8 w-48" />
      <Skeleton className="h-20 rounded-xl" />
      <Skeleton className="h-20 rounded-xl" />
      <Skeleton className="h-20 rounded-xl" />
    </SkeletonGroup>
  );
}
