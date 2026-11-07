import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ConfirmDialog } from "./ConfirmDialog";

const meta = {
  title: "Shared/ConfirmDialog",
  component: ConfirmDialog,
  args: { open: true, onClose: () => {}, onConfirm: () => {} },
} satisfies Meta<typeof ConfirmDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** MY-03 로그아웃 확인: 아이콘 없음, [닫기][로그아웃] */
export const LogoutConfirm: Story = {
  args: {
    title: "로그아웃할까요?",
    confirmLabel: "로그아웃",
    hasCloseButton: true,
  },
};

/** MY-04 탈퇴 불가: `!` 경고, [확인]만 */
export const WithdrawBlocked: Story = {
  args: {
    icon: "warning",
    title: "진행중인 일정이 있습니다.",
    description:
      "모든 일정을 취소하거나, 마지막 일정 시작 시각으로부터\n24시간이 지나야 탈퇴할 수 있어요.",
  },
};

/** MY-04 탈퇴 확인: 😢, [닫기][탈퇴하기(빨강)] */
export const WithdrawConfirm: Story = {
  args: {
    icon: "sad",
    title: "정말 탈퇴하실 건가요?",
    confirmLabel: "탈퇴하기",
    hasCloseButton: true,
    isDestructive: true,
  },
};

/** MY-04 탈퇴 완료: ✓, [확인]만 */
export const WithdrawDone: Story = {
  args: {
    icon: "check",
    title: "회원 탈퇴가 정상 처리되었습니다.",
  },
};

/** CRT-06 초기화 확인: 닫기 버튼 문구가 `취소` */
export const CreateRestartConfirm: Story = {
  args: {
    title: "입력한 내용을 초기화할까요?",
    description: "장소·일시·인원이 모두 지워지고\n첫 단계로 돌아가요.",
    hasCloseButton: true,
    closeLabel: "취소",
    confirmLabel: "초기화",
    isDestructive: true,
  },
};
