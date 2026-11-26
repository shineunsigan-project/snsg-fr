import type { Metadata } from "next";

// 검색 결과·공유 미리보기 설정 (SHI-220). 문구는 PM이 준 텍스트 그대로다. 임의로 고치지 않는다

/** 대표 주소. www·app 서브도메인은 이 주소로 리디렉션된다 */
export const SITE_URL = "https://shineunsigan.com";
export const SITE_NAME = "쉬는시간";
export const INSTAGRAM_URL = "https://www.instagram.com/snsg_official";

/**
 * 검색엔진에 노출하는 운영 배포인지. 미리보기·개발 배포는 검색에 잡히지 않게 막는다 (사용자 결정 2026-11-24).
 * Vercel이 배포마다 넣어 주는 `VERCEL_ENV`로 구분한다. 다른 곳으로 배포를 옮기면 이 값을 바꾼다
 */
export const IS_PRODUCTION_SITE = process.env.VERCEL_ENV === "production";

/** 한 줄 소개: 홈 페이지 제목과 보이지 않는 대표 제목(h1) */
export const SITE_TAGLINE =
  "보드게임·방탈출 모임, 기다리지 말고 하고 싶을 때 직접 열어요";
/** 서비스 소개 설명: 홈 공유 미리보기 설명 */
export const SITE_INTRO =
  "쉬는시간은 보드게임·방탈출 모임을 직접 열고 사람을 모아 동행하는 서비스예요. 망설이지 말고, 홍대·신촌·성수에서 가보고 싶었던 장소로 모임을 열어 보세요.";
/** 검색 결과 설명 문구 */
export const SEARCH_DESCRIPTION =
  "원하는 보드게임·방탈출 모임이 안 보인다면 기다리지 말고 직접 열어 보세요. 가보고 싶었던 장소를 고르면 바로 모임을 열고, 사람을 모아 동행해요.";

/**
 * 검색엔진에 사이트 이름·운영 주체·공식 SNS를 알리는 구조화 데이터(JSON-LD). 홈에 넣는다.
 * 새로 지어낸 문구 없이 사이트 이름·주소·인스타그램 주소만 쓴다
 */
export const SITE_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      inLanguage: "ko",
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/icons/icon-512.png`,
      sameAs: [INSTAGRAM_URL],
    },
  ],
};

/**
 * 일정 목록 화면 제목·설명. PM 문구가 없어 PM 문구·화면 문구의 표현으로 만들고 사용자가 승인했다 (2026-11-25)
 */
export const SCHEDULE_LIST_TITLE = "모집 중인 보드게임·방탈출 모임";
export const SCHEDULE_LIST_DESCRIPTION =
  "홍대·신촌·성수에서 모집 중인 보드게임·방탈출 모임을 한눈에 보고 바로 참여해 보세요. 마음에 드는 모임이 없다면 직접 열 수도 있어요.";

/**
 * 로그인·가입·내 정보처럼 검색에 나오면 안 되는 화면에 붙이는 색인 금지 표시.
 * robots.txt로 막지 않고 화면마다 알린다 (robots.txt로 막으면 검색엔진이 이 표시를 읽지 못한다)
 */
export const NO_INDEX_METADATA: Metadata = {
  robots: { index: false, follow: false },
};

/** 공유 이미지(1200×630). 보드게임 이미지가 대표(기본)이고 방탈출 이미지는 방탈출 일정에 쓴다 (사용자 결정 2026-11-24) */
export const OG_IMAGES = {
  boardGame: {
    url: "/images/og/og-boardgame.jpg",
    width: 1200,
    height: 630,
    alt: "보드게임카페 테이블에 둘러앉은 다섯 명이 웃으며 보드게임을 하는 모습",
  },
  escapeRoom: {
    url: "/images/og/og-escape-room.jpg",
    width: 1200,
    height: 630,
    alt: "방탈출 방에서 네 명이 낡은 종이 단서를 함께 들여다보는 모습",
  },
} as const;

/** 활동 코드(`ESCAPE_ROOM` 등)에 맞는 공유 이미지. 방탈출만 방탈출 이미지를 쓰고 나머지는 대표(보드게임) 이미지다 */
export function getActivityOgImage(activityCode: string | undefined) {
  return activityCode === "ESCAPE_ROOM"
    ? OG_IMAGES.escapeRoom
    : OG_IMAGES.boardGame;
}

type SocialMetadataInput = {
  title: string;
  description: string;
  /** 대표 주소 뒤에 붙는 경로. 예: `/schedules`. 없으면 og:url을 두지 않는다(화면이 따로 정하는 기본값용) */
  path?: string;
  image: (typeof OG_IMAGES)[keyof typeof OG_IMAGES];
};

/**
 * 공유 미리보기(OG)·트위터 카드 설정.
 * 하위 페이지가 `openGraph`를 지정하면 상위 값과 합쳐지지 않고 통째로 바뀐다. 그래서 사이트 이름·언어까지 매번 채워 준다
 */
export function socialMetadata({
  title,
  description,
  path,
  image,
}: SocialMetadataInput): Pick<Metadata, "openGraph" | "twitter"> {
  return {
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "ko_KR",
      url: path,
      title,
      description,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image.url],
    },
  };
}
