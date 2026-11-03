# 코드 품질

- **TypeScript:** `strict`. `any` 금지(필요하면 `unknown`). `as` 단언은 최소로. 라이브러리가 `any`를 주면 타입 가드로 좁힌다.
- **도메인 값:** 일정 상태, 사용자 역할 같은 값은 enum 대신 union 타입으로 한 곳(`features/<기능>/types.ts`)에 정의한다.
- **ESLint·Prettier:** 설정을 따른다. `eslint-disable`에는 이유 주석. 포맷을 손으로 맞추지 않는다.
- **네이밍:** 컴포넌트 파일 `PascalCase.tsx`, 그 밖 `camelCase.ts`. 훅 `useXxx`. API 함수는 동사+명사(`getSchedules`). 도메인 용어는 기존 이름을 그대로 쓴다.
- **export:** named export. default export는 Next.js 라우트 파일에서만.
- **불필요한 코드:** 쓰지 않는 코드, 주석 처리된 코드, 요청 범위 밖의 파일을 남기지 않는다.
- **주석:** "왜"만 적는다. 미결 사항은 문서 질문 ID를 붙여 `TODO(F-8)` 형식(`F-x`, `D-x`, `T-x`, `API`). 화면이 아직 없어 미룬 것은 화면 ID(`TODO(DTL-01)`).
- **가장 단순한 방법:** 래퍼 훅, HOC, 팩토리를 미리 만들지 않는다.
- **공통 코드 변경:** `shared/`, API 클라이언트, Tailwind 테마, `providers.tsx`를 고치면 영향 범위를 작업 요약에 적는다.
