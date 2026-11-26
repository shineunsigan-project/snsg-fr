import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AppHeader } from "./AppHeader";

const meta = {
  title: "Shared/AppHeader",
  component: AppHeader,
} satisfies Meta<typeof AppHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Logo: Story = {};

/** 일정 목록처럼 대표 제목(`h1`)을 서버 컴포넌트가 따로 둘 때. 로고는 `h1`이 아니고 화면은 `Logo`와 같다 */
export const LogoWithoutHeading: Story = {
  args: { logoIsHeading: false },
};

/** 홈처럼 검색엔진용 대표 제목을 따로 둘 때. 화면은 `Logo`와 같다 */
export const HiddenHeading: Story = {
  args: {
    hiddenHeading:
      "보드게임·방탈출 모임, 기다리지 말고 하고 싶을 때 직접 열어요",
  },
};
