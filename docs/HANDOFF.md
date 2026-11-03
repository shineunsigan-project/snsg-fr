# 인계

하루를 시작하면 이 문서부터 읽는다. 작업을 멈출 때 "지금 상태"와 "다음에 할 일"을 고친다.

마지막 갱신: 2026-11-03

## 지금 상태
- 브랜치 `feature/SHI-152-schedule-list` (SHI-151 위). **커밋 전 변경이 많다**: 일정 목록 구현 + 리뷰 반영 + 문서·규칙 정리.
- PR #10(SHI-151 일정 개설) 열림. PR #9(SHI-150)는 develop에 머지됨.
- 개발 서버: `localhost:3001`에 MSW 켜고 실행 중(`NEXT_PUBLIC_API_MOCKING=enabled pnpm exec next dev -p 3001`). mock은 로그인 상태로 시작(`src/mocks/handlers.ts` `MOCK_LOGGED_IN = true`).
- 검사: tsc·lint·format·build-storybook 통과, e2e 16개 통과 (2026-11-03).

## 다음에 할 일
1. [ ] 커밋 나누기 (사용자 요청 시): ① SHI-152 일정 목록 ② 문서·규칙 정리(AGENTS 최소화, `.claude/rules`·`skills`·`tasks`, `.gitignore`, docs/HANDOFF·PLAN·DEPLOY_LOG). ②는 별도 이슈·PR 권장
2. [ ] SHI-152 PR (#10 머지 후 develop 기준으로 맞추기)
3. [ ] 백엔드에 임시 계약 전달: 목록 API(경로·필터·`startTime` 경계·cursor 방식·`status`·401 code·`isNew`), 일정 생성·개설 완료 조회, 활동 목록
4. [ ] `MOCK_LOGGED_IN` 원복 시점 정하기
5. [ ] 남은 docs 정리(USER_FLOW·DESIGN·TECH_STACK 결정 이력 분리 등) 범위 정하기

## 사용자 확인 목록 (SHI-152)
개발 서버 `localhost:3001`에서 확인하고 `[x]`.
- [ ] 홈 탭 3개 전환: 주소가 `/`, `/?tab=joined`, `/?tab=created`로 바뀌고 카드 표시가 탭마다 다른지 (참여 확정·D-DAY / 모집 중·NEW)
- [ ] `[더 보기]`: 모집 중 탭 맨 아래에서 눌러 20개 뒤가 붙는지
- [ ] 필터: `활동 ▾`·`지역 ▾`(맨 위 `전체`)·`날짜 ▾`(기간, 같은 날 두 번 = 하루, `시작 시각 설정` 켜기) → `적용하기` 후 칩 이름과 목록이 바뀌는지
- [ ] 일정 개설 후 `개설한 일정` 탭으로 와서 팝업과 NEW 카드(녹색 테두리)가 보이는지
- [ ] 헤더 `로그아웃` 후 참여한·개설한 탭에 안내와 `로그인 후 사용 가능합니다` 버튼이 보이는지

## 열린 질문
- 커밋 전 리뷰 알림 hook을 넣을지 (막기 / 알리기만)
- docs 정리: 팀 모두 기획서(정의서 v0.3·화면 명세 MVP)를 알고 있음 → USER_FLOW는 기획서 원문을 옮기지 않고 위치·버전만 참조, 기획서와 다른 점·팀 결정·구현 규칙·미정 질문만 남긴다(2026-11-03). DESIGN은 화면 묘사를 시안 경로로, 수치는 토큰으로. 결정 이력은 `docs/DECISIONS.md`로 따로 둔다(2026-11-03). DESIGN 공통 컴포넌트는 `docs/COMPONENTS.md`(목록)로 분리 예정. SHI-152 커밋은 보류(사용자, 2026-11-03)
