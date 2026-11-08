import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { DetailBottomBar } from "./DetailBottomBar";

// 상세 하단: 일정 상태 × 보는 사람 역할 (USER_FLOW §7.2 하단 버튼 표)
const meta = {
  title: "Schedule/DetailBottomBar",
  component: DetailBottomBar,
  args: {
    status: "RECRUITING",
    viewerRole: "NON_PARTICIPANT",
    participantCount: 4,
    capacity: 6,
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
export const GuestRecruiting: Story = { args: { viewerRole: "GUEST" } };

/** DTL-04 미참여자 · 모집 중 */
export const NonParticipantRecruiting: Story = {};

/** 미참여자 · `참여하기` 요청 중: 두 번 보내지 않게 막는다 */
export const NonParticipantJoining: Story = { args: { isJoinPending: true } };

/** DTL-05 확정 참여자 · 모집 중 (모집 마감도 같다) */
export const ParticipantRecruiting: Story = {
  args: { viewerRole: "PARTICIPANT" },
};

/** HOST-01 개설자 · 모집 중 (모집 마감도 같다) */
export const HostRecruiting: Story = { args: { viewerRole: "HOST" } };

/** DTL-08 조회자·미참여자 · 모집 마감: 안내 띠 없음 */
export const GuestClosed: Story = {
  args: { viewerRole: "GUEST", status: "CLOSED", participantCount: 6 },
};

/** DTL-08 확정 참여자 · 일정 취소됨 */
export const ParticipantCanceled: Story = {
  args: { viewerRole: "PARTICIPANT", status: "CANCELED" },
};

/** DTL-08 확정 참여자 · 일정 완료 */
export const ParticipantCompleted: Story = {
  args: { viewerRole: "PARTICIPANT", status: "COMPLETED" },
};

/** 개설자 · 일정 완료: 왼쪽은 상태와 상관없이 `내가 연 일정` (N5) */
export const HostCompleted: Story = {
  args: { viewerRole: "HOST", status: "COMPLETED" },
};

/** DTL-08 확정 참여자 · 활동 진행 중 */
export const ParticipantInProgress: Story = {
  args: { viewerRole: "PARTICIPANT", status: "IN_PROGRESS" },
};

/** 미참여자 · 일정 취소됨: 왼쪽 시안 없음, 마감과 같은 `n / m명` */
export const NonParticipantCanceled: Story = {
  args: { status: "CANCELED" },
};
