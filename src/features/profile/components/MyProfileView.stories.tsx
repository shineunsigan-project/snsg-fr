import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MyProfileView } from "./MyProfileView";

import { mockAvatar } from "@/mocks/scheduleStore";

const meta = {
  title: "Profile/MyProfileView",
  component: MyProfileView,
  parameters: { layout: "fullscreen" },
  args: {
    profile: {
      id: "01a19cc6-3d80-7000-8000-000000000001",
      name: "김민지",
      nickname: "민트초코",
      gender: "FEMALE",
      birthDate: "1996-04-12",
      email: "mintchoco@kakao.com",
      // 네트워크 없이 보이도록 MSW와 같은 SVG 사진을 쓴다
      profileImageUrl: mockAvatar("민", "#578627"),
      ageGroup: { decade: 20, phase: "LATE" },
      nicknameChangeableAt: null,
    },
    onEdit: () => {},
    onHomeScreenGuide: () => {},
    onLogout: () => {},
    onWithdraw: () => {},
  },
  // 페이지처럼 h-dvh 모바일 컨테이너 안에 넣는다. 하단 GNB는 페이지가 붙인다
  decorators: [
    (Story) => (
      <div className="mx-auto flex h-dvh max-w-md flex-col bg-background">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MyProfileView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** 이메일은 선택 입력. 없으면(빈 문자열) 줄을 뺀다 */
export const WithoutEmail: Story = {
  args: { profile: { ...meta.args.profile, email: "" } },
};

/** 닉네임 최대 10자, 긴 이메일은 말줄임 */
export const LongTexts: Story = {
  args: {
    profile: {
      ...meta.args.profile,
      name: "Christopher Smith",
      nickname: "가나다라마바사아자차",
      email: "very.long.email.address.for.testing@example-company.co.kr",
    },
  },
};
