import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StatusBadge } from "./StatusBadge";

const meta = {
  title: "Shared/StatusBadge",
  component: StatusBadge,
} satisfies Meta<typeof StatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Recruiting: Story = { args: { variant: "recruiting" } };
export const Closed: Story = { args: { variant: "closed" } };
export const SeatsLeft: Story = { args: { variant: "seatsLeft", count: 2 } };
