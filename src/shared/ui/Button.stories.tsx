import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button } from "./button";

const meta = {
  title: "Shared/Button",
  component: Button,
  args: { children: "취소", variant: "secondary" },
  decorators: [
    (Story) => (
      <div className="w-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Secondary: Story = { args: { className: "w-full" } };

/** 화면 하단 주요 버튼 (프로필 완성 `시작하기`) */
export const PrimaryLarge: Story = {
  args: {
    variant: "primary",
    size: "lg",
    children: "시작하기",
    className: "w-full",
  },
};

/** 녹색 배경 위에서 쓴다 */
export const OutlineInverse: Story = {
  args: {
    variant: "outline-inverse",
    className: "w-full rounded-lg",
    children: "로그인 없이 둘러보기",
  },
  decorators: [
    (Story) => (
      <div className="bg-brand p-5">
        <Story />
      </div>
    ),
  ],
};
