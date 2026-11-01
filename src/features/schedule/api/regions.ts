import { apiClient, type ApiSuccess } from "@/shared/lib/api/client";

/** 서비스 중인 지역(시군구) */
export type Region = {
  /** 시군구 코드 5자리 문자열. 숫자로 바꾸지 않는다 */
  code: string;
  /** 시군구 이름 (시도 이름은 붙지 않는다) */
  name: string;
};

/** 지역 목록 — 서버가 정한 노출 순서 그대로 쓴다. 인증이 필요 없다 */
export async function getRegions() {
  const { data } = await apiClient.get<ApiSuccess<Region[]>>("/api/v1/regions");
  return data.data;
}
