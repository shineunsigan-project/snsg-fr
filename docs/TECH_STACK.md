# TECH_STACK.md — 쉬는시간 사용자 앱 기술스택

> 이 문서는 **어떤 기술을, 어떤 목적과 범위로 쓰는가**를 다룬다.
> 화면 디자인은 [`DESIGN.md`](./DESIGN.md), 사용자 흐름과 비즈니스 규칙은 [`USER_FLOW.md`](./USER_FLOW.md)를 참고한다.

| 항목 | 내용 |
|---|---|
| 결정일 | 2026-10-03 |
| 상태 | **확정 · 초기 세팅 완료 (2026-10-04)** |
| 기준 요구사항 | MVP는 웹뷰 앱, 추후 모바일 앱 개발 고려 · 백엔드는 별도 개발자 담당 · 여러 명이 협업하고 PR 리뷰 필수 |

---

## 1. 확정 기술스택

| 영역 | 기술 | 버전 | 이 프로젝트에서의 역할 |
|---|---|---|---|
| Framework | **Next.js** (App Router) | 16.3 | 라우팅, 공유 링크용 메타 태그(OG) 생성, 카카오 로그인 콜백 처리 |
| Language | **TypeScript** | 5.9 | 일정 상태 × 역할 × 로그인 여부 분기를 타입으로 표현, 백엔드 응답 형식 관리 |
| Styling | **Tailwind CSS** | 4.3 | 스타일링, 디자인 토큰 관리 (shadcn/ui의 전제, §3.13) |
| UI Component | **shadcn/ui** (Base UI 기반) | CLI 4.21 · `@base-ui/react` 1.8 | 접근성이 중요한 오버레이·입력 요소 (범위는 §3.4) |
| Toast | **Sonner** | 2.0 | 결과 안내 토스트 (`src/shared/ui/sonner.tsx`, §3.4) |
| Server State | **TanStack Query** | 5 | 서버 데이터 조회·캐시·로딩/에러 상태, 참여·취소 후 관련 목록 갱신 |
| Form | **React Hook Form** | 7 | 프로필 완성·수정, 일정 개설 폼 |
| Validation | **Zod** | 4 | 폼 입력값 유효성 검사 스키마 |
| API Communication | **Axios** | 1 | 공통 API 클라이언트 (base URL, 인증, 에러 형식 통일) |
| API Mocking | **MSW** | 3 | 백엔드 준비 전 화면 개발, 실패 케이스 재현 |
| Lint | **ESLint** | 9 | 코드 오류·위험한 패턴 검사 |
| Formatter | **Prettier** | 3 | 코드 포맷 통일 |
| Component Workshop | **Storybook** (`@storybook/nextjs-vite`) | 10 | 공통 컴포넌트 단위 개발·문서화 (§3.12) |
| CI | **GitHub Actions** | — | PR 검사 자동화 |
| Package Manager | **pnpm** | 12.4.2 (`packageManager`로 고정) | 의존성 설치·관리 |
| Runtime | **Node.js** | 24 LTS (`.nvmrc`, `engines >=24`) | 개발·CI 실행 환경 |

- 버전은 2026-10-04 초기 세팅 기준이다. 정확한 버전은 `package.json`과 `pnpm-lock.yaml`을 따른다.
- 도구가 함께 설치하는 패키지: shadcn — `@base-ui/react`, `class-variance-authority`, `cn`, `lucide-react`, `tw-animate-css` / Storybook — `vite`, `@storybook/addon-docs`.

---

## 2. 이번에 채택하지 않은 기술

| 기술 | 판단 | 이유 |
|---|---|---|
| Zustand | 미채택 | 전역 클라이언트 상태가 거의 없다. 서버 데이터는 TanStack Query, 필터·탭은 URL, 모달 등은 컴포넌트 state로 충분하다. 일정 개설 단계를 별도 URL로 나누게 되면 다시 검토한다 |
| Chromatic | **추후 도입** | 디자인 토큰이 근사치라 시각 테스트 기준선을 아직 잡을 수 없다. 버전·원칙은 §3.12 |
| Husky | 미채택 | 같은 검사를 GitHub Actions에서 수행한다 |
| npm | 미채택 | pnpm으로 통일한다 |

