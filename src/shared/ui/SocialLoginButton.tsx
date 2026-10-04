import Image from "next/image";
import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/utils";

// 카카오·네이버가 제공한 공식 로그인 버튼 이미지만 쓴다. 비율을 유지한 채 크기만 맞추고 이미지는 고치지 않는다 (DESIGN §9.1)
// fit: "height"는 높이를 정하면 폭이, "width"는 폭을 정하면 높이가 비율대로 따라온다
const assets = {
  /** 말풍선 + "로그인", 112×46 — 로그인 필요 모달처럼 좁은 자리. 높이 52px에 맞춘다 */
  "kakao-small": {
    src: "/images/kakao/kakao_login_kr_small.svg",
    width: 112,
    height: 46,
    alt: "카카오 로그인",
    fit: "height",
  },
  /** 말풍선 + "카카오 로그인", 336×46 — 로그인 화면 전체 폭 */
  "kakao-large": {
    src: "/images/kakao/kakao_login_kr_large.svg",
    width: 336,
    height: 46,
    alt: "카카오 로그인",
    fit: "width",
  },
  /** N + "네이버 로그인", 368×48 (PNG 4배 해상도) — 로그인 화면 전체 폭 */
  "naver-large": {
    src: "/images/naver/NAVER_login_Dark_KR_green_center_H48.png",
    width: 368,
    height: 48,
    alt: "네이버 로그인",
    fit: "width",
  },
} as const;

const fitClassName = {
  height: { button: "h-13", image: "h-full w-auto" },
  width: { button: "w-full", image: "h-auto w-full" },
} as const;

type SocialLoginButtonProps = Omit<ComponentProps<"button">, "children"> & {
  asset: keyof typeof assets;
};

/** 소셜 로그인 버튼 — 공식 이미지를 보여주는 버튼 (DESIGN §9.1 Kakao Login Button) */
export function SocialLoginButton({
  asset,
  className,
  ...props
}: SocialLoginButtonProps) {
  const { src, width, height, alt, fit } = assets[asset];

  return (
    <button
      type="button"
      className={cn(
        "block shrink-0 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        fitClassName[fit].button,
        className,
      )}
      {...props}
    >
      <Image
        src={src}
        width={width}
        height={height}
        alt={alt}
        unoptimized
        className={cn("block", fitClassName[fit].image)}
      />
    </button>
  );
}
