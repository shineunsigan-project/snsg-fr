import { useId, type ComponentProps, type ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

type TextFieldProps = Omit<ComponentProps<"input">, "id"> & {
  label: string;
  /** 입력칸 아래 안내·성공 문구 (녹색) */
  helperText?: string;
  /** 입력칸 아래 오류 문구. 있으면 helperText 대신 보여준다 */
  errorMessage?: string;
  /** 입력칸 안 오른쪽에 붙는 값 (예: 생년월일 옆 연령대) */
  trailing?: ReactNode;
};

/** 라벨(위) → 입력 → 도움말(아래) 구조의 입력 필드 (DESIGN §9.1, §13-9) */
export function TextField({
  label,
  helperText,
  errorMessage,
  trailing,
  className,
  ...inputProps
}: TextFieldProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const message = errorMessage ?? helperText;

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="block text-xs font-bold text-muted-foreground"
      >
        {label}
      </label>
      <div
        className={cn(
          "mt-2 flex h-13 items-center gap-2 rounded-lg border bg-card px-4 focus-within:ring-3 focus-within:ring-ring/50",
          errorMessage ? "border-destructive" : "border-input",
        )}
      >
        <input
          id={id}
          aria-invalid={errorMessage ? true : undefined}
          aria-describedby={message ? messageId : undefined}
          className="min-w-0 flex-1 bg-transparent text-md text-foreground outline-none placeholder:text-subtle-foreground"
          {...inputProps}
        />
        {trailing}
      </div>
      {message && (
        <p
          id={messageId}
          className={cn(
            "mt-2 text-xs",
            // TODO(D-8): 오류 색은 디자인 미확인이라 shadcn 기본 오류 색을 쓴다
            errorMessage ? "text-destructive" : "text-primary",
          )}
        >
          {message}
        </p>
      )}
    </div>
  );
}