---

## 3. 기술별 사용 원칙

### 3.1 Next.js
- **App Router**를 쓴다. 라우트 파일은 `src/app/`에 둔다.
- 대부분의 화면은 **클라이언트 컴포넌트**로 만든다. 서버 쪽 기능은 꼭 필요한 곳에만 쓴다.
  - 공유 링크로 열리는 일정 상세의 메타 태그(OG) 생성
  - 카카오 로그인 콜백 처리
- 웹뷰 앱 안에서 동작하는 것이 기본이다. 기준 화면은 모바일 세로 하나다(DESIGN §12).
- `next.config.ts`의 `agentRules: false`로 `next dev`가 `AGENTS.md`·`CLAUDE.md`에 규칙 블록을 자동으로 추가하지 않게 한다. 개발 규칙은 `AGENTS.md`에서 직접 관리한다.

### 3.2 TypeScript
- `strict` 모드를 처음부터 켠다.
- 일정 상태(`모집중` / `모집완료` / `활동 진행 중` / `활동 완료` / `취소`)와 사용자 역할(일반 / 확정 참여자 / 개설자)은 문자열을 흩어 쓰지 않고 타입으로 정의한다.
- 백엔드 응답 타입은 API 계층(§3.7)에만 둔다.

### 3.3 TanStack Query — 서버 상태
- **서버에서 오는 데이터는 모두 TanStack Query로 관리한다.** 로그인한 사용자 정보도 포함한다.
- 참여·참여 취소·전체 취소·개설 후에는 영향을 받는 쿼리(목록, 상세, 참여한·개설한 일정)를 무효화해 다시 가져온다.
- 일정 상태는 시간에 따라 서버에서 바뀐다(USER_FLOW §7.1). 클라이언트가 상태를 계산하지 않고, 화면 진입 시 다시 조회한다.

클라이언트 상태는 아래 위치에 둔다(별도 상태 관리 라이브러리를 쓰지 않는다).

| 상태 | 위치 |
|---|---|
| 필터 값, 선택된 탭 | URL 쿼리 파라미터 |
| 모달 열림, 입력 중인 값 | 컴포넌트 state |
| 로그인 후 돌아갈 화면 | sessionStorage `loginRedirect` (USER_FLOW §4.3). 카카오 인증이 서버를 거쳐 고정 주소로 돌아오므로 URL로 넘기지 않는다 (2026-10-06) |

### 3.4 shadcn/ui
shadcn 기반 컴포넌트는 코드를 레포로 복사한 뒤 DESIGN.md에 맞게 스타일을 고쳐 쓴다.

- **기반 라이브러리는 Base UI**다(팀 결정, 2026-10-04). `components.json`의 style은 `base-nova`이고, 컴포넌트는 `src/shared/ui`에 설치된다.
- 추가는 `pnpm dlx shadcn@latest add <컴포넌트>`로 한다.

| shadcn 기반 | 직접 구현 |
|---|---|
| Dialog(확인 모달·로그인 필요 모달), Drawer(바텀시트), RadioGroup, Checkbox, Tabs(동작), Sonner(토스트) | Button 변형, Badge, FilterChip, ScheduleCard, BottomNav, Header, ImagePlaceholder, 일정 요약 블록, 성별 토글, Avatar Editor |

- 기준: 포커스 이동·키보드 조작·스크린리더 대응이 까다로운 요소만 shadcn을 쓴다. 도메인 전용 UI는 직접 만든다.
- **Sonner:** 토스트는 Sonner로 띄운다(팀 결정, 2026-10-04). `sonner` 패키지만 설치하고(`next-themes` 없음), `src/shared/ui/sonner.tsx`의 `Toaster`를 `providers.tsx`에 한 번 둔다. 모양은 Sonner 기본을 끄고(`unstyled`) 시안 컴포넌트 코드의 Toast를 따른다(DESIGN §9.1). 띄울 때는 `showToast("문구")`.

