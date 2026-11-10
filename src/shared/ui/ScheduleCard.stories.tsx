import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { NewBadge } from "./NewBadge";
import { ScheduleCard } from "./ScheduleCard";
import { Tag } from "./Tag";

const meta = {
  title: "Shared/ScheduleCard",
  component: ScheduleCard,
  args: {
    href: "/schedules/1",
    category: "보드게임",
    title: "퇴근 후 전략 게임",
    region: "성동구",
    dateLabel: "09월26일(토) 21:00",
    participantCount: 2,
    capacity: 6,
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

/** LIST-01 모집 중. 카드 전체가 상세로 가는 링크 (Tab으로 포커스하면 테두리 표시) */
export const Recruiting: Story = {};

/** LIST-01 모집완료: 약속 시간을 회색으로 */
export const Closed: Story = {
  args: {
    title: "주말 오후 파티 게임",
    dateLabel: "09월29일(화) 15:00",
    participantCount: 5,
    capacity: 5,
    badge: { variant: "closed" },
    isInactive: true,
  },
};

/** LIST-04 참여한 일정: 참여 확정 + D-DAY */
export const Joined: Story = {
  args: {
    badge: undefined,
    tags: (
      <>
        <Tag tone="brand">참여 확정</Tag>
        <Tag tone="dark">D-DAY</Tag>
      </>
    ),
  },
};

/** LIST-05 개설한 일정: 모집완료 */
export const Created: Story = {
  args: {
    badge: undefined,
    title: "주말 오후 파티 게임",
    participantCount: 5,
    capacity: 5,
    tags: <Tag tone="muted">모집완료</Tag>,
  },
};

/** CRT-07 방금 개설한 일정: 모집 중 + NEW, 녹색 테두리 */
export const CreatedNew: Story = {
  args: {
    badge: undefined,
    participantCount: 1,
    isHighlighted: true,
    tags: (
      <>
        <Tag tone="brand">모집 중</Tag>
        <NewBadge />
      </>
    ),
  },
};

/** 긴 제목은 말줄임 */
export const LongText: Story = {
  args: {
    title: "처음 만나는 사람들과 함께하는 아주 긴 이름의 협력 보드게임 모임",
  },
};

/** 지역 정보를 찾을 수 없으면(서버가 빈 문자열) 지역과 구분점을 그리지 않는다 */
export const NoRegion: Story = {
  args: { region: "" },
};
