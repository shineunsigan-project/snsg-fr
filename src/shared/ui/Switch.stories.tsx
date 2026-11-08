import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Switch } from "./switch";

const meta = {
  title: "Shared/Switch",
  component: Switch,
  args: { size: "lg", "aria-label": "시작 시각 설정" },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 꺼짐 (시안 LIST-03 날짜·시간 시트의 `시작 시각 설정`) */
export const Off: Story = { args: { defaultChecked: false } };

/** 켜짐 */
export const On: Story = { args: { defaultChecked: true } };
