/**
 * Loading·Error·Empty 상태의 공통 임시 표시 (AGENTS §2, DESIGN D-5)
 * 디자인이 정해지기 전까지 텍스트만 화면 가운데에 보여준다
 */
export function PageStatus({ message }: { message: string }) {
  return (
    <div
      role="status"
      className="flex min-h-dvh items-center justify-center px-5"
    >
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
