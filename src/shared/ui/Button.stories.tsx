import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Ban } from "lucide-react";

import { Button } from "./button";

const meta = {
  title: "Shared/Button",
  component: Button,
  args: { children: "취소", variant: "secondary" },
  decorators: [
    (Story) => (
      <div className="w-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Secondary: Story = { args: { className: "w-full" } };

/** 화면 하단 주요 버튼 (프로필 완성 `시작하기`) */
export const PrimaryLarge: Story = {
  args: {
    variant: "primary",
    size: "lg",
    children: "시작하기",
    className: "w-full",
  },
};

/** 녹색 배경 위에서 쓴다 */
export const OutlineInverse: Story = {
  args: {
    variant: "outline-inverse",
    className: "w-full rounded-lg",
    children: "로그인 없이 둘러보기",
  },
  decorators: [
    (Story) => (
      <div className="bg-brand p-5">
        <Story />
      </div>
    ),
  ],
};

/** DTL-05 `참여 취소` */
export const DangerSoft: Story = {
  args: { variant: "danger-soft", children: "참여 취소", className: "w-full" },
};

/** HOST-01 `일정 전체 취소`. 취소 확인 팝업의 `확인`도 같은 변형 (DTL-07) */
export const Danger: Story = {
  args: { variant: "danger", children: "일정 전체 취소", className: "w-full" },
};

/** DTL-08 상태 때문에 누를 수 없는 버튼. `일정 취소됨`·`일정 완료`도 글자만 다르다 */
export const Inactive: Story = {
  args: {
    variant: "inactive",
    disabled: true,
    className: "w-full",
    children: (
      <>
        <Ban aria-hidden className="size-5" />
        모집 마감
      </>
    ),
  },
};

/** 배경 없는 회색 글자 버튼 (ONB-01 `나중에 할게요`). 높이는 쓰는 곳에서 정한다 */
export const Text: Story = {
  args: {
    variant: "text",
    children: "나중에 할게요",
    className: "h-11 w-full text-sm",
  },
};
