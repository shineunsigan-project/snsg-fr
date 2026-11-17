import type { Metadata, Viewport } from "next";

import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "쉬는시간",
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
      </body>
    </html>
  );
}
