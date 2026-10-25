import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { ToggleButtonGroup } from "./ToggleButtonGroup";

const options = [
  { value: "MALE", label: "남성" },
  { value: "FEMALE", label: "여성" },
  { value: "OTHER", label: "기타" },
] as const;

type Gender = (typeof options)[number]["value"];

const meta = {
  title: "Shared/ToggleButtonGroup",
  component: ToggleButtonGroup<Gender>,
  args: {
    label: "성별",
    name: "gender",
    options,
    value: undefined,
    onChange: () => {},
  },
  render: function Render(args) {
    const [value, setValue] = useState<Gender | undefined>(args.value);
    return <ToggleButtonGroup {...args} value={value} onChange={setValue} />;
  },
  decorators: [
    (Story) => (
      <div className="w-sm bg-card p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ToggleButtonGroup<Gender>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unselected: Story = {};
export const Selected: Story = { args: { value: "FEMALE" } };
export const Error: Story = { args: { errorMessage: "성별을 선택해주세요." } };
