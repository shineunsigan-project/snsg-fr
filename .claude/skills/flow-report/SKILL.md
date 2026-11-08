---
name: flow-report
description: 기능(이슈) 하나를 마치면 사용자가 누르는 순서대로 화면을 캡처해 흐름 아티팩트로 발행한다. 사용자가 "흐름 보여줘", "아티팩트로 확인"을 요청하거나 feature 스킬 마무리 단계에서 쓴다.
---

# 화면 흐름 아티팩트

기능을 마치면 사용자가 화면 순서를 한눈에 확인할 수 있게, 누르는 순서대로 캡처한 페이지를 아티팩트로 발행한다.

## 1. 흐름 정하기
- 작업 지시서의 화면 ID 순서(예: LIST-01 → 03 → 04)와 결정 사항을 기준으로 단계를 나눈다. 단계 = 사용자가 하나의 목적으로 하는 동작 묶음(예: "활동 필터").
- 단계마다: 누른 것, 바뀐 주소, 근거(화면 ID·USER_FLOW 절·결정 날짜). 상태별 분기(로그인/비로그인, 역할, 오류·빈 화면)도 단계로 넣는다.

## 2. 캡처
- 개발 서버를 가짜 응답(MSW) 켜고 띄운다. `.env.local`은 고치지 않고 명령에서 덮어쓴다:
  `NEXT_PUBLIC_API_MOCKING=enabled pnpm exec next dev -p 3001` (3000은 다른 프로젝트가 쓸 수 있다. 먼저 `lsof -iTCP:3001`로 확인)
- Playwright 스크립트를 scratchpad에 만든다. `list-example.mjs`(SHI-152)를 복사해 단계만 바꾼다. 프로젝트 폴더에서 실행: `BASE=http://localhost:3001 OUT=<scratchpad>/shots/ node <script>`
  - 390×844, deviceScaleFactor 2, `timezoneId: Asia/Seoul`. Next 개발 표시(`nextjs-portal`)는 숨긴다(예시에 있음).
  - 요소는 role·이름으로 찾는다(e2e 규칙과 같음).
  - **비로그인 화면:** MSW 개발 서버에서 service worker를 막으면 앱이 뜨지 않는다. 같은 세션에서 `sessionStorage.setItem("mswSession", "out")` 후 새로고침해 만든다(mock 세션 로그아웃, `src/mocks/userStore.ts`). 다시 로그인은 `removeItem("mswSession")`.
  - 매번 처음 상태로 시작: `sessionStorage.clear()` 후 새로고침.
- 찍은 뒤 한 장으로 모아(contact sheet) 한 번 보고, 개발 표시·로딩 중 화면·빈 화면이 잘못 찍힌 것만 다시 찍는다.

## 3. 페이지
- `page-template.html`(일정 목록 흐름)을 복사해 내용만 바꾼다. 형식: 머리(이슈·화면 ID, 브랜치·커밋, 캡처 날짜, 화면 크기, 가짜 응답 여부) → 단계 목차 → 단계별 섹션(제목·설명·근거, 화면 + 누른 것 + 주소) → "캡처 조건과 남은 것"(실제 기기 아님, 임시 계약, 남은 TODO ID).
- 이미지는 webp(quality 82)로 바꿔 `shots/`에 두고 Artifact `files`로 함께 올린다.
- 제목은 `쉬는시간 <화면 이름> 흐름`. 아이콘은 첫 발행 때만.
- 같은 기능을 다시 발행할 때는 같은 파일 경로(또는 작업 지시서에 적어 둔 URL)로 갱신한다.

## 4. 마무리
- `obsidian-note` 스킬로 같은 내용을 옵시디언 노트로 남긴다(캡처 원본 png를 jpg로 줄여 attachments에).
- 아티팩트 URL을 작업 지시서 "진행 상태"와 `docs/HANDOFF.md`에 적는다.
- 사용자에게: URL, 단계 목록, 캡처하지 못한 상태(예: 실제 기기, 실제 API)를 알린다.
