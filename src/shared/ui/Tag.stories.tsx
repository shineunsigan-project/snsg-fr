import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Tag } from "./Tag";

const meta = {
  title: "Shared/Tag",
  component: Tag,
  args: { tone: "brand", children: "참여 확정" },
} satisfies Meta<typeof Tag>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 참여 확정, 개설한 일정의 모집 중 */
export const Brand: Story = {};

/** 모집완료, D-N */
export const Muted: Story = { args: { tone: "muted", children: "D-5" } };

/** 오늘 시작하는 참여 일정 */
export const Dark: Story = { args: { tone: "dark", children: "D-DAY" } };
