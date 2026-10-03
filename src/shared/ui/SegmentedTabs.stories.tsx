import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SegmentedTabs } from "./SegmentedTabs";

const meta = {
  title: "Shared/SegmentedTabs",
  component: SegmentedTabs,
  args: {
    "aria-label": "일정 구분",
    items: [
      { value: "recruiting", label: "모집 중" },
      { value: "joined", label: "참여한 일정" },
      { value: "hosted", label: "개설한 일정" },
    ],
    value: "recruiting",
  },
  decorators: [
    (Story) => (
      <div className="w-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SegmentedTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
