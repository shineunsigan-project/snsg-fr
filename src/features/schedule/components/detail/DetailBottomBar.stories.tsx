import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { DetailBottomBar } from "./DetailBottomBar";

// 상세 하단: 일정 상태 × 보는 사람 역할 × 서버가 준 동작 (USER_FLOW §7.2 하단 버튼 표, api-guide 일정 상세 역할·상태별 표)
const meta = {
  title: "Schedule/DetailBottomBar",
  component: DetailBottomBar,
  args: {
    status: "RECRUITING",
    viewerRole: "NON_PARTICIPANT",
    availableActions: ["JOIN"],
    confirmedCount: 4,
    capacity: 6,
    remainingSeats: 2,
    onLogin: fn(),
    onJoin: fn(),
    onCancelParticipation: fn(),
    onCancelSchedule: fn(),
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-md bg-card">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DetailBottomBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** DTL-01 조회자 · 모집 중: 안내 띠 + `로그인하고 참여하기` */
export const GuestRecruiting: Story = {
  args: { viewerRole: "GUEST", availableActions: ["LOGIN_TO_JOIN"] },
};

/** DTL-04 미참여자 · 모집 중 */
export const NonParticipantRecruiting: Story = {};

/** 미참여자 · `참여하기` 요청 중: 두 번 보내지 않게 막는다 */
export const NonParticipantJoining: Story = { args: { isJoinPending: true } };

/** DTL-05 확정 참여자 · 모집 중 (모집 마감은 완료 전까지 같다) */
export const ParticipantRecruiting: Story = {
  args: {
    viewerRole: "PARTICIPANT",
    availableActions: ["CANCEL_PARTICIPATION"],
  },
};

/** HOST-01 개설자 · 모집 중 (시작 전 모집 마감도 같다) */
export const HostRecruiting: Story = {
  args: { viewerRole: "HOST", availableActions: ["CANCEL_SCHEDULE"] },
};

/** 개설자 · 시작 후 모집 마감: 서버가 동작을 주지 않아 비활성 `모집 마감` (사용자 결정 2026-11-11) */
export const HostStarted: Story = {
  args: {
    viewerRole: "HOST",
    status: "RECRUITMENT_CLOSED",
    availableActions: [],
  },
};

/** DTL-08 조회자·미참여자 · 모집 마감: 안내 띠 없음 */
export const GuestClosed: Story = {
  args: {
    viewerRole: "GUEST",
    status: "RECRUITMENT_CLOSED",
    availableActions: [],
    confirmedCount: 6,
    remainingSeats: 0,
  },
};

/** DTL-08 확정 참여자 · 일정 취소됨 */
export const ParticipantCanceled: Story = {
  args: { viewerRole: "PARTICIPANT", status: "CANCELED", availableActions: [] },
};

/** DTL-08 확정 참여자 · 일정 완료 */
export const ParticipantCompleted: Story = {
  args: {
    viewerRole: "PARTICIPANT",
    status: "COMPLETED",
    availableActions: [],
  },
};

/** 개설자 · 일정 완료: 왼쪽은 상태와 상관없이 `내가 연 일정` (N5) */
export const HostCompleted: Story = {
  args: { viewerRole: "HOST", status: "COMPLETED", availableActions: [] },
};

/** 미참여자 · 일정 취소됨: 왼쪽 시안 없음, 마감과 같은 `n / m명` */
export const NonParticipantCanceled: Story = {
  args: { status: "CANCELED", availableActions: [] },
};
