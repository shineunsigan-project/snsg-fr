import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { RadioList, RadioListItem } from "./RadioList";

const meta = {
  title: "Shared/RadioList",
  component: RadioList,
  decorators: [
    (Story) => (
      <div className="w-full max-w-md bg-card p-5">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RadioList>;

export default meta;
type Story = StoryObj<typeof meta>;

const activities = (
  <>
    <RadioListItem value="boardgame" label="보드게임" />
    <RadioListItem value="escape" label="방탈출" />
    <RadioListItem value="walk" label="산책" />
  </>
);

/** CRT-01 활동 선택, 아무것도 고르지 않음 */
export const Default: Story = {
  args: { "aria-label": "활동", children: activities },
};

/** CRT-01 활동 선택, 보드게임 선택됨 */
export const Selected: Story = {
  args: {
    "aria-label": "활동",
    defaultValue: "boardgame",
    children: activities,
  },
};

/** CRT-03 예상 소요시간 (라벨 + 보조 설명), 보통 선택됨 */
export const WithDescription: Story = {
  args: {
    "aria-label": "예상 소요시간",
    defaultValue: "normal",
    children: (
      <>
        <RadioListItem value="short" label="짧게" description="1시간 내외" />
        <RadioListItem value="normal" label="보통" description="2시간 내외" />
        <RadioListItem value="long" label="길게" description="3시간 이상" />
      </>
    ),
  },
};
