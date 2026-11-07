import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { TextField } from "./TextField";

const meta = {
  title: "Shared/TextField",
  component: TextField,
  args: { label: "닉네임" },
  decorators: [
    (Story) => (
      <div className="w-sm bg-card p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** 안내는 회색 (시안 AUTH-03 이름) */
export const WithHelperText: Story = {
  args: {
    label: "이름",
    placeholder: "이름을 입력해주세요",
    helperText: "이름은 가입 후 바꿀 수 없어요.",
  },
};

/** 좋은 소식만 녹색 (시안 AUTH-03 카카오 닉네임) */
export const WithSuccessText: Story = {
  args: {
    label: "닉네임",
    defaultValue: "민트초코",
    helperText: "카카오 닉네임을 불러왔어요. 바꿀 수 있어요.",
    helperTone: "success",
  },
};

/** 라벨 뒤 연한 말 (시안 MY-02) */
export const WithLabelNote: Story = {
  args: {
    label: "이름",
    labelNote: "· 수정 불가",
    defaultValue: "김민지",
  },
};

export const WithTrailing: Story = {
  args: {
    label: "생년월일",
    defaultValue: "1996. 04. 12",
    trailing: <span className="text-sm font-bold text-primary">20대 후반</span>,
  },
};

export const Error: Story = {
  args: {
    label: "닉네임",
    defaultValue: "",
    placeholder: "닉네임을 입력해주세요",
    errorMessage: "닉네임을 입력해주세요.",
  },
};
