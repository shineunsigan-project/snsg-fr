import { useId, type Ref } from "react";

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

/** 2지선다 선택 버튼 (DESIGN §9.1 Toggle Button Group, §13-10). 라디오 버튼으로 동작한다 */
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
      <div className="mt-2 grid grid-cols-2 gap-2.5">
        {options.map((option, index) => (
          <label
            key={option.value}
            className="flex h-13 cursor-pointer items-center justify-center rounded-lg border border-input bg-card text-md text-foreground has-checked:border-primary has-checked:bg-brand-soft has-checked:font-bold has-checked:text-brand has-checked:ring-1 has-checked:ring-primary has-checked:ring-inset has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
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
        // TODO(D-8): 오류 색은 디자인 미확인이라 shadcn 기본 오류 색을 쓴다
        <p id={messageId} className="mt-2 text-xs text-destructive">
          {errorMessage}
        </p>
      )}
    </fieldset>
  );
}