### 3.5 React Hook Form + Zod
- **사용하는 곳:** 프로필 완성, 프로필 수정, 일정 개설.
- **사용하지 않는 곳:** 입력이 하나뿐인 폼(취소 사유, 제보 유형, 댓글, 필터 시트)은 컴포넌트 state로 처리한다.
- 유효성 검사 규칙과 오류 문구는 USER_FLOW §4.1 "입력값 유효성 검사"·"유효성 검사 문구"를 Zod 스키마로 옮긴다.
- 닉네임 중복 확인처럼 서버 응답이 필요한 검사는 비동기 검사로 처리한다.
- Zod는 우선 **폼 검증에만** 쓴다. 백엔드 응답 검증으로 넓힐지는 필요해지면 결정한다.

### 3.6 Axios
- 공통 클라이언트 하나만 만든다: base URL, 인증 정보 부착, 401 처리, 에러 형식 통일.
- 화면에서 Axios를 직접 부르지 않는다. 항상 API 함수(§3.7)를 거친다.
- 위치: `src/shared/lib/api/client.ts`. base URL은 환경 변수 `NEXT_PUBLIC_API_BASE_URL`로 받는다(`.env.example` 참고). 응답 형식, 인증, 401 처리는 §6을 따른다.

### 3.7 API 계층 분리

```
화면 컴포넌트
  └─ 쿼리 훅 (예: useScheduleList, useJoinSchedule)   ← TanStack Query: 언제 가져오고 무엇을 무효화할지
       └─ API 함수 (예: getSchedules, joinSchedule)     ← 요청 방법: URL·파라미터·응답 타입
            └─ 공통 API 클라이언트 (Axios)                 ← base URL, 인증, 에러 통일
```

- 백엔드는 별도 개발이므로 **백엔드 스펙 문서(Swagger 등) 하나를 기준**으로 삼는다.
- 실패 처리는 백엔드가 내려주는 에러 코드로 분기한다(예: 중복 참여, 진행 중 취소 불가, 조회 불가). 코드 이름은 백엔드와 협의한다.

### 3.8 MSW
- 백엔드 API가 준비되기 전에 화면을 개발하고, 실패 케이스(중복 참여, 진행 중 취소, 조회 불가, 401 등)를 재현하는 데 쓴다.
- **브라우저 쪽만 mock한다.** 환경 변수로 켜고 끈다.
- mock 응답은 백엔드 스펙 문서를 기준으로 작성한다. 실제 API와 어긋나지 않게, 스펙이 바뀌면 mock도 함께 고친다.
- 구성: 핸들러는 `src/mocks/handlers.ts`, worker는 `public/mockServiceWorker.js`(msw CLI가 생성). `NEXT_PUBLIC_API_MOCKING=enabled`일 때만 켜진다.
- 현재 mock: `POST /api/v1/auth/tokens`(항상 401 → 비로그인), `GET /api/v1/auth/signup/session`(카카오 정보, 임시 닉네임 "딸기스무디"), `POST /api/v1/auth/signup/profile-image`(사진 업로드), `POST /api/v1/auth/signup`(가입 완료. 닉네임 `중복닉네임`이면 409 `DUPLICATED_NICKNAME`). 카카오 인증 이동(`GET /api/v1/auth/kakao/authorize`)은 페이지 이동이라 mock하지 않는다. mock에서 가입 화면은 `/auth/callback?signUp=true`로 들어간다.
- `msw/browser`는 서버에서 불러올 수 없으므로, worker 시작은 `next/dynamic`(`ssr: false`)으로 불러오는 `src/mocks/MockWorker.tsx`에서만 한다. mock이 켜져 있으면 worker가 준비될 때까지 화면 렌더링을 미룬다(`src/app/providers.tsx`).

### 3.9 GitHub Actions
- PR마다 **lint · 포맷 검사 · 타입 검사 · 빌드 · Storybook 빌드**를 실행한다.
- `develop` 브랜치 보호 규칙과 함께 쓴다(CONTRIBUTING.md의 리뷰 규칙 유지).
- 배포 자동화는 배포 환경이 정해진 뒤 추가한다.

