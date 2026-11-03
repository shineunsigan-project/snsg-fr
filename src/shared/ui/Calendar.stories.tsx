import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import type { DateRange } from "react-day-picker";

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

/** 오늘 이전 날짜와 이번 달 이전 이동(`‹`)을 막는다 */
export const DisabledBeforeToday: Story = {
  render: () => (
    <Calendar
      today={today}
      defaultMonth={today}
      startMonth={today}
      disabled={{ before: today }}
    />
  ),
};

/** LIST-03 날짜·시간: 기간 선택 (양 끝 원 + 사이 띠) */
export const Range: Story = {
  render: function Render() {
    const [selected, setSelected] = useState<DateRange>({
      from: new Date(2026, 8, 27),
      to: new Date(2026, 8, 30),
    });
    return (
      <Calendar
        mode="range"
        required
        today={today}
        defaultMonth={today}
        startMonth={today}
        selected={selected}
        onSelect={setSelected}
        disabled={{ before: today }}
      />
    );
  },
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
