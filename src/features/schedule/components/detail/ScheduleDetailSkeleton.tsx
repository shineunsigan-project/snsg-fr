import { Skeleton, SkeletonGroup } from "@/shared/ui/Skeleton";

/**
 * 일정 상세 불러오는 중 (DTL·HOST). 헤더는 실제 헤더를 두고, 본문을 DetailInfo·ParticipantSection·PlaceSection과 같은 배치로 그린다.
 * 하단 버튼은 역할마다 달라 그리지 않는다
 */
export function ScheduleDetailSkeleton() {
  return (
    <SkeletonGroup className="flex flex-1 flex-col">
      <div className="flex flex-col px-5 pt-4">
        <div className="flex gap-1.5">
          <Skeleton className="h-7 w-16 rounded-lg" />
          <Skeleton className="h-7 w-16 rounded-lg" />
        </div>
        <div className="mt-3 flex flex-col items-center">
          <Skeleton className="size-14 rounded-full" />
          <Skeleton className="mt-2 h-4 w-16" />
          <Skeleton className="mt-4 h-7 w-48" />
        </div>
        <Skeleton className="mt-5 h-18 rounded-xl" />
        <Skeleton className="mt-6 h-5 w-20" />
        <Skeleton className="mt-3 h-20 rounded-2xl" />
      </div>
      <div className="flex flex-col gap-3 px-5 pt-5">
        <Skeleton className="h-5 w-24" />
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {[0, 1, 2].map((index) => (
              <Skeleton
                key={index}
                className="size-8 rounded-full ring-2 ring-card"
              />
            ))}
          </div>
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <div className="flex flex-col gap-3 px-5 pt-5 pb-8">
        <Skeleton className="h-5 w-12" />
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-56" />
        <Skeleton className="aspect-place-map rounded-2xl" />
      </div>
    </SkeletonGroup>
  );
}

/** 참여자 명단 펼쳤을 때 불러오는 중 (DTL-06·HOST-02). 명단 줄과 같은 배치로 3줄 */
export function ParticipantRowsSkeleton() {
  return (
    <SkeletonGroup className="mx-5 flex flex-col divide-y divide-border border-t border-border">
      {[0, 1, 2].map((index) => (
        <div key={index} className="flex items-center gap-3 py-2.5">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3.5 w-28" />
          </div>
        </div>
      ))}
    </SkeletonGroup>
  );
}
