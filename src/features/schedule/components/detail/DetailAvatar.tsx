import { UserRound } from "lucide-react";

import { cn } from "@/shared/lib/utils";

/** 프로필 사진. 없으면(탈퇴한 사용자 포함) 연두 바탕에 흰 사람 모양 (시안 DTL-01). 크기는 className으로 정한다 */
export function DetailAvatar({
  src,
  className,
}: {
  src: string | null;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-avatar text-white",
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- 사용자 프로필 사진(외부 경로)이라 next/image 최적화 대상이 아니다
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        <UserRound className="size-1/2 fill-current" />
      )}
    </span>
  );
}
