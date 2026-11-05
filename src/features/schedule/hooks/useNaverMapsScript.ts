import { useEffect, useState } from "react";

const NAVER_MAP_CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID;
// NCP 신규 Maps 키는 `ncpKeyId`로 넘긴다. 웹 서비스 URL에 등록한 주소에서만 인증된다
const NAVER_MAP_SCRIPT_URL = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${NAVER_MAP_CLIENT_ID ?? ""}`;

/** 키 인증이 실패하면 지도 스크립트가 naver.maps를 null로 바꾼다. 그 뒤로는 지도 API를 부르지 않는다 */
export const isMapsAvailable = () => Boolean(window.naver?.maps);

/**
 * 네이버 지도 스크립트 로딩 상태 (CRT-02 장소 지도, DTL-02 상세 지도).
 * 돌려준 scriptProps를 next/script `<Script>`에 그대로 넘긴다. 키가 없으면 scriptProps는 null이고 바로 실패다
 */
export function useNaverMapsScript() {
  const [isReady, setIsReady] = useState(false);
  const [hasFailed, setHasFailed] = useState(!NAVER_MAP_CLIENT_ID);

  // 키 인증 실패는 스크립트 로드 성공 뒤 전역 함수로만 알려 준다
  useEffect(() => {
    window.navermap_authFailure = () => setHasFailed(true);
    return () => {
      window.navermap_authFailure = undefined;
    };
  }, []);

  const scriptProps = NAVER_MAP_CLIENT_ID
    ? {
        src: NAVER_MAP_SCRIPT_URL,
        strategy: "afterInteractive" as const,
        onReady: () =>
          isMapsAvailable() ? setIsReady(true) : setHasFailed(true),
        onError: () => setHasFailed(true),
      }
    : null;

  return { isReady, hasFailed, scriptProps };
}
