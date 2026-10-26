import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ScheduleCard } from "./ScheduleCard";

const meta = {
  title: "Shared/ScheduleCard",
  component: ScheduleCard,
  args: {
    category: "보드게임",
    dateLabel: "오늘 21:00",
    title: "퇴근 후 전략 게임",
    region: "마포구",
    place: "미스터리 하우스 합정",
    participantCount: 2,
    capacity: 6,
    price: 26000,
    badge: { variant: "recruiting" },
  },
  decorators: [
    (Story) => (
      <div className="w-sm bg-background p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ScheduleCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Recruiting: Story = {};

export const Closed: Story = {
  args: {
    category: undefined,
    region: undefined,
    dateLabel: "9월 29일 (화) 15:00",
    title: "붉은 달의 연회",
    place: "셜록 미스터리 카페 홍대점",
    participantCount: 5,
    capacity: 5,
    price: 28000,
    badge: { variant: "closed" },
  },
};

export const SeatsLeft: Story = {
  args: {
    dateLabel: "9.30 (수) 19:00",
    title: "처음 만나는 협력 게임",
    place: "추리극장 연남",
    participantCount: 3,
    capacity: 4,
    price: 24000,
    badge: { variant: "seatsLeft", count: 2 },
  },
};

export const LongText: Story = {
  args: {
    title: "아주 길어서 한 줄에 다 들어가지 않는 보드게임 일정 제목",
    place: "아주 길어서 한 줄에 다 들어가지 않는 미스터리 카페 지점 이름",
  },
};
