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
Next.js · TypeScript · Tailwind CSS · shadcn/ui · TanStack Query · React Hook Form · Zod · Axios · MSW · ESLint · Prettier · GitHub Actions · pnpm

자세한 내용은 [`docs/TECH_STACK.md`](./docs/TECH_STACK.md)를 참고한다.

## 🚀 개발 환경 셋팅

### 1. 레포 클론
```bash
git clone https://github.com/shineunsigan-project/snsg-fr.git
cd snsg-fr
```

### 2. 설치 · 실행
> 프로젝트 세팅 후 추가 예정 (pnpm 사용)

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
