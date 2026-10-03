import axios from "axios";

// 모든 API 요청은 이 클라이언트를 거친다 (TECH_STACK §3.6, §3.7)
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

// TODO(T-7): 백엔드 인증 방식(쿠키 / Bearer 토큰)이 정해지면 인증 정보 부착과 401 처리를 추가한다
// TODO(API): 에러 응답 형식이 정해지면 에러 형식 통일을 추가한다
