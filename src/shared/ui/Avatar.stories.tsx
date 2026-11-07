import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Avatar } from "./Avatar";

// 네트워크 없이 보이도록 SVG 사진을 data URI로 쓴다
const photo = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#578627"/><text x="32" y="42" font-size="28" text-anchor="middle" fill="#fff">민</text></svg>',
)}`;

const meta = {
  title: "Shared/Avatar",
  component: Avatar,
  args: { src: photo },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 사진 있음. 기본 크기 size-8 (상세 참여자 명단) */
export const WithPhoto: Story = {};

/** 사진이 없거나 탈퇴한 사용자: 연두 바탕 + 흰 사람 모양 (시안 DTL-01) */
export const WithoutPhoto: Story = { args: { src: null } };

/** alt가 있으면 스크린 리더가 읽는 이미지가 된다 (내 정보·프로필 편집) */
export const WithAlt: Story = {
  args: { alt: "프로필 사진", className: "size-16" },
};

/** 크기는 className으로 정한다: size-8(상세) · size-16(내 정보) */
export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-4">
      <Avatar {...args} className="size-8" />
      <Avatar {...args} className="size-16" />
      <Avatar {...args} src={null} className="size-8" />
      <Avatar {...args} src={null} className="size-16" />
    </div>
  ),
};
