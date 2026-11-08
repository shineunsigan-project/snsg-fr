import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { HomeScreenGuide } from "./HomeScreenGuide";

const meta = {
  title: "Onboarding/HomeScreenGuide",
  component: HomeScreenGuide,
  parameters: { layout: "fullscreen" },
  args: { platform: "ios", onConfirm: () => {}, onLater: () => {} },
} satisfies Meta<typeof HomeScreenGuide>;

export default meta;
type Story = StoryObj<typeof meta>;

/** ONB-01 아이폰(Safari 기준) 4단계 */
export const Ios: Story = {};

/** ONB-01-1 안드로이드(Chrome 기준) 3단계 */
export const Android: Story = { args: { platform: "android" } };

/** 낮은 화면(320×568): 본문은 스크롤되고 버튼은 하단에 붙는다 */
export const ShortScreen: Story = {
  globals: { viewport: { value: "mobile1", isRotated: false } },
};
