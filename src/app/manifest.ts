import type { MetadataRoute } from "next";

// 웹 앱 매니페스트 — 홈 화면에 추가했을 때의 이름·아이콘 (USER_FLOW §9.1, SHI-160 결정 2026-11-07)
// 아이콘은 로고의 동그라미 무늬를 흰 바탕에 둔 임시 아이콘이다. TODO(D-18): 정식 아이콘은 디자이너에게 받는다
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "쉬는시간",
    short_name: "쉬는시간",
    start_url: "/",
    display: "standalone",
    theme_color: "#FFFFFF",
    background_color: "#FFFFFF",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
