import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { Calendar } from "./calendar";

// 스토리가 날짜에 따라 달라지지 않게 시안 날짜(2026-09-26)를 오늘로 고정한다
const today = new Date(2026, 8, 26);

// DayPicker props가 mode별 union이라 args 추론이 되지 않아 render로 쓴다
const meta = {
  title: "Shared/Calendar",
  component: Calendar,
  decorators: [
    (Story) => (
      <div className="w-full max-w-md rounded-xl border border-input bg-card p-3">
        <Story />
      </div>
    ),
  ],
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => <Calendar today={today} defaultMonth={today} />,
};

export const DisabledBeforeToday: Story = {
  render: () => (
    <Calendar today={today} defaultMonth={today} disabled={{ before: today }} />
  ),
};

export const Selected: Story = {
  render: function Render() {
    const [selected, setSelected] = useState<Date | undefined>(today);
    return (
      <Calendar
        mode="single"
        today={today}
        defaultMonth={today}
        selected={selected}
        onSelect={setSelected}
        disabled={{ before: today }}
      />
    );
  },
};
