import { useId, type ComponentProps, type ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

type TextFieldProps = Omit<ComponentProps<"input">, "id"> & {
  label: string;
  /** 라벨 뒤에 더 연하게 붙는 말 (예: `· 수정 불가`, 시안 MY-02) */
  labelNote?: string;
  /** 입력칸 아래 안내 문구 */
  helperText?: string;
  /** 안내 문구 색. 기본은 회색, 좋은 소식만 녹색 (결정 2026-11-07) */
  helperTone?: "default" | "success";
  /** 입력칸 아래 오류 문구. 있으면 helperText 대신 보여준다 */
  errorMessage?: string;
  /** 입력칸 안 오른쪽에 붙는 값 (예: 생년월일 옆 연령대) */
  trailing?: ReactNode;
};

/** 라벨(위) → 입력 → 도움말(아래) 구조의 입력 필드 (DESIGN §9.1, §13-9) */
export function TextField({
  label,
  labelNote,
  helperText,
  helperTone = "default",
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
      <FieldLabel htmlFor={id} label={label} note={labelNote} />
      <div
        className={cn(
          "mt-2 flex h-13 items-center gap-2 rounded-lg border bg-card px-4",
          // 입력 중인 칸은 녹색 테두리가 포커스 표시를 대신한다 (시안 MY-02). 오류 테두리가 우선
          errorMessage
            ? "border-destructive"
            : "border-input focus-within:border-primary focus-within:ring-1 focus-within:ring-primary focus-within:ring-inset",
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
        <FieldMessage
          id={messageId}
          tone={errorMessage ? "error" : helperTone}
          message={message}
        />
      )}
    </div>
  );
}

/** 입력 칸 라벨. 읽기 전용 칸처럼 TextField 모양을 따로 만드는 곳에서도 쓴다 */
export function FieldLabel({
  htmlFor,
  label,
  note,
}: {
  htmlFor: string;
  label: string;
  note?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-xs font-bold text-muted-foreground"
    >
      {label}
      {note && (
        <span className="font-normal text-subtle-foreground"> {note}</span>
      )}
    </label>
  );
}

/** 입력 칸 아래 안내(회색)·좋은 소식(녹색)·오류(빨강) 문구 */
export function FieldMessage({
  id,
  tone,
  message,
}: {
  id: string;
  tone: "default" | "success" | "error";
  message: string;
}) {
  return (
    <p
      id={id}
      className={cn(
        "mt-2 text-xs",
        tone === "error" && "font-semibold text-destructive",
        tone === "success" && "text-primary",
        tone === "default" && "text-muted-foreground",
      )}
    >
      {message}
    </p>
  );
}
