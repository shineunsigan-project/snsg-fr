import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Tabs, TabsList, TabsTrigger } from "./tabs";

// 홈 목록 탭 (시안 LIST-01·04·05): 회색 바탕 위에 고른 탭만 흰색
function ListTabs({ defaultValue }: { defaultValue: string }) {
  return (
    <Tabs defaultValue={defaultValue} className="w-sm">
      <TabsList className="h-13 w-full rounded-xl bg-secondary p-1">
        {[
          ["recruiting", "모집 중"],
          ["joined", "참여한 일정"],
          ["created", "개설한 일정"],
        ].map(([value, label]) => (
          <TabsTrigger
            key={value}
            value={value}
            className="h-full rounded-lg text-sm font-semibold text-muted-foreground data-active:bg-card data-active:text-foreground"
          >
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

const meta = {
  title: "Shared/Tabs",
  component: ListTabs,
  args: { defaultValue: "recruiting" },
} satisfies Meta<typeof ListTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 모집 중 선택 */
export const Recruiting: Story = {};

/** 개설한 일정 선택 (개설 완료 후) */
export const Created: Story = { args: { defaultValue: "created" } };
