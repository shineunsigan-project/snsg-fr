"use client";

import {
  Calendar,
  CirclePlus,
  House,
  LogIn,
  User,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/shared/lib/utils";

export type BottomNavItem = "home" | "schedule" | "create" | "login" | "my";

type NavEntry = { value: BottomNavItem; label: string; icon: LucideIcon };

// 홈 / 일정 / 개설하기 / 내 정보 (화면 기능 명세서 v1.5)
const commonEntries: ReadonlyArray<NavEntry> = [
  { value: "home", label: "홈", icon: House },
  { value: "schedule", label: "일정", icon: Calendar },
  { value: "create", label: "개설하기", icon: CirclePlus },
];
// 네 번째 항목은 비로그인이면 로그인, 로그인 상태면 내 정보다 (Figma 430:28279, 팀 결정 2026-10-11)
const loginEntry: NavEntry = { value: "login", label: "로그인", icon: LogIn };
const myEntry: NavEntry = { value: "my", label: "내 정보", icon: User };

type BottomNavProps = {
  activeItem: BottomNavItem;
  /** 로그인 여부를 확인하기 전(undefined)에는 비로그인으로 그린다 */
  isLoggedIn?: boolean;
  onItemSelect?: (item: BottomNavItem) => void;
};

export function BottomNav({
  activeItem,
  isLoggedIn,
  onItemSelect,
}: BottomNavProps) {
  const items = [...commonEntries, isLoggedIn ? myEntry : loginEntry];
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
