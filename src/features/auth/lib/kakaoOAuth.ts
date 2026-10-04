const KAKAO_AUTHORIZE_URL = "https://kauth.kakao.com/oauth/authorize";

/**
 * 카카오 인증 페이지 주소. 로그인 후 돌아올 화면은 OAuth state에 담는다 (USER_FLOW §4.3)
 * 동의항목은 Kakao Developers 콘솔 설정을 따르므로 scope는 보내지 않는다
 */
export function getKakaoAuthorizeUrl(redirectPath: string) {
  const clientId = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY;
  const redirectUri = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    throw new Error(
      "NEXT_PUBLIC_KAKAO_REST_API_KEY, NEXT_PUBLIC_KAKAO_REDIRECT_URI를 .env.local에 설정해야 합니다",
    );
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state: redirectPath,
  });
  return `${KAKAO_AUTHORIZE_URL}?${params}`;
}

/** 사이트 안의 경로만 돌아갈 곳으로 쓴다. 외부 주소는 홈으로 바꾼다 (open redirect 방지) */
export function toSafeRedirectPath(path: string | null) {
  return path?.startsWith("/") && !path.startsWith("//") ? path : "/";
}
