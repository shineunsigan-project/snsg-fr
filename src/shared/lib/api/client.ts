import axios from "axios";

/** 로그인 토큰을 보관하는 localStorage 키 (기존 프로젝트와 같다) */
export const TOKEN_STORAGE_KEY = "token";

// 모든 API 요청은 이 클라이언트를 거친다 (TECH_STACK §3.6, §3.7)
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

// 로그인 토큰이 있으면 요청마다 Bearer 토큰으로 붙인다 (기존 백엔드 방식, TECH_STACK T-7)
apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// TODO(T-7): 401 처리와 refreshToken 재발급은 백엔드 계약이 정해지면 추가한다
// TODO(API): 에러 응답 형식이 정해지면 에러 형식 통일을 추가한다
