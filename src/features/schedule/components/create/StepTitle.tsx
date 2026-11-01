import type { ReactNode } from "react";

/** 단계 질문 제목과 보조 문구 (시안 CRT-01~06) */
export function StepTitle({
  children,
  description,
}: {
  children: ReactNode;
  description?: string;
}) {
  return (
    <div className="pt-6">
      <h1 className="text-2xl leading-8.5 font-bold break-keep">{children}</h1>
      {description && (
        <p className="mt-2 text-sm break-keep text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}