### 3.10 pnpm
- lock 파일은 `pnpm-lock.yaml` 하나만 둔다.
- pnpm 버전은 `package.json`의 `packageManager`로 고정한다. corepack이 같은 버전을 쓴다.
- 설치 스크립트 실행 허용 목록은 `pnpm-workspace.yaml`의 `allowBuilds`에서 관리한다(현재 `esbuild`만 허용).

### 3.11 ESLint · Prettier
- 역할을 나눈다. **ESLint는 코드 품질**, **Prettier는 포맷**만 맡는다. 두 규칙이 겹치지 않게 ESLint의 포맷 관련 규칙은 끈다(`eslint-config-prettier`).
- ESLint는 Next.js 기본 설정(`eslint-config-next`)과 TypeScript 규칙에서 시작한다. 규칙 추가는 팀 합의 후 한다.
- Tailwind 클래스 순서는 Prettier 플러그인(`prettier-plugin-tailwindcss`)으로 자동 정렬한다.
- 커밋 전 자동 실행(Husky)은 쓰지 않는다(§2). 에디터 저장 시 포맷 + PR의 GitHub Actions 검사로 지킨다. VS Code 설정은 `.vscode/`에 있다.
- Prettier 옵션은 기본값(큰따옴표, 세미콜론)을 쓴다. Markdown 파일(`*.md`)은 표 정렬이 바뀌지 않도록 포맷 대상에서 제외한다(`.prettierignore`).
- `lint`는 `--max-warnings 0`으로 경고도 실패로 처리한다.

### 3.12 Storybook · Chromatic
**Storybook은 초기 세팅에 포함한다** (팀 결정, 2026-10-03). **Chromatic은 추후 도입**한다. 디자인 토큰이 Claude Design 원본 값으로 확정되면(DESIGN D-4) 시각 테스트 기준선을 잡는다.

| 패키지 | 버전 | 역할 | 도입 시점 |
|---|---|---|---|
| `storybook` | **10.x** | 컴포넌트 단위 개발·문서화 | 초기 세팅 |
| `@storybook/nextjs-vite` | **10.x** | Next.js용 Storybook 프레임워크 (Vite 기반) | 초기 세팅 |
| `@chromatic-com/storybook` | **5.x** | Storybook 안에서 Chromatic 시각 테스트 실행 | 추후 |
| `chromatic` | **18.x** | CI에서 Chromatic으로 빌드 업로드 | 추후 |

- 버전 기준일: 2026-10-03 (당시 최신 `storybook` 10.6.1, `@chromatic-com/storybook` 5.4.0, `chromatic` 18.10.2). 설치할 때 위 메이저 버전의 최신을 쓴다.
- Storybook 11은 이 시점에 alpha라 쓰지 않는다. 안정 버전이 나오면 다시 검토한다.
- 프레임워크는 `@storybook/nextjs`(Webpack)가 아니라 **`@storybook/nextjs-vite`** 를 쓴다. 빌드가 빠르고, Tailwind v4 설정이 간단하며, Next.js 16을 지원한다.
- `storybook`과 `@storybook/*` 패키지는 **모두 같은 버전**으로 맞춘다. 업그레이드는 버전을 직접 고치지 않고 `pnpm dlx storybook@latest upgrade`로 한다.
- 스토리는 공통 컴포넌트(`src/shared/ui` `추정`)부터 작성한다. 화면 단위 스토리는 디자인이 확인된 화면만 만든다(DESIGN §11의 `미확인` 상태는 임의로 만들지 않는다).
- 스토리에서 API가 필요한 컴포넌트는 MSW mock(§3.8)을 함께 쓴다.
- PR 검사(§3.9)에 **Storybook 빌드**를 추가해, 스토리가 깨지면 머지하지 못하게 한다. Chromatic 검사는 도입 시 추가한다.
- 컴포넌트는 색·간격 등을 하드코딩하지 않고 **디자인 토큰(Tailwind 테마)만** 쓴다. 토큰 값이 바뀌면 Storybook에서 바로 확인할 수 있고, 나중에 Chromatic 스냅샷이 디자인 변경을 정확히 잡는다(DESIGN §14).

