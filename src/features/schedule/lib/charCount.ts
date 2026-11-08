// 글자 수는 서버와 같이 코드 포인트로 센다. 이모지 하나를 두 글자로 세지 않는다 (api-guide 일정 개설 "길이는 글자 수로 센다")

export function countChars(text: string) {
  return Array.from(text).length;
}

/** 최대 글자 수를 넘는 뒷부분을 자른다. 입력 칸의 maxLength는 이모지를 두 글자로 세어 쓰지 않는다 */
export function limitChars(text: string, max: number) {
  return countChars(text) > max
    ? Array.from(text).slice(0, max).join("")
    : text;
}
