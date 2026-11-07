import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FormProvider, useForm } from "react-hook-form";

import type { MyProfile } from "../api/myProfile";
import { ProfileEditView, type ProfileEditFormInput } from "./ProfileEditView";

import { mockAvatar } from "@/mocks/scheduleStore";

const profile: MyProfile = {
  name: "김민지",
  nickname: "민트라떼",
  gender: "FEMALE",
  birthDate: "1996-04-12",
  email: "mintchoco@kakao.com",
  // 네트워크 없이 보이도록 MSW와 같은 SVG 사진을 쓴다
  profileImageUrl: mockAvatar("민", "#578627"),
  nicknameChangeableAt: null,
};

const meta = {
  title: "Profile/ProfileEditView",
  component: ProfileEditView,
  parameters: { layout: "fullscreen" },
  args: {
    profile,
    onImageSelect: () => {},
    onBack: () => {},
    onSubmit: (event) => event.preventDefault(),
    isSubmitting: false,
  },
  // 컨테이너처럼 프로필 값을 기본값으로 FormProvider를 감싼다
  decorators: [
    (Story, { args }) => {
      const form = useForm<ProfileEditFormInput>({
        defaultValues: {
          nickname: args.profile.nickname,
          email: args.profile.email ?? "",
        },
      });
      return (
        <FormProvider {...form}>
          <Story />
        </FormProvider>
      );
    },
  ],
} satisfies Meta<typeof ProfileEditView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** 사진이 없으면 기본 아바타 (SHI-158 결정 2026-11-07) */
export const WithoutPhoto: Story = {
  args: { profile: { ...profile, profileImageUrl: null } },
};

/** 닉네임 14일 제한 중: 닉네임 칸을 잠근다. 문구는 임시 (F-19) */
export const NicknameLocked: Story = {
  args: {
    profile: { ...profile, nicknameChangeableAt: "2026-11-19T10:00:00" },
    nicknameLockedUntil: "11월19일",
  },
};

/** 이메일은 선택 입력. 없으면 빈 칸 */
export const WithoutEmail: Story = {
  args: { profile: { ...profile, email: null } },
};

/** 이름 20자·닉네임 10자·긴 이메일 */
export const LongTexts: Story = {
  args: {
    profile: {
      ...profile,
      name: "Christopher Smithson",
      nickname: "가나다라마바사아자차",
      email: "very.long.email.address.for.testing@example-company.co.kr",
    },
  },
};
