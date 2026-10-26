import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { Button } from "./button";
import { LoginRequiredDialog } from "./LoginRequiredDialog";

const meta = {
  title: "Shared/LoginRequiredDialog",
  component: LoginRequiredDialog,
  args: { open: true, onOpenChange: () => {} },
} satisfies Meta<typeof LoginRequiredDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {};

/** 버튼으로 열고, 취소·Esc로 닫는 흐름을 확인한다 */
export const OpenAndClose: Story = {
  render: function Render(args) {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          모달 열기
        </Button>
        <LoginRequiredDialog {...args} open={open} onOpenChange={setOpen} />
      </>
    );
  },
};
