import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { BottomNav } from "./BottomNav";

const meta = {
  title: "Shared/BottomNav",
  component: BottomNav,
  args: { activeItem: "schedule" },
  decorators: [
    (Story) => (
      <div className="w-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BottomNav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Schedule: Story = {};
