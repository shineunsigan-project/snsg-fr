"use client";

import { Tabs, TabsList, TabsTrigger } from "./tabs";

type SegmentedTabsProps<T extends string> = {
  items: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  onValueChange?: (value: T) => void;
  "aria-label": string;
};

export function SegmentedTabs<T extends string>({
  items,
  value,
  onValueChange,
  "aria-label": ariaLabel,
}: SegmentedTabsProps<T>) {
  return (
    <Tabs value={value} onValueChange={(next) => onValueChange?.(next as T)}>
      <TabsList
        aria-label={ariaLabel}
        className="w-full rounded-xl bg-secondary p-1 group-data-horizontal/tabs:h-11"
      >
        {items.map((item) => (
          <TabsTrigger
            key={item.value}
            value={item.value}
            className="h-full rounded-lg text-base text-muted-foreground data-active:bg-card data-active:font-semibold data-active:text-foreground"
          >
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
