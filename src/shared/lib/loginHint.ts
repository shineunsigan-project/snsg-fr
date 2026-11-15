// 로그인 표시용 쿠키. 앱 서버(src/proxy.ts)가 화면을 그리기 전에 로그인 여부를 알 수 있게 앱 주소에 둔다 (SHI-186)
// 로그인 쿠키(refresh token)는 API 서버 주소에만 있어 앱 서버가 볼 수 없기 때문이다.
// 표시용이라 인증에는 쓰지 않는다. 실제 인증은 access token으로 한다

/** 쿠키 이름. proxy.ts와 함께 쓴다 */
export const LOGIN_HINT_COOKIE = "snsg_logged_in";

// refresh token 유효 기간(14일, TECH_STACK §6)과 같게 둔다. 재발급할 때마다 다시 늘어난다
const LOGIN_HINT_MAX_AGE_SECONDS = 14 * 24 * 60 * 60;

/** access token을 저장·삭제할 때 함께 부른다. 로그인이면 쿠키를 두고, 아니면 지운다 */
export function syncLoginHint(isLoggedIn: boolean) {
  if (typeof document === "undefined") return;
  // Safari는 http://localhost에서 Secure 쿠키를 저장하지 않으므로 https일 때만 붙인다
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  const value = isLoggedIn
    ? `1; Max-Age=${LOGIN_HINT_MAX_AGE_SECONDS}`
    : "; Max-Age=0";
  document.cookie = `${LOGIN_HINT_COOKIE}=${value}; Path=/; SameSite=Lax${secure}`;
}
