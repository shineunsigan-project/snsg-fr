import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { TextField } from "./TextField";

const meta = {
  title: "Shared/TextField",
  component: TextField,
  args: { label: "닉네임" },
  decorators: [
    (Story) => (
      <div className="w-sm bg-card p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithHelperText: Story = {
  args: {
    label: "닉네임",
    defaultValue: "민트초코",
    helperText: "카카오 닉네임을 불러왔어요. 바꿀 수 있어요.",
  },
};

export const WithTrailing: Story = {
  args: {
    label: "생년월일",
    defaultValue: "1996. 04. 12",
    trailing: <span className="text-sm font-bold text-primary">20대 후반</span>,
  },
};

export const Error: Story = {
  args: {
    label: "닉네임",
    defaultValue: "",
    errorMessage: "닉네임을 입력해주세요.",
  },
};