- 설정은 `.storybook/`에 있다. `src/app/globals.css`를 불러와 앱과 같은 토큰·폰트로 렌더링하고, `public/`을 정적 파일로 서빙한다.
- `src/shared/ui/DesignTokens.mdx`(Foundations/Design Tokens)에서 색상 토큰을 확인할 수 있다.

### 3.13 Tailwind CSS · 디자인 토큰
- 토큰은 `src/app/globals.css`의 `:root`(값)와 `@theme inline`(Tailwind 클래스 연결)에 둔다. 별도 Tailwind 설정 파일은 없다(Tailwind v4).
- 색상은 DESIGN §6에 값이 있는 것만 정의한다. 값이 없는 항목(보조 텍스트, 테두리, 오류 색, radius)은 shadcn 기본값을 유지하고 `TODO(D-4)`, `TODO(D-8)`로 표시한다. 글자 크기·간격은 Tailwind 기본 스케일을 쓴다.
- 다크 모드는 정의하지 않는다(DESIGN §6 미확인).
- 폰트는 **Pretendard 1.3.9 가변 폰트**를 `public/fonts/`에서 직접 서빙한다(라이선스 `OFL.txt` 포함). 파일이 약 2MB라, 첫 로딩이 문제가 되면 subset 방식으로 바꾸는 것을 검토한다.

---

## 4. 확인이 필요한 사항

기술스택과 직접 연결되어 있어 세팅 전에 정해야 하는 항목이다.

| ID | 질문 | 영향 |
|---|---|---|
| ~~T-1~~ | ~~shadcn/ui는 Tailwind CSS를 전제로 한다. 스타일링을 Tailwind로 하는가?~~ → **해결 (2026-10-03): Tailwind CSS를 쓴다** (§1) | — |
| ~~T-2~~ | ~~ESLint·Prettier를 포함하는가?~~ → **해결 (2026-10-03): 둘 다 쓴다** (§1, §3.11) | — |
| ~~T-3~~ | ~~기존 코드(Vite + JSX + React Router + Zustand + Supabase + npm, 다른 레포의 커밋 `efadcdd`)를 이전할지, 새로 시작할지~~ → **해결 (2026-10-03): 이 레포(`snsg-fr`)에서 새로 세팅한다** | — |
| T-4 | 이전 작업물(다른 레포)에는 **Supabase**가 쓰였다. 백엔드는 별도 개발자가 담당하는데, 프론트에서 Supabase를 쓸 일이 있는가? | API 클라이언트 구성, 인증 방식 |
| ~~T-5~~ | ~~네이버 로그인도 지원하는가?~~ → **해결 (2026-10-04): 지원한다.** Figma 로그인 화면(`247:21229`)에 `네이버로 시작하기` 버튼이 있다. 인증 연동 방식은 카카오와 함께 정한다 (USER_FLOW F-16) | 로그인 화면, 인증 콜백 처리 |
| T-6 | **푸시 알림 구현 방향**(웹뷰 앱 + 네이티브 푸시 / 카카오 알림톡·문자 / 아이폰 브라우저 제외)이 아직 정해지지 않았다. 아이폰 지원, 홈 화면 추가 없음이 조건이다 | 웹뷰 앱 껍데기 필요 여부, 웹과 앱 사이 연결(브리지) 설계 (USER_FLOW F-15) |
| ~~T-7~~ | ~~백엔드 인증 방식은?~~ → **해결 (2026-10-06): 백엔드 API 계약을 따른다** (§6) | — |
| T-8 | Next.js의 배포 환경은? (Vercel / 자체 서버 등) | 서버 기능(OG 메타, 로그인 콜백) 사용 범위, GitHub Actions 배포 단계 |

---

## 5. 세팅 단계에서 정한 것 (2026-10-04)

