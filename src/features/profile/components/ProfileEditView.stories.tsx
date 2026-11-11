import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FormProvider, useForm } from "react-hook-form";

import type { MyProfile } from "../api/myProfile";
import { ProfileEditView, type ProfileEditFormInput } from "./ProfileEditView";

import { mockAvatar } from "@/mocks/scheduleStore";

const profile: MyProfile = {
  id: "01a19cc6-3d80-7000-8000-000000000001",
  name: "김민지",
  nickname: "민트라떼",
  gender: "FEMALE",
  birthDate: "1996-04-12",
  email: "mintchoco@kakao.com",
  // 네트워크 없이 보이도록 MSW와 같은 SVG 사진을 쓴다
  profileImageUrl: mockAvatar("민", "#578627"),
  ageGroup: { decade: 20, phase: "LATE" },
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
          email: args.profile.email,
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

/** 닉네임 14일 제한 중: 닉네임 칸을 잠근다. 문구는 임시 (F-19) */
export const NicknameLocked: Story = {
  args: {
    profile: { ...profile, nicknameChangeableAt: "2026-11-19T10:00:00" },
    nicknameLockedUntil: "11월19일",
  },
};

/** 이메일은 선택 입력. 없으면(빈 문자열) 빈 칸 */
export const WithoutEmail: Story = {
  args: { profile: { ...profile, email: "" } },
};

/** 닉네임 칸을 벗어날 때 사용 가능 여부 결과: 사용 가능(녹색) */
export const NicknameAvailable: Story = {
  args: {
    nicknameCheckMessage: {
      tone: "success",
      message: "사용할 수 있는 닉네임이에요.",
    },
  },
};

/** 사용 가능 여부 결과: 중복(빨강) */
export const NicknameDuplicated: Story = {
  args: {
    nicknameCheckMessage: {
      tone: "error",
      message: "이미 사용 중인 닉네임이에요. 다른 닉네임을 입력해주세요.",
    },
  },
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
