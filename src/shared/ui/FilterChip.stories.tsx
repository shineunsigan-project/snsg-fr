import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { FilterChip } from "./FilterChip";

const meta = {
  title: "Shared/FilterChip",
  component: FilterChip,
  args: { label: "날짜" },
} satisfies Meta<typeof FilterChip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Selected: Story = {
  args: { label: "머더 미스터리", state: "selected" },
};
export const Open: Story = { args: { label: "머더 미스터리", state: "open" } };
