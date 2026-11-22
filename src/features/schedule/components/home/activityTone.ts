/**
 * 활동별 색 (홈 화면 수정 시안): 활동 버튼 타일과 곧 마감돼요 카드의 활동 칩이 같은 색을 쓴다.
 * 배경색과 글자·아이콘 색. 시안(#FBF3E8·#EEF0EA·#F2F7E9)과 가까운 기존 토큰이다. TODO(D-4)
 * 키는 서버 활동 목록의 `code`다
 */
export const ACTIVITY_TONE: Record<string, string> = {
  BOARD_GAME: "bg-warning-soft text-warning",
  ESCAPE_ROOM: "bg-stripe-muted-soft text-foreground",
  WALK: "bg-brand-soft text-brand",
};

/** 홈에서 활동을 늘어놓는 순서: 활동 버튼 타일과 새로 열린 일정 칩이 같은 순서를 쓴다 (홈 화면 시안) */
export const ACTIVITY_ORDER = ["BOARD_GAME", "ESCAPE_ROOM", "WALK"] as const;

/** 목록에 없는 활동(새로 생긴 활동 등)의 색 */
export const DEFAULT_ACTIVITY_TONE = "bg-secondary text-muted-foreground";
