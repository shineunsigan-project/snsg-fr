/** "19960412" → Date. 존재하지 않는 날짜면 null */
export function parseBirthDate(digits: string): Date | null {
  if (!/^\d{8}$/.test(digits)) return null;
  const year = Number(digits.slice(0, 4));
  const month = Number(digits.slice(4, 6));
  const day = Number(digits.slice(6, 8));
  const date = new Date(year, month - 1, day);
  const isValid =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;
  return isValid ? date : null;
}

/** "19960412" → "1996-04-12" (서버 형식) */
export function toIsoBirthDate(digits: string) {
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
}

/** 입력 중인 숫자를 "1996. 04. 12" 형식으로 보여준다 (DESIGN §3.4) */
export function formatBirthDate(digits: string): string {
  const parts = [
    digits.slice(0, 4),
    digits.slice(4, 6),
    digits.slice(6, 8),
  ].filter(Boolean);
  return parts.join(". ");
}

/**
 * 연령대 (예: "20대 후반")
 * TODO(F-12): 산출 기준과 계산 위치(클라이언트/서버)가 정해지지 않았다.
 * 지금은 만 나이 기준, 일의 자리 0~3 초반 / 4~6 중반 / 7~9 후반으로 가정한다
 */
export function getAgeGroup(birthDate: Date, today = new Date()): string {
  let age = today.getFullYear() - birthDate.getFullYear();
  const hadBirthday =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() &&
      today.getDate() >= birthDate.getDate());
  if (!hadBirthday) age -= 1;

  const decade = Math.floor(age / 10) * 10;
  const unit = age % 10;
  const part = unit <= 3 ? "초반" : unit <= 6 ? "중반" : "후반";
  return `${decade}대 ${part}`;
}
