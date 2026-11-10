# Git · Linear · PR

- 브랜치·커밋 메시지·PR 규칙은 `CONTRIBUTING.md`를 따른다. Linear 규칙은 snsg-be `docs/linear-convention.md`.
- **커밋, push, PR은 사용자가 요청할 때만 한다.** `main`·`develop`에 직접 커밋하지 않는다.
- 작업 전 Linear 이슈를 만들고 In Progress로 바꾼다. 브랜치는 `feature/SHI-<번호>-<작업-이름>`.
- **이슈 본문은 BE와 같은 세 절만 쓴다**: `## 개요`(왜 하는지 한두 문장, 화면 ID) · `## 범위`(무엇을 바꾸는지) · `## 범위 밖`(넘긴 일이 있을 때만). 웹에서는 SHI 팀 템플릿 `FE 작업`(라벨 FE, 프로젝트 `쉬는시간 MVP`), CLI는 `linear issue create --team SHI --project "쉬는시간 MVP" -l FE -t "<제목>" --description-file <본문.md>`. 결정·임시 계약·확인 등은 이슈에 적지 않고 PR 본문에 남긴다(사용자 결정 2026-11-10).
- PR 제목은 `[SHI-<번호>] <커밋 규칙 제목>`, 본문 끝에 `Fixes SHI-<번호>`. 절차는 `pr` 스킬.
- 커밋 전 `code-reviewer`(또는 리뷰) 결과를 작업 지시서 "리뷰" 절에 남긴다.
- 결정이 나서 문서와 코드가 달라지면 같은 작업에서 문서도 고친다. 요청 범위 밖이면 먼저 알린다.
- 커밋하지 않는 것: `.env*`(`.env.example` 제외), 옵시디언 폴더(`snsg-fr-secondbrain/`), `.claude/agents/`, `.claude/settings.local.json`, 작업 중 만든 임시 파일.
- 작업 범위와 관계없는 변경(설정·무시 목록 등)은 별도 커밋으로 나눈다.
