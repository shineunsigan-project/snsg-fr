---
name: pr
description: 사용자가 커밋·push·PR을 요청했을 때 커밋을 나누고, Linear 번호가 붙은 PR을 만든다.
---

# 커밋 · PR

사용자가 요청할 때만 한다. `main`·`develop`에 직접 커밋하지 않는다.

커밋·PR 본문은 `.claude/rules/writing-ko.md`(한국어 글쓰기)를 따른다.
- PR 본문과 Linear 이슈 본문은 `writing-ko.md`의 짧은 명사형 요약으로 쓴다. 문장형 줄글로 길게 쓰지 않는다.
- 본문을 쓰면 항상 `humanize-korean` 스킬을 "가볍게"(`light`, 1회 호출)로 한 번 돌린다. `--strict`·정밀 모드는 쓰지 않는다.
- 본문 문장 전체를 넘기되 코드 블록·표·식별자(`SHI-<번호>`, 파일명)는 뺀다. 문단만 따로 넘기면 앞뒤 맥락이 사라져 더 어색해질 수 있다.
- 윤문 뒤에는 숫자, 파일명, 이슈 번호, 결정 날짜가 그대로인지 확인한다.

1. **확인:** `git status`로 범위를 본다. 커밋하지 않는 파일(`.claude/rules/git-workflow.md` 목록)이 섞이지 않았는지, 작업과 관계없는 변경(설정·무시 목록)은 별도 커밋으로 나눈다.
2. **리뷰:** 작업 지시서 "리뷰"에 최신 리뷰 결과가 없으면 code-reviewer부터 돌린다. `verify` 스킬 검사가 통과했는지 확인한다.
3. **커밋 메시지:** `CONTRIBUTING.md` 형식(`feat: …`, `fix: …`, `docs: …`). 본문에 무엇을 왜 바꿨는지, 끝에 `Ref SHI-<번호>` 또는 `Fixes SHI-<번호>`.
4. **PR:** base는 `develop`.
   - 제목: `[SHI-<번호>] <커밋 제목 형식>`
   - 본문: 작업 내용 / 결정(무엇을 왜 정했는지, 날짜) / 임시 계약(`TODO(API)`) 목록 / 확인(실행한 검사·화면 크기·못 본 것) / 남은 결정 / 대조한 snsg-be api-guide 커밋 / 끝에 `Fixes SHI-<번호>`
   - Linear 이슈 본문은 개요·범위·범위 밖만 둔다(`.claude/rules/git-workflow.md`). 결정·임시 계약·확인은 이슈에 옮기지 않고 이 PR 본문에만 쓴다.
   - `gh pr create --base develop --title … --body-file …`
5. **확인:** `linear issue view SHI-<번호>`에 PR이 첨부됐는지 본다.
6. **마무리:** `docs/HANDOFF.md`, `docs/PLAN.md`를 갱신한다.
