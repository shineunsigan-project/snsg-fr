"use client";

import { Calendar, CirclePlus, User, type LucideIcon } from "lucide-react";

import { cn } from "@/shared/lib/utils";

export type BottomNavItem = "schedule" | "create" | "my";

const items: ReadonlyArray<{
  value: BottomNavItem;
  label: string;
  icon: LucideIcon;
}> = [
  { value: "schedule", label: "일정", icon: Calendar },
  { value: "create", label: "일정 개설", icon: CirclePlus },
  { value: "my", label: "내 정보", icon: User },
];

type BottomNavProps = {
  activeItem: BottomNavItem;
  onItemSelect?: (item: BottomNavItem) => void;
};

export function BottomNav({ activeItem, onItemSelect }: BottomNavProps) {
  return (
    <nav
      aria-label="주요 메뉴"
      className="border-t border-border bg-card pb-safe"
    >
      <ul className="flex">
        {items.map(({ value, label, icon: Icon }) => {
          const isActive = value === activeItem;
          return (
            <li key={value} className="flex-1">
              <button
                type="button"
                aria-current={isActive ? "page" : undefined}
                onClick={() => onItemSelect?.(value)}
                className={cn(
                  "flex w-full flex-col items-center gap-1 pt-2.5 pb-2 text-xs",
                  isActive ? "font-bold text-brand" : "text-subtle-foreground",
                )}
              >
                <Icon
                  aria-hidden
                  className="size-6"
                  strokeWidth={isActive ? 2.25 : 1.75}
                />
                {label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
