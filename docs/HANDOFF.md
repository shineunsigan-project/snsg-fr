# 인계

하루를 시작하면 이 문서부터 읽는다. 작업을 멈출 때 "지금 상태"와 "다음에 할 일"을 고친다.

마지막 갱신: 2026-11-08

## 지금 상태
- 브랜치 `feature/SHI-158-my-page`: develop(SHI-151·162·152·155 머지본) 위로 옮김(2026-11-08). **SHI-158 내 정보·프로필 수정·로그아웃·탈퇴** — 지시서 `.claude/tasks/SHI-158.md`. 사용자 확인 완료(2026-11-08), PR 준비.
- 일정 개설은 실제 API(SHI-162). 일정 목록·상세·내 프로필 API는 백엔드에 없어 임시 계약 + MSW. 실제 연결은 SHI-163·164·165(Backlog).
- 흐름 아티팩트: 일정 목록 https://claude.ai/artifact/5bK2wjP6XaKdZWki6AdtzN · 일정 상세 https://claude.ai/artifact/58pkc7eCb9JBiWSQexvRMF · 내 정보 https://claude.ai/artifact/XG7dmDKoeu4ENYX62vuZPS (옵시디언 `01_Projects/쉬는시간/`에도 노트)
- 개발 서버: `localhost:3001` MSW 켜고 실행(`NEXT_PUBLIC_API_MOCKING=enabled pnpm exec next dev -p 3001`). mock은 로그인 상태로 시작(`MOCK_LOGGED_IN = true`).

## 다음에 할 일
1. [ ] SHI-158 PR
2. [ ] SHI-160을 develop 위로 옮기기
3. [ ] 백엔드 임시 계약: 목록(SHI-163)·상세(SHI-164)·내 프로필(SHI-165)
4. [ ] `MOCK_LOGGED_IN` 원복 시점 정하기
5. [ ] 남은 docs 정리 범위 정하기
6. [ ] 백엔드 확인: 카카오 사진이 없을 때 서버 기본 이미지(`default-profile.png`)를 넣으면 기본 아바타(사람 모양) 대신 그 이미지가 보인다 — 기본 이미지일 때 `profileImageUrl`을 비울지 (2026-11-07 아바타 통일 결정)

## 열린 질문
- 커밋 전 리뷰 알림 hook을 넣을지 (막기 / 알리기만)
- docs 정리: 팀 모두 기획서(정의서 v0.3·화면 명세 MVP)를 알고 있음 → USER_FLOW는 기획서 원문을 옮기지 않고 위치·버전만 참조, 기획서와 다른 점·팀 결정·구현 규칙·미정 질문만 남긴다(2026-11-03). DESIGN은 화면 묘사를 시안 경로로, 수치는 토큰으로. 결정 이력은 `docs/DECISIONS.md`로 따로 둔다(2026-11-03). DESIGN 공통 컴포넌트는 `docs/COMPONENTS.md`(목록)로 분리 예정. SHI-152 커밋은 보류(사용자, 2026-11-03)
