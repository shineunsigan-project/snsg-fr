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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
