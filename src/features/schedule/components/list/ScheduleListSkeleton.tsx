import { Skeleton, SkeletonGroup } from "@/shared/ui/Skeleton";

/** 일정 목록 불러오는 중 (LIST-01·04·05). 카드(ScheduleCard)와 같은 크기·간격으로 3장 */
export function ScheduleListSkeleton() {
  return (
    <SkeletonGroup className="flex flex-col gap-3">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className="flex flex-col gap-2.5 rounded-2xl bg-card px-4 py-3.5"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-14" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </SkeletonGroup>
  );
}
