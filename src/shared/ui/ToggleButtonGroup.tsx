import { useId, type Ref } from "react";

import { cn } from "@/shared/lib/utils";

type ToggleButtonGroupProps<T extends string> = {
  label: string;
  name: string;
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T | undefined;
  onChange: (value: T) => void;
  onBlur?: () => void;
  errorMessage?: string;
  /** 첫 번째 선택지에 연결한다. 폼 오류 시 포커스 이동에 쓴다 */
  ref?: Ref<HTMLInputElement>;
};

/** 하나만 고르는 선택 버튼 (DESIGN §9.1 Toggle Button Group, §13-10). 라디오 버튼으로 동작한다. 선택지 수만큼 같은 폭으로 나눈다 */
export function ToggleButtonGroup<T extends string>({
  label,
  name,
  options,
  value,
  onChange,
  onBlur,
  errorMessage,
  ref,
}: ToggleButtonGroupProps<T>) {
  const messageId = useId();

  return (
    <fieldset aria-describedby={errorMessage ? messageId : undefined}>
      <legend className="text-xs font-bold text-muted-foreground">
        {label}
      </legend>
      <div className="mt-2 grid auto-cols-fr grid-flow-col gap-2.5">
        {options.map((option, index) => (
          <label
            key={option.value}
            className={cn(
              "flex h-13 cursor-pointer items-center justify-center rounded-lg border bg-card text-md text-foreground has-checked:border-primary has-checked:bg-brand-soft has-checked:font-bold has-checked:text-brand has-checked:ring-1 has-checked:ring-primary has-checked:ring-inset has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
              // 오류면 모든 선택지에 빨간 테두리 (시안 AUTH-04)
              errorMessage ? "border-destructive" : "border-input",
            )}
          >
            <input
              ref={index === 0 ? ref : undefined}
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              onBlur={onBlur}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
      {errorMessage && (
        <p
          id={messageId}
          className="mt-2 text-xs font-semibold text-destructive"
        >
          {errorMessage}
        </p>
      )}
    </fieldset>
  );
}
