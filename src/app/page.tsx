import type { Metadata } from "next";

import { HomeScreen } from "@/features/schedule/components/home/HomeScreen";
import {
  OG_IMAGES,
  SEARCH_DESCRIPTION,
  SITE_INTRO,
  SITE_JSON_LD,
  SITE_TAGLINE,
  socialMetadata,
} from "@/shared/lib/seo";

export const metadata: Metadata = {
  title: SITE_TAGLINE,
  description: SEARCH_DESCRIPTION,
  alternates: { canonical: "/" },
  ...socialMetadata({
    title: SITE_TAGLINE,
    description: SITE_INTRO,
    path: "/",
    image: OG_IMAGES.boardGame,
  }),
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        // `<`를 이스케이프해 값에 `</script>`가 들어와도 태그가 닫히지 않게 한다
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(SITE_JSON_LD).replace(/</g, "\\u003c"),
        }}
      />
      <HomeScreen heading={SITE_TAGLINE} />
    </>
  );
}
