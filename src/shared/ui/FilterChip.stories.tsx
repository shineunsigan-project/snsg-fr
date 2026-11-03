import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { FilterChip } from "./FilterChip";

const meta = {
  title: "Shared/FilterChip",
  component: FilterChip,
  args: { label: "날짜" },
} satisfies Meta<typeof FilterChip>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 기본 (시안 LIST-01 `날짜`) */
export const Default: Story = {};
/** 값 선택됨 (시안 LIST-01 `보드게임`) */
export const Selected: Story = {
  args: { label: "보드게임", state: "selected" },
};
/** 시트 열림 (시안 LIST-03) */
export const Open: Story = { args: { label: "보드게임", state: "open" } };
