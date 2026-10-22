import axios, { isAxiosError, type InternalAxiosRequestConfig } from "axios";

import { saveLoginRedirect } from "../kakaoLogin";
import { getAccessToken, setAccessToken } from "./accessToken";

/** 성공 응답 봉투 (TECH_STACK §6) */
export type ApiSuccess<T> = { isSuccess: true; data: T };
/** 실패 응답 봉투. 화면 분기는 code로 한다. message는 바뀔 수 있어 분기에 쓰지 않는다 */
export type ApiFailure = { isSuccess: false; code: string; message: string };

/** 로그인·가입·재발급 응답 */
export type TokenResponse = { accessToken: string };

/** 재발급 API. refresh token 쿠키(Path=/api/v1/auth)로 새 access token을 받는다 */
const TOKENS_PATH = "/api/v1/auth/tokens";

// 모든 API 요청은 이 클라이언트를 거친다 (TECH_STACK §3.6, §3.7)
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  // refresh·가입 토큰이 HttpOnly 쿠키로 오가므로 쿠키를 함께 보낸다
  withCredentials: true,
});

/** 실패 응답의 code. 봉투가 아닌 응답(네트워크 오류 등)이면 undefined */
export function getApiErrorCode(error: unknown) {
  if (!isAxiosError<Partial<ApiFailure>>(error)) return undefined;
  const code = error.response?.data?.code;
  return typeof code === "string" ? code : undefined;
}

let refreshRequest: Promise<string | null> | null = null;

/**
 * access token 재발급. 성공하면 메모리에 저장하고 토큰을, 401이면 토큰을 지우고 null을 돌려준다
 * 재발급하면 이전 refresh token이 바로 무효가 되므로 요청은 한 번에 하나만 보낸다.
 * 진행 중이면 같은 요청의 결과를 기다린다
 */
export function refreshAccessToken() {
  refreshRequest ??= apiClient
    .post<ApiSuccess<TokenResponse>>(TOKENS_PATH)
    .then(
      ({ data }) => {
        setAccessToken(data.data.accessToken);
        return data.data.accessToken;
      },
      (error: unknown) => {
        if (isAxiosError(error) && error.response?.status === 401) {
          setAccessToken(null);
          return null;
        }
        throw error;
      },
    )
    .finally(() => {
      refreshRequest = null;
    });
  return refreshRequest;
}

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 재발급 후 이미 한 번 다시 보낸 요청. 다시 401이면 재발급하지 않는다
const retriedRequests = new WeakSet<InternalAxiosRequestConfig>();

// access token이 만료되면(401 UNAUTHENTICATED) 재발급 후 원래 요청을 한 번 다시 보낸다
// 가입 토큰 만료 등 다른 401은 화면에서 code로 처리한다
apiClient.interceptors.response.use(undefined, async (error: unknown) => {
  const config = isAxiosError(error) ? error.config : undefined;
  if (
    !config ||
    config.url === TOKENS_PATH ||
    retriedRequests.has(config) ||
    getApiErrorCode(error) !== "UNAUTHENTICATED"
  ) {
    throw error;
  }

  retriedRequests.add(config);
  const token = await refreshAccessToken();
  if (!token) {
    // refresh도 만료·무효(INVALID_REFRESH_TOKEN): 탈퇴했거나 다른 기기에서 로그인한 경우다. 지금 화면으로 돌아오게 로그인 화면으로 보낸다
    const { pathname, search } = window.location;
    saveLoginRedirect(pathname + search);
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- 컴포넌트 밖(인터셉터)이라 라우터를 쓸 수 없다
    window.location.assign("/login");
    throw error;
  }
  return apiClient(config);
});
