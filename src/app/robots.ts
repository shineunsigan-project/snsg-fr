import type { MetadataRoute } from "next";

import { IS_PRODUCTION_SITE, SITE_URL } from "@/shared/lib/seo";

// 운영만 열어 둔다. 로그인·내 정보처럼 검색에 나오면 안 되는 화면은 막지 않고 각 화면에서 noindex로 알린다
// (robots.txt로 막으면 검색엔진이 화면의 noindex 표시를 읽지 못한다)
export default function robots(): MetadataRoute.Robots {
  if (!IS_PRODUCTION_SITE) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
