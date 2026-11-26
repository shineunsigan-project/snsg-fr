import Script from "next/script";

import { IS_PRODUCTION_SITE } from "@/shared/lib/seo";

// GA4 측정 ID 형식(`G-XXXXXXXXXX`). 인라인 스크립트에 들어가는 값이라 형식이 맞을 때만 쓴다
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const GA_ID_PATTERN = /^G-[A-Z0-9]+$/;

/**
 * 구글 애널리틱스(GA4). 운영 배포이고 측정 ID가 있을 때만 불러온다.
 * 미리보기·개발 배포와 로컬 접속이 방문 수에 섞이지 않게 한다 (사용자 결정 2026-11-24)
 * 화면 이동(주소 변경)은 GA4 향상된 측정이 알아서 페이지 조회로 센다
 */
export function GoogleAnalytics() {
  if (!IS_PRODUCTION_SITE || !GA_ID || !GA_ID_PATTERN.test(GA_ID)) return null;
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
      </Script>
    </>
  );
}
