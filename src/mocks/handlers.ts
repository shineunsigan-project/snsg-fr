import type { AnyHandler } from "msw";

// API 함수와 1:1로 핸들러를 추가한다. 응답은 백엔드 스펙 문서를 기준으로 작성한다 (TECH_STACK §3.8)
export const handlers: AnyHandler[] = [];
