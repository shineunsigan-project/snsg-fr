"use client";

import { Toaster as Sonner, toast, type ToasterProps } from "sonner";

/**
 * 토스트 (TECH_STACK §3.4) — Sonner로 띄우고, 모양은 시안 컴포넌트 코드(Toast)를 따른다
 * 화면 아래에서 124px 위, 좌우 20px 안에서 가운데 정렬, 내용 길이만큼의 어두운 말풍선
 */
function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="light"
      position="bottom-center"
      offset={{ bottom: 124, left: 20, right: 20 }}
      mobileOffset={{ bottom: 124, left: 20, right: 20 }}
      // Sonner 기본 모양을 끄고 showToast가 그리는 모양만 쓴다
      toastOptions={{ unstyled: true, className: "flex w-full justify-center" }}
      {...props}
    />
  );
}

type ShowToastOptions = {
  /** 노출 시간(ms). 주지 않으면 Sonner 기본값(4초) */
  duration?: number;
  /** error면 체크 아이콘을 빼고 문구만 보여준다. TODO(D-15): 오류 토스트 디자인이 정해지면 바꾼다 */
  variant?: "success" | "error";
};

/** 안내 토스트를 띄운다. 기본은 체크 아이콘이 붙은 성공 안내다 */
function showToast(
  message: string,
  { duration, variant = "success" }: ShowToastOptions = {},
) {
  toast.custom(
    () => (
      <div className="pointer-events-none flex items-center gap-2 rounded-xl bg-toast px-4.5 py-3.25 font-sans text-sm font-semibold text-white shadow-toast">
        {variant === "success" && (
          <svg
            aria-hidden
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth="3"
            className="shrink-0 stroke-on-brand-accent"
          >
            <path d="M5 12l5 5 9-10" />
          </svg>
        )}
        {message}
      </div>
    ),
    { duration },
  );
}

export { showToast, Toaster };
