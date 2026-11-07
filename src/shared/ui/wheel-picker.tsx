import * as WheelPickerPrimitive from "@ncdai/react-wheel-picker";
import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/utils";

// shadcn 레지스트리 @ncdai/wheel-picker 기반. 패키지 기본 CSS는 globals.css에서 base 레이어로 불러온다

type WheelPickerValue = WheelPickerPrimitive.WheelPickerValue;

type WheelPickerOption<T extends WheelPickerValue = string> =
  WheelPickerPrimitive.WheelPickerOption<T>;

function WheelPickerWrapper({
  className,
  ...props
}: ComponentProps<typeof WheelPickerPrimitive.WheelPickerWrapper>) {
  return (
    <WheelPickerPrimitive.WheelPickerWrapper
      className={cn(
        // 열마다 따로 그려지는 선택 줄 배경을 한 줄로 이어 보이게 양 끝 열만 둥글게 한다
        "*:data-rwp:first:*:data-rwp-highlight-wrapper:rounded-s-lg",
        "*:data-rwp:last:*:data-rwp-highlight-wrapper:rounded-e-lg",
        className,
      )}
      {...props}
    />
  );
}

function WheelPicker<T extends WheelPickerValue = string>({
  classNames,
  ...props
}: WheelPickerPrimitive.WheelPickerProps<T>) {
  return (
    <WheelPickerPrimitive.WheelPicker
      classNames={{
        optionItem: cn(
          "text-lg text-muted-foreground data-disabled:opacity-40",
          classNames?.optionItem,
        ),
        highlightWrapper: cn(
          "bg-brand-soft text-foreground",
          "data-rwp-focused:inset-ring-2 data-rwp-focused:inset-ring-ring/50",
          classNames?.highlightWrapper,
        ),
        highlightItem: cn(
          "text-xl font-bold data-disabled:opacity-40",
          classNames?.highlightItem,
        ),
      }}
      {...props}
    />
  );
}

export { WheelPicker, WheelPickerWrapper };
export type { WheelPickerOption };
