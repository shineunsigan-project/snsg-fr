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

/** 참여 이력의 일정 취소됨 */
export const Danger: Story = {
  args: { tone: "danger", children: "일정 취소됨" },
};

/** 참여 이력의 참여 */
export const Outline: Story = { args: { tone: "outline", children: "참여" } };

/** 오늘 시작하는 참여 일정. NEW와 같은 색 (SHI-189) */
export const Solid: Story = { args: { tone: "solid", children: "D-DAY" } };
