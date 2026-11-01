// 네이버 지도 JavaScript API v3 중 이 앱이 쓰는 부분만 선언한다 (공식 타입 패키지를 설치하지 않는다)

declare global {
  interface Window {
    /** 키 인증이 실패하면 지도 스크립트가 부르는 전역 함수 */
    navermap_authFailure?: () => void;
    /** 키 인증이 실패하면 지도 스크립트가 `naver.maps`를 null로 바꾼다. 정리 코드에서 확인한다 */
    naver?: { maps: unknown };
  }

  namespace naver.maps {
    class LatLng {
      constructor(lat: number, lng: number);
    }

    class LatLngBounds {
      constructor(sw: LatLng, ne: LatLng);
      extend(latlng: LatLng): LatLngBounds;
    }

    class Point {
      constructor(x: number, y: number);
      x: number;
      y: number;
    }

    /** 좌표 ↔ 현재 확대 수준의 픽셀 위치 변환 */
    interface MapSystemProjection {
      fromCoordToOffset(coord: LatLng): Point;
      fromOffsetToCoord(offset: Point): LatLng;
    }

    const Position: { readonly RIGHT_CENTER: number };
    const ZoomControlStyle: { readonly SMALL: number };

    type Margin = { top: number; right: number; bottom: number; left: number };

    interface MapOptions {
      center?: LatLng;
      zoom?: number;
      zoomControl?: boolean;
      zoomControlOptions?: { position?: number; style?: number };
      scaleControl?: boolean;
      logoControl?: boolean;
      mapDataControl?: boolean;
    }

    class Map {
      constructor(element: HTMLElement, options?: MapOptions);
      setZoom(zoom: number): void;
      fitBounds(bounds: LatLngBounds, margin?: Margin): void;
      panTo(center: LatLng): void;
      getProjection(): MapSystemProjection;
      destroy(): void;
    }

    interface HtmlIcon {
      content: string;
      anchor?: Point;
    }

    interface MarkerOptions {
      position: LatLng;
      map?: Map;
      icon?: HtmlIcon;
      title?: string;
      zIndex?: number;
    }

    class Marker {
      constructor(options: MarkerOptions);
      setMap(map: Map | null): void;
      setIcon(icon: HtmlIcon): void;
      setZIndex(zIndex: number): void;
    }

    type MapEventListener = { readonly __brand: "MapEventListener" };

    namespace Event {
      function addListener(
        target: Marker | Map,
        eventName: string,
        listener: () => void,
      ): MapEventListener;
      function removeListener(listener: MapEventListener): void;
    }
  }
}

export {};
