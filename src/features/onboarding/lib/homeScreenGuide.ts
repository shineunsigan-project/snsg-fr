// 홈 화면 추가 안내 ONB-01·01-1 (USER_FLOW §9.1, SHI-160 결정 2026-11-07)
// 대상 판별과 기기 기록(localStorage). 판단은 순수 함수로 두고, 브라우저 값을 읽는 함수는 따로 둔다

/** 안내 화면 종류. 아이폰·아이패드 → ONB-01, 안드로이드(태블릿 포함) → ONB-01-1 (결정 Q5) */
export type HomeScreenGuidePlatform = "ios" | "android";

/** 안내를 연 곳. 버튼 동작과 기록이 다르다 (결정 Q1) */
export type HomeScreenGuideSource = "signup" | "home" | "menu";

// 홈·내 정보가 이 앱 안에서 안내를 열었는지. 메모리에만 두어, 주소를 직접 열거나 새로고침하면 false다
// false면 뒤로가기 대신 안내를 연 화면 주소로 바꾼다(앞 화면이 사이트 밖일 수 있어서)
let openedInApp = false;

/** 홈·내 정보에서 안내로 push하기 직전에 부른다 */
export function markHomeScreenGuideOpenedInApp() {
  openedInApp = true;
}

/** 안내를 앱 안에서 열었는지. 읽기만 한다(첫 그림이 버려져 다시 그려져도 같은 값) */
export function isHomeScreenGuideOpenedInApp() {
  return openedInApp;
}

/** 안내 화면을 떠날 때 지운다. 다음에 주소를 직접 열면 false가 되게 한다 */
export function clearHomeScreenGuideOpenedInApp() {
  openedInApp = false;
}

/** 안내 라우트. 들어온 곳은 `from` 쿼리로 넘긴다(복귀 경로가 아니라서 URL에 둔다) */
export const HOME_SCREEN_GUIDE_PATH = "/home-screen-guide";

export function toHomeScreenGuidePath(from: HomeScreenGuideSource) {
  return `${HOME_SCREEN_GUIDE_PATH}?from=${from}`;
}

export function readHomeScreenGuideSource(
  value: string | null,
): HomeScreenGuideSource | undefined {
  return value === "signup" || value === "home" || value === "menu"
    ? value
    : undefined;
}

type BrowserInfo = {
  userAgent: string;
  maxTouchPoints: number;
  /** 홈 화면 아이콘으로 실행 중인지 */
  isStandalone: boolean;
};

// OS·앱 안 브라우저는 CSS로 알 수 없어 user-agent로 판별한다.
// ui 규칙의 기기 감지 금지에 대한 예외이며, 이 안내(와 ENV)에만 쓴다 (SHI-160 결정 2026-11-07)
// 앱 안 브라우저는 문서의 카카오톡·인스타그램·페이스북·스레드 + 네이버 앱만 본다 (결정 Q2)
// 페이스북: iOS `FBAN`·안드로이드 `FB_IAB`·`FBAV`, 스레드: `Barcelona`, 네이버 앱: `NAVER(inapp`
const IN_APP_BROWSER =
  /KAKAOTALK|Instagram|FBAN|FBAV|FB_IAB|Barcelona|NAVER\(inapp/;

/** 안내를 보여줄 화면 종류. 대상이 아니면(PC·앱 안 브라우저·홈 화면 실행 중) null */
export function getHomeScreenGuidePlatform({
  userAgent,
  maxTouchPoints,
  isStandalone,
}: BrowserInfo): HomeScreenGuidePlatform | null {
  if (isStandalone) return null;
  if (IN_APP_BROWSER.test(userAgent)) return null;
  return getMobileOs(userAgent, maxTouchPoints);
}

/** OS만 본다(앱 안 브라우저·홈 화면 실행 여부와 상관없이). PC면 null */
export function getMobileOs(
  userAgent: string,
  maxTouchPoints: number,
): HomeScreenGuidePlatform | null {
  // iPadOS는 데스크톱 Safari처럼 Macintosh로 표시되므로 터치 지원으로 구분한다
  if (
    /iPhone|iPad|iPod/.test(userAgent) ||
    (/Macintosh/.test(userAgent) && maxTouchPoints > 1)
  ) {
    return "ios";
  }
  if (/Android/.test(userAgent)) return "android";
  return null;
}

/** 지금 기기가 휴대폰·태블릿인지. PC면 내 정보의 안내 메뉴를 숨긴다 (F-23, 사용자 결정 2026-11-09). 서버 렌더링에서는 부르지 않는다 */
export function isMobileDevice() {
  return getMobileOs(navigator.userAgent, navigator.maxTouchPoints) !== null;
}

/** 지금 브라우저의 안내 종류. 서버 렌더링에서는 부르지 않는다 */
export function detectHomeScreenGuidePlatform() {
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && navigator.standalone === true);
  return getHomeScreenGuidePlatform({
    userAgent: navigator.userAgent,
    maxTouchPoints: navigator.maxTouchPoints,
    isStandalone,
  });
}

