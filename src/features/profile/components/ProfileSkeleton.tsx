import { cn } from "@/shared/lib/utils";
import { BottomCta } from "@/shared/ui/BottomCta";
import { Skeleton, SkeletonGroup } from "@/shared/ui/Skeleton";

/** 내 정보 불러오는 중 (MY-01). 헤더는 실제 헤더를 두고, 프로필 카드·메뉴 카드를 같은 배치로 그린다 */
export function MyProfileSkeleton() {
  return (
    <SkeletonGroup className="min-h-0 flex-1 px-5 py-4">
      <div className="rounded-3xl border border-border bg-card p-5">
        <div className="flex items-center gap-4">
          <Skeleton className="size-16 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="mt-4 h-11 rounded-xl" />
      </div>
      <div className="mt-4 flex flex-col rounded-3xl border border-border bg-card">
        {[0, 1, 2].map((index) => (
          <div key={index} className="flex min-h-14 items-center px-5">
            <Skeleton className="h-5 w-36" />
          </div>
        ))}
      </div>
    </SkeletonGroup>
  );
}

/** 프로필 수정·완성 불러오는 중 (MY-02·AUTH-03). 사진과 입력칸 5개, 하단 버튼 자리를 폼과 같은 배치로 그린다 */
export function ProfileFormSkeleton({
  showTitle = false,
}: {
  showTitle?: boolean;
}) {
  return (
    <SkeletonGroup className="flex flex-1 flex-col">
      {/* 프로필 완성(AUTH-03)은 제목과 소개 두 줄이 있어 사진이 그만큼 아래에 온다 */}
      {showTitle && (
        <div className="flex flex-col px-5 pt-9">
          <Skeleton className="h-8.5 w-56" />
          <Skeleton className="mt-2 h-4 w-64" />
          <Skeleton className="mt-1 h-4 w-28" />
        </div>
      )}
      <div className="flex-1 px-5">
        <div
          className={cn("flex justify-center", showTitle ? "mt-5.5" : "mt-5")}
        >
          <Skeleton className="size-20 rounded-full" />
        </div>
        <div className="mt-4.5 flex flex-col gap-3.5 pb-6">
          {[0, 1, 2, 3, 4].map((index) => (
            <div key={index} className="flex flex-col gap-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-13 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
      {/* 불러온 뒤 하단 고정 버튼(수정 완료·시작하기)이 생겨도 배치가 흔들리지 않게 자리를 둔다 */}
      <BottomCta>
        <Skeleton className="h-14 rounded-xl" />
      </BottomCta>
    </SkeletonGroup>
  );
}
