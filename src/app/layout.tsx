import type { Metadata, Viewport } from "next";

import {
  IS_PRODUCTION_SITE,
  OG_IMAGES,
  SEARCH_DESCRIPTION,
  SITE_INTRO,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
  socialMetadata,
} from "@/shared/lib/seo";

import { GoogleAnalytics } from "./GoogleAnalytics";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  // 상대 경로로 적은 공유 이미지·canonical 주소를 대표 주소 기준 절대 주소로 바꾼다
  metadataBase: new URL(SITE_URL),
  title: SITE_NAME,
  // 하위 화면이 따로 정하지 않으면(일정 상세 조회가 일시적으로 실패한 경우 등) 홈과 같은 설명·공유 미리보기를 쓴다
  description: SEARCH_DESCRIPTION,
  ...socialMetadata({
    title: SITE_TAGLINE,
    description: SITE_INTRO,
    image: OG_IMAGES.boardGame,
  }),
  // 미리보기·개발 배포는 robots.txt와 함께 화면에서도 색인을 막는다
  robots: IS_PRODUCTION_SITE ? undefined : { index: false, follow: false },
  // 아이폰 홈 화면에 추가했을 때의 이름·아이콘 (USER_FLOW §9.1). 매니페스트는 app/manifest.ts
  appleWebApp: { title: "쉬는시간" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

// 노치·홈 인디케이터 기기의 safe-area 대응 (DESIGN §12)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <body>
        {/* 넓은 화면에서 가운데 모바일 폭(max-w-md) 앱 영역의 좌우를 그림자로 구분한다(사용자 결정 2026-11-17). 화면마다 두지 않고 화면 뒤에 같은 폭의 기둥을 깐다. 휴대폰처럼 좁으면 그림자는 화면 밖이라 보이지 않는다. html에 배경색을 넣으면 body 배경이 기둥 위에 칠해져 그림자가 가려진다 */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-y-0 left-1/2 -z-10 w-full max-w-md -translate-x-1/2 shadow-app-frame"
        />
        <Providers>{children}</Providers>
        <GoogleAnalytics />
      </body>
    </html>
  );
}
