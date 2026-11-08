import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // 포맷 관련 규칙은 끄고 Prettier에 맡긴다 (TECH_STACK §3.11)
  prettier,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "storybook-static/**",
    "public/mockServiceWorker.js",
    // e2e가 남기는 결과물(트레이스 뷰어 포함)
    "playwright-report/**",
    "test-results/**",
  ]),
]);

export default eslintConfig;
