@AGENTS.md

## Claude Code
- `.claude/rules/`는 해당 경로의 파일을 다룰 때 자동으로 읽힌다(`paths` 없는 파일은 항상). `.claude/skills/`는 절차가 필요할 때 불러 쓴다.
- 문서 관리: 새 컨벤션을 합의하면 해당 rules 파일에, 같은 작업 절차가 반복되면 skill로 옮긴다. 합의된 내용과 코드에서 확인한 사실만 적는다. AGENTS.md와 CLAUDE.md는 짧게 유지한다.
- 역할 에이전트 정의(`.claude/agents/`)는 개인 설정이라 git에 올리지 않는다. 없으면 `feature` 스킬 순서대로 메인 세션이 직접 진행한다.
- 아티팩트를 발행하면 같은 내용을 `obsidian-note` 스킬로 옵시디언(`snsg-fr-secondbrain/01_Projects/쉬는시간/`)에도 정리한다.
