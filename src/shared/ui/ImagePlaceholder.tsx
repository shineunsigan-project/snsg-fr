import { cn } from "@/shared/lib/utils";

type ImagePlaceholderProps = {
  /** 모집완료 등 비활성 상태에서는 회색 사선으로 표시한다 (DESIGN §13) */
  muted?: boolean;
  className?: string;
};

// TODO: 대표 사진은 보류 상태라 placeholder를 기본으로 쓴다 (DESIGN §14)
export function ImagePlaceholder({
  muted = false,
  className,
}: ImagePlaceholderProps) {
  return (
    <div
      aria-hidden
      className={cn(
        muted ? "bg-stripe-pattern-muted" : "bg-stripe-pattern",
        className,
      )}
    />
  );
}
