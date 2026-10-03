import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // next dev가 AGENTS.md / CLAUDE.md에 규칙 블록을 자동으로 추가하지 않게 한다 (개발 규칙은 AGENTS.md에서 직접 관리)
  agentRules: false,
};

export default nextConfig;
