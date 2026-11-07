import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { BottomCta } from "./BottomCta";
import { Button } from "./button";

const meta = {
  title: "Shared/BottomCta",
  component: BottomCta,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="mx-auto flex h-96 w-full max-w-md flex-col overflow-y-auto bg-card">
        <div className="flex-1" />
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BottomCta>;

export default meta;
type Story = StoryObj<typeof meta>;

/** CRT-01~05: 주요 버튼 하나 */
export const Default: Story = {
  args: { children: <Button variant="primary">다음</Button> },
};

/** CRT-01~05: 필수 입력 전 `다음` 비활성 */
export const Disabled: Story = {
  args: {
    children: (
      <Button variant="primary" disabled>
        다음
      </Button>
    ),
  },
};
