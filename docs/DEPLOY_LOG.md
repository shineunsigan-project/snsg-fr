# 배포 기록

배포할 때마다 맨 위에 한 줄씩 추가한다. 배포하지 않은 것은 적지 않는다.

| 날짜 | 환경 | 브랜치·커밋 | 내용 | 확인 |
|---|---|---|---|---|
| — | — | — | 아직 배포 없음 | — |

## 현재 상태 (2026-11-03 확인)
- `main`에는 초기 설정 커밋만 있다(`6d59397`). 기능은 `develop`에 머지되고 있다.
- CI: GitHub Actions `.github/workflows/ci.yml`.
- 배포 환경(Vercel 등)과 주소는 아직 정해지지 않았다. 정해지면 아래를 채운다.

## 배포 전에 할 일
- 백엔드 CORS에 배포 주소 등록 요청 (지금 허용은 `localhost:3000`뿐).
- 네이버 지도(NCP) 웹 서비스 URL, 네이버 검색 API(개발자센터) 서비스 환경에 배포 주소 등록.
- 카카오 로그인 리다이렉트(`FRONTEND_REDIRECT_URI`)를 배포 주소로.
- 환경 변수: `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_API_MOCKING=disabled`, `NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID`, `NAVER_CLIENT_ID`·`NAVER_CLIENT_SECRET`(서버 전용).
- MSW mock 로그인(`MOCK_LOGGED_IN`) 원복 확인.
