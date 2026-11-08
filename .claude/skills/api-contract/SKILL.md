---
name: api-contract
description: 백엔드 저장소 snsg-be의 api-guide·openapi가 최신인지 확인하고, 바뀐 부분을 프론트 코드와 대조한다. API 함수·MSW·로그인·가입처럼 서버와 주고받는 코드를 만들거나 고치기 전에 쓴다.
---

# API 계약 확인

백엔드 작업 폴더는 checkout하지 않는다. fetch와 읽기만 한다. 기본 위치는 `../snsg-be`.

1. 최신 받기와 변경 이력
   ```
   git -C ../snsg-be fetch -q origin
   git -C ../snsg-be log -5 --date=short --format='%h %ad %s' origin/develop -- docs/api-guide.md docs/openapi.yaml
   ```
2. 본문 읽기 (필요한 절만)
   ```
   git -C ../snsg-be show origin/develop:docs/api-guide.md
   git -C ../snsg-be show origin/develop:docs/openapi.yaml
   ```
3. 마지막으로 맞춘 커밋(작업 지시서·PR에 적힌 값) 이후 바뀐 부분만 보기
   ```
   git -C ../snsg-be diff <커밋>..origin/develop -- docs/api-guide.md docs/openapi.yaml
   ```
4. develop에 아직 없는 변경: 기능 브랜치를 찾는다.
   ```
   git -C ../snsg-be branch -r --sort=-committerdate | head
   git -C ../snsg-be log --oneline origin/develop..origin/<브랜치> -- docs/api-guide.md
   ```
   그 브랜치 기준으로 맞출 때는 작업 요약·PR에 "SHI-<번호> 브랜치 기준"이라고 적는다.
5. 대조: 경로, 요청·응답 필드, 에러 code, 검증 규칙과 문구를 `src/**/api/`, `src/mocks/handlers.ts`, 스키마와 비교한다. 다른 점은 표로 보고하고, 정하지 않은 것은 물어볼 목록으로.
6. 대조한 커밋(예: `snsg-be develop ee02813`)을 작업 지시서와 PR에 적는다.