/**
 * 기기에 남기는 기록
 * - confirmed: `확인했어요`를 눌렀다. 다시 띄우지 않는다
 * - later: 가입 직후 `나중에 할게요`를 누른 시각(ms). 7×24시간 뒤 홈에 들어올 때 한 번 더
 * - done: 7일 뒤 한 번 더 보여줬다. 두 번째 `나중에`든 아니든 다시 띄우지 않는다
 */
export type HomeScreenGuideRecord =
  | { status: "confirmed" }
  | { status: "later"; at: number }
  | { status: "done" };

const RECORD_KEY = "homeScreenGuide.v1";
const REMIND_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

export function parseHomeScreenGuideRecord(
  raw: string | null,
): HomeScreenGuideRecord | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null || !("status" in value)) {
      return null;
    }
    if (value.status === "confirmed") return { status: "confirmed" };
    if (value.status === "done") return { status: "done" };
    if (
      value.status === "later" &&
      "at" in value &&
      typeof value.at === "number" &&
      Number.isFinite(value.at)
    ) {
      return { status: "later", at: value.at };
    }
    return null;
  } catch {
    return null;
  }
}

/** 가입 직후에 보여줄지. 이 기기에 기록이 이미 있으면(다른 계정으로 가입 등) 기록을 따른다 */
export function shouldShowAfterSignup(record: HomeScreenGuideRecord | null) {
  return record === null;
}

/** 홈에 들어올 때 보여줄지. `나중에`를 누른 때부터 7×24시간이 지났을 때만 (결정 Q4) */
export function shouldShowOnHome(
  record: HomeScreenGuideRecord | null,
  now: number,
) {
  return record?.status === "later" && now - record.at >= REMIND_AFTER_MS;
}

/** 버튼을 누른 뒤의 기록. 메뉴로 연 안내는 기록을 바꾸지 않는다 */
export function nextHomeScreenGuideRecord(
  source: HomeScreenGuideSource,
  action: "confirm" | "later",
  now: number,
): HomeScreenGuideRecord | undefined {
  if (source === "menu") return undefined;
  if (action === "confirm") return { status: "confirmed" };
  return source === "signup"
    ? { status: "later", at: now }
    : { status: "done" };
}

/**
 * 가입 직후 안내를 보여주는 순간 `나중에`로 기록한다. 버튼 없이 뒤로 가도 7일 뒤 홈에서 한 번 더 보인다
 * (사용자 결정 2026-11-09). 버튼을 누르면 nextHomeScreenGuideRecord 값으로 바뀐다
 */
export function recordHomeScreenGuideShownAfterSignup() {
  saveHomeScreenGuideRecord({ status: "later", at: Date.now() });
}

// 저장소를 쓸 수 없는 환경(사생활 보호 모드 등)에서는 기록 없이 동작한다
export function readHomeScreenGuideRecord() {
  try {
    return parseHomeScreenGuideRecord(localStorage.getItem(RECORD_KEY));
  } catch {
    return null;
  }
}

export function saveHomeScreenGuideRecord(record: HomeScreenGuideRecord) {
  try {
    localStorage.setItem(RECORD_KEY, JSON.stringify(record));
  } catch {
    // 기록하지 못하면 다음에 다시 보일 수 있다. 막지 않는다
  }
}
