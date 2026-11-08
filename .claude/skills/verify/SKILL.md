---
name: verify
description: 작업 단계를 마칠 때 검사를 돌리고, 화면 크기별로 확인하고, 사용자가 직접 확인할 방법을 정리한다. 커밋 전에도 쓴다.
---

# 검증

## 검사 (순서대로, 실패하면 멈추고 보고)
```
pnpm exec tsc --noEmit        # 또는 pnpm typecheck
pnpm lint
pnpm exec prettier --check <바꾼 경로>   # 마무리 때는 pnpm format:check
pnpm build                    # 마무리 때 한 번
pnpm build-storybook          # shared/ui를 바꿨을 때
pnpm test:e2e                 # 흐름을 바꿨을 때
```

## 화면 확인 (UI를 바꿨을 때)
- 개발 서버(MSW 켬)에서 390×844, 375×667, 320px, 가로 화면을 본다. 넓은 화면은 최대 폭 가운데 정렬인지.
- 브라우저 크기 조절로 본 것과 실제 기기에서 본 것을 구분해서 보고한다. 실제 iPhone(Safari)·iPhone Duo에서 못 본 것은 "확인 안 함"으로 적는다.

## 사용자 확인 방법
작업 지시서 "단계"의 해당 줄에 적는다.
```
- [ ] 2. 필터 시트 — 확인: 홈 → `지역 ▾` → 마포구 → 적용하기 → 주소에 region=11440, 카드가 마포구만
```
사용자가 확인했다고 하면 `[x]`로 바꾼다.

## 보고
- 실행한 검사와 결과, 실행하지 못한 검사(이유)
- 바꾼 것 / 가정한 것 / 남긴 `TODO` ID / 문서와 다른 점
