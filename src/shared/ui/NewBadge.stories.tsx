import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { NewBadge } from "./NewBadge";
import { StatusBadge } from "./StatusBadge";

const meta = {
  title: "Shared/NewBadge",
  component: NewBadge,
} satisfies Meta<typeof NewBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** CRT-07 시안: 상태 배지 옆에 붙는 모습 */
export const WithStatusBadge: Story = {
  render: () => (
    <div className="flex gap-1.5">
      <StatusBadge variant="recruiting" />
      <NewBadge />
    </div>
  ),
};
