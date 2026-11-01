"use client";

import { CheckIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import type { Place } from "../../api/scheduleCreate";
import { useActivities } from "../../hooks/useActivities";
import { usePlaces } from "../../hooks/usePlaces";
import { useRegions } from "../../hooks/useRegions";
import type {
  CreateScheduleInput,
  CreateScheduleValues,
} from "../../schemas/createScheduleSchema";
import { getPlaceKey, PlaceMap } from "./PlaceMap";
import { StepTitle } from "./StepTitle";
import { cn } from "@/shared/lib/utils";
import { BottomCta } from "@/shared/ui/BottomCta";
import { Button } from "@/shared/ui/button";
import { Drawer, DrawerContent, DrawerTitle } from "@/shared/ui/drawer";

/** URL `region` 값. 지역 코드이거나 `ALL`(`전체` 칩)이다 */
const ALL_REGIONS = "ALL";
/** 장소 선택 화면을 처음 열 때의 지역: 마포구 (USER_FLOW §7.7) */
const DEFAULT_REGION_CODE = "11440";
/** 목록 시트를 끌어올린 높이(화면 높이 비율). globals.css `--spacing-place-sheet-max`와 같은 값 */
const SHEET_EXPANDED = 0.9;
/** 닫기를 막은 뒤 Base UI가 직전 높이로 되돌리는 요청을 무시할 시간 */
const SHEET_RESTORE_WINDOW_MS = 300;

/**
 * CRT-02 장소 선택. 지역 칩은 URL(`region`)에 둔다 (AGENTS §6)
 * 장소 목록은 지도 위 하단 시트이고, 위로 끌어올리면 넓어진다 (시안 CRT-02)
 */
export function PlaceStep({ onNext }: { onNext: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { control, setValue } = useFormContext<
    CreateScheduleInput,
    unknown,
    CreateScheduleValues
  >();
  const selectedPlace = useWatch({ control, name: "place" });
  const activityId = useWatch({ control, name: "activityId" });
  const {
    data: activities,
    isError: isActivitiesError,
    refetch: refetchActivities,
  } = useActivities();
  const keyword = activities?.find(
    (activity) => activity.activityId === activityId,
  )?.searchKeyword;

  const {
    data: regions,
    isError: isRegionsError,
    refetch: refetchRegions,
  } = useRegions();

  // URL에 지역이 없거나 목록에 없는 지역이면 고른 장소의 구, 그것도 없으면 마포구(목록에 없으면 첫 지역)
  const regionParam = searchParams.get("region");
  const isAllRegions = regionParam === ALL_REGIONS;
  const region = isAllRegions
    ? undefined
    : (regions?.find(({ code }) => code === regionParam) ??
      (selectedPlace &&
        regions?.find(({ code }) =>
          selectedPlace.regionCode.startsWith(code),
        )) ??
      regions?.find(({ code }) => code === DEFAULT_REGION_CODE) ??
      regions?.[0]);

  const {
    data: places,
    isPending,
    isError,
    refetch,
  } = usePlaces(keyword, isAllRegions ? regions : region && [region]);
  const isListError = isActivitiesError || isRegionsError || isError;
  const selectedKey = selectedPlace ? getPlaceKey(selectedPlace) : undefined;

  const retryList = () => {
    if (isActivitiesError) refetchActivities();
    if (isRegionsError) refetchRegions();
    if (isError) refetch();
  };

  // 지역을 바꾸면 고른 장소를 비운다. 다른 지역의 장소가 선택된 채로 남지 않게 한다
  const selectRegion = (code: string) => {
    setValue("place", null, { shouldDirty: true });
    const params = new URLSearchParams(searchParams);
    params.set("region", code);
    router.replace(`${pathname}?${params}`);
  };

  const selectPlace = (place: Place) =>
    setValue("place", place, { shouldDirty: true });

  // 지도 핀으로 고르면 목록도 그 장소가 시트 맨 위에 오게 스크롤한다
  const placeListRef = useRef<HTMLDivElement>(null);
  const selectPlaceFromMap = (place: Place) => {
    selectPlace(place);
    const list = placeListRef.current;
    const item = list?.querySelector(
      `[data-place-key="${CSS.escape(getPlaceKey(place))}"]`,
    );
    if (!list || !item) return;
    list.scrollTo({
      top:
        list.scrollTop +
        item.getBoundingClientRect().top -
        list.getBoundingClientRect().top,
      behavior: "smooth",
    });
  };

  // 지역 칩은 서버가 준 순서 그대로 그린다. 지역을 못 불러오면 칩 없이 오류를 보여 준다
  const regionChips = regions
    ? [
        { code: ALL_REGIONS, name: "전체", isSelected: isAllRegions },
        ...regions.map(({ code, name }) => ({
          code,
          name,
          isSelected: code === region?.code,
        })),
      ]
    : [];

  // 시트 기본 높이는 CSS 배치로 정한다. 지도 아래 빈 영역(시트 자리)의 실제 높이를 읽어 snap point로 쓴다
  const [sheetHeight, setSheetHeight] = useState<number>();
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);
  // 기본 높이보다 더 끌어내리면 Base UI는 닫으려 한다(snap point null). 닫기를 막으면 곧바로 직전 높이(펼침)로
  // 되돌리므로, 그 직후의 펼침 요청은 무시하고 기본 높이에 둔다
  const sheetDismissedAtRef = useRef(Number.NEGATIVE_INFINITY);
  const measureSheetHeight = useCallback((sheetArea: HTMLElement | null) => {
    if (!sheetArea) return;
    const observer = new ResizeObserver(() =>
      setSheetHeight(sheetArea.getBoundingClientRect().height),
    );
    observer.observe(sheetArea);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* 지도는 시트 기본 높이 위까지만 그린다. 핀이 시트에 가려지지 않는다 */}
      <main className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 px-5 pb-4">
          <StepTitle>어디서 만날까요?</StepTitle>
        </div>

        {/* isolate: 지도 안쪽 z-index(로고 등)가 시트 위로 올라오지 않게 가둔다 */}
        <div className="relative isolate min-h-place-map flex-1">
          <PlaceMap
            places={places ?? []}
            selectedKey={selectedKey}
            onSelect={selectPlaceFromMap}
          />
          <div
            role="group"
            aria-label="지역"
            className="absolute inset-x-0 top-0 flex gap-2 overflow-x-auto px-5 py-3"
          >
            {regionChips.map((chip) => (
              <button
                key={chip.code}
                type="button"
                aria-pressed={chip.isSelected}
                onClick={() => selectRegion(chip.code)}
                className={cn(
                  "relative h-9 shrink-0 rounded-full border px-4 text-sm font-semibold after:absolute after:-inset-1",
                  chip.isSelected
                    ? "border-foreground bg-foreground text-card"
                    : "border-border bg-card text-foreground",
                )}
              >
                {chip.name}
              </button>
            ))}
          </div>
        </div>
        {/* 시트 자리. 장소 3곳이 보이는 높이를 기본으로 하고, 낮은 화면에서는 지도 최소 높이를 지키도록 줄어든다 */}
        <div
          ref={measureSheetHeight}
          aria-hidden
          className="min-h-place-sheet-min basis-place-sheet"
        />
      </main>

      {/* 닫히지 않는 시트다. 아래로 끌어도 기본 높이에 멈춘다 */}
      {sheetHeight !== undefined && (
        <Drawer
          open
          modal={false}
          disablePointerDismissal
          // 빠르게 밀어도 높이를 건너뛰지 않고 바로 다음 높이로 간다
          snapToSequentialPoints
          snapPoints={[sheetHeight, SHEET_EXPANDED]}
          snapPoint={isSheetExpanded ? SHEET_EXPANDED : sheetHeight}
          onSnapPointChange={(point) => {
            if (point === null) {
              sheetDismissedAtRef.current = performance.now();
              setIsSheetExpanded(false);
              return;
            }
            const isRestoringAfterDismiss =
              performance.now() - sheetDismissedAtRef.current <
              SHEET_RESTORE_WINDOW_MS;
            setIsSheetExpanded(
              point === SHEET_EXPANDED && !isRestoringAfterDismiss,
            );
          }}
          showSwipeHandle
        >
          <DrawerContent className="mx-auto h-place-sheet-max max-w-md rounded-t-3xl border-0 bg-card shadow-toast">
            <div className="flex shrink-0 items-baseline justify-between gap-3 px-5 pt-3 pb-3">
              <DrawerTitle className="text-base font-bold">
                {region?.name ?? "전체"} 매장{" "}
                <span className="text-primary">{places?.length ?? 0}</span>곳
              </DrawerTitle>
              <p className="text-xs text-subtle-foreground">
                {isSheetExpanded
                  ? "아래로 내리면 지도가 보여요"
                  : "위로 올리면 목록이 넓어져요"}
              </p>
            </div>
            {/* 시트가 접혀 화면 밖에 남은 부분과 `다음` 버튼에 가려지지 않게 목록 끝을 비운다 */}
            <div
              ref={placeListRef}
              className="min-h-0 flex-1 overflow-y-auto px-5 pb-place-sheet-list-end"
            >
              {isListError ? (
                <div
                  role="alert"
                  className="flex flex-col items-start gap-3 py-6"
                >
                  <p className="text-sm text-muted-foreground">
                    장소를 불러오지 못했어요.
                  </p>
                  <Button variant="secondary" onClick={retryList}>
                    다시 시도
                  </Button>
                </div>
              ) : !keyword || !regions || (regions.length > 0 && isPending) ? (
                <p role="status" className="py-6 text-sm text-muted-foreground">
                  불러오는 중...
                </p>
              ) : !places?.length ? (
                <p role="status" className="py-6 text-sm text-muted-foreground">
                  이 지역에는 아직 장소가 없어요.
                </p>
              ) : (
                <ul className="flex flex-col gap-2.5">
                  {places.map((place, index) => {
                    const isSelected = getPlaceKey(place) === selectedKey;
                    return (
                      <li
                        key={getPlaceKey(place)}
                        data-place-key={getPlaceKey(place)}
                      >
                        <button
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => selectPlace(place)}
                          className={cn(
                            "flex w-full items-start gap-3 rounded-xl border bg-card px-4 py-3.5 text-left",
                            isSelected
                              ? "border-primary bg-brand-soft ring-1 ring-primary ring-inset"
                              : "border-input",
                          )}
                        >
                          <span
                            aria-hidden
                            className={cn(
                              "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 text-2xs font-bold",
                              isSelected
                                ? "border-brand bg-brand text-white"
                                : "border-primary text-brand",
                            )}
                          >
                            {index + 1}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-base font-bold text-foreground">
                              {place.name}
                            </span>
                            <span className="mt-1 block truncate text-sm text-muted-foreground">
                              {place.roadAddress}
                            </span>
                          </span>
                          {isSelected && (
                            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                              <CheckIcon
                                aria-hidden
                                className="size-3.5"
                                strokeWidth={3}
                              />
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              <p className="py-4 text-xs text-muted-foreground">
                결제 방식·영업시간은 직접 확인해주세요.
              </p>
            </div>
          </DrawerContent>
        </Drawer>
      )}

      {/* 시트 위에 고정한다 */}
      <BottomCta className="fixed inset-x-0 bottom-0 z-60 mx-auto max-w-md">
        <Button
          variant="primary"
          size="lg"
          disabled={!selectedPlace}
          onClick={onNext}
        >
          다음
        </Button>
      </BottomCta>
    </>
  );
}
