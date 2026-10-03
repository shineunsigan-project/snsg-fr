import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AppHeader } from "./AppHeader";

const meta = {
  title: "Shared/AppHeader",
  component: AppHeader,
} satisfies Meta<typeof AppHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Logo: Story = {};
