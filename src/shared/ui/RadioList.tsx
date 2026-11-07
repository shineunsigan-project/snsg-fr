"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { CheckIcon } from "lucide-react";
import { useId } from "react";

import { cn } from "@/shared/lib/utils";

type RadioListProps = Omit<RadioGroup.Props<string>, "className"> & {
  className?: string;
};

/**
 * 하나만 고르는 세로 선택 목록 (DESIGN §9.1 Radio List Item, Base UI RadioGroup 기반).
 * 시안 CRT-01 활동 선택, CRT-03 예상 소요시간의 카드형 목록이다.
 * 접근성 이름은 `aria-label` 또는 `aria-labelledby`로 준다.
 */
export function RadioList({ className, ...props }: RadioListProps) {
  return (
    <RadioGroup<string>
      className={cn("flex flex-col gap-3", className)}
      {...props}
    />
  );
}

type RadioListItemProps = {
  value: string;
  label: string;
  /** 라벨 오른쪽의 보조 설명 (예: `2시간 내외`) */
  description?: string;
  disabled?: boolean;
};

export function RadioListItem({
  value,
  label,
  description,
  disabled,
}: RadioListItemProps) {
  const id = useId();
  const labelId = `${id}-label`;
  const descriptionId = `${id}-description`;

  return (
    <label
      className={cn(
        "group/radio flex min-h-15 cursor-pointer items-center gap-3 rounded-xl border border-input bg-card px-5 py-3",
        // 선택 상태: 녹색 테두리 + 연두 배경 + 녹색 Bold 글자 (DESIGN §13-10)
        "has-data-checked:border-primary has-data-checked:bg-brand-soft has-data-checked:ring-1 has-data-checked:ring-primary has-data-checked:ring-inset",
        "has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
        "has-data-disabled:cursor-default has-data-disabled:opacity-50",
      )}
    >
      <span className="flex min-w-0 flex-1 items-baseline gap-2">
        <span
          id={labelId}
          className="truncate text-base font-bold text-foreground group-has-data-checked/radio:text-brand"
        >
          {label}
        </span>
        {description && (
          <span
            id={descriptionId}
            className="shrink-0 text-sm text-muted-foreground"
          >
            {description}
          </span>
        )}
      </span>
      <Radio.Root
        value={value}
        disabled={disabled}
        aria-labelledby={labelId}
        aria-describedby={description ? descriptionId : undefined}
        className="flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-input bg-card outline-none data-checked:border-primary data-checked:bg-primary"
      >
        <Radio.Indicator className="flex text-primary-foreground data-unchecked:hidden">
          <CheckIcon className="size-3.5" strokeWidth={3} aria-hidden />
        </Radio.Indicator>
      </Radio.Root>
    </label>
  );
}
