import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PageSkeleton, Skeleton, SkeletonGroup } from "./Skeleton";

const meta = {
  title: "Shared/Skeleton",
  component: Skeleton,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Shapes: Story = {
  render: () => (
    <div className="mx-auto flex max-w-md flex-col gap-5 bg-background p-5">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="size-12 rounded-full" />
      <Skeleton className="h-24 w-full rounded-2xl" />
    </div>
  ),
};

export const OnAppAndCardSurfaces: Story = {
  render: () => (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col gap-4 bg-background p-5">
      <SkeletonGroup className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Skeleton className="size-12 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </SkeletonGroup>
      <SkeletonGroup className="flex flex-col gap-3 rounded-2xl bg-card p-4">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </SkeletonGroup>
    </div>
  ),
};

/** 화면 배치가 정해지기 전(기기 저장값 읽기·기기 판별) 전체 자리 표시 */
export const Page: Story = { render: () => <PageSkeleton /> };
