import { NextResponse, type NextRequest } from "next/server";

import { LOGIN_HINT_COOKIE } from "@/shared/lib/loginHint";

/**
 * 로그인한 사람이 로그인 화면을 열면 화면을 그리기 전에 홈으로 보낸다 (USER_FLOW §4.2, SHI-186)
 * 앱 서버는 로그인 쿠키(API 서버 주소)를 볼 수 없어 표시용 쿠키로 판단한다.
 * 표시용 쿠키가 실제와 어긋나면(서버에서 세션 만료) 홈이 로그인 복구에 실패하면서 쿠키를 지운다
 */
export function proxy(request: NextRequest) {
  if (request.cookies.has(LOGIN_HINT_COOKIE)) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/login",
};
