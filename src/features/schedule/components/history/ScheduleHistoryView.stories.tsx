import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { HistoryItem } from "../../hooks/useScheduleHistory";
import { ScheduleHistoryView } from "./ScheduleHistoryView";

const makeItem = (
  index: number,
  overrides: Partial<HistoryItem> = {},
): HistoryItem => ({
  id: `01a1a2b3-0000-7000-8000-${String(index).padStart(12, "0")}`,
  category: { id: "category", name: "보드게임" },
  title: "처음 만나는 협력 게임",
  regionName: "서대문구",
  startAt: "2026-09-20T15:00:00",
  confirmedCount: 4,
  capacity: 4,
  remainingSeats: 0,
  displayStatus: "COMPLETED",
  createdAt: "2026-08-01T09:00:00",
  role: "participant",
  ...overrides,
});

const meta = {
  title: "Schedule/ScheduleHistoryView",
  component: ScheduleHistoryView,
  parameters: { layout: "fullscreen" },
  args: {
    schedules: [
      makeItem(1),
      makeItem(2, {
        category: { id: "escape", name: "방탈출" },
        title: "주말 추리 방탈출",
        regionName: "마포구",
        startAt: "2026-09-13T14:00:00",
        confirmedCount: 2,
        displayStatus: "CANCELED",
        role: "host",
      }),
      makeItem(3, {
        title: "퇴근 후 전략 게임",
        regionName: "성동구",
        startAt: "2026-09-10T20:00:00",
        confirmedCount: 6,
        capacity: 6,
        role: "host",
      }),
    ],
    isError: false,
    onRetry: () => {},
    hasNextPage: false,
    isFetchingNextPage: false,
    isFetchNextPageError: false,
    onLoadMore: () => {},
  },
  // 페이지처럼 h-dvh 모바일 컨테이너 안에 넣는다. 하단 GNB는 페이지가 붙인다
  decorators: [
    (Story) => (
      <div className="mx-auto flex h-dvh max-w-md flex-col bg-card">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ScheduleHistoryView>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 시안 MY-01-1: 참여·개설, 일정 완료·일정 취소됨이 섞여 최근 순 */
export const Default: Story = {};

/** 더 받을 지난 일정이 남았다 */
export const HasMore: Story = { args: { hasNextPage: true } };

export const Empty: Story = { args: { schedules: [] } };

export const Loading: Story = { args: { schedules: undefined } };

export const LoadError: Story = {
  args: { schedules: undefined, isError: true },
};
