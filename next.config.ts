import type { NextConfig } from "next";

// Next가 HTML만 읽는 봇(자바스크립트를 실행하지 않는 크롤러)을 알아보는 기본 목록(16.3.8)에 카카오톡 링크 미리보기 봇을 더했다.
// 이 목록에 없는 봇에게는 일정 상세의 공유 태그(og)가 `<head>`가 아니라 본문 뒤쪽으로 내려가 미리보기를 못 읽을 수 있다 (SHI-220).
// 기본 목록을 통째로 바꾸는 설정이라, Next를 올릴 때 기본 목록(`next/dist/shared/lib/router/utils/html-bots`)이 달라졌는지 본다
const HTML_LIMITED_BOTS =
  /[\w-]+-Google|Google-[\w-]+|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti|googleweblight|kakaotalk-scrap/i;

const nextConfig: NextConfig = {
  // next dev가 AGENTS.md / CLAUDE.md에 규칙 블록을 자동으로 추가하지 않게 한다 (개발 규칙은 AGENTS.md에서 직접 관리)
  agentRules: false,
  htmlLimitedBots: HTML_LIMITED_BOTS,
};

export default nextConfig;
