import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useEffect, useState } from "react";

import { AvatarEditor } from "./AvatarEditor";

const meta = {
  title: "Shared/AvatarEditor",
  component: AvatarEditor,
} satisfies Meta<typeof AvatarEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 프로필 사진이 없을 때 기본 원형 */
export const Default: Story = {};

/** 편집 버튼으로 사진을 고르면 미리보기로 바뀐다 */
export const SelectImage: Story = {
  render: function Render() {
    const [imageUrl, setImageUrl] = useState<string>();
    useEffect(() => {
      if (!imageUrl) return;
      return () => URL.revokeObjectURL(imageUrl);
    }, [imageUrl]);
    return (
      <AvatarEditor
        imageUrl={imageUrl}
        onFileSelect={(file) => setImageUrl(URL.createObjectURL(file))}
      />
    );
  },
};
