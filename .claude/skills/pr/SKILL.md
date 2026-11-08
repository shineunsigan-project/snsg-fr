---
name: pr
description: 사용자가 커밋·push·PR을 요청했을 때 커밋을 나누고, Linear 번호가 붙은 PR을 만든다.
---

# 커밋 · PR

사용자가 요청할 때만 한다. `main`·`develop`에 직접 커밋하지 않는다.

1. **확인:** `git status`로 범위를 본다. 커밋하지 않는 파일(`.claude/rules/git-workflow.md` 목록)이 섞이지 않았는지, 작업과 관계없는 변경(설정·무시 목록)은 별도 커밋으로 나눈다.
2. **리뷰:** 작업 지시서 "리뷰"에 최신 리뷰 결과가 없으면 code-reviewer부터 돌린다. `verify` 스킬 검사가 통과했는지 확인한다.
3. **커밋 메시지:** `CONTRIBUTING.md` 형식(`feat: …`, `fix: …`, `docs: …`). 본문에 무엇을 왜 바꿨는지, 끝에 `Ref SHI-<번호>` 또는 `Fixes SHI-<번호>`.
4. **PR:** base는 `develop`.
   - 제목: `[SHI-<번호>] <커밋 제목 형식>`
   - 본문: 작업 내용 / 임시 계약(`TODO(API)`) 목록 / 확인(실행한 검사·화면 크기·못 본 것) / 남은 결정 / 대조한 snsg-be api-guide 커밋 / 끝에 `Fixes SHI-<번호>`
   - `gh pr create --base develop --title … --body-file …`
5. **확인:** `linear issue view SHI-<번호>`에 PR이 첨부됐는지 본다.
6. **마무리:** `docs/HANDOFF.md`, `docs/PLAN.md`를 갱신한다.
