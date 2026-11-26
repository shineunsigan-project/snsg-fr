const entries = new Map<
  string,
  { expiresAt: number; value: Promise<unknown> }
>();
// 서버 메모리가 끝없이 늘지 않게 오래된 것부터 버린다
const MAX_ENTRIES = 500;

/**
 * 서버(Node) 메모리에 결과를 잠깐 보관한다. 서버 코드에서만 쓴다.
 * 일정 상세 `generateMetadata`는 홈·목록의 카드 링크가 미리 불러올 때마다 실행되어, 사용자가 누르지 않아도 백엔드 조회가 늘어나는 걸 줄이려고 둔다.
 * 같은 값을 동시에 요청하면 한 번만 조회한다. 실패한 결과는 보관하지 않는다
 */
export function cachedForSeconds<T>(
  key: string,
  seconds: number,
  load: () => Promise<T>,
): Promise<T> {
  const now = Date.now();
  const hit = entries.get(key);
  if (hit && hit.expiresAt > now) return hit.value as Promise<T>;

  const value = load();
  value.catch(() => {
    // 늦게 실패한 요청이 그 사이 새로 저장된 같은 키의 값을 지우지 않게 자기 것일 때만 지운다
    if (entries.get(key)?.value === value) entries.delete(key);
  });
  entries.set(key, { expiresAt: now + seconds * 1000, value });
  if (entries.size > MAX_ENTRIES) {
    const oldest = entries.keys().next();
    if (!oldest.done) entries.delete(oldest.value);
  }
  return value;
}
