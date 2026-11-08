// 일정을 연 뒤 홈에서 개설 완료 팝업(CRT-07)을 한 번만 띄우려고, 연 일정의 장소명을 탭 단위 저장소에 잠깐 둔다
// 개설 응답에는 일정 ID만 오므로 팝업 장소명은 개설 화면에서 고른 값을 쓴다
// 홈이 읽자마자 지워서 새로고침이나 주소 직접 입력으로는 다시 뜨지 않는다
// 예전에는 다른 키에 일정 ID를 두었다. 남은 값이 장소명으로 보이지 않게 키 이름을 바꿨다
const CREATED_KEY = "scheduleCreatedPlace";

export function saveCreatedNotice(placeName: string) {
  try {
    sessionStorage.setItem(CREATED_KEY, placeName);
  } catch {
    // 저장소를 쓸 수 없으면 팝업 없이 홈만 보인다
  }
}

/** 보관한 장소명. 없으면 null */
export function readCreatedNotice() {
  try {
    return sessionStorage.getItem(CREATED_KEY);
  } catch {
    return null;
  }
}

export function clearCreatedNotice() {
  try {
    sessionStorage.removeItem(CREATED_KEY);
  } catch {
    // 지울 수 없어도 화면 동작에는 영향이 없다
  }
}
