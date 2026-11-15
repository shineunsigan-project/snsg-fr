# 인계

하루를 시작하면 이 문서부터 읽는다. 작업을 멈출 때 "지금 상태"와 "다음에 할 일"을 고친다.

마지막 갱신: 2026-11-15

## 지금 상태
- 2026-11-15 **SHI-186 로그인 후 뒤로·앞으로 가기에서 로그인 화면이 끼어듦** — 브랜치 `feature/SHI-186-login-history`, 지시서 `.claude/tasks/SHI-186.md`, PR #20. 표시용 쿠키 + `src/proxy.ts`로 로그인 상태면 `/login`을 서버에서 홈으로, 로그인 화면 기록 바꿔치기, bfcache 복원 시 앱 전체 다시 받기.
- SHI-185(PR #19, 머지 2026-11-15): 로그인한 사람은 로그인 화면에서 내보내기, 네이버 버튼 숨김
- 배포: 프론트 `https://app.shineunsigan.com`(Vercel), API `https://api.shineunsigan.com`(ECS). 배포 서버의 카카오 콜백·CORS 설정 확인됨(2026-11-15)
- 브랜치 `feature/SHI-163-schedule-list-api`(메인 폴더, develop 561bf25 = SHI-160까지 머지). **SHI-163 일정 목록 실제 API 연결** — 지시서 `.claude/tasks/SHI-163.md`. 사용자 확인 끝, PR #16(2026-11-11)
- 백엔드 develop e746440에 목록·상세·참여·취소·내 프로필·탈퇴 API가 모두 생겼다. 일정 개설(SHI-162)·목록(SHI-163)은 실제 API, 상세·참여(SHI-164)는 실제 API(PR #17 머지), 내 정보·프로필 수정·탈퇴·닉네임 확인(SHI-165)은 실제 API로 바꿔 PR #18
- 로컬 실서버 확인: Redis 필요(`brew install redis` 설치됨, `redis-server /opt/homebrew/etc/redis.conf --daemonize yes`로 켬). `../snsg-be/snsg`에서 `sh ./gradlew bootRun`(8080), 프론트는 `.env.local`의 API 주소가 ngrok이라 `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080 pnpm dev`(3000)
- Linear 이슈 본문은 `FE 작업` 템플릿(개요·범위·범위 밖), 결정·임시 계약은 PR 본문에 (2026-11-10, `.claude/rules/git-workflow.md`)
- 흐름 아티팩트: 일정 목록 https://claude.ai/artifact/5bK2wjP6XaKdZWki6AdtzN · 일정 상세 https://claude.ai/artifact/58pkc7eCb9JBiWSQexvRMF · 내 정보 https://claude.ai/artifact/XG7dmDKoeu4ENYX62vuZPS (옵시디언 `01_Projects/쉬는시간/`에도 노트)
- 개발 서버: `localhost:3001` MSW 켜고 실행(`NEXT_PUBLIC_API_MOCKING=enabled pnpm exec next dev -p 3001`). mock은 로그인 상태로 시작(`MOCK_LOGGED_IN = true`).

## 다음에 할 일
0. [ ] SHI-186 PR #20 머지 → 배포 화면에서 홈 → 상세 → `로그인하고 참여하기` → 카카오 → 뒤로가기·앞으로 가기 확인(PC Chrome에서 앞으로 가기 때 검은 오버레이가 보였음, 실제 iPhone Safari 포함)
0. [ ] 보류(사용자 결정 2026-11-15, 추후 진행·논의): 조회 재시도 3→1, 방금 연 일정 녹색 테두리를 개설한 일정 탭에만, 취소 후 상세에 머무는 동작
1. [ ] SHI-165 PR #18 머지 → 이로써 MVP 화면의 실제 API 연결이 모두 끝난다. 결정은 `.claude/tasks/SHI-165.md`. 로컬 서버(Redis·백엔드·프론트)는 켜 둔 채 이어 간다
2. [ ] 작업 폴더 `../snsg-fr-151`·백업 브랜치(`backup/SHI-*`) 정리
3. [x] 실제 API 연결: 상세(SHI-164)·내 프로필(SHI-165, 진행 중)
4. [ ] `MOCK_LOGGED_IN` 원복 시점 정하기
5. [ ] 남은 docs 정리 범위 정하기
6. [ ] 백엔드 확인: 카카오 사진이 없을 때 서버 기본 이미지(`default-profile.png`)를 넣으면 기본 아바타(사람 모양) 대신 그 이미지가 보인다 — 기본 이미지일 때 `profileImageUrl`을 비울지 (2026-11-07 아바타 통일 결정)

## 열린 질문
- 커밋 전 리뷰 알림 hook을 넣을지 (막기 / 알리기만)
- docs 정리: 팀 모두 기획서(정의서 v0.3·화면 명세 MVP)를 알고 있음 → USER_FLOW는 기획서 원문을 옮기지 않고 위치·버전만 참조, 기획서와 다른 점·팀 결정·구현 규칙·미정 질문만 남긴다(2026-11-03). DESIGN은 화면 묘사를 시안 경로로, 수치는 토큰으로. 결정 이력은 `docs/DECISIONS.md`로 따로 둔다(2026-11-03). DESIGN 공통 컴포넌트는 `docs/COMPONENTS.md`(목록)로 분리 예정. SHI-152 커밋은 보류(사용자, 2026-11-03)
