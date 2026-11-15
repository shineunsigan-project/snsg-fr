/**
 * 앱 안에서 이동해 온 기록이 있는지 (팀 결정 Q7: 있으면 뒤로, 없으면 홈).
 * Navigation API의 canGoBack은 같은 출처(이 앱)의 이전 기록이 있을 때만 true다.
 * 공유 링크로 바로 들어왔거나 카카오 로그인(다른 출처)을 거쳐 돌아온 경우는 false라 홈으로 간다.
 * 이 API가 없는 브라우저는 앱 밖으로 나가지 않도록 홈으로 보낸다
 */
export function canGoBackInApp() {
  const navigation: unknown = Reflect.get(window, "navigation");
  return (
    typeof navigation === "object" &&
    navigation !== null &&
    "canGoBack" in navigation &&
    navigation.canGoBack === true
  );
}
