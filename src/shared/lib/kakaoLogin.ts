import { syncLoginHint } from "./loginHint";

// 서버가 카카오 인증을 처리하고 프론트의 /auth/callback으로 돌려보낸다. 앱 키는 서버만 가진다 (USER_FLOW §4.2)
const KAKAO_AUTHORIZE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL ?? ""}/api/v1/auth/kakao/authorize`;

// 로그인 후 돌아갈 화면. 서버가 고정 주소(/auth/callback)로 돌려보내므로 URL 대신 탭 단위 저장소에 둔다 (USER_FLOW §4.3)
const LOGIN_REDIRECT_KEY = "loginRedirect";

/** 로그인 후 돌아갈 화면을 저장한다. 로그인이 필요해진 곳(로그인 필요 모달, 재발급 실패)에서 부른다 */
export function saveLoginRedirect(path: string) {
  sessionStorage.setItem(LOGIN_REDIRECT_KEY, path);
  // 로그인 화면으로 보내기 직전이라 이 기기는 비로그인이다. 로그인 복구가 네트워크 오류·5xx로 실패해
  // 예전 표시용 쿠키가 남아 있으면 앱 서버가 로그인 화면 대신 홈으로 돌려보내므로 여기서 지운다 (SHI-186)
  syncLoginHint(false);
}

/**
 * 사이트 안의 경로만 쓴다 (open redirect 방지).
 * `//host`와 `/\host`는 브라우저가 다른 사이트 주소로 읽으므로 막는다
 */
const SAME_SITE_PATH = /^\/(?![/\\])/;

/** 저장한 돌아갈 화면. 없거나 사이트 밖 주소면 홈 */
export function getLoginRedirect() {
  const path = sessionStorage.getItem(LOGIN_REDIRECT_KEY);
  return path && SAME_SITE_PATH.test(path) ? path : "/";
}

// 인증 페이지로 넘어가는 중에 버튼을 다시 눌러도 한 번만 이동한다 (기능 요구사항 정의서 v0.3)
let isStartingKakaoLogin = false;
if (typeof window !== "undefined") {
  // 카카오 화면에서 뒤로가기로 돌아오면(bfcache) 다시 누를 수 있게 한다
  window.addEventListener("pageshow", () => {
    isStartingKakaoLogin = false;
  });
}

/**
 * 카카오 로그인 시작 — 서버의 카카오 인증 주소로 이동한다
 * replaceHistory: 로그인 화면에서 시작하면 방문 기록의 로그인 화면을 카카오 이동으로 바꾼다.
 * 로그인 뒤 뒤로·앞으로 가기에서 로그인 화면이 끼어들지 않게 한다 (USER_FLOW §4.2, SHI-186).
 * 다른 화면(로그인 필요 모달)에서 시작하면 그 화면이 기록에 남아야 하므로 바꾸지 않는다
 */
export function startKakaoLogin({ replaceHistory = false } = {}) {
  if (isStartingKakaoLogin) return;
  isStartingKakaoLogin = true;
  // 서버(외부 출처)로 가는 페이지 이동이라 Next.js 라우터를 쓰지 않는다
  if (replaceHistory) {
    window.location.replace(KAKAO_AUTHORIZE_URL);
    return;
  }
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- 주소는 API 서버(NEXT_PUBLIC_API_BASE_URL)다
  window.location.assign(KAKAO_AUTHORIZE_URL);
}
