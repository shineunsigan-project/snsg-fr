import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SocialLoginButton } from "./SocialLoginButton";

const meta = {
  title: "Shared/SocialLoginButton",
  component: SocialLoginButton,
  args: { asset: "kakao-large" },
  decorators: [
    (Story) => (
      <div className="w-sm bg-brand p-5">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SocialLoginButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 로그인 화면 — 전체 폭에 맞춘다 */
export const KakaoLarge: Story = {};

/** 로그인 화면 — 전체 폭에 맞춘다 */
export const NaverLarge: Story = { args: { asset: "naver-large" } };

/** 로그인 필요 모달 — 높이 52px에 맞춘다 */
export const KakaoSmall: Story = {
  args: { asset: "kakao-small" },
  decorators: [
    (Story) => (
      <div className="w-sm bg-card p-5">
        <Story />
      </div>
    ),
  ],
};
