import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PageStatus } from "./PageStatus";

const meta = {
  title: "Shared/PageStatus",
  component: PageStatus,
  args: { message: "로그인 처리 중..." },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof PageStatus>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = {};
