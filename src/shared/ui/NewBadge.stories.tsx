import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { NewBadge } from "./NewBadge";
import { Tag } from "./Tag";

const meta = {
  title: "Shared/NewBadge",
  component: NewBadge,
} satisfies Meta<typeof NewBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** CRT-07 시안: 상태 태그 옆에 붙는 모습 */
export const WithStatusTag: Story = {
  render: () => (
    <div className="flex gap-1.5">
      <Tag tone="brand">모집 중</Tag>
      <NewBadge />
    </div>
  ),
};
