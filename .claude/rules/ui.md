---
paths:
  - "src/shared/ui/**"
  - "src/features/**/components/**"
  - "src/app/**/*.tsx"
  - "src/app/globals.css"
---

# 디자인 구현 · 컴포넌트 · Storybook

## 기준의 우선순위
- **화면 구성과 시각 규칙:** `docs/DESIGN.md`를 따른다.
- **색·간격·radius·글자 크기 수치:** 화면 시안 원본이 있으면 원본 값을 따른다. 없으면 `DESIGN.md`의 근사치를 쓴다(D-4). 시안 이미지는 옵시디언 `snsg-fr-secondbrain/00_Inbox/디자인UI/`(디자인 UI만 잘라 둔 것). 원본은 같은 폴더 위 `00_Inbox/`.
- **Figma MCP:** FigJam 기획 보드(`fileKey: pfVZnQY81EM6AUQt3H6tKs`)는 문서의 근거 확인에만 쓴다. 초기 와이어프레임과 "MVP 제외, 삭제 요소" 섹션은 기준이 아니다(DESIGN §0). Figma가 문서와 다르면 한쪽을 골라 구현하지 않고 차이를 보고한다.

## 규칙
- 디자인에 없는 UI, interaction, 문구는 추가하지 않는다. 필요해 보이면 물어볼 목록에 올린다.
- 스타일 값은 **Tailwind 테마 토큰으로만** 쓴다. `bg-[#356516]`, `p-[13px]` 같은 임의값은 쓰지 않는다. 토큰이 없으면 `globals.css` 테마에 추가한다. (shadcn이 생성한 파일 안쪽 값은 예외)
- `미확인` 화면은 구조와 동작만 만들고 시각 디자인을 지어내지 않는다. 기존 토큰·컴포넌트로 배치하고 `TODO(D-x)`를 남긴다.
- Loading·Error·Empty 상태는 디자인이 없으면(D-5) 공통 임시 상태 컴포넌트(텍스트만)로 처리한다. 스켈레톤·일러스트·애니메이션은 추가하지 않는다.
- 팝업·안내·검증 문구는 `USER_FLOW.md`와 `DESIGN.md` §9.3의 원문을 그대로 쓴다.
- 접근성 최소 기준:
  - 클릭할 수 있는 요소는 `<button>`이나 `<a>`. `div`에 `onClick`을 달지 않는다.
  - 아이콘만 있는 버튼에는 `aria-label`.
  - 오버레이는 shadcn Dialog·Drawer.
  - 입력 필드의 label과 오류 문구를 연결한다.
- 디자인 의도와 구현이 충돌하면: 눈에 띄지 않는 작은 차이는 문서 기준으로 구현하고 요약에 적는다. 동작이나 화면이 달라지는 차이는 구현 전에 확인한다.

## UI를 만드는 순서
1. 시안의 의도와 레이아웃 구조를 파악한다.
2. 고정값과 화면에 따라 변해야 하는 값을 구분한다.
3. 일반 모바일 화면에서 동작하게 만든다.
4. 넓은 화면, 낮은 화면, iPhone Duo 닫힘·열림, safe area·동적 뷰포트를 검토한다.
5. 기기 전용 코드가 필요해 보이면 넣기 전에 필요성과 대안을 설명한다.

## 화면 크기와 기기 대응
시안은 모바일 세로(390×844) 한 장이다. 이 크기는 **디자인 기준점**일 뿐이고, 특정 기기가 아니라 **뷰포트 크기, safe area, 접힘(fold) 영역**을 기준으로 대응한다.

