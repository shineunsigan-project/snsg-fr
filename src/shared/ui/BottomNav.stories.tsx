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

export const Guest: Story = {};

/** 홈 화면(LIST-06): 첫 항목이 활성 */
export const HomeActive: Story = { args: { activeItem: "home" } };

export const LoggedIn: Story = { args: { isLoggedIn: true } };
