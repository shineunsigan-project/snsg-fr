import { Skeleton, SkeletonGroup } from "@/shared/ui/Skeleton";

/** 개설 1단계 활동 목록 불러오는 중 (CRT-01). RadioList 항목과 같은 높이로 3줄 */
export function ActivityListSkeleton() {
  return (
    <SkeletonGroup className="flex flex-col gap-3">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className="flex min-h-15 items-center rounded-xl border border-input bg-card px-5 py-3"
        >
          <Skeleton className="h-5 w-20" />
        </div>
      ))}
    </SkeletonGroup>
  );
}

/** 개설 2단계 장소 목록 불러오는 중 (CRT-02). 장소 버튼과 같은 배치로 3줄 */
export function PlaceListSkeleton() {
  return (
    <SkeletonGroup className="flex flex-col gap-2.5">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className="flex items-start gap-3 rounded-xl border border-input bg-card px-4 py-3.5"
        >
          <Skeleton className="mt-0.5 size-5 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      ))}
    </SkeletonGroup>
  );
}