- 폭은 `w-full` + 최대 폭 컨테이너(`max-w-*`) + Flexbox·Grid. 고정 width/height, `100vw`, 기기별 px 값을 쓰지 않는다.
- 시안 수치에서 고정값(버튼 높이, 아이콘·글자 크기)과 화면에 따라 변하는 값(폭, 이미지 영역, 세로 여백)을 구분한다.
- 넓은 화면에서 모바일 UI를 늘리지 않는다. 최대 폭 컨테이너를 가운데 두고 양옆은 앱 배경. 다단 배치는 디자인·사용자 확인이 있을 때만(DESIGN §12).
- 브레이크포인트·컨테이너 쿼리는 기기 이름이 아니라 **콘텐츠가 깨지는 지점**에 둔다. 컴포넌트 안쪽은 컨테이너 쿼리를 우선한다.
- 높이에 `100vh`(`h-screen`)를 쓰지 않는다. `dvh`·`svh`·`lvh`를 용도에 맞게, 화면 전체는 `min-h-dvh`·`h-dvh`.
- 낮은 화면에서 넘칠 때 줄어들 영역을 정해 `min-h-0`으로 줄이고, 그래도 넘치면 스크롤. 세로 가운데 정렬은 `justify-center-safe`.
- 한국어는 `break-keep`. 길어질 수 있는 텍스트(카드 제목, 장소명)는 말줄임.
- **기기 감지 금지:** user-agent 분기, `isIPhone` 같은 판별, 특정 기기 크기 비교 분기를 만들지 않는다. 필요해 보이면 추가 전에 필요성과 대안을 설명한다.
  - 예외(사용자 결정 2026-11-07): 홈 화면 추가 안내(ONB)의 OS·앱 안 브라우저 판별은 user-agent를 쓴다(`features/onboarding/lib/homeScreenGuide.ts`). 화면 배치에는 쓰지 않는다.
- **Safe area:** `viewport-fit=cover`라 가장자리 UI(하단 GNB·고정 CTA·바텀시트·모달·상단 고정 헤더)는 `env(safe-area-inset-*)`를 고려한다. 상하는 `pt-safe`·`pb-safe`. 가로 모드·iPhone Duo는 좌우 inset도 생길 수 있다.
- **iPhone Duo·폴더블:** 닫힘↔열림은 화면 크기 변경으로 다룬다(처음 크기를 JS로 저장해 고정하지 않는다). 웹 CSS 크기는 공개되지 않아 특정 값을 쓰지 않는다. 폴더블 전용 코드(Viewport Segments·Device Posture API)는 접힘 영역 문제가 실제로 확인될 때만, 지원하지 않는 환경에서도 그대로 동작하게 넣는다. 세부 사실은 DESIGN §12.

### 컴포넌트를 만들 때 점검할 것
- 320px에서 넘치거나 겹치지 않는가 / 넓은 폭에서 과하게 늘어나지 않는가
- 줄바꿈·말줄임 / 터치 영역 44×44 이상
- fixed·sticky 요소가 safe area와 겹치지 않는가 / 가로 모드, iPhone Duo 열림·닫힘

## 컴포넌트 위치와 분리
```
src/
  app/                라우트 파일(page, layout)만. 기능 컴포넌트를 조합만 한다
  features/<기능>/     해당 기능 전용 components / hooks / api / schemas / lib / types
  shared/ui/          여러 기능에서 쓰는 공통 UI (shadcn 기반 포함)
  shared/lib/         공통 API 클라이언트, 유틸
  mocks/              MSW 핸들러
```
- `shared`는 `features`를 import하지 않는다.
- 만들기 전 확인 순서: `shared/ui` → shadcn 기반 → 해당 기능 폴더 → 없을 때만 새로 만든다.
- 새 컴포넌트는 기능 폴더에 먼저 만든다. `DESIGN.md` §9.1 후보이거나 실제로 두 곳 이상에서 쓰면 `shared/ui`로 옮긴다.
- 한 곳에서만 쓰는 코드는 추상화하지 않는다. 세 번째 반복 때 추출을 검토한다.
- variant 추가는 `DESIGN.md`에 있는 변형일 때만. boolean prop을 계속 붙여 서로 다른 UI를 한 컴포넌트로 처리하지 않는다.
- shadcn은 TECH_STACK §3.4의 범위에만 쓴다. 도메인 UI는 직접 만든다.

## Storybook
- **`shared/ui` 컴포넌트를 만들거나 고치면 같은 작업에서 Story를 쓴다.**
- 기본 상태와 실제로 의미 있는 variant·상태(disabled, loading, error 포함)만. 디자인·요구사항에 없는 상태는 만들지 않는다.
- 기능 전용 컴포넌트는 분기가 많을 때만 권장(예: 일정 상태 × 역할의 상세 하단 버튼).
- Story 때문에 컴포넌트 구조를 바꾸지 않는다.
- 컴포넌트 옆 `Xxx.stories.tsx`, CSF3. 작성 후 `pnpm build-storybook` 통과를 확인한다. 버전·설정은 TECH_STACK §3.12.
