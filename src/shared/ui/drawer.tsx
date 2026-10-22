"use client";

import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer";
import { cn } from "@/shared/lib/utils";

// Base UI Drawer 기반 바텀시트 (TECH_STACK §3.4). 열림·닫힘 애니메이션은 디자인 미확인이라 넣지 않고(DESIGN §10),
// 아래로 끌어 닫는 동안 손가락을 따라오게만 한다

function Drawer({ ...props }: DrawerPrimitive.Root.Props) {
  return <DrawerPrimitive.Root data-slot="drawer" {...props} />;
}

function DrawerClose({ ...props }: DrawerPrimitive.Close.Props) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />;
}

function DrawerContent({
  className,
  children,
  ...props
}: DrawerPrimitive.Popup.Props) {
  return (
    <DrawerPrimitive.Portal>
      <DrawerPrimitive.Backdrop
        data-slot="drawer-overlay"
        // overlay.dim — 로그인 필요 모달과 같은 검정 50%
        className="fixed inset-0 z-50 bg-black/50"
      />
      <DrawerPrimitive.Viewport className="fixed inset-x-0 bottom-0 z-50">
        {/* flex로 둬서 안쪽 마지막 요소의 바깥 여백이 시트 밖으로 새지 않게 한다 */}
        <DrawerPrimitive.Popup
          data-slot="drawer-content"
          className={cn(
            "mx-auto flex w-full max-w-md drawer-swipe flex-col rounded-t-3xl bg-popover pb-safe text-popover-foreground outline-none",
            className,
          )}
          {...props}
        >
          {/* 상단 grabber (DESIGN §3.6) */}
          <div
            aria-hidden
            className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-border"
          />
          <DrawerPrimitive.Content>{children}</DrawerPrimitive.Content>
        </DrawerPrimitive.Popup>
      </DrawerPrimitive.Viewport>
    </DrawerPrimitive.Portal>
  );
}

function DrawerTitle({ className, ...props }: DrawerPrimitive.Title.Props) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn("font-bold", className)}
      {...props}
    />
  );
}

function DrawerDescription({
  className,
  ...props
}: DrawerPrimitive.Description.Props) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerTitle };
