# snsg-fr
쉬는시간 서비스 사용자 앱 프론트엔드

> MVP 목표: 일정 하나를 만들고, 다른 사람이 참여하는 흐름 검증
> 서비스 형태: 웹뷰 앱 (모바일 세로 화면 기준), 추후 네이티브 앱 고려

## 📄 문서
| 문서 | 내용 |
|---|---|
| [`docs/USER_FLOW.md`](./docs/USER_FLOW.md) | 사용자 흐름, 화면 이동, 비즈니스 규칙 |
| [`docs/DESIGN.md`](./docs/DESIGN.md) | 화면 구성, 디자인 토큰, 공통 컴포넌트 |
| [`docs/TECH_STACK.md`](./docs/TECH_STACK.md) | 기술스택과 사용 원칙 |
| [`CONTRIBUTING.md`](./CONTRIBUTING.md) | 브랜치·커밋·PR 규칙 |

## 🛠 기술스택
Next.js · TypeScript · Tailwind CSS · shadcn/ui · TanStack Query · React Hook Form · Zod · Axios · MSW · ESLint · Prettier · Storybook · GitHub Actions · pnpm

자세한 내용은 [`docs/TECH_STACK.md`](./docs/TECH_STACK.md)를 참고한다.

## 🚀 개발 환경 셋팅

### 1. 레포 클론
```bash
git clone https://github.com/shineunsigan-project/snsg-fr.git
cd snsg-fr
```

### 2. 설치 · 실행

**필요 환경**
- Node.js 24 이상 (`.nvmrc` 기준 24)
- pnpm 12.4.2 — corepack을 켜면 `package.json`의 `packageManager` 버전이 자동으로 쓰인다

```bash
nvm use                      # .nvmrc의 Node 버전 사용 (nvm 사용 시)
corepack enable              # pnpm 버전 고정
pnpm install                 # 의존성 설치
cp .env.example .env.local   # 환경변수 파일 생성 후 값 입력
```

**환경변수** (`.env.local`)

| 이름 | 설명 |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | 백엔드 API base URL |
| `NEXT_PUBLIC_API_MOCKING` | `enabled`로 두면 MSW 브라우저 mock을 켠다 (기본 `disabled`) |

**실행**

```bash
pnpm dev                     # 개발 서버 http://localhost:3000
pnpm storybook               # Storybook http://localhost:6006
```

**검사** — PR마다 GitHub Actions에서 같은 검사를 실행한다

```bash
pnpm lint                    # ESLint (경고도 실패)
pnpm format:check            # Prettier 검사 (pnpm format으로 자동 수정)
pnpm typecheck               # TypeScript 타입 검사
pnpm build                   # 프로덕션 빌드
pnpm build-storybook         # Storybook 빌드
```

### 3. 브랜치 규칙
작업 시작 전 반드시 `develop`에서 분기한다.
```bash
git checkout develop
git pull origin develop
git checkout -b feature/내-기능명
```

### 4. 작업 완료 후
```bash
git add .
git commit -m "feat: 기능 설명"
git push origin feature/내-기능명
```
→ GitHub에서 `develop`으로 PR 생성

### 5. main 직접 push 금지 ❌
### 6. .env 파일 커밋 금지 🚨
