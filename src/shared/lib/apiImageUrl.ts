/**
 * 서버가 준 이미지 경로를 화면에서 쓸 주소로 바꾼다.
 * 서버는 도메인 없이 경로만(`/images/...`) 주므로 API 서버 주소를 앞에 붙인다(api-guide 일정 상세 `profileImageUrl`).
 * 이미 주소 전체(`https:`·`data:`·`blob:` 등)면 그대로 둔다. null·빈 값이면 null (Avatar 기본 모양)
 */
export function toApiImageUrl(path: string | null | undefined) {
  if (!path) return null;
  const isServerPath = path.startsWith("/") && !path.startsWith("//");
  return isServerPath
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL ?? ""}${path}`
    : path;
}
