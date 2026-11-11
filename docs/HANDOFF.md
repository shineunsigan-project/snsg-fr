# 인계

하루를 시작하면 이 문서부터 읽는다. 작업을 멈출 때 "지금 상태"와 "다음에 할 일"을 고친다.

마지막 갱신: 2026-11-10

## 지금 상태
- 브랜치 `feature/SHI-163-schedule-list-api`(메인 폴더, develop 561bf25 = SHI-160까지 머지). **SHI-163 일정 목록 실제 API 연결** — 지시서 `.claude/tasks/SHI-163.md`. 사용자 확인 끝, PR #16(2026-11-11)
- 백엔드 develop e746440에 목록·상세·참여·취소·내 프로필·탈퇴 API가 모두 생겼다. 일정 개설(SHI-162)·목록(SHI-163)은 실제 API, 상세·참여(SHI-164)는 실제 API로 바꿔 PR #17, 내 프로필(SHI-165)은 아직 임시 계약 + MSW
- 로컬 실서버 확인: Redis 필요(`brew install redis` 설치됨, `redis-server /opt/homebrew/etc/redis.conf --daemonize yes`로 켬). `../snsg-be/snsg`에서 `sh ./gradlew bootRun`(8080), 프론트는 `.env.local`의 API 주소가 ngrok이라 `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080 pnpm dev`(3000)
- Linear 이슈 본문은 `FE 작업` 템플릿(개요·범위·범위 밖), 결정·임시 계약은 PR 본문에 (2026-11-10, `.claude/rules/git-workflow.md`)
- 흐름 아티팩트: 일정 목록 https://claude.ai/artifact/5bK2wjP6XaKdZWki6AdtzN · 일정 상세 https://claude.ai/artifact/58pkc7eCb9JBiWSQexvRMF · 내 정보 https://claude.ai/artifact/XG7dmDKoeu4ENYX62vuZPS (옵시디언 `01_Projects/쉬는시간/`에도 노트)
- 개발 서버: `localhost:3001` MSW 켜고 실행(`NEXT_PUBLIC_API_MOCKING=enabled pnpm exec next dev -p 3001`). mock은 로그인 상태로 시작(`MOCK_LOGGED_IN = true`).

## 다음에 할 일
1. [ ] SHI-164 PR #17 머지 → 다음은 SHI-165(내 프로필·탈퇴 실제 API, 사진 경로 앞 서버 주소 붙이기 확인 포함). 결정은 `.claude/tasks/SHI-164.md`. 로컬 서버(Redis·백엔드·프론트)는 켜 둔 채 이어 간다
2. [ ] 작업 폴더 `../snsg-fr-151`·백업 브랜치(`backup/SHI-*`) 정리
3. [ ] 실제 API 연결: 상세(SHI-164)·내 프로필(SHI-165)
4. [ ] `MOCK_LOGGED_IN` 원복 시점 정하기
5. [ ] 남은 docs 정리 범위 정하기
6. [ ] 백엔드 확인: 카카오 사진이 없을 때 서버 기본 이미지(`default-profile.png`)를 넣으면 기본 아바타(사람 모양) 대신 그 이미지가 보인다 — 기본 이미지일 때 `profileImageUrl`을 비울지 (2026-11-07 아바타 통일 결정)

## 열린 질문
- 커밋 전 리뷰 알림 hook을 넣을지 (막기 / 알리기만)
- docs 정리: 팀 모두 기획서(정의서 v0.3·화면 명세 MVP)를 알고 있음 → USER_FLOW는 기획서 원문을 옮기지 않고 위치·버전만 참조, 기획서와 다른 점·팀 결정·구현 규칙·미정 질문만 남긴다(2026-11-03). DESIGN은 화면 묘사를 시안 경로로, 수치는 토큰으로. 결정 이력은 `docs/DECISIONS.md`로 따로 둔다(2026-11-03). DESIGN 공통 컴포넌트는 `docs/COMPONENTS.md`(목록)로 분리 예정. SHI-152 커밋은 보류(사용자, 2026-11-03)
