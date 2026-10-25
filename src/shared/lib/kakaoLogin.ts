// 서버가 카카오 인증을 처리하고 프론트의 /auth/callback으로 돌려보낸다. 앱 키는 서버만 가진다 (USER_FLOW §4.2)
const KAKAO_AUTHORIZE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL ?? ""}/api/v1/auth/kakao/authorize`;

// 로그인 후 돌아갈 화면. 서버가 고정 주소(/auth/callback)로 돌려보내므로 URL 대신 탭 단위 저장소에 둔다 (USER_FLOW §4.3)
const LOGIN_REDIRECT_KEY = "loginRedirect";

/** 로그인 후 돌아갈 화면을 저장한다. 로그인이 필요해진 곳(로그인 필요 모달, 재발급 실패)에서 부른다 */
export function saveLoginRedirect(path: string) {
  sessionStorage.setItem(LOGIN_REDIRECT_KEY, path);
}

/** 저장한 돌아갈 화면. 없거나 사이트 밖 주소면 홈 */
export function getLoginRedirect() {
  const path = sessionStorage.getItem(LOGIN_REDIRECT_KEY);
  // 사이트 안의 경로만 쓴다 (open redirect 방지)
  return path?.startsWith("/") && !path.startsWith("//") ? path : "/";
}

// 인증 페이지로 넘어가는 중에 버튼을 다시 눌러도 한 번만 이동한다 (기능 요구사항 정의서 v0.3)
let isStartingKakaoLogin = false;
if (typeof window !== "undefined") {
  // 카카오 화면에서 뒤로가기로 돌아오면(bfcache) 다시 누를 수 있게 한다
  window.addEventListener("pageshow", () => {
    isStartingKakaoLogin = false;
  });
}

/** 카카오 로그인 시작 — 서버의 카카오 인증 주소로 이동한다 */
export function startKakaoLogin() {
  if (isStartingKakaoLogin) return;
  isStartingKakaoLogin = true;
  // 서버(외부 출처)로 가는 페이지 이동이라 Next.js 라우터를 쓰지 않는다
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- 주소는 API 서버(NEXT_PUBLIC_API_BASE_URL)다
  window.location.assign(KAKAO_AUTHORIZE_URL);
}
