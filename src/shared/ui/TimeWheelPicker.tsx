"use client";

import { WheelPicker, WheelPickerWrapper } from "./wheel-picker";

type Meridiem = "am" | "pm";

type TimeWheelPickerProps = {
  /** 24시간 `HH:mm` (예: `"19:30"`). 분은 `00`·`30`만 쓴다 */
  value: string;
  onValueChange: (value: string) => void;
  /** 이 시각(`HH:mm`)보다 이른 시각은 고를 수 없다. 30분 단위가 아니면 다음 30분으로 올린다 */
  min?: string;
  /** 휠 묶음의 접근성 이름 (예: `시작 시각`) */
  "aria-label": string;
};

// 시안 CRT-04: 휠 한 줄 40px, 위아래로 두 줄씩 보인다
const OPTION_ITEM_HEIGHT = 40;
const VISIBLE_COUNT = 12;
const MINUTE_STEP = 30;

const MERIDIEM_OPTIONS: ReadonlyArray<{ value: Meridiem; label: string }> = [
  { value: "am", label: "오전" },
  { value: "pm", label: "오후" },
];
// 12시가 1시 앞에 오게 해서 시간 순서와 맞춘다 (min으로 막는 시각이 한쪽에 몰린다)
const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;
const MINUTES = [0, 30] as const;

function toMinutes(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function toTimeString(totalMinutes: number) {
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function to24Hour(meridiem: Meridiem, hour12: number) {
  return (hour12 % 12) + (meridiem === "pm" ? 12 : 0);
}

/** 오전·오후 / 시(12·1~11) / 분(00·30) 3열 시간 휠 (시안 CRT-04) */
export function TimeWheelPicker({
  value,
  onValueChange,
  min,
  "aria-label": ariaLabel,
}: TimeWheelPickerProps) {
  const total = toMinutes(value);
  const hour24 = Math.floor(total / 60);
  const minute = total % 60;
  const meridiem: Meridiem = hour24 < 12 ? "am" : "pm";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;

  const minTotal =
    min === undefined
      ? undefined
      : Math.ceil(toMinutes(min) / MINUTE_STEP) * MINUTE_STEP;
  const isBeforeMin = (minutes: number) =>
    minTotal !== undefined && minutes < minTotal;

  const change = (next: {
    meridiem?: Meridiem;
    hour12?: number;
    minute?: number;
  }) => {
    const nextTotal =
      to24Hour(next.meridiem ?? meridiem, next.hour12 ?? hour12) * 60 +
      (next.minute ?? minute);
    // 열 하나만 바꿔 min보다 이른 조합이 되면 고를 수 있는 가장 이른 시각으로 맞춘다
    onValueChange(
      toTimeString(
        minTotal !== undefined && nextTotal < minTotal ? minTotal : nextTotal,
      ),
    );
  };

  const lastMinute = 60 - MINUTE_STEP;

  return (
    <div role="group" aria-label={ariaLabel}>
      <WheelPickerWrapper>
        <WheelPicker<Meridiem>
          value={meridiem}
          onValueChange={(next) => change({ meridiem: next })}
          options={MERIDIEM_OPTIONS.map((option) => ({
            ...option,
            disabled: isBeforeMin(to24Hour(option.value, 11) * 60 + lastMinute),
          }))}
          optionItemHeight={OPTION_ITEM_HEIGHT}
          visibleCount={VISIBLE_COUNT}
        />
        <WheelPicker<number>
          value={hour12}
          onValueChange={(next) => change({ hour12: next })}
          options={HOURS.map((hour) => ({
            value: hour,
            label: String(hour),
            disabled: isBeforeMin(to24Hour(meridiem, hour) * 60 + lastMinute),
          }))}
          optionItemHeight={OPTION_ITEM_HEIGHT}
          visibleCount={VISIBLE_COUNT}
        />
        <WheelPicker<number>
          value={minute}
          onValueChange={(next) => change({ minute: next })}
          options={MINUTES.map((option) => ({
            value: option,
            label: String(option).padStart(2, "0"),
            disabled: isBeforeMin(to24Hour(meridiem, hour12) * 60 + option),
          }))}
          optionItemHeight={OPTION_ITEM_HEIGHT}
          visibleCount={VISIBLE_COUNT}
        />
      </WheelPickerWrapper>
      {/* 휠 패키지가 role·aria 속성을 주지 않아, 바뀐 시각을 스크린리더에 읽어 준다 */}
      <p className="sr-only" aria-live="polite">
        {`${meridiem === "am" ? "오전" : "오후"} ${hour12}시 ${String(minute).padStart(2, "0")}분`}
      </p>
    </div>
  );
}
