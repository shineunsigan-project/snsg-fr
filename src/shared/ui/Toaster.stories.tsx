import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button } from "./button";
import { showToast, Toaster } from "./sonner";

const meta = {
  title: "Shared/Toaster",
  component: Toaster,
  parameters: { layout: "fullscreen" },
  render: () => (
    <div className="h-dvh p-5">
      <Toaster />
      <Button
        variant="secondary"
        onClick={() =>
          showToast("회원가입이 완료되었어요. 환영해요!", { duration: 2000 })
        }
      >
        토스트 띄우기
      </Button>
    </div>
  ),
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 버튼을 누르면 화면 아래쪽에 토스트가 뜬다 */
export const Default: Story = {};

/** 오류 안내는 체크 아이콘 없이 문구만 보여준다 */
export const Error: Story = {
  render: () => (
    <div className="h-dvh p-5">
      <Toaster />
      <Button
        variant="secondary"
        onClick={() =>
          showToast("JPG, PNG, WebP 형식의 사진만 올릴 수 있어요.", {
            variant: "error",
          })
        }
      >
        오류 토스트 띄우기
      </Button>
    </div>
  ),
};
