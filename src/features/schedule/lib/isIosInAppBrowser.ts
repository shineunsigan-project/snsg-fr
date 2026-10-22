// 카카오톡·인스타그램 등 앱 안에서 연 iOS 브라우저인지 판별한다 (팀 요청 2026-10-11)
// 브라우저 종류는 CSS로 알 수 없어 user-agent로 판별한다 (AGENTS §2 기기 감지 금지의 예외, 사용자 확인)
// Safari·iOS Chrome·Firefox·Edge는 앱 안 브라우저가 아니므로 제외한다

// 앱 안 브라우저 대부분은 user-agent에 `Safari/`가 없다. 아래 앱은 `Safari/`를 넣으므로 이름으로 찾는다
const IN_APP_WITH_SAFARI_TOKEN = /NAVER\(inapp|Line\/|DaumApps|KAKAOTALK/;

export function isIosInAppBrowser() {
  const { userAgent, maxTouchPoints } = navigator;
  // iPadOS는 데스크톱 Safari처럼 Macintosh로 표시되므로 터치 지원으로 구분한다
  const isIos =
    /iPhone|iPad|iPod/.test(userAgent) ||
    (/Macintosh/.test(userAgent) && maxTouchPoints > 1);
  if (!isIos) return false;
  // 홈 화면에 추가한 웹앱도 `Safari/`가 없지만 앱 안 브라우저가 아니다
  if ("standalone" in navigator && navigator.standalone === true) return false;
  return (
    !/Safari\//.test(userAgent) || IN_APP_WITH_SAFARI_TOKEN.test(userAgent)
  );
}
