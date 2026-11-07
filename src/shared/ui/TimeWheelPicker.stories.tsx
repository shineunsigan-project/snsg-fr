import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { TimeWheelPicker } from "./TimeWheelPicker";

const meta = {
  title: "Shared/TimeWheelPicker",
  component: TimeWheelPicker,
  args: {
    value: "12:00",
    onValueChange: () => {},
    "aria-label": "시작 시각",
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return (
      <div className="w-full max-w-md bg-card p-4">
        <TimeWheelPicker {...args} value={value} onValueChange={setValue} />
        <p className="mt-4 text-sm text-muted-foreground">값: {value}</p>
      </div>
    );
  },
} satisfies Meta<typeof TimeWheelPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** 시안 CRT-04: 오후 7:30 */
export const Selected: Story = { args: { value: "19:30" } };

/** 고를 수 있는 가장 이른 시각(`min`)보다 이른 시각은 흐리게 막힌다 (CRT-04: 현재 시각 + 1시간 이후만) */
export const WithMin: Story = { args: { value: "19:30", min: "18:30" } };
