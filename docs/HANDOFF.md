# 인계

하루를 시작하면 이 문서부터 읽는다. 작업을 멈출 때 "지금 상태"와 "다음에 할 일"을 고친다.

마지막 갱신: 2026-11-16

## 지금 상태
- 2026-11-16 **SHI-189 일정 목록 뱃지·상단 + SHI-188 불러오는 중 스켈레톤** — 한 PR #21(브랜치 `feature/SHI-188-skeleton`, 커밋 이슈별 2개). 지시서 `.claude/tasks/SHI-188.md`·`SHI-189.md`, 스켈레톤 범위·AC는 [`SKELETON_SPEC.md`](./SKELETON_SPEC.md). 스켈레톤은 자리·안내를 처음부터 두고 200ms 동안 투명(CSS), 준비·이동 중도 스켈레톤으로 통일(Q4). E2E 134개 통과. Q5(탭 전환 다시 받기)·Q6(상세 다시 받기 중 표시)은 지금 동작 유지로 결정(2026-11-16)
- 2026-11-15 **SHI-186 로그인 후 뒤로·앞으로 가기에서 로그인 화면이 끼어듦** — PR #20 머지됨(현재 기준 커밋 `18b2738`). 표시용 쿠키 + `src/proxy.ts`로 로그인 상태면 `/login`을 서버에서 홈으로, 로그인 화면 기록 바꿔치기, bfcache 복원 시 앱 전체 다시 받기. 배포 화면의 PC Chrome·iPhone Safari 확인은 남음.
- SHI-185(PR #19, 머지 2026-11-15): 로그인한 사람은 로그인 화면에서 내보내기, 네이버 버튼 숨김
- 배포: 프론트 `https://app.shineunsigan.com`(Vercel), API `https://api.shineunsigan.com`(ECS). 배포 서버의 카카오 콜백·CORS 설정 확인됨(2026-11-15)
- 브랜치 `feature/SHI-163-schedule-list-api`(메인 폴더, develop 561bf25 = SHI-160까지 머지). **SHI-163 일정 목록 실제 API 연결** — 지시서 `.claude/tasks/SHI-163.md`. 사용자 확인 끝, PR #16(2026-11-11)
- 백엔드 develop e746440에 목록·상세·참여·취소·내 프로필·탈퇴 API가 모두 생겼다. 일정 개설(SHI-162)·목록(SHI-163)은 실제 API, 상세·참여(SHI-164)는 실제 API(PR #17 머지), 내 정보·프로필 수정·탈퇴·닉네임 확인(SHI-165)은 실제 API로 바꿔 PR #18
- 로컬 개발 API (사용자 결정 2026-11-15): 평소 `pnpm dev`는 `.env.local`의 배포 API(`https://api.shineunsigan.com`)를 쓴다. 배포 API는 카카오 로그인 후 배포 화면으로 돌려보내므로 로컬에서는 비로그인 화면만 본다(로그인이 안 되므로 실제 데이터도 바뀌지 않는다). 로그인 흐름이 필요할 때만 로컬 백엔드를 켜고 `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080 pnpm dev`(3000)로 켠다. 로컬 백엔드: Redis(`redis-server /opt/homebrew/etc/redis.conf --daemonize yes`) → `../snsg-be/snsg`에서 `sh ./gradlew bootRun`(8080). 주소를 바꾸면 개발 서버를 다시 켠다(`NEXT_PUBLIC_` 값은 켤 때 고정)
- Linear 이슈 본문은 `FE 작업` 템플릿(개요·범위·범위 밖), 결정·임시 계약은 PR 본문에 (2026-11-10, `.claude/rules/git-workflow.md`)
- 흐름 아티팩트: 일정 목록 https://claude.ai/artifact/5bK2wjP6XaKdZWki6AdtzN · 일정 상세 https://claude.ai/artifact/58pkc7eCb9JBiWSQexvRMF · 내 정보 https://claude.ai/artifact/XG7dmDKoeu4ENYX62vuZPS (옵시디언 `01_Projects/쉬는시간/`에도 노트)
- MSW(가짜 API)는 배포 API가 생겨 개발 서버에서는 쓰지 않는다. Storybook(내 정보·프로필 수정)에서 쓰므로 코드는 유지한다(사용자 결정 2026-11-15). 켜려면 `NEXT_PUBLIC_API_MOCKING=enabled`

## 다음에 할 일
0. [ ] PR #21(SHI-189·SHI-188) 머지 → 배포 화면에서 목록 뱃지(모집 중 탭 N자리 남음·NEW)와 Slow 3G 스켈레톤·동작 줄이기·실제 iPhone Safari 확인
1. [ ] SHI-186 배포 화면에서 홈 → 상세 → `로그인하고 참여하기` → 카카오 → 뒤로가기·앞으로 가기 확인(PC Chrome에서 앞으로 가기 때 검은 오버레이가 보였음, 실제 iPhone Safari 포함)
2. [ ] SHI-165 PR #18 머지 → 이로써 MVP 화면의 실제 API 연결이 모두 끝난다. 결정은 `.claude/tasks/SHI-165.md`. 로컬 서버(Redis·백엔드·프론트)는 켜 둔 채 이어 간다
3. [ ] 작업 폴더 `../snsg-fr-151`·백업 브랜치(`backup/SHI-*`) 정리
4. [ ] `MOCK_LOGGED_IN` 원복 시점 정하기
5. [ ] 남은 docs 정리 범위 정하기
6. [ ] 백엔드 확인: 카카오 사진이 없을 때 서버 기본 이미지(`default-profile.png`)를 넣으면 기본 아바타(사람 모양) 대신 그 이미지가 보인다 — 기본 이미지일 때 `profileImageUrl`을 비울지 (2026-11-07 아바타 통일 결정)
7. [ ] 보류(사용자 결정 2026-11-15, 추후 진행·논의): 조회 재시도 3→1, 취소 후 상세에 머무는 동작

## 열린 질문
- 커밋 전 리뷰 알림 hook을 넣을지 (막기 / 알리기만)
- docs 정리: 팀 모두 기획서(정의서 v0.3·화면 명세 MVP)를 알고 있음 → USER_FLOW는 기획서 원문을 옮기지 않고 위치·버전만 참조, 기획서와 다른 점·팀 결정·구현 규칙·미정 질문만 남긴다(2026-11-03). DESIGN은 화면 묘사를 시안 경로로, 수치는 토큰으로. 결정 이력은 `docs/DECISIONS.md`로 따로 둔다(2026-11-03). DESIGN 공통 컴포넌트는 `docs/COMPONENTS.md`(목록)로 분리 예정. SHI-152 커밋은 보류(사용자, 2026-11-03)
