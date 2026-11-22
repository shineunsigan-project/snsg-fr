import { Button } from "@/shared/ui/button";

/**
 * 홈 구역 하나의 불러오기 실패 표시. 다른 구역은 그대로 둔다 (USER_FLOW §5.1).
 * 문구는 일정 목록과 같다. 📝 임시 문구 TODO(F-19)
 */
export function HomeSectionError({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-4 py-6 text-center"
    >
      <p className="text-sm text-muted-foreground">일정을 불러오지 못했어요.</p>
      <Button
        variant="secondary"
        className="h-11 px-5 text-sm"
        onClick={onRetry}
      >
        다시 시도
      </Button>
    </div>
  );
}
