import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button } from "./button";

const meta = {
  title: "Shared/Button",
  component: Button,
  args: { children: "카카오 로그인", variant: "kakao" },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Kakao: Story = {};
export const Secondary: Story = {
  args: { variant: "secondary", children: "취소" },
};
