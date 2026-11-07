import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { Drawer, DrawerContent, DrawerTitle } from "./drawer";

const places = [
  "보드게임카페 더조커 홍대점",
  "홈즈앤루팡 보드게임카페 홍대점",
  "더홀릭보드게임카페 홍대점",
  "히어로보드게임카페 홍대1호점",
  "보드게임카페 레드버튼 레이어드 홍대",
];

const COLLAPSED = 0.45;
const EXPANDED = 0.9;

/** CRT-02 장소 목록 시트처럼: 닫히지 않는 비모달 시트, 기본 높이 · 끌어올린 높이 두 단계 */
function PlaceListSheet({ initialSnapPoint }: { initialSnapPoint: number }) {
  const [snapPoint, setSnapPoint] = useState<number | string | null>(
    initialSnapPoint,
  );
  const isExpanded = snapPoint === EXPANDED;
  return (
    <Drawer
      open
      modal={false}
      disablePointerDismissal
      snapPoints={[COLLAPSED, EXPANDED]}
      snapPoint={snapPoint ?? COLLAPSED}
      onSnapPointChange={setSnapPoint}
      showSwipeHandle
    >
      <DrawerContent className="mx-auto max-w-md rounded-t-3xl border-0 bg-card shadow-toast">
        <div className="flex shrink-0 items-baseline justify-between gap-3 px-5 py-3">
          <DrawerTitle className="text-base font-bold">
            마포구 매장 <span className="text-primary">{places.length}</span>곳
          </DrawerTitle>
          <p className="text-xs text-subtle-foreground">
            {isExpanded
              ? "아래로 내리면 지도가 보여요"
              : "위로 올리면 목록이 넓어져요"}
          </p>
        </div>
        <ul className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-5 pb-6">
          {places.map((name) => (
            <li
              key={name}
              className="rounded-xl border border-input px-4 py-3.5 text-base font-bold"
            >
              {name}
            </li>
          ))}
        </ul>
      </DrawerContent>
    </Drawer>
  );
}

const meta = {
  title: "Shared/Drawer",
  component: PlaceListSheet,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="h-dvh bg-secondary">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PlaceListSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 기본 높이. 손잡이를 위로 끌면 넓어진다 */
export const Collapsed: Story = { args: { initialSnapPoint: COLLAPSED } };

/** 끌어올린 높이. 안내 문구가 바뀐다 */
export const Expanded: Story = { args: { initialSnapPoint: EXPANDED } };