| 항목 | 결정 |
|---|---|
| Next.js 라우터 | App Router |
| 폴더 구조 | 가벼운 기능 단위 구조. FSD는 이 규모에 과하다고 판단했다 (아래) |
| shadcn 기반 라이브러리 | Base UI |
| 토스트 | Sonner |
| 테스트 도구 | 도입하지 않음 (필요해지면 결정) |

```
src/
  app/              라우트 파일, providers, globals.css
  features/<기능>/   기능 전용 components / hooks / api / schemas / types (첫 기능을 만들 때 생성)
  shared/ui/        공통 UI, shadcn 컴포넌트
  shared/lib/       공통 API 클라이언트(api/client.ts), 유틸(utils.ts)
  mocks/            MSW 핸들러, worker
```

## 6. API 공통 규칙 (백엔드 계약, 2026-10-06)

엔드포인트별 요청·응답·에러 코드는 백엔드 서버의 `/v3/api-docs`(swagger-ui)가 기준이다. 여기에는 여러 호출에 걸친 규칙만 적는다.

- **경로:** 모든 API는 `/api/v1`으로 시작한다.
- **응답 봉투:** 성공 `{ "isSuccess": true, "data": {…} }`, 실패 `{ "isSuccess": false, "code", "message" }`. 화면 분기는 **`code`** 로 한다. `message`는 바뀔 수 있어 분기에 쓰지 않는다. 성공이어도 돌려줄 값이 없으면 `data`가 없다. 코드: `ApiSuccess`·`ApiFailure`·`getApiErrorCode` (`shared/lib/api/client.ts`).
- **공통 에러 코드:** `INVALID_REQUEST`(400·404·405·415 등 요청 형식 오류), `UNAUTHENTICATED`(401, access token 없음·만료), `INTERNAL_ERROR`(500).
- **인증 에러 코드:** `INVALID_REFRESH_TOKEN`(401 → 로그인 화면), `INVALID_SIGNUP_TOKEN`·`INVALID_SOCIAL_CODE`(401 → 카카오 로그인부터 다시), `DUPLICATED_NICKNAME`(409 → 다른 닉네임 입력 안내).
- **토큰:**
  - access token(30분)은 응답 본문으로 받아 **메모리에만** 둔다(`shared/lib/api/accessToken.ts`). localStorage·sessionStorage에 넣지 않는다. 요청마다 `Authorization: Bearer`로 붙인다.
  - refresh token(14일)과 가입 토큰은 서버가 **HttpOnly 쿠키**(`Path=/api/v1/auth`)로 관리한다. 그래서 `apiClient`는 `withCredentials: true`로 쿠키를 함께 보낸다.
- **로그인 복구:** 앱 시작 때 `POST /api/v1/auth/tokens`. 200이면 로그인, 401이면 비로그인. 로그인 여부는 `useIsLoggedIn`(TanStack Query `["auth","session"]` + 메모리 토큰)으로 읽는다.
- **401 처리:** `UNAUTHENTICATED`를 받으면 `POST /api/v1/auth/tokens`로 재발급을 한 번 시도하고 원래 요청을 한 번 다시 보낸다. 재발급하면 이전 refresh token이 바로 무효가 되므로 **재발급 요청은 한 번에 하나만** 보내고, 다른 요청은 그 결과를 기다린다. 재발급이 401이면 토큰을 지우고 로그인 화면으로 보낸다.
- **날짜·시간:** `2026-09-14T00:00:00`처럼 오프셋 없는 ISO-8601이고, 모두 한국 시간(Asia/Seoul)이다. 브라우저 시간대와 상관없이 한국 시간으로 해석한다.
- **CORS·쿠키:** 백엔드가 개발 서버 주소(`http://localhost:3000`)를 허용한다(credentials 포함, 허용 헤더 `Authorization`·`Content-Type`). 쿠키는 `SameSite=None; Secure`라 프론트와 API가 다른 사이트인 동안 Safari에서 막힐 수 있다(`추가 검증 필요`).

