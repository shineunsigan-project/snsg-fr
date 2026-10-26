import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ImagePlaceholder } from "./ImagePlaceholder";

const meta = {
  title: "Shared/ImagePlaceholder",
  component: ImagePlaceholder,
  args: { className: "size-22 rounded-xl" },
} satisfies Meta<typeof ImagePlaceholder>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Muted: Story = { args: { muted: true } };
