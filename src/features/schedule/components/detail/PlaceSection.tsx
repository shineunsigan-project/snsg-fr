"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

import {
  isMapsAvailable,
  useNaverMapsScript,
} from "../../hooks/useNaverMapsScript";
import { PIN_PATH } from "../create/PlaceMap";

/** 장소 하나를 보여줄 때의 확대 수준 (CRT-02와 같다) */
const PLACE_ZOOM = 16;

type PlaceSectionProps = {
  name: string;
  /** 도로명 주소(+ 상세주소) */
  address: string;
  latitude: number;
  longitude: number;
  /** `주소 복사` */
  onCopyAddress: () => void;
};

/**
 * 장소: `장소` 제목, 네이버 지도(저장된 좌표에 핀 하나), 장소명·주소, `주소 복사` (시안 DTL-02).
 * 명단을 펼친 화면(DTL-06·HOST-02) 시안에는 장소명이 빠졌지만 DTL-02처럼 장소명 + 주소를 보여준다 (지시서 결정).
 * 외부 장소 API는 다시 부르지 않는다
 */
export function PlaceSection({
  name,
  address,
  latitude,
  longitude,
  onCopyAddress,
}: PlaceSectionProps) {
  return (
    <section className="flex flex-col px-5 pt-5 pb-8">
      <h2 className="text-base font-bold">장소</h2>
      <PlacePinMap name={name} latitude={latitude} longitude={longitude} />
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="truncate text-base font-bold">{name}</p>
          <p className="text-sm break-keep text-muted-foreground">{address}</p>
        </div>
        {/* 보이는 버튼은 작은 외곽선 버튼, 누르는 영역은 44px. 위쪽을 장소명 줄에 맞춘다 */}
        <button
          type="button"
          onClick={onCopyAddress}
          className="group -mt-2 flex min-h-11 shrink-0 items-center outline-none"
        >
          <span className="rounded-lg border border-input px-3 py-1.5 text-sm font-medium group-focus-visible:ring-3 group-focus-visible:ring-ring/50 group-active:bg-secondary">
            주소 복사
          </span>
        </button>
      </div>
    </section>
  );
}

// 녹색으로 채운 물방울 핀 + 가운데 흰 점 (시안 DTL-02). 32×40, 아래 꼭짓점이 장소 위치다
function placePinIcon(): naver.maps.HtmlIcon {
  return {
    content: `<div class="h-10 w-8"><svg viewBox="0 0 32 40" class="size-full fill-brand stroke-brand drop-shadow-sm" stroke-width="2"><path d="${PIN_PATH}"/><circle cx="16" cy="15.5" r="5" class="fill-card stroke-none"/></svg></div>`,
    anchor: new naver.maps.Point(16, 40),
  };
}

function PlacePinMap({
  name,
  latitude,
  longitude,
}: Pick<PlaceSectionProps, "name" | "latitude" | "longitude">) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isReady, hasFailed, scriptProps } = useNaverMapsScript();

  useEffect(() => {
    if (!isReady || hasFailed || !containerRef.current) return;
    if (!isMapsAvailable()) return;
    const position = new naver.maps.LatLng(latitude, longitude);
    const map = new naver.maps.Map(containerRef.current, {
      center: position,
      zoom: PLACE_ZOOM,
      scaleControl: false,
      mapDataControl: false,
    });
    const marker = new naver.maps.Marker({
      map,
      position,
      title: name,
      icon: placePinIcon(),
    });
    return () => {
      if (!isMapsAvailable()) return;
      marker.setMap(null);
      map.destroy();
    };
  }, [isReady, hasFailed, name, latitude, longitude]);

  return (
    <div className="relative isolate mt-3 aspect-place-map overflow-hidden rounded-2xl border border-border bg-secondary">
      {scriptProps && <Script {...scriptProps} />}
      {hasFailed ? (
        // TODO(D-5): 지도 실패 표시 디자인 없음. CRT-02와 같은 텍스트만 둔다
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
