"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

import type { Place } from "../../api/scheduleCreate";

const NAVER_MAP_CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID;
// NCP 신규 Maps 키는 `ncpKeyId`로 넘긴다. 웹 서비스 URL에 등록한 주소에서만 인증된다
const NAVER_MAP_SCRIPT_URL = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${NAVER_MAP_CLIENT_ID ?? ""}`;

// 장소가 하나뿐이거나 없을 때의 확대 수준과 기본 중심(마포구청 부근)
const SINGLE_PLACE_ZOOM = 16;
// 핀을 놓을 수 있는 영역의 여백(px). 위: 지역 칩(약 60) + 핀 높이와 여유 / 오른쪽: 확대·축소 버튼
const PIN_AREA_MARGIN = { top: 120, right: 56, bottom: 32, left: 32 };

/**
 * 확대 수준은 그대로 두고 장소를 핀 영역(칩 아래)의 가운데로 옮긴다.
 * 지도 가운데보다 (위 여백 − 아래 여백) / 2만큼 아래에 놓아 장소명이 칩에 가리지 않게 한다
 */
function panToPinArea(map: naver.maps.Map, latLng: naver.maps.LatLng) {
  const projection = map.getProjection();
  const offset = projection.fromCoordToOffset(latLng);
  const shiftY = (PIN_AREA_MARGIN.top - PIN_AREA_MARGIN.bottom) / 2;
  map.panTo(
    projection.fromOffsetToCoord(
      new naver.maps.Point(offset.x, offset.y - shiftY),
    ),
  );
}
const DEFAULT_CENTER = { latitude: 37.5663, longitude: 126.9019 };
const DEFAULT_ZOOM = 13;

/** 키 인증이 실패하면 지도 스크립트가 naver.maps를 null로 바꾼다. 그 뒤로는 지도 API를 부르지 않는다 */
const isMapsAvailable = () => Boolean(window.naver?.maps);

// 물방울 모양 번호 핀 (시안 CRT-02). viewBox 32×40, 아래 꼭짓점이 장소 위치다
const PIN_PATH =
  "M16 1C7.7 1 1 7.6 1 15.8c0 6 3.6 10.6 8.4 14.6L16 39l6.6-8.6C27.4 26.4 31 21.8 31 15.8 31 7.6 24.3 1 16 1z";

const escapeHtml = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ] ?? char,
  );

// 기본: 흰 바탕 + 녹색 테두리·번호. 선택: 크게, 녹색으로 채우고 위에 장소명을 띄운다
function pinIcon(
  number: number,
  selected: boolean,
  name: string,
): naver.maps.HtmlIcon {
  // 크기는 클래스와 anchor(px)에 같은 값을 쓴다: 기본 32×40, 선택 40×50
  const [width, height] = selected ? [40, 50] : [32, 40];
  const sizeClass = selected ? "h-12.5 w-10" : "h-10 w-8";
  const label = selected
    ? `<span class="absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 rounded-lg bg-brand px-3 py-1.5 text-sm font-bold whitespace-nowrap text-white shadow-toast">${escapeHtml(name)}</span>`
    : "";
  const pinClass = selected
    ? "fill-brand stroke-brand"
    : "fill-card stroke-brand";
  const numberClass = selected ? "text-base text-white" : "text-sm text-brand";
  return {
    content: `<div class="relative ${sizeClass}">${label}<svg viewBox="0 0 32 40" class="size-full drop-shadow-sm ${pinClass}" stroke-width="2"><path d="${PIN_PATH}"/></svg><span class="absolute inset-x-0 top-0 flex aspect-square items-center justify-center font-bold ${numberClass}">${number}</span></div>`,
    anchor: new naver.maps.Point(width / 2, height),
  };
}

type PlaceMapProps = {
  places: readonly Place[];
  selectedKey: string | undefined;
  onSelect: (place: Place) => void;
};

/** 네이버 지도 + 결과 핀 (CRT-02). 지도를 못 불러와도 목록으로 고를 수 있다 */
export function PlaceMap({ places, selectedKey, onSelect }: PlaceMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<naver.maps.Map>();
  const [isScriptReady, setIsScriptReady] = useState(false);
  const [hasFailed, setHasFailed] = useState(!NAVER_MAP_CLIENT_ID);
  const markersRef = useRef<Array<{ key: string; marker: naver.maps.Marker }>>(
    [],
  );
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  // 키 인증 실패는 스크립트 로드 성공 뒤 전역 함수로만 알려 준다
  useEffect(() => {
    window.navermap_authFailure = () => setHasFailed(true);
    return () => {
      window.navermap_authFailure = undefined;
    };
  }, []);

  useEffect(() => {
    // 인증 실패로 naver.maps가 사라졌으면 navermap_authFailure가 실패 표시를 맡는다
    if (!isScriptReady || hasFailed || !containerRef.current) return;
    if (!isMapsAvailable()) return;
    const instance = new naver.maps.Map(containerRef.current, {
      center: new naver.maps.LatLng(
        DEFAULT_CENTER.latitude,
        DEFAULT_CENTER.longitude,
      ),
      zoom: DEFAULT_ZOOM,
      // 확대·축소 버튼. 위는 지역 칩, 아래는 목록 시트가 덮으므로 오른쪽 가운데에 둔다
      zoomControl: true,
      zoomControlOptions: {
        position: naver.maps.Position.RIGHT_CENTER,
        style: naver.maps.ZoomControlStyle.SMALL,
      },
      scaleControl: false,
      mapDataControl: false,
    });
    setMap(instance);
    return () => {
      if (isMapsAvailable()) instance.destroy();
      setMap(undefined);
    };
  }, [isScriptReady, hasFailed]);

  // 결과가 바뀌면 핀을 다시 그리고 모든 핀이 보이게 맞춘다
  useEffect(() => {
    if (!map || !isMapsAvailable()) return;
    const listeners: naver.maps.MapEventListener[] = [];
    const markers = places.map((place, index) => {
      const marker = new naver.maps.Marker({
        map,
        position: new naver.maps.LatLng(place.latitude, place.longitude),
        title: place.name,
        icon: pinIcon(index + 1, false, place.name),
      });
      listeners.push(
        naver.maps.Event.addListener(marker, "click", () =>
          onSelectRef.current(place),
        ),
      );
      return { key: place.id, marker };
    });
    markersRef.current = markers;

    const [first, ...rest] = places;
    if (first && rest.length === 0) {
      const latLng = new naver.maps.LatLng(first.latitude, first.longitude);
      map.setZoom(SINGLE_PLACE_ZOOM);
      panToPinArea(map, latLng);
    } else if (first) {
      const firstLatLng = new naver.maps.LatLng(
        first.latitude,
        first.longitude,
      );
      const bounds = new naver.maps.LatLngBounds(firstLatLng, firstLatLng);
      for (const place of rest) {
        bounds.extend(new naver.maps.LatLng(place.latitude, place.longitude));
      }
      map.fitBounds(bounds, PIN_AREA_MARGIN);
    }

    return () => {
      markersRef.current = [];
      if (!isMapsAvailable()) return;
      listeners.forEach((listener) =>
        naver.maps.Event.removeListener(listener),
      );
      markers.forEach(({ marker }) => marker.setMap(null));
    };
  }, [map, places]);

  // 선택한 장소의 핀을 강조하고 지도 가운데로 옮긴다
  useEffect(() => {
    if (!map || !isMapsAvailable()) return;
    markersRef.current.forEach(({ key, marker }, index) => {
      const selected = key === selectedKey;
      marker.setIcon(pinIcon(index + 1, selected, places[index]?.name ?? ""));
      marker.setZIndex(selected ? 1 : 0);
    });
    const selected = places.find((place) => place.id === selectedKey);
    if (selected) {
      const latLng = new naver.maps.LatLng(
        selected.latitude,
        selected.longitude,
      );
      panToPinArea(map, latLng);
    }
  }, [map, places, selectedKey]);

  return (
    <div className="absolute inset-0 bg-secondary">
      {NAVER_MAP_CLIENT_ID && (
        <Script
          src={NAVER_MAP_SCRIPT_URL}
          strategy="afterInteractive"
          onReady={() =>
            isMapsAvailable() ? setIsScriptReady(true) : setHasFailed(true)
          }
          onError={() => setHasFailed(true)}
        />
      )}
      {hasFailed ? (
        // TODO(D-5): 지도 실패 표시 디자인 없음. 텍스트만 둔다
        <p
          role="status"
          className="flex size-full items-center justify-center px-5 text-sm text-muted-foreground"
        >
          지도를 불러오지 못했어요.
        </p>
      ) : (
        <div
          ref={containerRef}
          aria-label="장소 지도"
          role="region"
          className="size-full"
        />
      )}
    </div>
  );
}
