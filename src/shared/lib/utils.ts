import { createCn } from "cn/config";

/**
 * 클래스 합치기(clsx + tailwind-merge). globals.css에 직접 정한 글자 크기 토큰을 글자 크기로 알려 준다.
 * 알려 주지 않으면 `text-tag`를 글자색으로 보고 `text-brand` 같은 색과 함께 쓸 때 크기나 색 하나를 지운다
 */
export const cn = createCn({
  extend: {
    classGroups: {
      "font-size": [{ text: ["display", "2xs", "md", "tag"] }],
    },
  },
});
